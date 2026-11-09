const SENIORITY_LEVELS = new Map([
  ["intern", 0], ["internship", 0], ["entry", 1], ["junior", 1], ["jr", 1],
  ["associate", 1], ["mid", 2], ["intermediate", 2], ["senior", 3], ["sr", 3],
  ["staff", 4], ["lead", 4], ["principal", 5], ["head", 5], ["director", 5],
  ["vp", 6], ["vice", 6],
]);
const SENIORITY_WORDS = new Set(SENIORITY_LEVELS.keys());
const GENERIC_ROLE_WORDS = new Set([
  "administrator", "analyst", "architect", "consultant", "coordinator", "designer",
  "developer", "director", "engineer", "executive", "lead", "manager", "officer",
  "practitioner", "representative", "scientist", "specialist", "technician",
]);
const GENERIC_REMOTE_LOCATIONS = /^(remote( only)?|remote no office|anywhere|worldwide|global|distributed|no office)$/;
const US_LOCATION_SIGNAL = /\b(united states|u s a|usa|us|u s|new york|new jersey|nyc|jersey city|north america|americas)\b/;
const UNTRUSTED_INSTRUCTION_PATTERNS = [
  [/ignore (all |any )?(previous|prior) instructions?/i, "Attempts to override reviewer instructions"],
  [/\b(as an ai|ai reviewer|language model|system prompt)\b/i, "Text addressed to an AI reviewer"],
  [/\bplease (mention|include|write|use) (the )?(word|phrase|code)\b/i, "Applicant instruction embedded in the posting"],
  [/\b(system|assistant|developer)\s*:/i, "Prompt-like role label embedded in the posting"],
];
export const HOSTED_MATCH_VERSION = 2;
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

function unique(values) {
  return [...new Set(values)];
}

function seniorityLevel(value) {
  const levels = tokens(value)
    .map((word) => SENIORITY_LEVELS.get(word))
    .filter((level) => Number.isInteger(level));
  return levels.length ? Math.max(...levels) : null;
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
      if (65 > best) {
        best = 65;
        matchedRole = role;
      }
      continue;
    }
    const roleTokens = unique(tokens(role, { ignoreSeniority: true }));
    if (!roleTokens.length) continue;
    const titleTokens = new Set(tokens(title));
    const overlap = roleTokens.filter((word) => titleTokens.has(word)).length / roleTokens.length;
    const domainTokens = roleTokens.filter((word) => !GENERIC_ROLE_WORDS.has(word));
    const domainMatched = !domainTokens.length || domainTokens.some((word) => titleTokens.has(word));
    const strong = overlap >= 0.67 && domainMatched;
    const score = strong ? Math.round(45 + overlap * 15) : Math.round(overlap * 35);
    if (score > best) {
      best = score;
      matchedRole = role;
    }
  }

  return { score: best, matchedRole, strong: best >= 55 };
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
  if (preference === "remote" && !remote) {
    return { score: 0, reason: "", incompatible: true, needsVerification: false };
  }

  const wanted = (profile.locations || [])
    .map(normalizeText)
    .filter((value) => value && !GENERIC_REMOTE_LOCATIONS.test(value));
  const listed = normalizeText(job.location || "");
  const genericRemote = !listed || GENERIC_REMOTE_LOCATIONS.test(listed);
  const matched = wanted.find((location) => haystack.includes(location));
  const profileSignalsUs = wanted.some((location) => US_LOCATION_SIGNAL.test(location));
  const jobSignalsUs = US_LOCATION_SIGNAL.test(listed);
  if (matched || (profileSignalsUs && jobSignalsUs)) {
    return { score: 20, reason: remote ? "Remote in preferred region" : "Preferred location", incompatible: false, needsVerification: false };
  }
  if (remote && genericRemote) {
    return { score: 14, reason: "Remote location", incompatible: false, needsVerification: wanted.length > 0 };
  }
  if (remote && wanted.length > 0) {
    return { score: 0, reason: "", incompatible: true, needsVerification: false };
  }
  if (preference === "flexible" && !wanted.length) {
    return { score: remote ? 14 : 8, reason: remote ? "Remote option" : "Flexible arrangement", incompatible: false, needsVerification: false };
  }
  return { score: 0, reason: "", incompatible: wanted.length > 0, needsVerification: !listed };
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
    return { belowFloor: false, score: 0, reason: "", needsVerification: false };
  }
  if (hasMaximum && maximum < floor) return { belowFloor: true, score: 0, reason: "", needsVerification: false };
  if ((hasMinimum && minimum >= floor) || (hasMaximum && maximum >= floor)) {
    return { belowFloor: false, score: 5, reason: "Meets compensation floor", needsVerification: false };
  }
  return { belowFloor: false, score: 0, reason: "", needsVerification: !hasMinimum && !hasMaximum };
}

function sponsorshipMatch(job, profile) {
  const signal = job.sponsorshipSignal || "unknown";
  if (!profile.sponsorshipRequired) return { incompatible: false, score: 0, reason: "", needsVerification: false };
  if (signal === "negative") return { incompatible: true, score: 0, reason: "", needsVerification: false };
  if (signal === "positive") return { incompatible: false, score: 5, reason: "Sponsorship signal", needsVerification: false };
  return { incompatible: false, score: 0, reason: "", needsVerification: true };
}

function seniorityMatch(title, matchedRole) {
  const target = seniorityLevel(matchedRole);
  const actual = seniorityLevel(title);
  if (target === null) return { incompatible: false, needsVerification: false };
  if (actual === null) return { incompatible: false, needsVerification: target >= 3 };
  if (actual <= 1 && target >= 3) return { incompatible: true, needsVerification: false };
  if (actual < target) return { incompatible: false, needsVerification: true };
  return { incompatible: false, needsVerification: false };
}

function untrustedInstructionSignals(job) {
  const content = `${job.title || ""}\n${job.descriptionExcerpt || ""}`;
  return UNTRUSTED_INSTRUCTION_PATTERNS
    .filter(([pattern]) => pattern.test(content))
    .map(([, label]) => label);
}

function rejectionKey(reason) {
  return reason || "other";
}

export function classifyHostedJobs(jobs, profile, { now = Date.now(), minimumScore = 55, limit = 100 } = {}) {
  const seen = new Set();
  const accepted = [];
  const rejected = [];
  const rejectionCounts = {};

  const reject = (job, reason) => {
    rejected.push({ job, reason });
    const key = rejectionKey(reason);
    rejectionCounts[key] = (rejectionCounts[key] || 0) + 1;
  };

  for (const rawJob of jobs || []) {
    if (!rawJob?.title || !rawJob?.url) {
      reject(rawJob, "invalid-listing");
      continue;
    }
    if (isExcluded(rawJob.title, profile.excludedRoles)) {
      reject(rawJob, "excluded-title");
      continue;
    }
    let canonicalUrl;
    try {
      canonicalUrl = canonicalizeJobUrl(rawJob.url);
    } catch {
      reject(rawJob, "unsafe-url");
      continue;
    }
    if (seen.has(canonicalUrl)) {
      reject(rawJob, "duplicate");
      continue;
    }
    seen.add(canonicalUrl);

    const role = roleMatch(rawJob.title, profile.targetRoles);
    if (!role.strong) {
      reject(rawJob, "role-mismatch");
      continue;
    }
    const seniority = seniorityMatch(rawJob.title, role.matchedRole);
    if (seniority.incompatible) {
      reject(rawJob, "seniority-mismatch");
      continue;
    }
    const location = locationMatch(rawJob, profile);
    if (location.incompatible) {
      reject(rawJob, "location-mismatch");
      continue;
    }
    const matchedSkills = skillMatches(rawJob, profile.prioritySkills);
    const fresh = freshnessScore(rawJob.postedAt, now);
    const compensation = compensationMatch(rawJob, profile);
    const sponsorship = sponsorshipMatch(rawJob, profile);
    if (compensation.belowFloor) {
      reject(rawJob, "compensation-below-floor");
      continue;
    }
    if (sponsorship.incompatible) {
      reject(rawJob, "sponsorship-incompatible");
      continue;
    }
    const skillScore = Math.min(15, matchedSkills.length * 5);
    const score = Math.min(100, role.score + location.score + skillScore + fresh + compensation.score + sponsorship.score);
    if (score < minimumScore) {
      reject(rawJob, "score-below-threshold");
      continue;
    }

    const untrustedSignals = untrustedInstructionSignals(rawJob);
    const verificationReasons = [];
    if (seniority.needsVerification) verificationReasons.push("Seniority is not confirmed");
    if (location.needsVerification) verificationReasons.push("Location eligibility needs verification");
    if (compensation.needsVerification) verificationReasons.push("Compensation is not listed");
    if (sponsorship.needsVerification) verificationReasons.push("Sponsorship is not stated");
    if (untrustedSignals.length) verificationReasons.push("Posting contains an instruction that needs manual review");
    const matchTier = verificationReasons.length ? "verification" : "qualified";

    const matchReasons = [];
    if (role.matchedRole) matchReasons.push(`Matches ${role.matchedRole}`);
    if (location.reason) matchReasons.push(location.reason);
    if (matchedSkills.length) matchReasons.push(`${matchedSkills.slice(0, 3).join(", ")} alignment`);
    if (compensation.reason) matchReasons.push(compensation.reason);
    if (sponsorship.reason) matchReasons.push(sponsorship.reason);
    if (fresh >= 7) matchReasons.push("Recently posted");

    accepted.push({
      ...rawJob,
      canonicalUrl,
      matchScore: score,
      matchReasons,
      matchedSkills,
      remoteSignal: rawJob.remoteSignal || "unknown",
      sponsorshipSignal: rawJob.sponsorshipSignal || "unknown",
      matchTier,
      verificationReasons,
      untrustedSignals,
      sourceMetadata: {
        ...(rawJob.sourceMetadata || {}),
        rolelinkedMatch: { version: HOSTED_MATCH_VERSION, tier: matchTier, verificationReasons, untrustedSignals },
      },
    });
  }

  const sorted = accepted
    .sort((a, b) => {
      if (a.matchTier !== b.matchTier) return a.matchTier === "qualified" ? -1 : 1;
      return b.matchScore - a.matchScore || Number(new Date(b.postedAt || 0)) - Number(new Date(a.postedAt || 0));
    })
    .slice(0, limit);

  return {
    accepted: sorted,
    qualified: sorted.filter((job) => job.matchTier === "qualified"),
    verification: sorted.filter((job) => job.matchTier === "verification"),
    rejected,
    rejectionCounts,
  };
}

export function rankHostedJobs(jobs, profile, options = {}) {
  return classifyHostedJobs(jobs, profile, options).accepted;
}

/**
 * Re-screen untouched automated leads when the Discover view loads. A user
 * decision always wins: manual entries and anything moved beyond discovered
 * remain visible even when current targeting would filter them out.
 */
export function screenHostedDiscoveryJobs(jobs, profile, options = {}) {
  const preserved = (jobs || []).filter((job) => job.source === "Manual" || job.status !== "discovered");
  const automated = (jobs || []).filter((job) => job.source !== "Manual" && job.status === "discovered");
  const classified = classifyHostedJobs(automated, profile, options);
  return [...preserved, ...classified.accepted].sort((a, b) => {
    const aScore = Number(a.matchScore) || 0;
    const bScore = Number(b.matchScore) || 0;
    return bScore - aScore || Number(new Date(b.postedAt || 0)) - Number(new Date(a.postedAt || 0));
  });
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
