const SENIORITY_WORDS = new Set(["senior", "sr", "staff", "principal", "lead", "junior", "jr"]);
import { normalizeUrl } from "./url-key.mjs";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

function tokens(value, { ignoreSeniority = false } = {}) {
  const values = normalizeText(value).split(/\s+/).filter(Boolean);
  return ignoreSeniority ? values.filter((word) => !SENIORITY_WORDS.has(word)) : values;
}

export function canonicalizeJobUrl(value) {
  const canonical = normalizeUrl(String(value || ""));
  if (!canonical) {
    throw new Error("Job URLs must use HTTP or HTTPS.");
  }
  return canonical;
}

function roleMatch(title, targetRoles) {
  const normalizedTitle = normalizeText(title);
  let best = 0;
  let matchedRole = "";

  for (const role of targetRoles || []) {
    const normalizedRole = normalizeText(role);
    if (!normalizedRole) continue;
    if (normalizedTitle.includes(normalizedRole)) {
      if (55 > best) {
        best = 55;
        matchedRole = role;
      }
      continue;
    }
    const roleTokens = [...new Set(tokens(role, { ignoreSeniority: true }))];
    if (!roleTokens.length) continue;
    const titleTokens = new Set(tokens(title));
    const overlap = roleTokens.filter((word) => titleTokens.has(word)).length / roleTokens.length;
    const score = Math.round(overlap * 48);
    if (score > best) {
      best = score;
      matchedRole = role;
    }
  }

  return { score: best, matchedRole };
}

function isExcluded(title, excludedRoles) {
  const normalizedTitle = normalizeText(title);
  return (excludedRoles || []).some((role) => {
    const normalizedRole = normalizeText(role);
    return normalizedRole && normalizedTitle.includes(normalizedRole);
  });
}

function locationMatch(job, profile) {
  const haystack = normalizeText(`${job.location || ""} ${job.remoteSignal || ""}`);
  const remote = /\bremote\b/.test(haystack) || job.remoteSignal === "remote";
  const preference = profile.remotePreference || "flexible";
  if (preference === "remote") return remote ? { score: 20, reason: "Remote preference" } : { score: 0, reason: "" };
  if (preference === "flexible") return { score: remote ? 15 : 8, reason: remote ? "Remote option" : "Flexible arrangement" };

  const wanted = (profile.locations || []).map(normalizeText).filter(Boolean);
  const matched = wanted.find((location) => haystack.includes(location));
  return matched ? { score: 20, reason: "Preferred location" } : { score: remote ? 8 : 0, reason: "" };
}

function skillMatches(job, prioritySkills) {
  const haystack = normalizeText(`${job.title || ""} ${job.descriptionExcerpt || ""}`);
  return (prioritySkills || []).filter((skill) => {
    const normalized = normalizeText(skill);
    return normalized && haystack.includes(normalized);
  });
}

function freshnessScore(postedAt, now) {
  if (!postedAt) return 0;
  const timestamp = new Date(postedAt).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  const ageDays = Math.max(0, (now - timestamp) / 86_400_000);
  if (ageDays <= 3) return 10;
  if (ageDays <= 7) return 7;
  if (ageDays <= 14) return 3;
  return 0;
}

function compensationMatch(job, profile) {
  const floor = Number(profile.compensationMinimum);
  const minimum = Number(job.compensationMinimum);
  const maximum = Number(job.compensationMaximum);
  const hasFloor = Number.isFinite(floor) && floor > 0;
  const hasMinimum = Number.isFinite(minimum) && minimum > 0;
  const hasMaximum = Number.isFinite(maximum) && maximum > 0;
  if (!hasFloor || String(profile.compensationCurrency || "USD").toUpperCase() !== "USD") {
    return { belowFloor: false, score: 0, reason: "" };
  }
  if (hasMaximum && maximum < floor) return { belowFloor: true, score: 0, reason: "" };
  if ((hasMinimum && minimum >= floor) || (hasMaximum && maximum >= floor)) {
    return { belowFloor: false, score: 5, reason: "Meets compensation floor" };
  }
  return { belowFloor: false, score: 0, reason: "" };
}

function sponsorshipMatch(job, profile) {
  const signal = job.sponsorshipSignal || "unknown";
  if (!profile.sponsorshipRequired) return { incompatible: false, score: 0, reason: "" };
  if (signal === "negative") return { incompatible: true, score: 0, reason: "" };
  if (signal === "positive") return { incompatible: false, score: 5, reason: "Sponsorship signal" };
  return { incompatible: false, score: 0, reason: "" };
}

export function rankHostedJobs(jobs, profile, { now = Date.now(), minimumScore = 35, limit = 100 } = {}) {
  const seen = new Set();
  const ranked = [];

  for (const rawJob of jobs || []) {
    if (!rawJob?.title || !rawJob?.url || isExcluded(rawJob.title, profile.excludedRoles)) continue;
    let canonicalUrl;
    try {
      canonicalUrl = canonicalizeJobUrl(rawJob.url);
    } catch {
      continue;
    }
    if (seen.has(canonicalUrl)) continue;
    seen.add(canonicalUrl);

    const role = roleMatch(rawJob.title, profile.targetRoles);
    const location = locationMatch(rawJob, profile);
    const matchedSkills = skillMatches(rawJob, profile.prioritySkills);
    const fresh = freshnessScore(rawJob.postedAt, now);
    const compensation = compensationMatch(rawJob, profile);
    const sponsorship = sponsorshipMatch(rawJob, profile);
    if (compensation.belowFloor || sponsorship.incompatible) continue;
    const skillScore = Math.min(15, matchedSkills.length * 5);
    const score = Math.min(100, role.score + location.score + skillScore + fresh + compensation.score + sponsorship.score);
    if (score < minimumScore) continue;

    const matchReasons = [];
    if (role.matchedRole) matchReasons.push(`Matches ${role.matchedRole}`);
    if (location.reason) matchReasons.push(location.reason);
    if (matchedSkills.length) matchReasons.push(`${matchedSkills.slice(0, 3).join(", ")} alignment`);
    if (compensation.reason) matchReasons.push(compensation.reason);
    if (sponsorship.reason) matchReasons.push(sponsorship.reason);
    if (fresh >= 7) matchReasons.push("Recently posted");

    ranked.push({
      ...rawJob,
      canonicalUrl,
      matchScore: score,
      matchReasons,
      matchedSkills,
      remoteSignal: rawJob.remoteSignal || "unknown",
      sponsorshipSignal: rawJob.sponsorshipSignal || "unknown",
    });
  }

  return ranked
    .sort((a, b) => b.matchScore - a.matchScore || Number(new Date(b.postedAt || 0)) - Number(new Date(a.postedAt || 0)))
    .slice(0, limit);
}

export const HOSTED_JOB_STATUSES = [
  "discovered",
  "shortlisted",
  "applied",
  "responded",
  "assessment",
  "interview",
  "offer",
  "hired",
  "rejected",
  "discarded",
];

export function assertHostedJobStatus(value) {
  if (!HOSTED_JOB_STATUSES.includes(value)) throw new Error("Unsupported pipeline status.");
  return value;
}
