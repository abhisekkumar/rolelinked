"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  CircleHelp,
  FileCheck2,
  FileQuestion,
  LibraryBig,
  PencilLine,
  Plus,
  Quote,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./evidence-vault.module.css";

type EvidenceState =
  | "verified"
  | "corrected"
  | "narrative-only"
  | "unknown"
  | "derived-unverified"
  | "user-cannot-confirm";

type EvidenceItem = {
  id: string;
  category: string;
  title: string;
  statement: string;
  verificationState: EvidenceState;
  sourceType: "resume" | "document" | "user-statement" | "manual-confirmation";
  sourceLabel: string;
  sourceExcerpt: string;
  isQuantified: boolean;
  confirmedAt: string | null;
  usageCount: number;
  usages: { id: string; surfaceType: string; surfaceId: string; surfaceLabel: string; createdAt: string }[];
  updatedAt: string;
};

type ResumeSource = { id: string; name: string; roleType: string; originalFilename: string };
type DocumentSource = { id: string; title: string; kind: string; originalFilename: string };
type Filter = "all" | "review" | "verified" | "narrative";

const stateCopy: Record<EvidenceState, { label: string; detail: string }> = {
  verified: { label: "Verified", detail: "Confirmed as accurate" },
  corrected: { label: "Corrected", detail: "Candidate supplied the accurate wording" },
  "narrative-only": { label: "Narrative only", detail: "Context, not a factual or quantified claim" },
  unknown: { label: "Unknown", detail: "Needs a source before it can be used" },
  "derived-unverified": { label: "Needs review", detail: "Not approved for generated materials" },
  "user-cannot-confirm": { label: "Cannot confirm", detail: "Durably excluded from factual claims" },
};

const categories = [
  ["experience", "Experience"],
  ["project", "Project"],
  ["skill", "Skill"],
  ["education", "Education"],
  ["certification", "Certification"],
  ["achievement", "Achievement"],
  ["work-authorization", "Work authorization"],
  ["publication", "Publication"],
  ["interview-story", "Interview story"],
  ["other", "Other"],
] as const;

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function EvidenceVault() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [resumes, setResumes] = useState<ResumeSource[]>([]);
  const [documents, setDocuments] = useState<DocumentSource[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sourceType, setSourceType] = useState<EvidenceItem["sourceType"]>("resume");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [evidenceResponse, resumeResponse, documentResponse] = await Promise.all([
      fetch("/api/hosted/evidence", { cache: "no-store" }),
      fetch("/api/hosted/resumes", { cache: "no-store" }),
      fetch("/api/hosted/documents", { cache: "no-store" }),
    ]);
    const [evidenceBody, resumeBody, documentBody] = await Promise.all([
      evidenceResponse.json().catch(() => ({})),
      resumeResponse.json().catch(() => ({})),
      documentResponse.json().catch(() => ({})),
    ]);
    setItems(evidenceResponse.ok ? evidenceBody.evidence || [] : []);
    setResumes(resumeResponse.ok ? resumeBody.resumes || [] : []);
    setDocuments(documentResponse.ok ? documentBody.documents || [] : []);
    setMessage(evidenceResponse.ok ? null : evidenceBody.error || "The Evidence Vault is unavailable.");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => items.filter((item) => {
    if (filter === "review") return item.verificationState === "derived-unverified" || item.verificationState === "unknown";
    if (filter === "verified") return item.verificationState === "verified" || item.verificationState === "corrected";
    if (filter === "narrative") return item.verificationState === "narrative-only" || item.verificationState === "user-cannot-confirm";
    return true;
  }), [filter, items]);

  const reviewCount = items.filter((item) => item.verificationState === "derived-unverified" || item.verificationState === "unknown").length;
  const verifiedCount = items.filter((item) => item.verificationState === "verified" || item.verificationState === "corrected").length;

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const sourceId = String(data.get("sourceId") || "");
    const selectedResume = resumes.find((resume) => resume.id === sourceId);
    const selectedDocument = documents.find((document) => document.id === sourceId);
    const payload = {
      category: String(data.get("category") || ""),
      title: String(data.get("title") || ""),
      statement: String(data.get("statement") || ""),
      sourceType,
      sourceResumeId: sourceType === "resume" ? sourceId : null,
      sourceDocumentId: sourceType === "document" ? sourceId : null,
      sourceLabel: selectedResume
        ? `${selectedResume.name} · ${selectedResume.originalFilename}`
        : selectedDocument
          ? `${selectedDocument.title} · ${selectedDocument.originalFilename}`
          : "Candidate statement",
      sourceExcerpt: String(data.get("sourceExcerpt") || ""),
      isQuantified: data.get("isQuantified") === "on",
    };
    const response = await fetch("/api/hosted/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      form.reset();
      setSourceType("resume");
      setMessage("Evidence added for explicit review.");
      await load();
    } else {
      setMessage(body.error || "The evidence item could not be added.");
    }
    setBusy(false);
  }

  async function decide(item: EvidenceItem, action: "confirm" | "correct" | "narrative-only" | "cannot-confirm") {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/hosted/evidence/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(action === "correct" ? { action, statement: correction } : { action }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setReviewingId(null);
      setCorrection("");
      setMessage(action === "confirm" ? "Evidence confirmed." : "Evidence decision saved.");
      await load();
    } else {
      setMessage(body.error || "The evidence decision could not be saved.");
    }
    setBusy(false);
  }

  async function remove(item: EvidenceItem) {
    if (!window.confirm(`Delete “${item.title}” from the Evidence Vault?`)) return;
    setBusy(true);
    const response = await fetch(`/api/hosted/evidence/${item.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Evidence deleted." : body.error || "The evidence item could not be deleted.");
    if (response.ok) await load();
    setBusy(false);
  }

  const sourceOptions = sourceType === "resume" ? resumes : sourceType === "document" ? documents : [];

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Career Evidence Vault</p>
          <h1 className={instrumentSerif.className}>Every claim should know where it came from.</h1>
          <p>Build a reusable career record without laundering guesses into facts. New evidence starts unverified and stays out of generated materials until you review it.</p>
        </div>
        <div className={styles.safety}><ShieldCheck /><span><strong>Source-backed by design</strong>Nothing becomes verified without your decision</span></div>
      </header>

      <section className={styles.metrics} aria-label="Evidence summary">
        <div><LibraryBig /><span><strong>{items.length}</strong>Total evidence</span></div>
        <div><FileQuestion /><span><strong>{reviewCount}</strong>Needs review</span></div>
        <div><BadgeCheck /><span><strong>{verifiedCount}</strong>Verified facts</span></div>
        <div><BookOpenCheck /><span><strong>{items.reduce((sum, item) => sum + item.usageCount, 0)}</strong>Recorded uses</span></div>
      </section>

      <section className={styles.workspace}>
        <form className={styles.formCard} onSubmit={create}>
          <div className={styles.cardHeading}><span><Plus /></span><div><small>Add evidence</small><h2>Capture a source-backed claim</h2></div></div>
          <p className={styles.cardLead}>Adding a claim does not verify it. You will review the exact wording after it is saved.</p>

          <label>Category<select name="category" defaultValue="experience">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Short title<input name="title" required maxLength={140} placeholder="Reduced daily pipeline latency" /></label>
          <label>Evidence statement<textarea name="statement" required maxLength={8000} placeholder="State only what the source supports." /></label>
          <label>Source type<select value={sourceType} onChange={(event) => setSourceType(event.target.value as EvidenceItem["sourceType"])}><option value="resume">Saved resume</option><option value="document">Saved document</option><option value="user-statement">My direct statement</option></select></label>

          {(sourceType === "resume" || sourceType === "document") && (
            <label>Source record
              <select name="sourceId" required defaultValue="">
                <option value="" disabled>Select a private source</option>
                {sourceOptions.map((source) => <option key={source.id} value={source.id}>{"name" in source ? source.name : source.title} · {source.originalFilename}</option>)}
              </select>
              {!sourceOptions.length && <small className={styles.fieldHelp}>No {sourceType}s available. <Link href={sourceType === "resume" ? "/app/resumes" : "/app/documents"}>Add one first.</Link></small>}
            </label>
          )}

          <label>Exact supporting text<textarea name="sourceExcerpt" required maxLength={8000} placeholder="Paste the exact sentence or passage supporting this claim." /></label>
          <label className={styles.checkbox}><input name="isQuantified" type="checkbox" /><span>This contains a number, scale, percentage, or quantified scope.</span></label>
          <button className={styles.primary} disabled={busy || ((sourceType === "resume" || sourceType === "document") && !sourceOptions.length)}><Plus />{busy ? "Saving…" : "Add for review"}</button>
          {message && <p className={styles.message} aria-live="polite">{message}</p>}
        </form>

        <section className={styles.library}>
          <div className={styles.libraryHead}>
            <div><small>Reusable evidence</small><h2>{filtered.length} item{filtered.length === 1 ? "" : "s"}</h2></div>
            <div className={styles.filters}>
              {(["all", "review", "verified", "narrative"] as Filter[]).map((value) => <button className={filter === value ? styles.activeFilter : ""} key={value} type="button" onClick={() => setFilter(value)}>{value}</button>)}
            </div>
          </div>

          {loading ? <div className={styles.empty}>Loading your private evidence…</div> : filtered.length === 0 ? <div className={styles.empty}><Quote />No evidence matches this view.</div> : (
            <div className={styles.list}>
              {filtered.map((item) => {
                const state = stateCopy[item.verificationState];
                const canReview = item.verificationState === "derived-unverified" || item.verificationState === "unknown";
                return <article className={styles.item} key={item.id}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemIdentity}><span className={styles.categoryIcon}><FileCheck2 /></span><div><small>{titleCase(item.category)}{item.isQuantified ? " · quantified" : ""}</small><h3>{item.title}</h3></div></div>
                    <span className={`${styles.state} ${styles[item.verificationState]}`} title={state.detail}>{state.label}</span>
                  </div>
                  <p className={styles.statement}>{item.statement}</p>
                  <details className={styles.provenance}>
                    <summary>View provenance</summary>
                    <div><strong>{item.sourceLabel}</strong><small>{titleCase(item.sourceType)}</small><blockquote>{item.sourceExcerpt}</blockquote></div>
                  </details>
                  {item.usages.length > 0 && <details className={styles.usageGraph}>
                    <summary>Used in {item.usages.length} artifact{item.usages.length === 1 ? "" : "s"}</summary>
                    <ul>{item.usages.map((usage) => <li key={usage.id}><BookOpenCheck /><span><strong>{usage.surfaceLabel}</strong><small>{titleCase(usage.surfaceType)} · pinned {new Date(usage.createdAt).toLocaleDateString()}</small></span></li>)}</ul>
                  </details>}
                  <div className={styles.itemFooter}>
                    <span>{item.usageCount ? `Used in ${item.usageCount} artifact${item.usageCount === 1 ? "" : "s"}` : "Not used in any artifact"}</span>
                    <button className={styles.delete} type="button" onClick={() => remove(item)} disabled={busy}><Trash2 />Delete</button>
                  </div>

                  {canReview && <div className={styles.reviewBox}>
                    <div><CircleHelp /><span><strong>Choose the truthful outcome</strong><small>Do not guess just to clear this review.</small></span></div>
                    {reviewingId === item.id ? <div className={styles.correction}>
                      <label>Correct statement<textarea value={correction} onChange={(event) => setCorrection(event.target.value)} autoFocus /></label>
                      <div><button type="button" onClick={() => decide(item, "correct")} disabled={busy || correction.trim().length < 2}>Save correction</button><button type="button" onClick={() => { setReviewingId(null); setCorrection(""); }}>Cancel</button></div>
                    </div> : <div className={styles.decisions}>
                      <button type="button" onClick={() => decide(item, "confirm")} disabled={busy}><BadgeCheck />Confirm accurate</button>
                      <button type="button" onClick={() => { setReviewingId(item.id); setCorrection(item.statement); }} disabled={busy}><PencilLine />Provide correction</button>
                      <button type="button" onClick={() => decide(item, "narrative-only")} disabled={busy}><Quote />Narrative only</button>
                      <button type="button" onClick={() => decide(item, "cannot-confirm")} disabled={busy}><CircleHelp />I don’t know</button>
                    </div>}
                  </div>}
                </article>;
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
