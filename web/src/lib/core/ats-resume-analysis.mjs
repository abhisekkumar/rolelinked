const TITLE_STOPWORDS = new Set([
  "a", "an", "and", "at", "for", "in", "of", "on", "or", "the", "to", "with",
  "associate", "junior", "lead", "principal", "senior", "sr", "staff",
]);

function unique(values) {
  return [...new Set(values)];
}

function titleTerms(title) {
  return unique(String(title || "").toLowerCase().match(/[a-z0-9+#.]{2,}/g) || [])
    .filter((term) => !TITLE_STOPWORDS.has(term));
}

function countSectionHeadings(text) {
  const matches = String(text || "").match(/^(?:#{1,3}\s*)?(summary|profile|experience|work experience|employment|education|skills|technical skills|projects|certifications?)\s*:?[ \t]*$/gim);
  return unique((matches || []).map((match) => match.toLowerCase().replace(/^#+\s*/, "").replace(/:$/, "").trim())).length;
}

/**
 * @param {{
 *   resumeText: string,
 *   jobText: string,
 *   jobTitle: string,
 *   coverage: { coveragePct: number, [key: string]: unknown },
 *   skills: unknown[],
 *   extractionDiagnosis?: { message?: string } | null,
 *   format?: string,
 *   pageCount?: number | null,
 * }} input
 */
export function buildAtsResumeAnalysis({
  resumeText,
  jobText,
  jobTitle,
  coverage,
  skills,
  extractionDiagnosis = null,
  format = "Resume",
  pageCount = null,
}) {
  const normalizedResume = String(resumeText || "").toLowerCase();
  const terms = titleTerms(jobTitle);
  const titlePresent = terms.filter((term) => normalizedResume.includes(term));
  const titleAlignmentPct = terms.length ? Math.round((titlePresent.length / terms.length) * 100) : 0;
  const headings = countSectionHeadings(resumeText);
  const parseChecks = [
    { key: "text", label: "Selectable text", passed: resumeText.trim().length >= 250, detail: `${resumeText.trim().length.toLocaleString()} extracted characters` },
    { key: "email", label: "Email address", passed: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resumeText), detail: "Helps ATS and recruiters identify contact information" },
    { key: "phone", label: "Phone number", passed: /(?:\+?\d[\d().\s-]{7,}\d)/.test(resumeText), detail: "A recognizable contact number" },
    { key: "sections", label: "Standard sections", passed: headings >= 3, detail: `${headings} common section headings detected` },
    { key: "dates", label: "Experience dates", passed: /\b(?:19|20)\d{2}\b|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(resumeText), detail: "Dates make work history easier to parse" },
  ];
  const parseabilityPct = Math.round((parseChecks.filter((check) => check.passed).length / parseChecks.length) * 100);
  const hasSkills = Array.isArray(skills) && skills.length > 0;
  const compatibilityPct = hasSkills
    ? Math.round((coverage.coveragePct * 0.65) + (parseabilityPct * 0.25) + (titleAlignmentPct * 0.10))
    : Math.round((parseabilityPct * 0.70) + (titleAlignmentPct * 0.30));
  const confidence = hasSkills && !extractionDiagnosis ? "high" : hasSkills ? "medium" : "low";

  return {
    compatibilityPct,
    confidence,
    label: compatibilityPct >= 75 ? "Strong observable fit" : compatibilityPct >= 50 ? "Reviewable fit" : "Needs careful review",
    format,
    pageCount,
    extractedCharacters: resumeText.trim().length,
    jobCharacters: String(jobText || "").trim().length,
    keywordCoverage: coverage,
    titleAlignment: { total: terms.length, present: titlePresent, missing: terms.filter((term) => !titlePresent.includes(term)), percentage: titleAlignmentPct },
    parseability: { percentage: parseabilityPct, checks: parseChecks },
    lowConfidenceReason: extractionDiagnosis?.message || (!hasSkills ? "The captured job text did not expose a reliable requirements list. Read the original listing before tailoring." : null),
    guardrail: "Missing means not found in this selected resume. Add a term only when it truthfully describes your experience; RoleLinked never inserts qualifications.",
  };
}
