import type { Metadata } from "next";

import { AuthScreen } from "@/components/hosted/auth-screen";

export const metadata: Metadata = {
  title: "Sign in — RoleLinked",
  description: "Sign in to your private RoleLinked workspace.",
};

export default function SignInPage() {
  return <AuthScreen mode="sign-in" />;
}
