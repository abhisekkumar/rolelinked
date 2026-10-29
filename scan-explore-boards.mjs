#!/usr/bin/env node

// Read-only Explore adapter for public job-board providers that are not part of
// scan-ats-full.mjs's reverse-ATS directories. It reuses the core provider
// registry and the canonical title/location/age filters, emits one JSON object,
// and never writes pipeline/history/tracker files.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
import { loadProviders } from './providers/_registry.mjs';
import { makeHttpCtx } from './providers/_http.mjs';
import { buildTitleFilter, buildLocationFilter, buildPostingAgeFilter } from './scan.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SUPPORTED = new Set(['builtin', 'remoteok', 'remotive', 'weworkremotely', 'himalayas', 'jobicy']);

function readYaml(file, label) {
  try {
    const parsed = yaml.load(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function queryFromKeyword(raw) {
  return String(raw ?? '')
    .split(/\s+\+\s+/)
    .map((part) => part.replace(/^(?:word|stem):/i, '').trim())
    .filter(Boolean)
    .join(' ');
}

function configuredBuiltIn(userConfig, filterConfig) {
  const existing = Array.isArray(userConfig.job_boards)
    ? userConfig.job_boards.find((entry) => entry?.enabled !== false && entry?.provider === 'builtin')
    : null;
  if (existing) return { ...existing, name: existing.name || 'Built In' };

  const positive = Array.isArray(filterConfig?.title_filter?.positive)
    ? filterConfig.title_filter.positive.map(queryFromKeyword).filter(Boolean)
    : [];
  return {
    name: 'Built In',
    provider: 'builtin',
    builtin: {
      host: 'builtin.com',
      scope: 'remote',
      queries: positive.length ? positive : ['data engineer', 'data platform engineer'],
      max_pages: 1,
    },
  };
}

function entryFor(source, userConfig, filterConfig) {
  if (source === 'builtin') return configuredBuiltIn(userConfig, filterConfig);
  return { name: source, provider: source, enabled: true };
}

function isoDate(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      sources: { type: 'string' },
      filters: { type: 'string' },
      'user-portals': { type: 'string' },
      since: { type: 'string', default: '7' },
    },
    strict: true,
  });

  const requested = String(values.sources ?? '')
    .split(',')
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);
  const unknown = requested.filter((source) => !SUPPORTED.has(source));
  if (unknown.length) throw new Error(`unsupported additional source(s): ${unknown.join(', ')}`);
  if (!values.filters || !values['user-portals']) throw new Error('--filters and --user-portals are required');

  const sinceDays = Number(values.since);
  if (!Number.isFinite(sinceDays) || sinceDays <= 0) throw new Error('--since must be a positive number');

  const filterConfig = readYaml(path.resolve(values.filters), 'could not read Explore filters');
  const userConfig = readYaml(path.resolve(values['user-portals']), 'could not read user portals');
  const titleMatches = buildTitleFilter(filterConfig.title_filter);
  const locationMatches = buildLocationFilter(filterConfig.location_filter);
  const ageMatches = buildPostingAgeFilter(sinceDays);
  const providers = await loadProviders(path.join(ROOT, 'providers'));
  const ctx = { ...makeHttpCtx(), maxPages: 1 };
  const seen = new Set();

  const results = await Promise.all(requested.map(async (source) => {
    const provider = providers.get(source);
    if (!provider) return { id: source, count: 0, error: `provider ${source} is unavailable`, offers: [] };
    try {
      const jobs = await provider.fetch(entryFor(source, userConfig, filterConfig), ctx);
      const offers = [];
      for (const job of Array.isArray(jobs) ? jobs : []) {
        const title = typeof job?.title === 'string' ? job.title.trim() : '';
        const url = typeof job?.url === 'string' ? job.url.trim() : '';
        const company = typeof job?.company === 'string' ? job.company.trim() : '';
        const location = typeof job?.location === 'string' ? job.location.trim() : '';
        if (!title || !url || !company || seen.has(url)) continue;
        if (!titleMatches(title) || !locationMatches(location, url, title) || !ageMatches(job.postedAt)) continue;
        seen.add(url);
        offers.push({ company, title, url, location, postedAt: isoDate(job.postedAt), source });
      }
      return { id: source, count: offers.length, offers };
    } catch (error) {
      return { id: source, count: 0, error: error instanceof Error ? error.message : String(error), offers: [] };
    }
  }));

  const offers = results.flatMap((result) => result.offers);
  process.stdout.write(JSON.stringify({ offers, sources: results.map(({ offers: _offers, ...source }) => source) }));
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
