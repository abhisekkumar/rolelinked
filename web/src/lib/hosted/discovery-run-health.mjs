export const HOSTED_DISCOVERY_QUEUED_TIMEOUT_MS = 15 * 60_000;
export const HOSTED_DISCOVERY_RUNNING_TIMEOUT_MS = 20 * 60_000;

export const HOSTED_DISCOVERY_QUEUED_TIMEOUT_MESSAGE =
  "Background discovery did not start before the safety timeout. Please try again.";
export const HOSTED_DISCOVERY_RUNNING_TIMEOUT_MESSAGE =
  "Background discovery exceeded the safety timeout. Please try again.";

export function hostedDiscoveryStaleCutoffs(nowValue = new Date()) {
  const now = nowValue instanceof Date ? new Date(nowValue.getTime()) : new Date(nowValue);
  if (Number.isNaN(now.getTime())) throw new TypeError("A valid discovery reconciliation time is required.");

  return {
    queuedBefore: new Date(now.getTime() - HOSTED_DISCOVERY_QUEUED_TIMEOUT_MS),
    runningBefore: new Date(now.getTime() - HOSTED_DISCOVERY_RUNNING_TIMEOUT_MS),
  };
}
