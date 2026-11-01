import { NextResponse } from "next/server";

import { getHostedServiceReadiness } from "@/lib/hosted/config.mjs";
import { getHostedIdentity } from "@/lib/hosted/identity";

export async function GET() {
  const identity = await getHostedIdentity();
  if (!identity) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return NextResponse.json({
    workspace: {
      mode: identity.mode,
      userId: identity.userId,
      label: identity.label,
    },
    services: getHostedServiceReadiness(),
    safeguards: {
      approvalRequiredForSubmission: true,
      approvalRequiredForMessages: true,
      localFilesImportedAutomatically: false,
    },
  });
}
