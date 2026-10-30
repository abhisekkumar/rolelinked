import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { ArrowRight, Check, Cloud, LockKeyhole, ShieldCheck } from "lucide-react";
import { CoMark } from "@/components/co-mark";
import { instrumentSerif } from "@/lib/fonts";

export const dynamic = "force-dynamic";

export default async function HostedWorkspacePage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: "/app" });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/welcome" className="flex items-center gap-3">
            <CoMark size={36} />
            <span className={`${instrumentSerif.className} text-3xl text-landing`}>RoleLinked</span>
          </Link>
          <UserButton />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
          <Cloud className="size-3.5" />
          Hosted foundation active
        </div>
        <h1 className={`${instrumentSerif.className} mt-7 max-w-4xl text-5xl leading-none tracking-tight text-landing sm:text-7xl`}>
          Your account is ready. Your private workspace is next.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
          Authentication is connected, while career files, scans, and AI workers remain disabled until tenant-scoped storage and background jobs are wired. This prevents the hosted app from ever falling back to server-local files.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            [ShieldCheck, "Account boundary", "Every hosted request is authenticated with Clerk."],
            [LockKeyhole, "Private by default", "Legacy filesystem and local-CLI routes fail closed in hosted mode."],
            [Check, "Approval first", "Submitting applications and sending messages will always require your action."],
          ].map(([Icon, title, copy]) => {
            const CardIcon = Icon as typeof ShieldCheck;
            return (
              <article key={String(title)} className="rounded-[1.5rem] border border-border bg-surface p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><CardIcon className="size-5" /></span>
                <h2 className="mt-6 text-lg font-semibold">{String(title)}</h2>
                <p className="mt-3 leading-7 text-muted">{String(copy)}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-[1.5rem] border border-border bg-surface p-6">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Next engineering milestone</p>
            <p className="mt-1 text-sm text-muted">Tenant database, encrypted object storage, and scheduled discovery workers.</p>
          </div>
          <a href="https://github.com/abhisekkumar/rolelinked" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground">
            Follow development <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
