import type { Metadata } from "next";
import { SourceControls } from "@/components/hosted/source-controls";

export const metadata: Metadata = { title: "Sources — RoleLinked", description: "Manage private discovery source preferences." };
export default function SourcesPage() { return <SourceControls />; }
