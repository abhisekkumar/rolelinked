import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isHostedDeployment } from "@/lib/deployment-mode.mjs";

export async function GET() {
  if (!isHostedDeployment()) {
    return NextResponse.json({ error: "hosted_mode_disabled" }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    deployment: "hosted",
    authenticated: true,
    capabilities: {
      account: true,
      tenantStorage: false,
      backgroundWorkers: false,
      localFilesystemFallback: false,
      automaticSubmission: false,
    },
  });
}
