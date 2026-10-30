import type { Metadata } from "next";

import { AuthScreen } from "@/components/hosted/auth-screen";

export const metadata: Metadata = {
  title: "Create your account — RoleLinked",
  description: "Create a private RoleLinked workspace.",
};

export default function SignUpPage() {
  return <AuthScreen mode="sign-up" />;
}
