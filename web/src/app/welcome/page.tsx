import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  FileCheck2,
  GitFork,
  Radar,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from "lucide-react";
import { CoMark } from "@/components/co-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { instrumentSerif } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "RoleLinked — your AI career command center",
  description:
    "Discover relevant roles, prepare truthful applications, track every opportunity, and practice for interviews from one private workspace.",
  openGraph: {
    title: "RoleLinked — your AI career command center",
    description:
      "A private, approval-first workspace for job discovery, tailored applications, pipeline tracking, and interview preparation.",
    type: "website",
  },
};

const steps = [
  {
    icon: Radar,
    eyebrow: "Discover",
    title: "Find roles worth your time",
    copy: "Scan public company boards, filter against your real preferences, and bring the strongest matches into one inbox.",
  },
  {
    icon: FileCheck2,
    eyebrow: "Prepare",
    title: "Tailor without fabricating",
    copy: "Match the job to the right CV, surface evidence gaps, and draft application material from facts you have approved.",
  },
  {
    icon: Workflow,
    eyebrow: "Progress",
    title: "Run the whole search",
    copy: "Track applications, follow-ups, interviews, outcomes, and company-specific preparation without losing context.",
  },
];

const trustPoints = [
  "No application is submitted without your approval",
  "Your resumes and private career data stay isolated",
  "Job listings are treated as untrusted input",
  "Local edition remains open source and unrestricted",
];

export default function WelcomePage() {
  const hosted = process.env.ROLELINKED_DEPLOYMENT_MODE === "hosted";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 dot-bg opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-[-22rem] h-[42rem] w-[62rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18),rgba(79,70,229,0.08)_42%,transparent_72%)] blur-3xl" />

      <header className="relative z-10 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/welcome" className="flex items-center gap-3" aria-label="RoleLinked home">
            <CoMark size={38} />
            <span className={`${instrumentSerif.className} text-3xl tracking-tight text-landing`}>RoleLinked</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary navigation">
            <a
              href="https://github.com/abhisekkumar/rolelinked"
              className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground sm:flex"
            >
              <GitFork className="size-4" />
              Open source
            </a>
            <ThemeToggle />
            <Link
              href={hosted ? "#hosted" : "/"}
              className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-[0_8px_30px_rgba(15,118,110,0.22)] transition hover:-translate-y-0.5 hover:bg-brand-200"
            >
              {hosted ? "Hosted beta" : "Open local app"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:pb-32">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
            <Sparkles className="size-3.5" />
            Hosted beta in progress
          </div>
          <h1 className={`${instrumentSerif.className} mt-7 max-w-3xl text-6xl leading-[0.94] tracking-[-0.045em] text-landing sm:text-7xl lg:text-[5.6rem]`}>
            Your job search deserves a command center.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
            RoleLinked connects discovery, truthful application preparation, pipeline tracking, and interview practice—while keeping you in control of every consequential action.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://github.com/abhisekkumar/rolelinked"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-brand-foreground shadow-[0_12px_40px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 hover:bg-brand-200"
            >
              Run it locally for free
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#hosted"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface/70 px-6 py-3.5 font-semibold text-foreground transition hover:border-brand/40 hover:bg-surface-hover"
            >
              See the hosted plan
            </a>
          </div>
          <p className="mt-4 text-sm text-faint">Open source locally. Approval-first everywhere.</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-brand/15 via-transparent to-indigo-500/15 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface/90 p-4 shadow-2xl shadow-black/10 backdrop-blur sm:p-5">
            <div className="flex items-center justify-between border-b border-border px-2 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium">Today&apos;s career operations</span>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[11px] text-brand-text">PRIVATE</span>
            </div>

            <div className="grid gap-3 py-4 sm:grid-cols-3">
              {[
                ["25", "roles reviewed"],
                ["6", "strong matches"],
                ["3", "follow-ups due"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className={`${instrumentSerif.className} text-4xl text-landing`}>{value}</p>
                  <p className="mt-1 text-xs text-faint">{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {[
                ["Staff Data Platform Engineer", "94% evidence match", "Review"],
                ["Senior Data Engineer", "H-1B signal: verify", "Prepare"],
                ["AI Data Infrastructure Engineer", "Remote · strong fit", "Shortlist"],
              ].map(([role, signal, action], index) => (
                <div key={role} className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-mono text-xs font-bold text-brand-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{role}</p>
                    <p className="mt-0.5 truncate text-xs text-faint">{signal}</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted">{action}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-4 text-sm text-muted">
              <Bot className="size-5 shrink-0 text-brand-text" />
              <p><span className="font-semibold text-foreground">AI prepares.</span> You review and approve before anything leaves your workspace.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-border bg-surface/55">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-20 sm:px-8 lg:grid-cols-3">
          {steps.map(({ icon: Icon, eyebrow, title, copy }) => (
            <article key={title} className="rounded-[1.6rem] border border-border bg-background/80 p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-text">{eyebrow}</span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><Icon className="size-5" /></span>
              </div>
              <h2 className={`${instrumentSerif.className} mt-8 text-3xl leading-tight text-landing`}>{title}</h2>
              <p className="mt-4 leading-7 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="hosted" className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><TimerReset className="size-6" /></div>
          <h2 className={`${instrumentSerif.className} mt-6 text-5xl leading-none tracking-tight text-landing`}>Always on when your laptop is not.</h2>
          <p className="mt-6 text-lg leading-8 text-muted">
            The hosted edition will keep the dashboard available, schedule discovery in the cloud, and isolate every member&apos;s career files behind their account. The local edition will continue to work without a hosted subscription.
          </p>
        </div>
        <div className="rounded-[2rem] border border-border bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-brand-text" />
            <h3 className="text-lg font-semibold">Built around user control</h3>
          </div>
          <ul className="mt-6 grid gap-4">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-muted">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text"><Check className="size-3" /></span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border bg-surface/45">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5"><CoMark size={28} /><span>RoleLinked · approval-first career operations</span></div>
          <p className="max-w-2xl text-left sm:text-right">
            Independent MIT-licensed derivative of Career Ops. Not endorsed by Career Ops.
          </p>
        </div>
      </footer>
    </main>
  );
}
