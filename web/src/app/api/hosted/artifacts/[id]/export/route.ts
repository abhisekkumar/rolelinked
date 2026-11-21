import { getHostedArtifact } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { renderArtifactHtml, renderArtifactMarkdown, renderArtifactTex } from "@/lib/hosted/artifact-export.mjs";

type Context = { params: Promise<{ id: string }> };
const safeFilename = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "rolelinked-document";

export async function GET(request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const record = await getHostedArtifact(ownerId, id);
    if (!record?.latestVersion) return Response.json({ error: "Artifact not found." }, { status: 404 });
    const format = new URL(request.url).searchParams.get("format") || "html";
    const filename = safeFilename(record.artifact.title);
    const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
    if (format === "markdown") return new Response(renderArtifactMarkdown(record.artifact, record.latestVersion), { headers: { ...headers, "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${filename}.md"` } });
    if (format === "tex") return new Response(renderArtifactTex(record.artifact, record.latestVersion), { headers: { ...headers, "content-type": "application/x-tex; charset=utf-8", "content-disposition": `attachment; filename="${filename}.tex"` } });
    const rendered = renderArtifactHtml(record.artifact, record.latestVersion);
    if (format === "word") return new Response(rendered, { headers: { ...headers, "content-type": "application/msword; charset=utf-8", "content-disposition": `attachment; filename="${filename}.doc"` } });
    return new Response(rendered, { headers: { ...headers, "content-type": "text/html; charset=utf-8", "content-disposition": "inline" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export this artifact.";
    return Response.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
