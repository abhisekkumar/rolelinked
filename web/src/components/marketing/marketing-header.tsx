import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { instrumentSerif } from "@/lib/fonts";

import styles from "./marketing-header.module.css";

export function MarketingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link
          href="/welcome#top"
          className={styles.brand}
          aria-label="RoleLinked home — return to top"
        >
          <CoMark size={36} />
          <span className={instrumentSerif.className}>RoleLinked</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/welcome#workspace">Product</Link>
          <Link href="/welcome#rhythm">How it works</Link>
          <Link href="/legal#privacy">Privacy</Link>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/app/today" className={styles.previewLink}>Workspace preview</Link>
          <ThemeToggle className={styles.themeToggle} />
          <Link href="/onboarding" className={styles.headerCta}>
            Start free <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
