import { getHostedResumeVersion } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { readPrivateObject } from "@/lib/hosted/object-store";

type ResumeDownloadRouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: ResumeDownloadRouteContext) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const record = await getHostedResumeVersion(ownerId, id);
    if (!record) return Response.json({ error: "Resume not found." }, { status: 404 });
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
        "content-disposition": `attachment; filename="${safeName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download the resume.";
    return Response.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
