import type { Metadata } from "next";
import Link from "next/link";

import { MarketingHeader } from "@/components/marketing/marketing-header";

import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "Legal — RoleLinked",
  description: "RoleLinked privacy, cookie, and terms information.",
};

export default function LegalPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <MarketingHeader />
      <article className={styles.document}>
        <Link className={styles.backLink} href="/welcome">
          ← Back to RoleLinked
        </Link>

        <p className={styles.eyebrow}>Legal</p>
        <h1>Clear policies, written for humans.</h1>
        <p className={styles.lede}>
          These policies describe the current RoleLinked public preview and
          local edition. They will be updated before hosted accounts begin
          accepting candidate documents or payment information.
        </p>
        <p className={styles.updated}>Last updated October 30, 2026</p>

        <nav className={styles.jumpLinks} aria-label="Legal sections">
          <a href="#privacy">Privacy</a>
          <a href="#cookies">Cookies</a>
          <a href="#terms">Terms</a>
        </nav>

        <section id="privacy">
          <h2>Privacy</h2>
          <p>
            The current public preview does not accept account registrations,
            resumes, application records, or payment details. The local edition
            stores candidate files on the user&apos;s own machine unless the user
            deliberately connects an external service.
          </p>
          <p>
            When hosted accounts launch, RoleLinked will disclose what data is
            collected, why it is needed, how long it is retained, the processors
            involved, and how users can export or delete their information before
            asking candidates to upload private material.
          </p>
        </section>

        <section id="cookies">
          <h2>Cookies</h2>
          <p>
            RoleLinked does not currently use advertising cookies. The public
            preview may use essential browser storage for preferences such as
            theme or interface state. Hosted authentication will require
            essential session cookies; any optional analytics will be disclosed
            and consented to separately where required.
          </p>
        </section>

        <section id="terms">
          <h2>Terms</h2>
          <p>
            RoleLinked provides workflow assistance, not a promise of employment
            and not legal, immigration, tax, or financial advice. Users remain
            responsible for reviewing generated material, confirming factual
            accuracy, and deciding whether to apply or communicate with an
            employer.
          </p>
          <p>
            RoleLinked is designed not to submit applications or send messages
            without the user&apos;s approval. Job listings and third-party services
            may be incomplete, inaccurate, unavailable, or governed by their own
            terms. Users must follow applicable laws and third-party platform
            rules.
          </p>
        </section>

        <p className={styles.note}>
          This is an operational policy draft for the product preview, not legal
          advice. Counsel should review the final policies before hosted user data
          collection begins.
        </p>
      </article>
    </main>
  );
}
