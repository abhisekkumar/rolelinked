import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CoMark } from "@/components/co-mark";
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
          <Link href="/welcome#control">Control</Link>
        </nav>

        <Link href="/welcome#workspace" className={styles.headerCta}>
          See it in action <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
