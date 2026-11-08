import { getHostedResumeVersion } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { readPrivateObject } from "@/lib/hosted/object-store";

type ResumePreviewRouteContext = { params: Promise<{ id: string }> };

const PREVIEWABLE_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/x-tex",
]);

export async function GET(_request: Request, context: ResumePreviewRouteContext) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const record = await getHostedResumeVersion(ownerId, id);
    if (!record) return Response.json({ error: "Resume not found." }, { status: 404 });
    if (!PREVIEWABLE_TYPES.has(record.version.contentType)) {
      return Response.json(
        { error: "This file type cannot be previewed safely in the browser. Download it instead." },
        { status: 415 },
      );
    }
    const blob = await readPrivateObject(record.version.storageKey);
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return Response.json({ error: "Resume file not found." }, { status: 404 });
    }
    const safeName = record.version.originalFilename.replace(/["\r\n]/g, "");
    return new Response(blob.stream, {
      status: 200,
      headers: {
        "content-type": record.version.contentType,
        "content-length": String(record.version.byteSize),
        "content-disposition": `inline; filename="${safeName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-frame-options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview the resume.";
    return Response.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
