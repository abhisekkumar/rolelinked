import type { Metadata } from "next";
import Link from "next/link";

import styles from "../legal/legal.module.css";

export const metadata: Metadata = {
  title: "About RoleLinked",
  description:
    "Why RoleLinked exists, how it works, and the project that helped inspire it.",
};

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <article className={styles.document}>
        <Link className={styles.backLink} href="/welcome">
          ← Back to RoleLinked
        </Link>

        <p className={styles.eyebrow}>About</p>
        <h1>A calmer command center for a complicated job search.</h1>
        <p className={styles.lede}>
          RoleLinked helps candidates discover roles, compare fit, prepare
          accurate application material, and keep every next step visible—while
          leaving consequential actions under human control.
        </p>

        <section>
          <h2>What we are building</h2>
          <p>
            The goal is one coherent workspace instead of a trail of job-board
            tabs, spreadsheets, drafts, and calendar reminders. RoleLinked is
            designed for both a hosted experience and a private local edition.
            The same core principles apply to both: candidate data stays scoped
            to the candidate, generated claims must be source-backed, and the
            user approves applications and messages before anything is sent.
          </p>
        </section>

        <section>
          <h2>Project lineage</h2>
          <p>
            RoleLinked is an independent MIT-licensed derivative of Career Ops.
            We preserve attribution to the original work while developing a
            distinct product, hosted architecture, onboarding experience, and
            interaction model. RoleLinked is not endorsed by or affiliated with
            the Career Ops maintainers.
          </p>
          <div className={styles.linkGrid}>
            <a href="https://github.com/abhisekkumar/rolelinked">
              RoleLinked source ↗
            </a>
            <a href="https://github.com/career-ops-hq/career-ops">
              Career Ops upstream ↗
            </a>
          </div>
        </section>

        <section>
          <h2>Our operating promise</h2>
          <ul>
            <li>No invented qualifications or experience.</li>
            <li>No automatic application submission or outbound messaging.</li>
            <li>No credentials or private resumes committed to public source.</li>
            <li>Clear boundaries between public product code and candidate data.</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
