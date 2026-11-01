import Link from "next/link";
import { Bot, CalendarClock, Cloud, Database, HardDriveUpload, KeyRound, ShieldCheck } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";

import styles from "./integrations-view.module.css";

type Readiness = {
  auth: boolean;
  database: boolean;
  objectStorage: boolean;
  scheduler: boolean;
  modelGateway: boolean;
  deployment: string;
};

const definitions = [
  { key: "auth", title: "Accounts", description: "Clerk sign-up, sign-in, and server-enforced workspace identity.", env: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY", icon: KeyRound },
  { key: "database", title: "Workspace database", description: "Tenant-scoped profiles, jobs, applications, approvals, interviews, and activity.", env: "DATABASE_URL", icon: Database },
  { key: "objectStorage", title: "Private document storage", description: "Original resumes, tailored PDFs, job-description archives, and interview packets.", env: "OBJECT_STORAGE_*", icon: HardDriveUpload },
  { key: "scheduler", title: "Scheduled discovery", description: "A signed dispatcher for due scans; it never grants permission to apply or message.", env: "SCHEDULER_SIGNING_SECRET", icon: CalendarClock },
  { key: "modelGateway", title: "AI preparation", description: "Server-side model access for evaluation and preparation with fair-use limits.", env: "LLM_GATEWAY_API_KEY", icon: Bot },
] as const;

export function IntegrationsView({ readiness }: { readiness: Readiness }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Workspace infrastructure</p><h1 className={instrumentSerif.className}>Connect the services behind RoleLinked.</h1></div>
        <p>This page reports configuration only—never values. Secrets stay in local or hosting-provider environment settings and are never written to Git.</p>
      </header>

      <div className={styles.notice}><ShieldCheck /> The hosted app and local Career Ops dashboard remain separate. Connecting an account does not upload the files in your local checkout.</div>

      <section className={styles.grid}>
        {definitions.map(({ key, title, description, env, icon: Icon }) => {
          const ready = readiness[key];
          return (
            <article key={key} className={styles.card}>
              <div className={styles.cardTop}><span className={styles.icon}><Icon /></span><span className={`${styles.status} ${ready ? styles.ready : styles.waiting}`}>{ready ? "Connected" : "Not configured"}</span></div>
              <h2>{title}</h2><p>{description}</p><code>{env}</code>
            </article>
          );
        })}
        <article className={styles.card}>
          <div className={styles.cardTop}><span className={styles.icon}><Cloud /></span><span className={`${styles.status} ${readiness.deployment === "hosted" ? styles.ready : styles.waiting}`}>{readiness.deployment === "hosted" ? "Hosted mode" : "Local preview"}</span></div>
          <h2>Deployment</h2><p>Vercel keeps the public app online while your computer is off. Domain cutover comes only after account-isolation tests pass.</p><code>ROLELINKED_DEPLOYMENT_MODE=hosted</code>
        </article>
      </section>

      <section className={styles.next}><div><small>Next safe milestone</small><strong>Connect Clerk locally, then add the tenant database schema.</strong></div><Link href="/onboarding">Review onboarding</Link></section>
    </div>
  );
}
