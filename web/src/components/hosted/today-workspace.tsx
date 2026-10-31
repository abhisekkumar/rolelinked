"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";

import styles from "./today-workspace.module.css";

const focusItems = [
  { id: "match", label: "Review a strong match", title: "Staff Data Platform Engineer", meta: "Remote · $190K–$230K · sponsorship signal", action: "Add to shortlist", icon: BriefcaseBusiness, tone: "violet" },
  { id: "packet", label: "Application packet", title: "Senior Data Engineer", meta: "Resume ready · 1 answer needs confirmation", action: "Review packet", icon: FileCheck2, tone: "mint" },
  { id: "interview", label: "Interview preparation", title: "Platform architecture round", meta: "Tomorrow · system design · 45 minutes", action: "Open practice plan", icon: MessageSquareText, tone: "peach" },
];

export function TodayWorkspace() {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  const complete = (id: string) => {
    setCompleted((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Thursday, October 30</p>
          <h1 className={instrumentSerif.className}>Your search has three useful decisions today.</h1>
          <p>RoleLinked keeps discovery, applications, and preparation in one queue—without taking the final action for you.</p>
        </div>
        <div className={styles.scanStatus}><span /><div><strong>Daily discovery complete</strong><small>128 sources checked · 12 relevant roles</small></div><Radar /></div>
      </section>

      <section className={styles.metricGrid} aria-label="Workspace overview">
        <article><span>New matches</span><strong>12</strong><small><TrendingUp /> 4 high priority</small></article>
        <article><span>Ready to review</span><strong>{Math.max(0, 3 - completed.size)}</strong><small><Sparkles /> candidate decisions</small></article>
        <article><span>Follow-ups due</span><strong>2</strong><small><CalendarClock /> next at 2:00 PM</small></article>
        <article><span>Active interviews</span><strong>1</strong><small><MessageSquareText /> prep plan ready</small></article>
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.focusColumn}>
          <div className={styles.sectionHeading}><div><span>Today&apos;s focus</span><h2>Move the search forward.</h2></div><small>{completed.size} of 3 reviewed</small></div>
          <div className={styles.focusList}>
            {focusItems.map(({ id, label, title, meta, action, icon: Icon, tone }) => {
              const done = completed.has(id);
              return (
                <article key={id} className={done ? styles.doneCard : undefined}>
                  <span className={`${styles.actionIcon} ${styles[tone]}`}><Icon /></span>
                  <div className={styles.actionCopy}><small>{label}</small><strong>{title}</strong><p>{meta}</p></div>
                  <button type="button" onClick={() => complete(id)} disabled={done}>
                    {done ? <><Check /> Reviewed</> : <>{action} <ChevronRight /></>}
                  </button>
                </article>
              );
            })}
          </div>
          <p className={styles.demoHint}><CircleAlert /> Preview interactions update this page only. No application, status, or message is changed.</p>
        </div>

        <aside className={styles.insightColumn}>
          <article className={styles.weekCard}>
            <div className={styles.cardHeading}><div><span>This week</span><strong>Search momentum</strong></div><span className={styles.upBadge}>+18%</span></div>
            <div className={styles.chart} aria-label="Weekly search activity chart">
              {[34, 55, 43, 78, 62, 88, 52].map((height, index) => <span key={index} style={{ height: `${height}%` }}><i /></span>)}
            </div>
            <div className={styles.chartLabels}><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
            <dl><div><dt>Discovered</dt><dd>47</dd></div><div><dt>Evaluated</dt><dd>19</dd></div><div><dt>Applied</dt><dd>4</dd></div></dl>
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
          <div className={styles.sectionHeading}><div><span>Activity</span><h2>Recent workspace events</h2></div><button type="button" disabled>View all <ArrowUpRight /></button></div>
          <div className={styles.activityList}>
            <div><span className={styles.activityDot} /><p><strong>12 new roles</strong> passed your target-role and location rules.</p><small>18 min ago</small></div>
            <div><span className={styles.activityDot} /><p>A resume packet was prepared for <strong>Senior Data Engineer</strong>.</p><small>1 hr ago</small></div>
            <div><span className={styles.activityDot} /><p>Interview questions were generated for a <strong>platform architecture round</strong>.</p><small>Yesterday</small></div>
          </div>
        </article>

        <article className={styles.nextScanCard}>
          <span><Radar /></span><div><small>Next discovery run</small><strong>Tomorrow at 8:00 AM</strong><p>Targeting Senior, Staff, and AI Data Engineering roles.</p></div><button type="button" disabled>Manage automation</button>
        </article>
      </section>
    </div>
  );
}
