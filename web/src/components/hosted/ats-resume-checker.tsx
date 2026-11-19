"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, ExternalLink, FileScan, LockKeyhole, SearchCheck, ShieldCheck, X } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./ats-resume-checker.module.css";

type Job = { id: string; company: string; title: string; url: string };
type Resume = { id: string; name: string; roleType: string; originalFilename: string };
type CheckItem = { key: string; label: string; passed: boolean; detail: string };
type Analysis = {
  compatibilityPct: number;
  confidence: "high" | "medium" | "low";
  label: string;
  format: string;
  pageCount: number | null;
  extractedCharacters: number;
  keywordCoverage: { total: number; presentCount: number; coveragePct: number; present: string[]; thin: string[]; missing: string[] };
  titleAlignment: { total: number; present: string[]; missing: string[]; percentage: number };
  parseability: { percentage: number; checks: CheckItem[] };
  lowConfidenceReason: string | null;
  guardrail: string;
};
type Result = { job: Job; resume: { id: string; name: string; filename: string }; analysis: Analysis; privacy: string };

function KeywordGroup({ title, values, tone }: { title: string; values: string[]; tone: "good" | "warn" | "bad" }) {
  return <section className={styles.keywordGroup}><div><strong>{title}</strong><span>{values.length}</span></div>{values.length ? <p>{values.map((value) => <em className={styles[tone]} key={value}>{value}</em>)}</p> : <small>None detected</small>}</section>;
}

export function AtsResumeChecker() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobId, setJobId] = useState(searchParams.get("jobId") || "");
  const [resumeId, setResumeId] = useState(searchParams.get("resumeId") || "");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/hosted/jobs?view=pipeline", { cache: "no-store" }),
      fetch("/api/hosted/resumes", { cache: "no-store" }),
    ]).then(async ([jobsResponse, resumesResponse]) => {
      const [jobsBody, resumesBody] = await Promise.all([jobsResponse.json(), resumesResponse.json()]);
      if (jobsResponse.ok) {
        setJobs(jobsBody.jobs || []);
        setJobId((current) => current || jobsBody.jobs?.[0]?.id || "");
      }
      if (resumesResponse.ok) {
        setResumes(resumesBody.resumes || []);
        setResumeId((current) => current || resumesBody.resumes?.[0]?.id || "");
      }
      if (!jobsResponse.ok || !resumesResponse.ok) setMessage(jobsBody.error || resumesBody.error || "Your saved roles or resumes could not be loaded.");
    }).catch(() => setMessage("Your saved roles or resumes could not be loaded."));
  }, []);

  const canRun = useMemo(() => Boolean(jobId && resumeId && !busy), [busy, jobId, resumeId]);

  async function runCheck(event: React.FormEvent) {
    event.preventDefault();
    if (!canRun) return;
    setBusy(true);
    setMessage(null);
    setResult(null);
    const response = await fetch("/api/hosted/ats-check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, resumeId }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setResult(body);
    else setMessage(body.error || "The ATS check could not be completed.");
    setBusy(false);
  }

  return <div className={styles.page}>
    <header className={styles.heading}><div><p>ATS resume check</p><h1 className={instrumentSerif.className}>See what parsers can observe. Keep every claim true.</h1><span>Compare one private resume with one saved job using deterministic checks—no model call, no proprietary “pass” prediction, and no automatic keyword injection.</span></div><aside><ShieldCheck /><div><strong>Private by design</strong><small>Processed on demand · report not stored</small></div></aside></header>

    <section className={styles.workspace}>
      <form className={styles.controls} onSubmit={runCheck}>
        <div className={styles.step}><span>01</span><div><small>Select evidence</small><strong>Choose a role and resume</strong></div></div>
        <label>Saved job<div className={styles.selectWrap}><select value={jobId} onChange={(event) => setJobId(event.target.value)}><option value="">Choose a job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} — {job.title}</option>)}</select><ChevronDown aria-hidden="true" /></div></label>
        <label>Private resume<div className={styles.selectWrap}><select value={resumeId} onChange={(event) => setResumeId(event.target.value)}><option value="">Choose a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} — {resume.roleType}</option>)}</select><ChevronDown aria-hidden="true" /></div></label>
        <div className={styles.notice}><LockKeyhole /><p><strong>Your file stays private.</strong> RoleLinked reads the selected object for this request and does not save extracted text or the report.</p></div>
        <button disabled={!canRun}><FileScan />{busy ? "Checking resume…" : "Run private ATS check"}</button>
        {!resumes.length && <p className={styles.inlineHelp}>Upload a base resume in the Resumes section first.</p>}
        {!jobs.length && <p className={styles.inlineHelp}>Save or discover a role before running a check.</p>}
      </form>

      <section className={styles.report} aria-live="polite">
        {message && <div className={styles.error}><AlertTriangle />{message}</div>}
        {!result && !message && <div className={styles.empty}><SearchCheck /><h2>Compatibility report</h2><p>Select the exact evidence you plan to use. The report will show keyword coverage, title alignment, and parsing signals.</p></div>}
        {result && <>
          <div className={styles.reportHead}><div><small>Observable compatibility estimate</small><h2>{result.job.company} · {result.job.title}</h2><p>{result.resume.name} · {result.resume.filename}</p></div><a href={result.job.url} target="_blank" rel="noreferrer">Open listing <ExternalLink /></a></div>
          <div className={styles.scoreGrid}>
            <article className={styles.score}><strong>{result.analysis.compatibilityPct}%</strong><span>{result.analysis.label}</span><small>{result.analysis.confidence} confidence</small></article>
            <article><strong>{result.analysis.keywordCoverage.coveragePct}%</strong><span>Requirements coverage</span><small>{result.analysis.keywordCoverage.presentCount} of {result.analysis.keywordCoverage.total} detected terms</small></article>
            <article><strong>{result.analysis.parseability.percentage}%</strong><span>Parseability checks</span><small>{result.analysis.format}{result.analysis.pageCount ? ` · ${result.analysis.pageCount} pages` : ""}</small></article>
            <article><strong>{result.analysis.titleAlignment.percentage}%</strong><span>Title alignment</span><small>{result.analysis.titleAlignment.present.join(", ") || "No substantive title terms found"}</small></article>
          </div>
          {result.analysis.lowConfidenceReason && <div className={styles.warning}><AlertTriangle /><p><strong>Limited job-text confidence</strong>{result.analysis.lowConfidenceReason}</p></div>}
          <div className={styles.parseList}>{result.analysis.parseability.checks.map((check) => <div key={check.key}>{check.passed ? <Check className={styles.pass} /> : <X className={styles.fail} />}<p><strong>{check.label}</strong><span>{check.detail}</span></p></div>)}</div>
          <div className={styles.keywordGrid}>
            <KeywordGroup title="Found in resume" values={result.analysis.keywordCoverage.present} tone="good" />
            <KeywordGroup title="Mentioned once" values={result.analysis.keywordCoverage.thin} tone="warn" />
            <KeywordGroup title="Not found" values={result.analysis.keywordCoverage.missing} tone="bad" />
          </div>
          <div className={styles.guardrail}><ShieldCheck /><p><strong>Truthfulness guardrail</strong>{result.analysis.guardrail}</p></div>
          <p className={styles.privacy}>{result.privacy}</p>
        </>}
      </section>
    </section>
  </div>;
}
