import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAtsResumeAnalysis } from "@/lib/core/ats-resume-analysis.mjs";
import { analyzeCareerOpsAtsCoverage } from "@/lib/hosted/ats-check-core-bridge.mjs";
import { getHostedJob, getHostedResumeVersion, listHostedAtsReports, saveHostedAtsReport } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { readPrivateObject } from "@/lib/hosted/object-store";
import { extractResumeText } from "@/lib/hosted/resume-text";

export const maxDuration = 60;

const requestSchema = z.object({
  jobId: z.string().uuid(),
  resumeId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const jobId = new URL(request.url).searchParams.get("jobId") || undefined;
    if (jobId && !z.string().uuid().safeParse(jobId).success) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
    return NextResponse.json({ reports: await listHostedAtsReports(ownerId, jobId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load ATS reports.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

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
    const report = await saveHostedAtsReport(ownerId, {
      jobId: job.id,
      resumeId: resumeRecord.resume.id,
      resumeVersionId: resumeRecord.version.id,
      resumeSha256: resumeRecord.version.sha256,
      analysis,
      jobSnapshot: {
        company: job.company,
        title: job.title,
        url: job.url,
        descriptionExcerpt: job.descriptionExcerpt,
        capturedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      job: { id: job.id, company: job.company, title: job.title, url: job.url },
      resume: { id: resumeRecord.resume.id, name: resumeRecord.resume.name, filename: resumeRecord.version.originalFilename },
      analysis,
      report: { id: report.id, createdAt: report.createdAt },
      privacy: "Processed inside your authenticated account. Extracted resume text is discarded; the diagnostic report and source fingerprints are retained for packet reproducibility.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The ATS check could not be completed.";
    const status = message === "Authentication required." ? 401 : /No readable|No selectable|not supported|pages/.test(message) ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
