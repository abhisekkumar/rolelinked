import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";

import styles from "./today-workspace.module.css";

type TodayJob = {
  id: string;
  company: string;
  title: string;
  location: string;
  matchScore: number | null;
  status: string;
  url: string;
};

export function TodayWorkspace({ jobs }: { jobs: TodayJob[] }) {
  const fresh = jobs.filter((job) => job.status === "discovered");
  const review = jobs.filter((job) => ["discovered", "shortlisted"].includes(job.status));
  const applied = jobs.filter((job) => job.status === "applied");
  const interviews = jobs.filter((job) => ["assessment", "interview"].includes(job.status));
  const offers = jobs.filter((job) => job.status === "offer");
  const focus = [...review].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 3);

  return (
    <div className={styles.page}>
      <section className={styles.previewNotice}>
        <Sparkles />
        <div>
          <strong>Live private workspace</strong>
          <p>The numbers below come from this account&apos;s Neon pipeline. Nothing here submits an application or sends a message.</p>
        </div>
      </section>
      <section className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Today&apos;s search</p>
          <h1 className={instrumentSerif.className}>{jobs.length ? "Your real search, distilled into decisions." : "Your private search is ready to begin."}</h1>
          <p>{jobs.length ? "Review the strongest matches, update outcomes, and keep every next step connected." : "Run discovery or add a role from any job site. Your queue will appear here once it contains real data."}</p>
        </div>
        <div className={styles.scanStatus}><span /><div><strong>{jobs.length ? `${jobs.length} roles in your workspace` : "No discovery run yet"}</strong><small>{jobs.length ? `${fresh.length} waiting for review` : "Your profile controls what qualifies"}</small></div><Radar /></div>
      </section>

      <section className={styles.metricGrid} aria-label="Workspace overview">
        <article><span>New matches</span><strong>{fresh.length}</strong><small><TrendingUp /> waiting for review</small></article>
        <article><span>Shortlisted</span><strong>{jobs.filter((job) => job.status === "shortlisted").length}</strong><small><Sparkles /> candidate decisions</small></article>
        <article><span>Applied</span><strong>{applied.length}</strong><small><CheckCircle2 /> tracker records</small></article>
        <article><span>Active interviews</span><strong>{interviews.length}</strong><small><MessageSquareText /> assessment or interview</small></article>
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.focusColumn}>
          <div className={styles.sectionHeading}><div><span>Today&apos;s focus</span><h2>{focus.length ? "Review your strongest open matches." : "Build your first review queue."}</h2></div><small>{review.length} need review</small></div>
          {focus.length ? (
            <div className={styles.focusList}>
              {focus.map((job) => (
                <article key={job.id}>
                  <span className={`${styles.actionIcon} ${styles.violet}`}><BriefcaseBusiness /></span>
                  <div className={styles.actionCopy}><small>{job.company}</small><strong>{job.title}</strong><p>{job.location || "Location not listed"}{job.matchScore !== null ? ` · ${job.matchScore}% match` : ""}</p></div>
                  <Link href="/app/discover">Review role <ArrowUpRight /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.focusList}>
              <article>
                <span className={`${styles.actionIcon} ${styles.mint}`}><Radar /></span>
                <div className={styles.actionCopy}><small>Live discovery</small><strong>Check public sources against your profile.</strong><p>Any profession is supported through your target-role preferences.</p></div>
                <Link href="/app/discover">Open Discover <ArrowUpRight /></Link>
              </article>
            </div>
          )}
          <p className={styles.demoHint}><CircleAlert /> Job listings are treated as untrusted data. External actions remain approval-gated.</p>
        </div>

        <aside className={styles.insightColumn}>
          <article className={styles.weekCard}>
            <div className={styles.cardHeading}><div><span>Pipeline</span><strong>Current outcomes</strong></div><span className={styles.upBadge}>{jobs.length}</span></div>
            <dl>
              <div><dt>Review</dt><dd>{review.length}</dd></div>
              <div><dt>Applied</dt><dd>{applied.length}</dd></div>
              <div><dt>Interviews</dt><dd>{interviews.length}</dd></div>
              <div><dt>Offers</dt><dd>{offers.length}</dd></div>
            </dl>
            <Link href="/app/pipeline">Open full pipeline <ArrowUpRight /></Link>
          </article>
          <article className={styles.approvalCard}>
            <ShieldCheck />
            <span>Approval control</span>
            <strong>Every external action is locked.</strong>
            <p>RoleLinked can research and prepare. Applications and messages remain blocked until you approve the exact payload.</p>
            <b>Protection active</b>
          </article>
        </aside>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.activityCard}>
          <div className={styles.sectionHeading}><div><span>What&apos;s live</span><h2>Phase 3 foundation</h2></div></div>
          <div className={styles.activityList}>
            <div><span className={styles.activityDot} /><p><strong>Discover</strong> checks public sources and ranks roles against your saved preferences.</p><small>Live</small></div>
            <div><span className={styles.activityDot} /><p><strong>Pipeline</strong> stores private status changes with a tenant-isolated history.</p><small>Live</small></div>
            <div><span className={styles.activityDot} /><p><strong>Applications</strong> remain manual and approval-controlled.</p><small>Protected</small></div>
          </div>
        </article>
        <article className={styles.nextScanCard}>
          <span><CalendarClock /></span><div><small>Next milestone</small><strong>Scheduled discovery</strong><p>QStash will run the same account-isolated scan on each user&apos;s chosen cadence.</p></div><Link href="/app/discover">Run manually now</Link>
        </article>
      </section>
    </div>
  );
}
