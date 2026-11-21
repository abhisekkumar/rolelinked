import assert from "node:assert/strict";
import test from "node:test";

import { buildAtsResumeAnalysis } from "../../src/lib/core/ats-resume-analysis.mjs";

const resumeText = `
Jane Candidate
jane@example.com · +1 (212) 555-0100

Summary
Data platform engineer focused on reliable distributed systems.

Experience
Senior Data Engineer — Example Corp — 2021–2026
Built Python and SQL pipelines on Apache Spark and Airflow.

Skills
Python, SQL, Spark, Airflow, AWS

Education
B.S. Computer Science — 2020
`;

test("ATS analysis reports observable coverage without changing claims", () => {
  const result = buildAtsResumeAnalysis({
    resumeText,
    jobText: "Senior Data Engineer. Requirements: Python, SQL, Spark, Databricks.",
    jobTitle: "Senior Data Engineer",
    skills: ["Python", "SQL", "Spark", "Databricks"],
    coverage: { total: 4, presentCount: 3, coveragePct: 75, present: ["Python", "SQL", "Spark"], thin: [], missing: ["Databricks"] },
    format: "PDF",
    pageCount: 1,
  });

  assert.equal(result.keywordCoverage.coveragePct, 75);
  assert.deepEqual(result.keywordCoverage.missing, ["Databricks"]);
  assert.equal(result.parseability.checks.every((check) => check.passed), true);
  assert.match(result.guardrail, /only when it truthfully describes/i);
  assert.ok(result.compatibilityPct > 0 && result.compatibilityPct <= 100);
  assert.deepEqual(result.parserVisibility.contact.emails, ["jane@example.com"]);
  assert.ok(result.parserVisibility.titles.some((line) => /Senior Data Engineer/.test(line)));
  assert.equal(result.layoutDiagnostics.find((item) => item.key === "image-only")?.state, "pass");
  assert.deepEqual(result.matchDiagnostics.genuineGaps, ["Databricks"]);
  assert.match(result.matchDiagnostics.limitation, /not proof of a skill gap/i);
  assert.ok(result.methodology.some((item) => /weighted heuristic/i.test(item)));
  assert.ok(result.limitations.some((item) => /not a pass probability/i.test(item)));
});

test("ATS analysis labels inconclusive extraction instead of claiming a clean match", () => {
  const result = buildAtsResumeAnalysis({
    resumeText,
    jobText: "Welcome to our careers page.",
    jobTitle: "Data Engineer",
    skills: [],
    coverage: { total: 0, presentCount: 0, coveragePct: 0, present: [], thin: [], missing: [] },
    extractionDiagnosis: { message: "No reliable requirements were extracted." },
  });

  assert.equal(result.confidence, "low");
  assert.match(result.lowConfidenceReason, /No reliable requirements/);
});
