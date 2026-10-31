import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { instrumentSerif } from "@/lib/fonts";
import { isHostedAuthConfigured } from "@/lib/hosted/config.mjs";

import styles from "./auth-screen.module.css";

const authAppearance = {
  elements: {
    rootBox: styles.clerkRoot,
    cardBox: styles.clerkCardBox,
    card: styles.clerkCard,
  },
};

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const configured = isHostedAuthConfigured();
  const creating = mode === "sign-up";

  return (
    <main className={styles.page}>
      <section className={styles.frame}>
        <div className={styles.story}>
          <Link href="/welcome#top" className={styles.brand}>
            <CoMark size={34} />
            <span className={instrumentSerif.className}>RoleLinked</span>
          </Link>
          <div>
            <h1 className={instrumentSerif.className}>{creating ? "Build a search that works while you sleep." : "Welcome back to your search."}</h1>
            <p>One private workspace for discovery, truthful application packets, pipeline tracking, and interview preparation—with your approval required before anything leaves it.</p>
          </div>
          <div className={styles.promise}><ShieldCheck /> Your resume and application data are isolated to your account. RoleLinked never submits an application or sends a message without your approval.</div>
        </div>

        <div className={styles.panel}>
          {configured ? (
            creating ? (
              <SignUp
                appearance={authAppearance}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/onboarding"
              />
            ) : (
              <SignIn
                appearance={authAppearance}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/app/today"
              />
            )
          ) : (
            <div className={styles.pending}>
              <small>Local integration preview</small>
              <h2>{creating ? "Account creation is ready for Clerk keys." : "Sign-in is ready for Clerk keys."}</h2>
              <p>The authentication code is installed, but no credential is stored in this repository. Add the Clerk development keys through <code>web/.env.local</code> to test real accounts locally.</p>
              <Link href="/app/today">Continue with sample workspace</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
