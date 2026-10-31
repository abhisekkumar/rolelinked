"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  FileText,
  Fingerprint,
  LockKeyhole,
  MapPin,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  X,
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

const resumeNames = [
  "Staff Data Engineer · platform version",
  "Senior Data Engineer · core version",
  "AI Data Engineer · infrastructure version",
];

const pipelineSteps = [
  ["Discovered", "Today · 09:12"],
  ["Evidence checked", "Today · 09:16"],
  ["Application ready", "Waiting for your review"],
  ["Applied", "Not recorded"],
];

export function WelcomeExperience() {
  const [selectedRole, setSelectedRole] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [packetApproved, setPacketApproved] = useState(false);
  const role = roles[selectedRole];
  const stage = stages[activeStage];

  useEffect(() => {
    if (!reviewOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReviewOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [reviewOpen]);

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

              {stage.key === "discover" && (
                <div className={styles.signalGrid}>
                  <div><MapPin /><span>Work model</span><strong>{role.location}</strong></div>
                  <div><CircleDollarSign /><span>Compensation</span><strong>{role.pay}</strong></div>
                  <div><Fingerprint /><span>Sponsorship</span><strong>{role.visa}</strong></div>
                </div>
              )}

              {stage.key === "tailor" && (
                <div className={styles.tailorDemo}>
                  <div className={styles.resumeChoice}>
                    <FileText />
                    <span>Base resume selected</span>
                    <strong>{resumeNames[selectedRole]}</strong>
                    <small>{role.fit}% evidence alignment before edits</small>
                  </div>
                  <div className={styles.evidenceChoice}>
                    <span>Verified evidence retained</span>
                    <div>{role.stack.map((skill) => <b key={skill}><Check /> {skill}</b>)}</div>
                  </div>
                  <div className={styles.gapChoice}>
                    <AlertCircle />
                    <span>Needs your confirmation</span>
                    <strong>{role.visa}</strong>
                  </div>
                </div>
              )}

              {stage.key === "track" && (
                <div className={styles.pipelineDemo}>
                  {pipelineSteps.map(([label, timestamp], index) => (
                    <div key={label} className={index < 2 ? styles.pipelineDone : index === 2 ? styles.pipelineCurrent : ""}>
                      <span>{index < 2 ? <Check /> : index + 1}</span>
                      <div><strong>{label}</strong><small>{timestamp}</small></div>
                    </div>
                  ))}
                </div>
              )}

              {stage.key === "prepare" && (
                <div className={styles.prepareDemo}>
                  <article>
                    <span>01 · Architecture</span>
                    <strong>Design a reliable data platform for this role</strong>
                    <small>45-minute system-design practice</small>
                  </article>
                  <article>
                    <span>02 · Evidence</span>
                    <strong>Map verified stories to {role.stack.slice(0, 2).join(" + ")}</strong>
                    <small>3 source-backed prompts</small>
                  </article>
                  <article>
                    <span>03 · Questions</span>
                    <strong>Clarify sponsorship, scope, and platform ownership</strong>
                    <small>Questions prepared for the recruiter</small>
                  </article>
                </div>
              )}

              {stage.key !== "tailor" && (
                <div className={styles.stackRow}>
                  <span>Evidence match</span>
                  <div>{role.stack.map((skill) => <b key={skill}>{skill}</b>)}</div>
                </div>
              )}
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
            <span className={packetApproved ? styles.readyState : styles.holdState}>
              {packetApproved ? "Reviewed" : "Held for review"}
            </span>
          </div>
          <div className={styles.packetRows}>
            <span><FileText /> Tailored resume <b>Ready</b></span>
            <span><Fingerprint /> Claims check <b>Passed</b></span>
            <span><ShieldCheck /> Submission <b>Blocked</b></span>
          </div>
          <button type="button" onClick={() => setReviewOpen(true)}>
            {packetApproved ? "View reviewed packet" : "Review packet"} <ArrowRight />
          </button>
          <p>{packetApproved ? "Review complete. Submission is still blocked until you take the final action." : "Open the packet to inspect every document, answer, and unresolved item."}</p>
        </div>

        {reviewOpen && (
          <div className={styles.reviewBackdrop} onMouseDown={() => setReviewOpen(false)}>
            <section
              className={styles.reviewDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="packet-review-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className={styles.reviewHeader}>
                <div>
                  <span>Approval checkpoint</span>
                  <h3 id="packet-review-title">Review the exact application packet</h3>
                  <p>Illustrative demo · nothing here is sent or saved.</p>
                </div>
                <button type="button" aria-label="Close packet review" onClick={() => setReviewOpen(false)} autoFocus>
                  <X />
                </button>
              </header>

              <div className={styles.reviewSummary}>
                <div><FileText /><span>Resume</span><strong>Staff Data Engineer · tailored</strong><small>3 evidence-backed emphasis changes</small></div>
                <div><ClipboardCheck /><span>Application answers</span><strong>4 ready · 1 needs confirmation</strong><small>No qualification was inferred</small></div>
                <div><LockKeyhole /><span>External action</span><strong>Submission locked</strong><small>Review does not grant submit permission</small></div>
              </div>

              <div className={styles.reviewBody}>
                <article>
                  <div className={styles.reviewItemHeading}><Eye /><span>Resume changes</span><b>Source checked</b></div>
                  <ul>
                    <li><Check /> Platform scale moved into the opening summary</li>
                    <li><Check /> Spark, Python, and Airflow evidence prioritized</li>
                    <li><Check /> Original employers, titles, dates, and metrics preserved</li>
                  </ul>
                </article>
                <article>
                  <div className={styles.reviewItemHeading}><Fingerprint /><span>Application answers</span><b className={styles.needsReview}>1 review</b></div>
                  <dl>
                    <div><dt>Work authorization</dt><dd>Needs your confirmation</dd></div>
                    <div><dt>Compensation</dt><dd>Uses saved target range</dd></div>
                    <div><dt>Why this role?</dt><dd>Drafted from verified platform experience</dd></div>
                  </dl>
                </article>
              </div>

              <footer className={styles.reviewFooter}>
                <p><ShieldCheck /> Marking this reviewed never submits the application.</p>
                <div>
                  <button type="button" onClick={() => setReviewOpen(false)}>Keep editing</button>
                  <button type="button" onClick={() => { setPacketApproved(true); setReviewOpen(false); }}>
                    Mark packet reviewed <Check />
                  </button>
                </div>
              </footer>
            </section>
          </div>
        )}
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
