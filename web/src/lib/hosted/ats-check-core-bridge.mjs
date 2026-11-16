import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let loaded;

function resolveCoreRoot() {
  const candidates = [process.cwd(), path.join(process.cwd(), "..")];
  const root = candidates.find((candidate) => existsSync(path.join(candidate, "keyword-match.mjs")));
  if (!root) throw new Error("Shared Career Ops ATS analysis was not packaged with this deployment.");
  return root;
}

async function loadCore() {
  if (loaded) return loaded;
  const root = resolveCoreRoot();
  loaded = Promise.all([
    import(/* webpackIgnore: true */ pathToFileURL(path.join(root, "keyword-match.mjs")).href),
    import(/* webpackIgnore: true */ pathToFileURL(path.join(root, "jd-skill-gap.mjs")).href),
  ]).then(([keywordMatch, skillGap]) => ({
    analyzeCoverage: keywordMatch.analyzeCoverage,
    extractJdSkills: skillGap.extractJdSkills,
    diagnoseExtraction: skillGap.diagnoseExtraction,
  }));
  return loaded;
}

export async function analyzeCareerOpsAtsCoverage(jobText, resumeText) {
  const { analyzeCoverage, extractJdSkills, diagnoseExtraction } = await loadCore();
  const skills = extractJdSkills(jobText);
  return {
    skills,
    coverage: analyzeCoverage(skills, resumeText),
    extractionDiagnosis: diagnoseExtraction(jobText, skills),
  };
}
