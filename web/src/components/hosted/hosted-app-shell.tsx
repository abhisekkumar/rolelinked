"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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
  Unplug,
} from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { instrumentSerif } from "@/lib/fonts";
import type { HostedIdentity } from "@/lib/hosted/identity";

import styles from "./hosted-app-shell.module.css";

const navItems = [
  { label: "Today", href: "/app/today", icon: LayoutDashboard, ready: true },
  { label: "Discover", href: "/app/discover", icon: Compass, ready: true },
  { label: "Pipeline", href: "/app/pipeline", icon: ListChecks, ready: true },
  { label: "Resumes", href: "/app/resumes", icon: FileText, ready: true },
  { label: "Documents", href: "/app/documents", icon: FileStack, ready: false },
  { label: "Interviews", href: "/app/interviews", icon: MessageSquareText, ready: false },
  { label: "Follow-ups", href: "/app/follow-ups", icon: Bell, ready: false },
  { label: "Automations", href: "/app/automations", icon: CalendarClock, ready: false },
  { label: "Sources", href: "/app/sources", icon: Radar, ready: false },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3, ready: false },
  { label: "Integrations", href: "/app/integrations", icon: Unplug, ready: true },
];

export function HostedAppShell({
  children,
  identity,
  onboardingComplete,
}: {
  children: React.ReactNode;
  identity: HostedIdentity;
  onboardingComplete: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/welcome#top" className={styles.brand} aria-label="RoleLinked home">
          <CoMark size={34} />
          <span className={instrumentSerif.className}>RoleLinked</span>
        </Link>

        <div className={styles.previewBadge}><Sparkles /> {identity.mode === "preview" ? "Hosted workspace preview" : "Private account workspace"}</div>

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
          <ThemeToggle className={styles.sidebarTheme} showLabel />
          <Link href="/onboarding"><Settings /> {onboardingComplete ? "Edit preferences" : "Continue setup"}</Link>
          <div className={styles.accountCard}>
            {identity.mode === "clerk" ? <UserButton /> : <span>RL</span>}
            <div><strong>{identity.label}</strong><small>{identity.detail}</small></div>
            {identity.mode === "preview" && <ChevronDown />}
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
            <span className={styles.safeBadge}>{identity.mode === "preview" ? "Sample workspace" : "Private workspace"}</span>
            <ThemeToggle className={styles.topbarTheme} />
            <Link href="/onboarding">{onboardingComplete ? "Edit preferences" : "Continue setup"}</Link>
          </div>
        </header>

        <nav className={styles.mobileNav} aria-label="Mobile workspace navigation">
          <Link href="/app/today" className={pathname === "/app/today" ? styles.activeMobile : undefined}><LayoutDashboard /> Today</Link>
          <Link href="/app/discover" className={pathname === "/app/discover" ? styles.activeMobile : undefined}><Compass /> Discover</Link>
          <Link href="/app/pipeline" className={pathname === "/app/pipeline" ? styles.activeMobile : undefined}><ListChecks /> Pipeline</Link>
          <Link href="/app/resumes" className={pathname === "/app/resumes" ? styles.activeMobile : undefined}><FileText /> Resumes</Link>
        </nav>

        <main className={styles.main}>{children}</main>
      </section>
    </div>
  );
}
