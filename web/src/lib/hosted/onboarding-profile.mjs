export const ROLE_EXAMPLES = Object.freeze([
  "Marketing Manager",
  "Software Engineer",
  "Product Manager",
  "UX Designer",
  "Sales Manager",
  "Financial Analyst",
]);

export function addTargetRoles(currentRoles, rawValue, limit = 30) {
  const next = [...currentRoles];
  const seen = new Set(next.map((role) => role.toLocaleLowerCase()));
  const candidates = String(rawValue || "")
    .split(/[,\n]/)
    .map((role) => role.trim())
    .filter((role) => role.length >= 2 && role.length <= 100);

  for (const role of candidates) {
    const key = role.toLocaleLowerCase();
    if (seen.has(key) || next.length >= limit) continue;
    seen.add(key);
    next.push(role);
  }

  return next;
}

export function buildResumeGuidance(targetRoles) {
  const roles = [...targetRoles].slice(0, 6);
  if (roles.length === 0) {
    return [[
      "Your first base resume",
      "Use a truthful resume that best represents the work you want next.",
    ]];
  }

  return roles.map((role) => [
    `${role} resume`,
    `A truthful source tailored for ${role} opportunities.`,
  ]);
}
