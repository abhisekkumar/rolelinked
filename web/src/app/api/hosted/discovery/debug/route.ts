import { Client } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";

import { getHostedDiscoveryRun } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";

export const maxDuration = 30;

function deliveryErrorCategory(value: unknown) {
  const message = String(value || "").toLowerCase();
  const status = message.match(/(?:status|http)[^0-9]{0,8}([1-5][0-9]{2})/)?.[1];
  if (status) return `http-${status}`;
  if (message.includes("protection") || message.includes("authentication")) return "deployment-protection";
  if (message.includes("timeout")) return "timeout";
  return message ? "delivery-error" : null;
}

export async function GET(request: NextRequest) {
  try {
    if (process.env.VERCEL_ENV === "production") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const ownerId = await requireHostedUserId();
    const runId = request.nextUrl.searchParams.get("runId")?.trim();
    if (!runId) return NextResponse.json({ error: "runId is required." }, { status: 400 });
    const run = await getHostedDiscoveryRun(ownerId, runId);
    if (!run) return NextResponse.json({ error: "Discovery run not found." }, { status: 404 });
    if (!run.run.messageId) return NextResponse.json({ run: { status: run.run.status }, delivery: [] });

    const token = String(process.env.QSTASH_TOKEN || "").trim();
    if (!token) return NextResponse.json({ error: "Queue diagnostics are unavailable." }, { status: 503 });
    const client = new Client({ token });
    const [result, message] = await Promise.all([
      client.logs({ messageIds: [run.run.messageId], count: 20 }),
      client.messages.get(run.run.messageId).catch(() => null),
    ]);
    return NextResponse.json({
      run: { status: run.run.status, attempt: run.run.attempt },
      message: message
        ? {
            createdAt: new Date(message.createdAt).toISOString(),
            notBefore: message.notBefore ? new Date(message.notBefore).toISOString() : null,
            path: new URL(message.url).pathname,
            queueName: message.queueName || null,
            flowControl: {
              key: Boolean(message.flowControlKey),
              parallelism: message.parallelism || null,
              rate: message.rate || null,
              period: message.period || null,
            },
          }
        : null,
      delivery: result.logs.map((entry) => ({
        time: new Date(entry.time).toISOString(),
        state: entry.state,
        error: deliveryErrorCategory(entry.error),
        path: new URL(entry.url).pathname,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Diagnostics failed.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
