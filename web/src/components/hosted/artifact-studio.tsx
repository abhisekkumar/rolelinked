"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BadgeCheck, Download, FileDiff, FilePlus2, History, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./artifact-studio.module.css";

type Kind = "resume" | "cover-letter";
type Evidence = { id: string; title: string; statement: string; category: string; sourceLabel: string; verificationState: string };
type Job = { id: string; company: string; title: string };
type Block = { id: string; type: "summary" | "experience" | "project" | "skill" | "education" | "certification" | "achievement" | "paragraph"; heading: string; subheading: string; text: string; evidenceIds: string[] };
type Content = { name: string; headline: string; contactLine: string; recipient: string; greeting: string; closing: string; blocks: Block[] };
type Version = { id: string; version: number; content: Content; evidenceIds: string[]; sourceJobId: string | null; changeSummary: string; createdAt: string };
type ArtifactRow = { artifact: { id: string; kind: Kind; title: string; roleFamily: string; archived: boolean }; latestVersion: Version; versionCount: number };

const emptyContent = (): Content => ({ name: "", headline: "", contactLine: "", recipient: "", greeting: "", closing: "", blocks: [] });
const typeByCategory: Record<string, Block["type"]> = { experience: "experience", project: "project", skill: "skill", education: "education", certification: "certification", achievement: "achievement" };

export function ArtifactStudio() {
  const [kind, setKind] = useState<Kind>("resume");
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [title, setTitle] = useState("Untitled resume");
  const [roleFamily, setRoleFamily] = useState("");
  const [sourceJobId, setSourceJobId] = useState("");
  const [content, setContent] = useState<Content>(emptyContent());
  const [changeSummary, setChangeSummary] = useState("");
  const [restoredFromVersionId, setRestoredFromVersionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastDiff, setLastDiff] = useState<{ added: string[]; removed: string[]; changed: string[] } | null>(null);

  const load = useCallback(async () => {
    const [artifactResponse, evidenceResponse, jobsResponse] = await Promise.all([
      fetch(`/api/hosted/artifacts?kind=${kind}`, { cache: "no-store" }),
      fetch("/api/hosted/evidence", { cache: "no-store" }),
      fetch("/api/hosted/jobs?view=pipeline", { cache: "no-store" }),
    ]);
    const [artifactBody, evidenceBody, jobsBody] = await Promise.all([artifactResponse.json(), evidenceResponse.json(), jobsResponse.json()]);
    setArtifacts(artifactResponse.ok ? artifactBody.artifacts || [] : []);
    setEvidence(evidenceResponse.ok ? (evidenceBody.evidence || []).filter((item: Evidence) => ["verified", "corrected"].includes(item.verificationState)) : []);
    setJobs(jobsResponse.ok ? jobsBody.jobs || [] : []);
    if (!artifactResponse.ok) setMessage(artifactBody.error || "The studio is unavailable.");
  }, [kind]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { newArtifact(); }, [kind]);

  function newArtifact() {
    setArtifactId(null); setVersions([]); setTitle(kind === "resume" ? "Untitled resume" : "Untitled cover letter");
    setRoleFamily(""); setSourceJobId(""); setContent(emptyContent()); setChangeSummary(""); setRestoredFromVersionId(null); setLastDiff(null);
  }

  async function openArtifact(id: string) {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/hosted/artifacts/${id}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setArtifactId(body.artifact.id); setTitle(body.artifact.title); setRoleFamily(body.artifact.roleFamily); setVersions(body.versions || []);
      const latest = body.latestVersion as Version; setContent(latest.content); setSourceJobId(latest.sourceJobId || ""); setRestoredFromVersionId(null); setLastDiff(null);
    } else setMessage(body.error || "The artifact could not be loaded.");
    setBusy(false);
  }

  function addEvidence(item: Evidence) {
    if (content.blocks.some((block) => block.evidenceIds.includes(item.id))) return;
    setContent((current) => ({ ...current, blocks: [...current.blocks, {
      id: crypto.randomUUID(), type: kind === "cover-letter" ? "paragraph" : typeByCategory[item.category] || "achievement",
      heading: item.title, subheading: item.sourceLabel, text: item.statement, evidenceIds: [item.id],
    }] }));
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setContent((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === id ? { ...block, ...patch } : block) }));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= content.blocks.length) return;
    setContent((current) => {
      const blocks = [...current.blocks];
      [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
      return { ...current, blocks };
    });
  }

  function restore(version: Version) {
    setContent(version.content); setSourceJobId(version.sourceJobId || ""); setRestoredFromVersionId(version.id);
    setChangeSummary(`Restored from version ${version.version}`); setMessage(`Version ${version.version} loaded as a new draft. Save to preserve the restore.`);
  }

  async function save() {
    if (!content.blocks.length) { setMessage("Pin at least one verified claim before saving."); return; }
    setBusy(true); setMessage(null);
    const evidenceIds = [...new Set(content.blocks.flatMap((block) => block.evidenceIds))];
    const response = await fetch("/api/hosted/artifacts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      artifactId, kind, title, roleFamily, sourceJobId: sourceJobId || null, evidenceIds, changeSummary,
      restoredFromVersionId, content,
    }) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setArtifactId(body.artifact.id); setLastDiff(body.diff); setRestoredFromVersionId(null); setChangeSummary("");
      setMessage(`${kind === "resume" ? "Resume" : "Cover letter"} version ${body.version.version} saved with ${evidenceIds.length} source link${evidenceIds.length === 1 ? "" : "s"}.`);
      await load(); await openArtifact(body.artifact.id);
    } else setMessage(body.error || "This version could not be saved.");
    setBusy(false);
  }

  const usedEvidence = useMemo(() => new Set(content.blocks.flatMap((block) => block.evidenceIds)), [content.blocks]);

  return <div className={styles.page}>
    <header className={styles.heading}><div><p>Evidence-backed document studio</p><h1 className={instrumentSerif.className}>Edit the wording. Preserve the truth.</h1><span>Every factual block stays attached to verified evidence. Each save creates an immutable version you can inspect or restore.</span></div><aside><ShieldCheck /><div><strong>Claim Passport active</strong><small>{content.blocks.length} sourced block{content.blocks.length === 1 ? "" : "s"} in this draft</small></div></aside></header>
    <div className={styles.kindTabs}><button className={kind === "resume" ? styles.active : ""} onClick={() => setKind("resume")}>Resume studio</button><button className={kind === "cover-letter" ? styles.active : ""} onClick={() => setKind("cover-letter")}>Cover-letter studio</button></div>
    {message && <p className={styles.message} aria-live="polite">{message}</p>}
    <section className={styles.shell}>
      <aside className={styles.library}><div className={styles.libraryHead}><div><small>Versioned artifacts</small><strong>{artifacts.length} saved</strong></div><button onClick={newArtifact} title="New artifact"><FilePlus2 /></button></div>{artifacts.map((item) => <button className={artifactId === item.artifact.id ? styles.selectedArtifact : ""} key={item.artifact.id} onClick={() => openArtifact(item.artifact.id)}><span><strong>{item.artifact.title}</strong><small>{item.artifact.roleFamily || "General"}</small></span><em>v{item.latestVersion?.version || 0}</em></button>)}{!artifacts.length && <p>No saved {kind === "resume" ? "resumes" : "cover letters"} yet.</p>}</aside>
      <section className={styles.editor}>
        <div className={styles.metadata}><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>{kind === "resume" ? "Role family" : "Target role"}<input value={roleFamily} onChange={(event) => setRoleFamily(event.target.value)} placeholder="Data engineering" /></label>{kind === "cover-letter" && <label>Archived job source<select value={sourceJobId} onChange={(event) => setSourceJobId(event.target.value)}><option value="">Choose a saved role</option>{jobs.map((job) => <option value={job.id} key={job.id}>{job.company} — {job.title}</option>)}</select></label>}</div>
        <div className={styles.identity}>{kind === "resume" ? <><input value={content.name} onChange={(event) => setContent({ ...content, name: event.target.value })} placeholder="Name" /><input value={content.headline} onChange={(event) => setContent({ ...content, headline: event.target.value })} placeholder="Professional headline" /><input value={content.contactLine} onChange={(event) => setContent({ ...content, contactLine: event.target.value })} placeholder="Email · phone · location · portfolio" /></> : <><input value={content.recipient} onChange={(event) => setContent({ ...content, recipient: event.target.value })} placeholder="Hiring team or recipient" /><input value={content.greeting} onChange={(event) => setContent({ ...content, greeting: event.target.value })} placeholder="Dear hiring team," /></>}</div>
        <div className={styles.blocks}>{content.blocks.map((block, index) => <article key={block.id}><div><select value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value as Block["type"] })}><option value="summary">Summary</option><option value="experience">Experience</option><option value="project">Project</option><option value="skill">Skill</option><option value="education">Education</option><option value="certification">Certification</option><option value="achievement">Achievement</option><option value="paragraph">Paragraph</option></select><span><button disabled={index === 0} onClick={() => moveBlock(index, -1)} title="Move block up"><ArrowUp /></button><button disabled={index === content.blocks.length - 1} onClick={() => moveBlock(index, 1)} title="Move block down"><ArrowDown /></button><button onClick={() => setContent((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== block.id) }))} title="Remove block"><Trash2 /></button></span></div><input value={block.heading} onChange={(event) => updateBlock(block.id, { heading: event.target.value })} placeholder="Heading" /><textarea value={block.text} onChange={(event) => updateBlock(block.id, { text: event.target.value })} /><small><BadgeCheck /> Sourced from {block.evidenceIds.map((id) => evidence.find((item) => item.id === id)?.title || "verified evidence").join(", ")}</small></article>)}</div>
        {kind === "cover-letter" && <input className={styles.closing} value={content.closing} onChange={(event) => setContent({ ...content, closing: event.target.value })} placeholder="Sincerely, Your name" />}
        <label className={styles.change}>Version note<input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="What changed in this version?" /></label><button className={styles.save} onClick={save} disabled={busy}><Save />{busy ? "Saving version…" : "Save immutable version"}</button>{artifactId && <div className={styles.exports}><a href={`/api/hosted/artifacts/${artifactId}/export?format=html`} target="_blank" rel="noreferrer"><Download /> Print / PDF</a><a href={`/api/hosted/artifacts/${artifactId}/export?format=word`}><Download /> Word</a><a href={`/api/hosted/artifacts/${artifactId}/export?format=markdown`}><Download /> Markdown</a><a href={`/api/hosted/artifacts/${artifactId}/export?format=tex`}><Download /> TeX</a></div>}
      </section>
      <aside className={styles.rightRail}><section className={styles.preview}><small>Live structured preview</small><h2>{content.name || title}</h2>{content.headline && <p>{content.headline}</p>}{content.contactLine && <em>{content.contactLine}</em>}{content.greeting && <p>{content.greeting}</p>}{content.blocks.map((block) => <div key={block.id}><h3>{block.heading}</h3><p>{block.text}</p><small>{block.evidenceIds.map((id) => evidence.find((item) => item.id === id)?.title).filter(Boolean).join(" · ")}</small></div>)}{content.closing && <p>{content.closing}</p>}</section><section className={styles.sources}><small>Verified source library</small>{evidence.map((item) => <button disabled={usedEvidence.has(item.id)} onClick={() => addEvidence(item)} key={item.id}><span><strong>{item.title}</strong><small>{item.category.replaceAll("-", " ")}</small></span><BadgeCheck /></button>)}</section>{versions.length > 0 && <section className={styles.history}><small><History /> Version history</small>{versions.map((version) => <div key={version.id}><span><strong>v{version.version}</strong><small>{new Date(version.createdAt).toLocaleString()}</small></span><button onClick={() => restore(version)} title={`Restore version ${version.version}`}><RotateCcw /></button></div>)}</section>}{lastDiff && <section className={styles.diff}><small><FileDiff /> Last saved diff</small><p>{lastDiff.added.length} added · {lastDiff.changed.length} changed · {lastDiff.removed.length} removed</p></section>}</aside>
    </section>
  </div>;
}
