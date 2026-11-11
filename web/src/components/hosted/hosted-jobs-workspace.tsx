"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Filter,
  Globe2,
  Info,
  LoaderCircle,
  MapPin,
  Plus,
  Radar,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import type { HostedJobView } from "@/lib/hosted/job-view";

import styles from "./hosted-jobs-workspace.module.css";

type JobRecord = HostedJobView;

const STATUSES = [
  "discovered",
  "shortlisted",
  "applied",
  "responded",
  "assessment",
  "interview",
  "offer",
  "hired",
  "rejected",
  "discarded",
] as const;

const STATUS_LABELS: Record<string, string> = {
  discovered: "Discovered",
  shortlisted: "Shortlisted",
  applied: "Applied",
  responded: "Responded",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  discarded: "Discarded",
};

const DATE_FILTERS = [
  { value: "all", label: "Any time" },
  { value: "1", label: "24h" },
  { value: "3", label: "3d" },
  { value: "7", label: "7d" },
  { value: "14", label: "14d" },
  { value: "30", label: "30d" },
] as const;

const SENIORITY_FILTERS = [
  { value: "all", label: "Any level" },
  { value: "staff", label: "Staff+" },
  { value: "senior", label: "Senior" },
  { value: "other", label: "Other" },
] as const;

const MATCH_FILTERS = [
  { value: "all", label: "All matches" },
  { value: "qualified", label: "Strong match" },
  { value: "verification", label: "Verify details" },
  { value: "unreviewed", label: "Unreviewed" },
] as const;

function matchLabel(job: JobRecord) {
  if (job.matchTier === "qualified") return "Strong match";
  if (job.matchTier === "verification") return "Verify details";
  return "Unreviewed";
}

function seniorityBucket(title: string) {
  const normalized = title.toLowerCase();
  if (/\b(principal|director|head|lead|staff)\b/.test(normalized)) return "staff";
  if (/\b(senior|sr\.?)(\b|\s)/.test(normalized)) return "senior";
  return "other";
}

function formatDate(value: string | null) {
  if (!value) return "Posting date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Posting date unavailable";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatCompensation(job: JobRecord) {
  if (!job.compensationMinimum && !job.compensationMaximum) return "Compensation not listed";
  const money = (value: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
  if (job.compensationMinimum && job.compensationMaximum) {
    return `${money(job.compensationMinimum)}–${money(job.compensationMaximum)}`;
  }
  return money(job.compensationMinimum || job.compensationMaximum || 0);
}

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

export function HostedJobsWorkspace({
  initialJobs,
  mode,
}: {
  initialJobs: JobRecord[];
  mode: "discover" | "pipeline";
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState(mode === "discover" ? "all" : "all");
  const [running, setRunning] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [postedWithin, setPostedWithin] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [seniorityFilter, setSeniorityFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: jobs.length };
    for (const status of STATUSES) next[status] = jobs.filter((job) => job.status === status).length;
    return next;
  }, [jobs]);

  const sources = useMemo(() => [...new Set(jobs.map((job) => job.source).filter(Boolean))].sort(), [jobs]);

  const activeFilterCount = [
    postedWithin !== "all",
    sourceFilter !== "all",
    seniorityFilter !== "all",
    matchFilter !== "all",
    Boolean(locationFilter.trim()),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setPostedWithin("all");
    setSourceFilter("all");
    setSeniorityFilter("all");
    setMatchFilter("all");
    setLocationFilter("");
  };

  const visibleJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();
    const cutoff = postedWithin === "all" ? null : Date.now() - Number(postedWithin) * 86_400_000;
    return jobs.filter((job) => {
      const statusMatch = activeStatus === "all" || job.status === activeStatus;
      const searchMatch = !normalized || `${job.company} ${job.title} ${job.location} ${job.matchedSkills.join(" ")}`.toLowerCase().includes(normalized);
      const dateValue = job.postedAt ? new Date(job.postedAt).getTime() : Number.NaN;
      const dateMatch = cutoff === null || (Number.isFinite(dateValue) && dateValue >= cutoff);
      const sourceMatch = sourceFilter === "all" || job.source === sourceFilter;
      const seniorityMatch = seniorityFilter === "all" || seniorityBucket(job.title) === seniorityFilter;
      const matchTier = ["qualified", "verification"].includes(job.matchTier) ? job.matchTier : "unreviewed";
      const qualityMatch = matchFilter === "all" || matchTier === matchFilter;
      const locationMatch = !normalizedLocation || job.location.toLowerCase().includes(normalizedLocation);
      const baseMatch = statusMatch && searchMatch && dateMatch && sourceMatch && seniorityMatch && qualityMatch && locationMatch;
      if (mode === "discover") return baseMatch && !["rejected", "discarded", "hired"].includes(job.status);
      return baseMatch;
    });
  }, [activeStatus, jobs, locationFilter, matchFilter, mode, postedWithin, query, seniorityFilter, sourceFilter]);

  const reloadJobs = async () => {
    const payload = await readResponse(await fetch(`/api/hosted/jobs?view=${mode}`, { cache: "no-store" }));
    setJobs(payload.jobs);
  };

  const runDiscovery = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const payload = await readResponse(await fetch("/api/hosted/discovery/run", { method: "POST" }));
      await reloadJobs();
      const failureNote = payload.run.failures.length
        ? ` ${payload.run.failures.length} source${payload.run.failures.length === 1 ? "" : "s"} could not be reached.`
        : "";
      setMessage({
        tone: "good",
        text: `Checked ${payload.run.sourcesChecked} sources: ${payload.run.qualified} strong match${payload.run.qualified === 1 ? "" : "es"}, ${payload.run.verification} role${payload.run.verification === 1 ? "" : "s"} needing detail verification, and ${payload.run.rejected} off-target listing${payload.run.rejected === 1 ? "" : "s"} filtered out.${failureNote}`,
      });
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Discovery could not run." });
    } finally {
      setRunning(false);
    }
  };

  const changeStatus = async (jobId: string, status: string) => {
    setUpdatingId(jobId);
    setMessage(null);
    try {
      const payload = await readResponse(await fetch(`/api/hosted/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      }));
      setJobs((current) => current.map((job) => job.id === jobId ? payload.job : job));
      setMessage({ tone: "good", text: `Moved to ${STATUS_LABELS[status]}. This updates your tracker only.` });
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Status could not be updated." });
    } finally {
      setUpdatingId(null);
    }
  };

  const addManualJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRunning(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await readResponse(await fetch("/api/hosted/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      }));
      await reloadJobs();
      event.currentTarget.reset();
      setShowManual(false);
      setMessage({ tone: "good", text: "Job added to your private discovery queue." });
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Job could not be added." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{mode === "discover" ? "Private discovery" : "Application pipeline"}</p>
          <h1 className={instrumentSerif.className}>
            {mode === "discover" ? "Find roles worth your attention." : "Every opportunity, in the right stage."}
          </h1>
          <p>
            {mode === "discover"
              ? "RoleLinked checks public job sources, ranks roles against your approved profile, and keeps the results private to your account."
              : "Track what happened after discovery. Status changes here never submit an application or contact a company."}
          </p>
        </div>
        <div className={styles.headingActions}>
          {mode === "discover" && <button type="button" className={styles.secondaryButton} onClick={() => setShowManual((value) => !value)}><Plus /> Add a job</button>}
          {mode === "discover" && <button type="button" className={styles.primaryButton} onClick={runDiscovery} disabled={running}>
            {running ? <LoaderCircle className={styles.spin} /> : <Radar />} {running ? "Scanning…" : "Run discovery"}
          </button>}
        </div>
      </section>

      <section className={styles.safetyStrip}>
        <ShieldCheck />
        <div><strong>Research only</strong><span>Listings are untrusted input. RoleLinked reads them as data and never follows instructions embedded inside a posting.</span></div>
      </section>

      {showManual && (
        <form className={styles.manualForm} onSubmit={addManualJob}>
          <div><span>Add any profession or source</span><strong>Bring a role into your private pipeline.</strong></div>
          <label>Job URL<input name="url" type="url" placeholder="https://company.com/jobs/role" required /></label>
          <label>Company<input name="company" placeholder="Company" required /></label>
          <label>Role title<input name="title" placeholder="Marketing Manager, Nurse Practitioner, Data Engineer…" required /></label>
          <label>Location<input name="location" placeholder="Remote, New York, London…" /></label>
          <button type="submit" disabled={running}>Save job</button>
          <button type="button" className={styles.closeButton} onClick={() => setShowManual(false)} aria-label="Close"><X /></button>
        </form>
      )}

      {message && <div className={message.tone === "good" ? styles.goodMessage : styles.badMessage}>{message.text}</div>}

      <section className={styles.controls}>
        <label className={styles.searchBox}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, title, location, or skill" /></label>
        <button type="button" className={showFilters ? styles.activeFilterButton : styles.filterButton} onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}>
          <SlidersHorizontal /> Refine {activeFilterCount > 0 && <span>{activeFilterCount}</span>} <ChevronDown className={showFilters ? styles.chevronOpen : undefined} />
        </button>
        <div className={styles.filterLabel}><Filter /> {visibleJobs.length} of {jobs.length}</div>
      </section>

      {showFilters && (
        <section className={styles.filterPanel} aria-label="Refine pipeline results">
          <div className={styles.filterGroup}>
            <span>Posted</span>
            <div>{DATE_FILTERS.map((filter) => <button type="button" key={filter.value} className={postedWithin === filter.value ? styles.selectedFilter : undefined} onClick={() => setPostedWithin(filter.value)}>{filter.label}</button>)}</div>
          </div>
          <div className={styles.filterGroup}>
            <span>Source</span>
            <div>
              <button type="button" className={sourceFilter === "all" ? styles.selectedFilter : undefined} onClick={() => setSourceFilter("all")}>All sources</button>
              {sources.map((source) => <button type="button" key={source} className={sourceFilter === source ? styles.selectedFilter : undefined} onClick={() => setSourceFilter(source)}>{source}</button>)}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span>Seniority</span>
            <div>{SENIORITY_FILTERS.map((filter) => <button type="button" key={filter.value} className={seniorityFilter === filter.value ? styles.selectedFilter : undefined} onClick={() => setSeniorityFilter(filter.value)}>{filter.label}</button>)}</div>
          </div>
          <div className={styles.filterGroup}>
            <span>Match quality</span>
            <div>{MATCH_FILTERS.map((filter) => <button type="button" key={filter.value} className={matchFilter === filter.value ? styles.selectedFilter : undefined} onClick={() => setMatchFilter(filter.value)}>{filter.label}</button>)}</div>
          </div>
          <label className={styles.locationFilter}><span>Location</span><div><MapPin /><input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="Remote, New York…" /></div></label>
          {activeFilterCount > 0 && <button type="button" className={styles.clearFilters} onClick={clearFilters}><RotateCcw /> Clear</button>}
        </section>
      )}

      <details className={styles.matchLegend}>
        <summary><Info /> What do the match labels mean?</summary>
        <div>
          <p><strong>Strong match</strong><span>The known role, location, compensation, and sponsorship facts fit your saved preferences.</span></p>
          <p><strong>Verify details</strong><span>The role looks relevant, but at least one required fact—often compensation or sponsorship—is not stated.</span></p>
          <p><strong>Unreviewed</strong><span>A role you added manually or an older saved result that has not received the current match check.</span></p>
        </div>
      </details>

      <section className={styles.statusTabs} aria-label="Pipeline status filters">
        <button type="button" className={activeStatus === "all" ? styles.activeTab : undefined} onClick={() => setActiveStatus("all")}>All <span>{counts.all}</span></button>
        {STATUSES.filter((status) => mode === "pipeline" || ["discovered", "shortlisted", "applied"].includes(status)).map((status) => (
          <button type="button" key={status} className={activeStatus === status ? styles.activeTab : undefined} onClick={() => setActiveStatus(status)}>
            {STATUS_LABELS[status]} <span>{counts[status]}</span>
          </button>
        ))}
      </section>

      {visibleJobs.length ? (
        <section className={styles.jobGrid}>
          {visibleJobs.map((job) => (
            <article key={job.id} className={styles.jobCard}>
              <div className={styles.cardTop}>
                <span className={styles.companyMark}>{job.company.slice(0, 1).toUpperCase()}</span>
                <div><span>{job.company}</span><h2>{job.title}</h2></div>
                {job.matchScore !== null && (
                  <b className={job.matchTier === "verification" ? styles.verificationBadge : undefined}>
                    {matchLabel(job)} · {job.matchScore}%
                  </b>
                )}
              </div>
              <div className={styles.metaRow}>
                <span><MapPin /> {job.location || "Location not listed"}</span>
                <span><Clock3 /> {formatDate(job.postedAt)}</span>
                <span><Globe2 /> {job.source}</span>
              </div>
              {job.descriptionExcerpt && <p className={styles.excerpt}>{job.descriptionExcerpt}</p>}
              <div className={styles.reasonRow}>
                {job.matchReasons.slice(0, 3).map((reason) => <span key={reason}><Sparkles /> {reason}</span>)}
                {job.verificationReasons.slice(0, 1).map((reason) => <span className={styles.verificationReason} key={reason}><ShieldCheck /> {reason}</span>)}
              </div>
              <div className={styles.factRow}>
                <span><CircleDollarSign /> {formatCompensation(job)}</span>
                <span><ShieldCheck /> Sponsorship {job.sponsorshipSignal === "unknown" ? "not stated" : job.sponsorshipSignal}</span>
              </div>
              <footer>
                <a href={job.url} target="_blank" rel="noreferrer">View role <ExternalLink /></a>
                <div className={styles.quickActions}>
                  {mode === "discover" && job.status === "discovered" && <button type="button" onClick={() => changeStatus(job.id, "shortlisted")} disabled={updatingId === job.id}>Shortlist</button>}
                  {mode === "discover" && !["applied", "responded", "assessment", "interview", "offer", "hired"].includes(job.status) && <button type="button" onClick={() => changeStatus(job.id, "applied")} disabled={updatingId === job.id}><CheckCircle2 /> Mark applied</button>}
                  {mode === "pipeline" && (
                    <label className={styles.statusSelect}>
                      <span className="sr-only">Status for {job.title}</span>
                      <i aria-hidden="true" data-status={job.status} />
                      <select value={job.status} onChange={(event) => changeStatus(job.id, event.target.value)} disabled={updatingId === job.id}>
                        {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                      </select>
                      {updatingId === job.id ? <LoaderCircle className={styles.selectSpinner} /> : <ChevronDown className={styles.selectChevron} />}
                    </label>
                  )}
                </div>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <span><BriefcaseBusiness /></span>
          <h2>{jobs.length ? "No roles match this filter." : "Your live role queue starts here."}</h2>
          <p>{jobs.length ? "Try another status or search term." : "Run discovery to check public sources against your profile, or add a role from any website."}</p>
          {mode === "discover" && !jobs.length && <button type="button" onClick={runDiscovery} disabled={running}>Run first discovery <ArrowUpRight /></button>}
        </section>
      )}
    </div>
  );
}

export type { JobRecord };
