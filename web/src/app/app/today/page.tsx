import type { Metadata } from "next";

import { TodayWorkspace } from "@/components/hosted/today-workspace";

export const metadata: Metadata = {
  title: "Today — RoleLinked",
  description: "A focused daily queue for job discovery, application review, follow-ups, and interview preparation.",
};

export default function TodayPage() {
  return <TodayWorkspace />;
}
