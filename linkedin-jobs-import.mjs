#!/usr/bin/env node
/**
 * linkedin-jobs-import.mjs — private, offline LinkedIn jobs export bridge.
 *
 * LinkedIn does not provide an open job-search API and prohibits logged-in
 * scraping/automation. This tool therefore consumes the user's own LinkedIn
 * data export. It never logs in, stores cookies, opens LinkedIn, submits an
 * application, sends a message, or changes the applications tracker.
 *
 * Preview (default; no writes):
 *   node linkedin-jobs-import.mjs --dir data/linkedin-export --summary
 *
 * Write a private review document:
 *   node linkedin-jobs-import.mjs --dir ... --write-report --summary
 *
 * Queue Saved Jobs for normal RoleLinked evaluation (explicit opt-in):
 *   node linkedin-jobs-import.mjs --dir ... --queue --summary
 *
 * Job Applications are review-only. They are never written to the tracker,
 * because an export can be stale or incomplete and tracker status changes
 * require the user's approval.
 */

import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, renameSync } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseCsv } from './linkedin-join.mjs';
import { appendToPipeline } from './scan.mjs';
import { aggregatorPostingId, normalizeUrl } from './url-key.mjs';
import { getCareerOpsRoot } from './path-resolver.mjs';
import { flagValue, hasFlag, validateFlags } from './lib/cli-flags.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

const CODE_ROOT = dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = getCareerOpsRoot();
const DEFAULT_DIR = join(DATA_ROOT, 'data', 'linkedin-export');
const DEFAULT_REPORT = join(DATA_ROOT, 'data', 'linkedin-jobs-review.md');
const PIPELINE_PATH = join(DATA_ROOT, 'data', 'pipeline.md');

function postingKey(raw) {
  const aggregateId = aggregatorPostingId(raw);
  return aggregateId ? `${aggregateId.domain}:${aggregateId.id}` : normalizeUrl(raw);
}

const args = process.argv.slice(2);
const VALUE_FLAGS = ['--dir', '--report'];
const KNOWN_FLAGS = [
  '--summary', '--write-report', '--queue', '--self-test',
  ...VALUE_FLAGS, '--help', '-h',
];
const USAGE = `Usage: node linkedin-jobs-import.mjs [options]

Offline import of LinkedIn Saved Jobs / Job Applications CSV exports.

  --dir <path>       Extracted LinkedIn export folder (default: data/linkedin-export)
  --summary          Print a human-readable preview (default output is JSON)
  --write-report     Write data/linkedin-jobs-review.md (or --report path)
  --report <path>    Override the private review-report path
  --queue            Queue Saved Jobs with URLs in data/pipeline.md for evaluation
  --self-test        Run parser checks; no files are written
  --help, -h         Show this message

Safety: never logs in, scrapes LinkedIn, submits applications, sends messages,
or changes data/applications.md.`;

const HEADER_ALIASES = {
  title: ['job title', 'title', 'position', 'position title'],
  company: ['company name', 'company', 'employer', 'organization'],
  url: ['job posting url', 'job url', 'posting url', 'job posting link', 'job link', 'url', 'link'],
  date: ['saved date', 'application date', 'applied date', 'date saved', 'date applied', 'date'],
};

function normalizeHeader(value) {
  return String(value || '').replace(/^\ufeff/, '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function firstHeaderIndex(headers, aliases) {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

function inferredKind(path, headers = []) {
  const name = basename(path).toLowerCase();
  if (name.includes('application')) return 'applied';
  if (name.includes('saved job')) return 'saved';
  if (headers.includes('application date') || headers.includes('applied date')) return 'applied';
  if (headers.includes('saved date') || headers.includes('date saved')) return 'saved';
  return null;
}

function validHttpUrl(value) {
  const text = String(value || '').trim();
  if (!/^https?:\/\//i.test(text)) return '';
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

/** Parse one supported LinkedIn CSV. Unknown CSV shapes are ignored safely. */
export function parseLinkedInJobsCsv(text, sourcePath = 'Saved Jobs.csv') {
  const rows = parseCsv(text);
  let headerIndex = -1;
  let headers = [];
  let columns = null;

  for (let i = 0; i < rows.length; i++) {
    const candidate = rows[i].map(normalizeHeader);
    const title = firstHeaderIndex(candidate, HEADER_ALIASES.title);
    const company = firstHeaderIndex(candidate, HEADER_ALIASES.company);
    const url = firstHeaderIndex(candidate, HEADER_ALIASES.url);
    if (title !== -1 && company !== -1 && (url !== -1 || inferredKind(sourcePath, candidate))) {
      headerIndex = i;
      headers = candidate;
      columns = { title, company, url, date: firstHeaderIndex(candidate, HEADER_ALIASES.date) };
      break;
    }
  }

  if (headerIndex === -1 || !columns) {
    return { kind: null, jobs: [], skipped: 0, reason: 'unsupported-header' };
  }

  const kind = inferredKind(sourcePath, headers);
  if (!kind) return { kind: null, jobs: [], skipped: 0, reason: 'unsupported-file' };

  const jobs = [];
  let skipped = 0;
  for (const cells of rows.slice(headerIndex + 1)) {
    if (!cells.length || cells.every((cell) => !String(cell || '').trim())) continue;
    const get = (index) => index >= 0 && cells[index] != null ? String(cells[index]).trim() : '';
    const title = get(columns.title);
    const company = get(columns.company);
    if (!title || !company) { skipped++; continue; }
    jobs.push({
      kind,
      title,
      company,
      url: validHttpUrl(get(columns.url)),
      date: get(columns.date),
      sourceFile: basename(sourcePath),
    });
  }
  return { kind, jobs, skipped, reason: null };
}

function csvFiles(root) {
  if (!existsSync(root)) return [];
  const out = [];
  const visit = (path, depth) => {
    if (depth > 4) return;
    let entries;
    try { entries = readdirSync(path, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) visit(child, depth + 1);
      else if (entry.isFile() && extname(entry.name).toLowerCase() === '.csv') out.push(child);
    }
  };
  visit(root, 0);
  return out.sort();
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = job.url
      ? `url:${postingKey(job.url) || job.url}`
      : `row:${normalizeHeader(job.company)}::${normalizeHeader(job.title)}::${normalizeHeader(job.date)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function existingPipelineKeys() {
  if (!existsSync(PIPELINE_PATH)) return new Set();
  const text = readFileSync(PIPELINE_PATH, 'utf8');
  return new Set([...text.matchAll(/- \[[ xX]\]\s+(\S+)/g)].map((match) => postingKey(match[1]) || match[1]));
}

function markdownCell(value) {
  return String(value || '—').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim() || '—';
}

export function buildReport(result) {
  const lines = [
    '# LinkedIn Jobs Import Review',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '> Private local review file. LinkedIn export content is operational data, not a source for CV claims.',
    '> Nothing in this report means an application was submitted or a tracker status was changed.',
    '',
  ];

  for (const [kind, heading] of [['saved', 'Saved Jobs'], ['applied', 'Job Applications (review only)']]) {
    const jobs = result.jobs.filter((job) => job.kind === kind);
    lines.push(`## ${heading}`, '', '| Date | Company | Role | Link |', '|---|---|---|---|');
    if (!jobs.length) lines.push('| — | — | No records found | — |');
    for (const job of jobs) {
      const link = job.url ? `[Open posting](${job.url})` : 'No URL in export';
      lines.push(`| ${markdownCell(job.date)} | ${markdownCell(job.company)} | ${markdownCell(job.title)} | ${link} |`);
    }
    lines.push('');
  }

  if (result.unsupported.length) {
    lines.push('## Files not imported', '');
    for (const item of result.unsupported) lines.push(`- ${markdownCell(item.file)} — ${item.reason}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}`;
  writeFileSync(temp, content, { encoding: 'utf8', mode: 0o600 });
  renameSync(temp, path);
}

export function loadExport(root) {
  const files = csvFiles(root);
  const jobs = [];
  const unsupported = [];
  let skippedRows = 0;
  for (const file of files) {
    let parsed;
    try { parsed = parseLinkedInJobsCsv(readFileSync(file, 'utf8'), file); }
    catch { unsupported.push({ file: basename(file), reason: 'unreadable' }); continue; }
    skippedRows += parsed.skipped;
    if (!parsed.kind) { unsupported.push({ file: basename(file), reason: parsed.reason }); continue; }
    jobs.push(...parsed.jobs);
  }
  return { files, jobs: dedupeJobs(jobs), unsupported, skippedRows };
}

function selfTest() {
  const saved = parseLinkedInJobsCsv(
    'Notes:,export\nJob Title,Company Name,Job Posting Url,Saved Date\nSenior Data Engineer,Acme,https://example.com/jobs/1,2026-10-29\n',
    'Saved Jobs.csv',
  );
  const applied = parseLinkedInJobsCsv(
    'Company Name,Job Title,Application Date,Job Url\nExample Corp,Staff Data Engineer,2026-10-28,https://example.com/jobs/2\n',
    'Job Applications.csv',
  );
  const checks = [
    saved.kind === 'saved', saved.jobs.length === 1, saved.jobs[0].company === 'Acme',
    applied.kind === 'applied', applied.jobs.length === 1, applied.jobs[0].title === 'Staff Data Engineer',
  ];
  console.log(checks.every(Boolean) ? 'PASS 6/6 self-test checks' : 'FAIL self-test');
  return checks.every(Boolean) ? 0 : 1;
}

async function main() {
  validateFlags(args, KNOWN_FLAGS, USAGE, { valueFlags: VALUE_FLAGS, requireOperand: true });
  if (hasFlag(args, '--self-test')) return selfTest();

  const inputDir = resolve(CODE_ROOT, flagValue(args, '--dir') || DEFAULT_DIR);
  const reportPath = resolve(CODE_ROOT, flagValue(args, '--report') || DEFAULT_REPORT);
  const writeReport = hasFlag(args, '--write-report') || hasFlag(args, '--queue');
  const result = loadExport(inputDir);

  if (!result.files.length) {
    console.error(`No CSV files found under: ${inputDir}\nExtract LinkedIn's data export there, then run this command again.`);
    return 1;
  }

  const saved = result.jobs.filter((job) => job.kind === 'saved');
  const applied = result.jobs.filter((job) => job.kind === 'applied');
  const existing = existingPipelineKeys();
  const queueable = saved.filter((job) => job.url && !existing.has(postingKey(job.url) || job.url));

  let queued = 0;
  if (hasFlag(args, '--queue') && queueable.length) {
    await appendToPipeline(queueable, { pipelinePath: PIPELINE_PATH });
    queued = queueable.length;
  }
  if (writeReport) atomicWrite(reportPath, buildReport(result));

  const output = {
    inputDir,
    csvFiles: result.files.length,
    savedJobs: saved.length,
    jobApplications: applied.length,
    savedJobsWithUrls: saved.filter((job) => job.url).length,
    newQueueCandidates: queueable.length,
    queued,
    skippedRows: result.skippedRows,
    unsupportedFiles: result.unsupported,
    report: writeReport ? reportPath : null,
    trackerChanged: false,
    applicationsSubmitted: false,
  };

  if (hasFlag(args, '--summary')) {
    console.log(`LinkedIn export: ${result.files.length} CSV file(s)`);
    console.log(`Saved jobs: ${saved.length} (${queueable.length} new queue candidate(s))`);
    console.log(`Job applications: ${applied.length} (review only; tracker unchanged)`);
    if (queued) console.log(`Queued for evaluation: ${queued}`);
    if (writeReport) console.log(`Private review: ${reportPath}`);
    if (result.unsupported.length) console.log(`Ignored unrelated/unsupported CSVs: ${result.unsupported.length}`);
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
  return 0;
}

if (isMainModule(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(`LinkedIn import failed: ${error.message}`);
    process.exitCode = 1;
  });
}
