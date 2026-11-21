import type { Metadata } from "next";
import Link from "next/link";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { getHostedIdentity } from "@/lib/hosted/identity";

import styles from "../legal/legal.module.css";

export const metadata: Metadata = {
  title: "About RoleLinked",
  description:
    "Why RoleLinked exists and the operating principles behind the product.",
};

export default async function AboutPage() {
  const identity = await getHostedIdentity();
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <MarketingHeader signedIn={identity?.mode === "clerk"} />
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
          <h2>Our operating promise</h2>
          <ul>
            <li>No invented qualifications or experience.</li>
            <li>No automatic application submission or outbound messaging.</li>
            <li>Private credentials and resumes remain isolated to the account.</li>
            <li>Clear boundaries between product systems and candidate data.</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
