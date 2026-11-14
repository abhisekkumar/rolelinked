import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { instrumentSerif } from "@/lib/fonts";

import styles from "./marketing-header.module.css";

export function MarketingHeader({ signedIn = false }: { signedIn?: boolean }) {
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
          {signedIn ? (
            <div className={styles.accountButton} aria-label="Signed-in account">
              <UserButton />
            </div>
          ) : (
            <Link href="/sign-in?redirect_url=%2Fapp%2Ftoday" className={styles.signInLink}>Sign in</Link>
          )}
          <ThemeToggle className={styles.themeToggle} />
          <Link href={signedIn ? "/app/today" : "/sign-up?redirect_url=%2Fonboarding"} className={styles.headerCta}>
            {signedIn ? "Open workspace" : "Start free"} <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
