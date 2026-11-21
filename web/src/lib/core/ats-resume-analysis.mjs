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

const DISCLOSED_SYNONYMS = [
  ["javascript", "js"], ["typescript", "ts"], ["postgresql", "postgres"],
  ["kubernetes", "k8s"], ["amazon web services", "aws"], ["google cloud platform", "gcp"],
  ["continuous integration", "ci/cd"], ["machine learning", "ml"],
];

function matches(text, expression) {
  return unique(String(text || "").match(expression) || []);
}

function parserVisibility(text, skills, headings) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const emails = matches(text, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
  const phones = matches(text, /(?:\+?\d[\d().\s-]{7,}\d)/g).map((value) => value.trim());
  const dates = matches(text, /\b(?:(?:19|20)\d{2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[ .-]+(?:19|20)\d{2}|Present|Current)\b/gi);
  const education = lines.filter((line) => /\b(university|college|bachelor|master|ph\.?d|degree|diploma)\b/i.test(line)).slice(0, 12);
  const certifications = lines.filter((line) => /\b(certif(?:ied|ication)|credential|license)\b/i.test(line)).slice(0, 12);
  const likelyTitles = lines.filter((line) => /\b(engineer|manager|director|analyst|designer|developer|consultant|specialist|architect|scientist|coordinator|lead|officer)\b/i.test(line) && line.length < 120).slice(0, 20);
  const likelyEmployers = lines.filter((line) => /\b(inc\.?|llc|ltd\.?|corp\.?|company|group|university|bank|technologies|systems)\b/i.test(line) && line.length < 120).slice(0, 20);
  return {
    contact: { emails, phones },
    employers: likelyEmployers,
    titles: likelyTitles,
    dates,
    education,
    certifications,
    skills: Array.isArray(skills) ? skills.map(String).slice(0, 50) : [],
    headings,
    readingOrder: lines.slice(0, 40),
  };
}

function layoutDiagnostics(text, pageCount, headingCount) {
  const lines = String(text || "").split(/\r?\n/);
  const denseRows = lines.filter((line) => /\S\s{4,}\S/.test(line)).length;
  const pipeRows = lines.filter((line) => /\S\s*\|\s*\S/.test(line)).length;
  const ambiguousDates = matches(text, /\b(?:19|20)\d{2}\s+(?:19|20)\d{2}\b/g).length;
  return [
    { key: "columns", label: "Columns", state: denseRows >= 6 ? "warn" : "pass", detail: denseRows >= 6 ? `${denseRows} lines have wide spacing that can indicate columns.` : "No strong multi-column text pattern detected." },
    { key: "tables", label: "Tables", state: pipeRows >= 2 ? "warn" : "pass", detail: pipeRows >= 2 ? `${pipeRows} table-like rows detected.` : "No text table pattern detected." },
    { key: "text-boxes", label: "Text boxes", state: "unknown", detail: "Text extraction cannot reliably prove whether content came from floating text boxes." },
    { key: "headers-footers", label: "Headers and footers", state: "unknown", detail: "Page-level position metadata is not available in this parser." },
    { key: "image-only", label: "Image-only content", state: String(text || "").trim().length < 250 ? "warn" : "pass", detail: String(text || "").trim().length < 250 ? "Very little selectable text was extracted." : "Selectable text volume is sufficient for inspection." },
    { key: "ambiguous-dates", label: "Ambiguous dates", state: ambiguousDates ? "warn" : "pass", detail: ambiguousDates ? `${ambiguousDates} date sequence(s) may need a dash or month context.` : "No obviously ambiguous year sequence detected." },
    { key: "sections", label: "Missing standard sections", state: headingCount < 3 ? "warn" : "pass", detail: `${headingCount} common section headings detected.` },
    { key: "overflow", label: "Page density", state: pageCount && pageCount > 2 ? "warn" : "pass", detail: pageCount ? `${pageCount} page${pageCount === 1 ? "" : "s"}; review anything beyond two pages for the target role.` : "Page count is unavailable for this format." },
  ];
}

function matchDiagnostics(jobText, resumeText, coverage, jobTitle) {
  const normalizedResume = String(resumeText || "").toLowerCase();
  const normalizedJob = String(jobText || "").toLowerCase();
  const synonymMatches = DISCLOSED_SYNONYMS.flatMap(([long, short]) => {
    const requested = normalizedJob.includes(long) ? long : normalizedJob.includes(short) ? short : null;
    if (!requested) return [];
    const matched = normalizedResume.includes(long) ? long : normalizedResume.includes(short) ? short : null;
    return matched && matched !== requested ? [{ requested, matched }] : [];
  });
  const terms = unique([...(coverage.present || []), ...(coverage.missing || [])]);
  const stuffing = terms.filter((term) => {
    const safe = String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safe && (normalizedResume.match(new RegExp(`\\b${safe}\\b`, "gi")) || []).length >= 8;
  });
  const seniority = String(jobTitle || "").match(/\b(senior|sr\.?|staff|principal|lead|director|head|vp|chief)\b/i)?.[0] || null;
  return {
    required: { present: coverage.present || [], missing: coverage.missing || [] },
    preferred: { present: [], missing: [], limitation: "The archived excerpt does not preserve a reliable required-versus-preferred boundary." },
    exactMatches: coverage.present || [],
    disclosedSynonymMatches: synonymMatches,
    supportedButMissing: [],
    genuineGaps: coverage.missing || [],
    warnings: [
      ...(stuffing.length ? [{ key: "stuffing", detail: `Possible repetition: ${stuffing.join(", ")}.` }] : []),
      ...(seniority && !normalizedResume.includes(seniority.toLowerCase()) ? [{ key: "seniority", detail: `The listing title includes “${seniority}”; the resume does not use that seniority label.` }] : []),
    ],
    limitation: "A missing term is not proof of a skill gap. RoleLinked labels it as a gap only against this selected resume; verified Evidence Vault support must be reviewed separately.",
  };
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
  const headingNames = unique(matches(resumeText, /^(?:#{1,3}\s*)?(?:summary|profile|experience|work experience|employment|education|skills|technical skills|projects|certifications?)\s*:?[ \t]*$/gim).map((value) => value.replace(/^#+\s*/, "").replace(/:$/, "").trim()));
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
    parserVisibility: parserVisibility(resumeText, skills, headingNames),
    layoutDiagnostics: layoutDiagnostics(resumeText, pageCount, headings),
    matchDiagnostics: matchDiagnostics(jobText, resumeText, coverage, jobTitle),
    sourceComparison: { state: "unavailable", detail: "Run the check on both the source and tailored immutable versions to compare changes; this report never assumes which version is original." },
    methodology: [
      "Compatibility is a transparent weighted heuristic: 65% disclosed term coverage, 25% parseability checks, and 10% title-term alignment when requirements are extractable.",
      "Parser visibility is derived from selectable text patterns; it does not emulate a specific ATS vendor.",
      "Synonym matches are shown only from the disclosed built-in synonym list.",
    ],
    limitations: [
      "This is not a pass probability and cannot predict an interview.",
      "Text extraction cannot reliably detect every column, floating text box, header, footer, graphic, or reading-order error.",
      "Missing terms must never be added unless they truthfully describe candidate-approved evidence.",
    ],
    lowConfidenceReason: extractionDiagnosis?.message || (!hasSkills ? "The captured job text did not expose a reliable requirements list. Read the original listing before tailoring." : null),
    guardrail: "Missing means not found in this selected resume. Add a term only when it truthfully describes your experience; RoleLinked never inserts qualifications.",
  };
}
