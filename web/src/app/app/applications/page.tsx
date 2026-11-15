import type { Metadata } from "next";
import { ApplicationPackets } from "@/components/hosted/application-packets";

export const metadata: Metadata = { title: "Applications — RoleLinked", description: "Prepare and approve truthful application packets." };
export default function ApplicationsPage() { return <ApplicationPackets />; }
