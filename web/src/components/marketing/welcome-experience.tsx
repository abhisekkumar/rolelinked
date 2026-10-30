"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Fingerprint,
  MapPin,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import { CoMark } from "@/components/co-mark";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { instrumentSerif } from "@/lib/fonts";
import styles from "./welcome.module.css";

const roles = [
  {
    title: "Staff Data Platform Engineer",
    location: "Remote · United States",
    pay: "$190K–$230K base",
    fit: 92,
    visa: "Sponsorship history found · verify role",
    stack: ["Spark", "Python", "Airflow"],
  },
  {
    title: "Senior Data Engineer",
    location: "New York · Hybrid",
    pay: "$185K–$215K base",
    fit: 88,
    visa: "Work authorization not stated",
    stack: ["Databricks", "SQL", "Snowflake"],
  },
  {
    title: "AI Data Infrastructure Engineer",
    location: "Remote · US time zones",
    pay: "Compensation needs verification",
    fit: 84,
    visa: "Recruiter confirmation needed",
    stack: ["Python", "Data platform", "MLOps"],
  },
];

const stages = [
  {
    key: "discover",
    label: "Discover",
    eyebrow: "Signal, not volume",
    title: "12 roles passed your rules",
    copy: "Location, compensation, seniority, and sponsorship signals are checked before a role reaches your review queue.",
    icon: Radar,
  },
  {
    key: "tailor",
    label: "Tailor",
    eyebrow: "Evidence only",
    title: "The right resume is selected",
    copy: "RoleLinked maps the posting to verified experience, preserves your real history, and surfaces gaps instead of inventing claims.",
    icon: FileText,
  },
  {
    key: "track",
    label: "Track",
    eyebrow: "One source of truth",
    title: "Every next step stays visible",
    copy: "Applications, responses, interviews, rejections, and follow-ups move through one pipeline with dates and context intact.",
    icon: Workflow,
  },
  {
    key: "prepare",
    label: "Prepare",
    eyebrow: "Company-specific",
    title: "Interview prep starts with the role",
    copy: "Build a focused plan from the job description, company context, your verified story bank, and the gaps you still need to close.",
    icon: Target,
  },
];

const week = [
  ["Mon", "New roles", "Fresh matches enter one review queue."],
  ["Tue", "Application", "A truthful packet is ready for your approval."],
  ["Thu", "Follow-up", "The right reminder appears with the original context."],
  ["Fri", "Interview", "Practice is mapped to this company and role."],
];

export function WelcomeExperience() {
  const [selectedRole, setSelectedRole] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [packetReviewed, setPacketReviewed] = useState(false);
  const role = roles[selectedRole];
  const stage = stages[activeStage];

  return (
    <main id="top" className={styles.root}>
      <div className={styles.auroraOne} aria-hidden="true" />
      <div className={styles.auroraTwo} aria-hidden="true" />

      <MarketingHeader />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.liveDot} />
            Career operations, linked end to end
          </div>
          <h1 className={instrumentSerif.className}>
            Your next role shouldn&apos;t live across <em>fourteen tabs.</em>
          </h1>
          <p>
            RoleLinked turns discovery, truthful resume tailoring, application tracking, and interview preparation into one calm daily system—with you at every decision point.
          </p>
          <div className={styles.heroActions}>
            <a href="#workspace" className={styles.primaryCta}>
              Explore the workspace <ArrowRight aria-hidden="true" />
            </a>
            <a href="#control" className={styles.secondaryCta}>See the approval gate</a>
          </div>
          <div className={styles.proofStrip} aria-label="Product principles">
            <span><CheckCircle2 /> No auto-submit</span>
            <span><Fingerprint /> Source-backed tailoring</span>
            <span><ShieldCheck /> Private by design</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.orbit}>
            <span className={styles.orbitNodeOne}><ScanSearch /></span>
            <span className={styles.orbitNodeTwo}><FileText /></span>
            <span className={styles.orbitNodeThree}><CalendarClock /></span>
          </div>
          <div className={styles.focusCard}>
            <span className={styles.focusLabel}>Today</span>
            <strong>3 decisions</strong>
            <p>One role to review, one application packet, one follow-up.</p>
            <div className={styles.focusRail}>
              <span /><span /><span />
            </div>
          </div>
        </div>
      </section>

      <section id="workspace" className={styles.workspaceSection}>
        <div className={styles.sectionIntro}>
          <div>
            <span className={styles.kicker}>Interactive product tour</span>
            <h2 className={instrumentSerif.className}>Move one role through the whole search.</h2>
          </div>
          <p>Choose a role and a workflow stage. The example workspace updates with the context you would actually need next.</p>
        </div>

        <div className={styles.workspace}>
          <div className={styles.workspaceTopbar}>
            <div className={styles.windowDots}><span /><span /><span /></div>
            <span>Illustrative workspace · no real candidate data</span>
            <span className={styles.securePill}><ShieldCheck /> Private</span>
          </div>
          <div className={styles.stageTabs} role="tablist" aria-label="Workflow stage">
            {stages.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={activeStage === index}
                  className={activeStage === index ? styles.stageActive : ""}
                  onClick={() => setActiveStage(index)}
                >
                  <Icon /> {item.label}
                </button>
              );
            })}
          </div>

          <div className={styles.workspaceGrid}>
            <div className={styles.roleList}>
              <div className={styles.panelHeading}>
                <span>Review queue</span>
                <span>{roles.length} roles</span>
              </div>
              {roles.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSelectedRole(index)}
                  className={selectedRole === index ? styles.roleSelected : styles.roleButton}
                >
                  <span className={styles.fitRing}>{item.fit}</span>
                  <span className={styles.roleCopy}>
                    <strong>{item.title}</strong>
                    <small><MapPin /> {item.location}</small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className={styles.roleDetail} key={`${selectedRole}-${activeStage}`}>
              <div className={styles.detailHeader}>
                <div>
                  <span>{stage.eyebrow}</span>
                  <h3>{stage.title}</h3>
                </div>
                <span className={styles.scoreBadge}>{role.fit}% fit</span>
              </div>
              <p className={styles.stageCopy}>{stage.copy}</p>

              <div className={styles.signalGrid}>
                <div><MapPin /><span>Work model</span><strong>{role.location}</strong></div>
                <div><CircleDollarSign /><span>Compensation</span><strong>{role.pay}</strong></div>
                <div><Fingerprint /><span>Sponsorship</span><strong>{role.visa}</strong></div>
              </div>

              <div className={styles.stackRow}>
                <span>Evidence match</span>
                <div>{role.stack.map((skill) => <b key={skill}>{skill}</b>)}</div>
              </div>
              <div className={styles.nextAction}>
                <Sparkles />
                <div>
                  <span>Suggested next action</span>
                  <strong>{stage.label === "Discover" ? "Verify sponsorship and open the evidence report" : `Continue to ${stage.label.toLowerCase()} with this role`}</strong>
                </div>
                <button type="button" onClick={() => setActiveStage((activeStage + 1) % stages.length)}>
                  Continue <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rhythm" className={styles.rhythmSection}>
        <div className={styles.rhythmCopy}>
          <span className={styles.kicker}>A search with a memory</span>
          <h2 className={instrumentSerif.className}>Every action makes the next one easier.</h2>
          <p>RoleLinked keeps the role, evidence, documents, status, and interview context connected instead of starting from zero each time. It is agentic where coordination saves time, and approval-first wherever an action could leave your workspace.</p>
        </div>
        <div className={styles.weekFlow}>
          {week.map(([day, title, copy], index) => (
            <article key={day}>
              <span className={styles.day}>{day}</span>
              <span className={styles.weekIndex}>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="control" className={styles.controlSection}>
        <div className={styles.controlCopy}>
          <span className={styles.kicker}>Approval is a product feature</span>
          <h2 className={instrumentSerif.className}>AI prepares. You decide what leaves.</h2>
          <p>Drafting and automation stop at a visible review gate. RoleLinked does not silently submit applications, send messages, or turn an uncertain qualification into a fact.</p>
          <ul>
            <li><Check /> Exact payload shown before any consequential action</li>
            <li><Check /> Unknown sponsorship and compensation stay unknown</li>
            <li><Check /> Resume claims remain tied to your approved sources</li>
          </ul>
        </div>

        <div className={styles.approvalCard}>
          <div className={styles.approvalHeader}>
            <span><BriefcaseBusiness /> Application packet</span>
            <span className={packetReviewed ? styles.readyState : styles.holdState}>
              {packetReviewed ? "Reviewed" : "Held for review"}
            </span>
          </div>
          <div className={styles.packetRows}>
            <span><FileText /> Tailored resume <b>Ready</b></span>
            <span><Fingerprint /> Claims check <b>Passed</b></span>
            <span><ShieldCheck /> Submission <b>{packetReviewed ? "Still requires you" : "Blocked"}</b></span>
          </div>
          <button type="button" onClick={() => setPacketReviewed(!packetReviewed)}>
            {packetReviewed ? "Reset demo" : "Review packet"} <ArrowRight />
          </button>
          <p>{packetReviewed ? "Packet reviewed. Nothing was submitted—your final action remains yours." : "This button demonstrates the gate. It never sends an application."}</p>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span>RoleLinked</span>
          <h2 className={instrumentSerif.className}>A calmer way to run the search.</h2>
          <p>Less tab chaos. More context. Better decisions.</p>
        </div>
        <a href="#workspace" className={styles.primaryCta}>Explore the workflow <ArrowRight /></a>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><CoMark size={28} /><span>RoleLinked</span></div>
        <nav aria-label="Footer navigation">
          <Link href="/about">About</Link>
          <Link href="/legal#privacy">Privacy</Link>
          <Link href="/legal#cookies">Cookies</Link>
          <Link href="/legal#terms">Terms</Link>
        </nav>
        <span>© 2026 RoleLinked</span>
      </footer>
    </main>
  );
}
