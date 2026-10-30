import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { inter, instrumentSerif, instrumentSerifItalic } from "@/lib/fonts";
import { AppShell } from "@/components/app-shell";
import { RouteProgressHost } from "@/components/route-progress-host";
import { ThemeProvider } from "@/components/theme-provider";
import { isHostedDeployment } from "@/lib/deployment-mode.mjs";
import { isHostedAuthConfigured } from "@/lib/hosted/config.mjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoleLinked — local-first AI career command center",
  description: "Discover roles, prepare truthful applications, track your pipeline, and practice interviews locally.",
  // Home-screen / standalone (iOS): let our theme-color flow up to the status bar
  // + Dynamic Island; safe-area insets handle the layout.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RoleLinked" },
};

export const viewport: Viewport = {
  // viewport-fit=cover → env(safe-area-inset-*) become non-zero so the header can
  // sit flush under the notch / Dynamic Island.
  viewportFit: "cover",
  // Default (corrected to the real theme before paint by THEME_SCRIPT, then kept
  // in sync by the theme toggle). Dark flows seamlessly into the black island.
  themeColor: "#071211",
};

// Before paint: set the theme class AND tint the browser chrome (theme-color) to
// match — so Safari's status bar / URL bar unify with the header instead of a
// jarring light seam. Matches --bg (light #f6f8f8 / dark #071211).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('career-ops:theme');var s=t==='light'||t==='dark'?t:null;var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',d?'#071211':'#f6f8f8');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <>
      <RouteProgressHost />
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </>
  );
  const useClerk = isHostedDeployment(process.env.ROLELINKED_DEPLOYMENT_MODE) && isHostedAuthConfigured();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${instrumentSerifItalic.variable}`}
    >
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {useClerk ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
