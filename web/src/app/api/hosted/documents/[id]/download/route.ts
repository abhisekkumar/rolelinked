import { getHostedDocument } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { readPrivateObject } from "@/lib/hosted/object-store";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const document = await getHostedDocument(ownerId, id);
    if (!document) return Response.json({ error: "Document not found." }, { status: 404 });
    const blob = await readPrivateObject(document.storageKey);
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return Response.json({ error: "Document file not found." }, { status: 404 });
    }
    const safeName = document.originalFilename.replace(/["\r\n]/g, "");
    return new Response(blob.stream, { headers: {
      "content-type": document.contentType,
      "content-length": String(document.byteSize),
      "content-disposition": `attachment; filename="${safeName}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download the document.";
    return Response.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
