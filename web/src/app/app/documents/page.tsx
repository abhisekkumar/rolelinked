import type { Metadata } from "next";
import { DocumentLibrary } from "@/components/hosted/document-library";

export const metadata: Metadata = { title: "Documents — RoleLinked", description: "Manage private career documents." };
export default function DocumentsPage() { return <DocumentLibrary />; }
