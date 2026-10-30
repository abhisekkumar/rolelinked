"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  Compass,
  FileStack,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Radar,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { instrumentSerif } from "@/lib/fonts";

import styles from "./hosted-app-shell.module.css";

const navItems = [
  { label: "Today", href: "/app/today", icon: LayoutDashboard, ready: true },
  { label: "Discover", href: "/app/discover", icon: Compass, ready: false },
  { label: "Pipeline", href: "/app/pipeline", icon: ListChecks, ready: false },
  { label: "Resumes", href: "/app/resumes", icon: FileText, ready: false },
  { label: "Documents", href: "/app/documents", icon: FileStack, ready: false },
  { label: "Interviews", href: "/app/interviews", icon: MessageSquareText, ready: false },
  { label: "Follow-ups", href: "/app/follow-ups", icon: Bell, ready: false },
  { label: "Automations", href: "/app/automations", icon: CalendarClock, ready: false },
  { label: "Sources", href: "/app/sources", icon: Radar, ready: false },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3, ready: false },
];

export function HostedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/welcome#top" className={styles.brand} aria-label="RoleLinked home">
          <CoMark size={34} />
          <span className={instrumentSerif.className}>RoleLinked</span>
        </Link>

        <div className={styles.previewBadge}><Sparkles /> Hosted workspace preview</div>

        <nav className={styles.sideNav} aria-label="Workspace navigation">
          {navItems.map(({ label, href, icon: Icon, ready }) => {
            const item = (
              <>
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {!ready && <small>Soon</small>}
              </>
            );

            if (!ready) {
              return <span key={href} className={styles.disabledNav} aria-disabled="true">{item}</span>;
            }

            return (
              <Link key={href} href={href} className={pathname === href ? styles.activeNav : undefined}>
                {item}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/onboarding"><Settings /> Finish setup</Link>
          <div className={styles.accountCard}>
            <span>RL</span>
            <div><strong>Demo workspace</strong><small>Sample data only</small></div>
            <ChevronDown />
          </div>
        </div>
      </aside>

      <section className={styles.contentColumn}>
        <header className={styles.topbar}>
          <Link href="/welcome#top" className={styles.mobileBrand} aria-label="RoleLinked home">
            <CoMark size={31} />
            <span className={instrumentSerif.className}>RoleLinked</span>
          </Link>
          <div className={styles.searchPreview}><Search /><span>Search roles, applications, and documents</span><kbd>⌘ K</kbd></div>
          <div className={styles.topbarActions}>
            <span className={styles.safeBadge}>Sample workspace</span>
            <Link href="/onboarding">Finish setup</Link>
          </div>
        </header>

        <nav className={styles.mobileNav} aria-label="Mobile workspace navigation">
          <Link href="/app/today" className={pathname === "/app/today" ? styles.activeMobile : undefined}><LayoutDashboard /> Today</Link>
          <span aria-disabled="true"><Compass /> Discover</span>
          <span aria-disabled="true"><ListChecks /> Pipeline</span>
          <span aria-disabled="true"><FileText /> Resumes</span>
        </nav>

        <main className={styles.main}>{children}</main>
      </section>
    </div>
  );
}
