import type { HostedDiscoveryRunWithSources } from "@/lib/hosted/db/repository";

export type HostedDiscoveryRunView = {
  id: string;
  status: string;
  execution: string;
  trigger: string;
  attempt: number;
  sourcesChecked: number;
  providersSucceeded: number;
  fetched: number;
  qualified: number;
  verification: number;
  rejected: number;
  saved: number;
  failureCount: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  sources: Array<{
    source: string;
    status: string;
    fetched: number;
    error: string | null;
    checkedAt: string;
  }>;
};

function safeError(value: string | null) {
  if (!value) return null;
  return value.replace(/https?:\/\/\S+/g, "source endpoint").slice(0, 240);
}

export function toHostedDiscoveryRunView(record: HostedDiscoveryRunWithSources): HostedDiscoveryRunView {
  const { run, sources } = record;
  return {
    id: run.id,
    status: run.status,
    execution: run.execution,
    trigger: run.trigger,
    attempt: run.attempt,
    sourcesChecked: run.sourcesChecked,
    providersSucceeded: run.providersSucceeded,
    fetched: run.fetchedCount,
    qualified: run.qualifiedCount,
    verification: run.verificationCount,
    rejected: run.rejectedCount,
    saved: run.savedCount,
    failureCount: run.failureCount,
    error: safeError(run.errorMessage),
    createdAt: run.createdAt.toISOString(),
    startedAt: run.startedAt?.toISOString() || null,
    completedAt: run.completedAt?.toISOString() || null,
    sources: sources.map((source) => ({
      source: source.source,
      status: source.status,
      fetched: source.fetchedCount,
      error: safeError(source.errorMessage),
      checkedAt: source.checkedAt.toISOString(),
    })),
  };
}
