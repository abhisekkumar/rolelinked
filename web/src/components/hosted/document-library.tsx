"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Eye, FileLock2, FileStack, ShieldCheck, Trash2, Upload } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./career-operations.module.css";

type DocumentRow = { id: string; title: string; kind: string; originalFilename: string; contentType: string; byteSize: number; updatedAt: string };
const PREVIEWABLE = new Set(["application/pdf", "text/plain", "text/markdown", "application/x-tex"]);
const bytes = (value: number) => value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;

export function DocumentLibrary() {
  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/hosted/documents", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    setItems(response.ok ? body.documents || [] : []);
    setMessage(response.ok ? null : body.error || "Documents are unavailable.");
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const form = event.currentTarget;
    const response = await fetch("/api/hosted/documents", { method: "POST", body: new FormData(form) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) { form.reset(); setMessage("Document stored privately."); await load(); }
    else setMessage(body.error || "The document could not be uploaded.");
    setBusy(false);
  }

  async function remove(item: DocumentRow) {
    if (!window.confirm(`Delete ${item.title}? This removes the private file.`)) return;
    const response = await fetch(`/api/hosted/documents/${item.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Document deleted." : body.error || "The document could not be deleted.");
    if (response.ok) await load();
  }

  return <div className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Private document vault</p><h1 className={instrumentSerif.className}>Keep every supporting file close to the decision.</h1><p>Store cover letters, work samples, references, and portfolio notes. Files are isolated to your account and never published.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Private by default</strong>Authenticated preview and download only</span></div></header>
    <section className={styles.grid}>
      <form className={`${styles.card} ${styles.form}`} onSubmit={upload}><h2>Add a document</h2><p className={styles.cardLead}>RoleLinked stores the original file without using it as a factual source until you choose it.</p><label>Title<input name="title" required maxLength={140} placeholder="Platform architecture work sample" /></label><label>Type<select name="kind" defaultValue="work-sample"><option value="cover-letter">Cover letter</option><option value="portfolio">Portfolio</option><option value="work-sample">Work sample</option><option value="reference">Reference</option><option value="other">Other</option></select></label><label>File<input name="file" type="file" accept=".pdf,.docx,.txt,.md,.tex" required /></label><button disabled={busy}><Upload />{busy ? "Uploading…" : "Upload privately"}</button>{message && <p className={styles.message} aria-live="polite">{message}</p>}</form>
      <section className={`${styles.card} ${styles.library}`}><div className={styles.libraryHead}><div><small>Stored files</small><h2>{items.length} document{items.length === 1 ? "" : "s"}</h2></div><FileStack /></div>{loading ? <div className={styles.empty}>Loading your private documents…</div> : items.length === 0 ? <div className={styles.empty}><span><FileLock2 /><br />No documents stored yet.</span></div> : <div className={styles.list}>{items.map((item) => <article className={styles.row} key={item.id}><span className={styles.icon}><FileStack /></span><div><strong>{item.title}</strong><p>{item.kind.replaceAll("-", " ")}</p><small>{item.originalFilename} · {bytes(item.byteSize)}</small></div><div className={styles.actions}>{PREVIEWABLE.has(item.contentType) && <a href={`/api/hosted/documents/${item.id}/preview`} target="_blank" rel="noreferrer"><Eye />Preview</a>}<a href={`/api/hosted/documents/${item.id}/download`}><Download />Download</a><button className={styles.danger} onClick={() => remove(item)} type="button"><Trash2 />Delete</button></div></article>)}</div>}</section>
    </section>
  </div>;
}
