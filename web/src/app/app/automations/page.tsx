import type { Metadata } from "next";
import { AutomationControls } from "@/components/hosted/automation-controls";

export const metadata: Metadata = { title: "Automations — RoleLinked", description: "Schedule safe private job discovery." };
export default function AutomationsPage() { return <AutomationControls />; }
