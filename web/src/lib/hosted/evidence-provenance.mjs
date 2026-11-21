export const EVIDENCE_STATES = Object.freeze([
  "verified",
  "corrected",
  "narrative-only",
  "unknown",
  "derived-unverified",
  "user-cannot-confirm",
]);

export const EVIDENCE_DECISIONS = Object.freeze([
  "confirm",
  "correct",
  "narrative-only",
  "cannot-confirm",
]);

const TERMINAL_NON_FACT_STATES = new Set(["narrative-only", "user-cannot-confirm"]);

/**
 * Apply an explicit candidate decision to an evidence item. This deliberately
 * contains no automatic path from an unverified or unknown claim to a verified
 * fact: the caller must supply one of the four confirmation outcomes.
 */
export function applyEvidenceDecision(current, decision) {
  if (!current || !EVIDENCE_STATES.includes(current.verificationState)) {
    throw new Error("A valid evidence item is required.");
  }
  if (!decision || !EVIDENCE_DECISIONS.includes(decision.action)) {
    throw new Error("Choose a valid evidence decision.");
  }
  if (TERMINAL_NON_FACT_STATES.has(current.verificationState)) {
    throw new Error("This evidence outcome is durable and cannot be promoted automatically.");
  }

  switch (decision.action) {
    case "confirm":
      return { statement: current.statement, verificationState: "verified" };
    case "correct": {
      const statement = String(decision.statement || "").trim();
      if (statement.length < 2) throw new Error("Provide the corrected evidence statement.");
      return { statement, verificationState: "corrected" };
    }
    case "narrative-only":
      return { statement: current.statement, verificationState: "narrative-only" };
    case "cannot-confirm":
      return { statement: current.statement, verificationState: "user-cannot-confirm" };
    default:
      throw new Error("Choose a valid evidence decision.");
  }
}
