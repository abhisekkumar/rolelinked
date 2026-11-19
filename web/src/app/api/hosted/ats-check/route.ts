import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAtsResumeAnalysis } from "@/lib/core/ats-resume-analysis.mjs";
import { analyzeCareerOpsAtsCoverage } from "@/lib/hosted/ats-check-core-bridge.mjs";
import { getHostedJob, getHostedResumeVersion } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { readPrivateObject } from "@/lib/hosted/object-store";
import { extractResumeText } from "@/lib/hosted/resume-text";

export const maxDuration = 60;

const requestSchema = z.object({
  jobId: z.string().uuid(),
  resumeId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a saved job and resume." }, { status: 400 });

    const [job, resumeRecord] = await Promise.all([
      getHostedJob(ownerId, parsed.data.jobId),
      getHostedResumeVersion(ownerId, parsed.data.resumeId),
    ]);
    if (!job || !resumeRecord) return NextResponse.json({ error: "The selected job or resume was not found in your account." }, { status: 404 });

    const blob = await readPrivateObject(resumeRecord.version.storageKey);
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return NextResponse.json({ error: "The selected private resume file could not be read." }, { status: 404 });
    }
    const bytes = await new Response(blob.stream).arrayBuffer();
    const extracted = await extractResumeText(bytes, resumeRecord.version.contentType);
    const jobText = `${job.title}\n${job.descriptionExcerpt}`;
    const core = await analyzeCareerOpsAtsCoverage(jobText, extracted.text);
    const analysis = buildAtsResumeAnalysis({
      resumeText: extracted.text,
      jobText,
      jobTitle: job.title,
      coverage: core.coverage,
      skills: core.skills,
      extractionDiagnosis: core.extractionDiagnosis,
      format: extracted.format,
      pageCount: extracted.pageCount,
    });

    return NextResponse.json({
      job: { id: job.id, company: job.company, title: job.title, url: job.url },
      resume: { id: resumeRecord.resume.id, name: resumeRecord.resume.name, filename: resumeRecord.version.originalFilename },
      analysis,
      privacy: "Processed on demand inside your authenticated account. Resume text and this report are not persisted.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The ATS check could not be completed.";
    const status = message === "Authentication required." ? 401 : /No readable|No selectable|not supported|pages/.test(message) ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
