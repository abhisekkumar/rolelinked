"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  FileLock2,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";

import styles from "./resume-library.module.css";

type ResumeRow = {
  id: string;
  name: string;
  roleType: string;
  version: number;
  originalFilename: string;
  contentType: string;
  byteSize: number;
  updatedAt: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PREVIEWABLE_RESUME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/x-tex",
]);

export function ResumeLibrary({ fromOnboarding = false }: { fromOnboarding?: boolean }) {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/hosted/resumes", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || "Resume storage is unavailable.");
      setResumes([]);
    } else {
      setResumes(body.resumes || []);
      setMessage(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);
    setMessage(null);
    const form = event.currentTarget;
    const response = await fetch("/api/hosted/resumes", { method: "POST", body: new FormData(form) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || "The resume could not be uploaded.");
    } else {
      form.reset();
      setMessage("Resume uploaded privately.");
      await load();
    }
    setUploading(false);
  };

  const remove = async (resume: ResumeRow) => {
    if (!window.confirm(`Delete ${resume.name} and its stored file? This cannot be undone.`)) return;
    const response = await fetch(`/api/hosted/resumes/${resume.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || "The resume could not be deleted.");
    else {
      setMessage("Resume deleted.");
      await load();
    }
  };

  return (
    <div className={styles.page}>
      {fromOnboarding && <section className={styles.onboardingReturn}><div><strong>Resume setup</strong><span>Upload or review your sources, then return to finish your search preferences.</span></div><Link href="/onboarding?step=resumes"><ArrowLeft /> Return to setup</Link></section>}
      <header className={styles.heading}>
        <div>
          <p>Private resume library</p>
          <h1 className={instrumentSerif.className}>Keep a truthful source for every role family.</h1>
          <span>Files stay private. Tailoring can emphasize supported evidence later, but it cannot invent qualifications.</span>
        </div>
        <div className={styles.security}><ShieldCheck /><span><strong>Tenant isolated</strong><small>Authenticated downloads only</small></span></div>
      </header>

      <section className={styles.grid}>
        <form className={styles.uploadCard} onSubmit={upload}>
          <span className={styles.uploadIcon}><Upload /></span>
          <p>Upload a base resume</p>
          <h2>Add a role-specific source.</h2>
          <label>
            Resume name
            <input name="name" maxLength={100} placeholder="Product marketing resume" required />
          </label>
          <label>
            Best used for
            <input name="roleType" maxLength={100} placeholder="Product marketing and growth roles" required />
          </label>
          <label className={styles.fileField}>
            Resume file
            <input name="file" type="file" accept=".pdf,.docx,.txt,.md,.tex" required />
            <small>PDF, DOCX, Markdown, text, or TeX · up to 5 MB</small>
          </label>
          <button type="submit" disabled={uploading}>{uploading ? <LoaderCircle className={styles.spin} /> : <FileLock2 />} {uploading ? "Uploading…" : "Upload privately"}</button>
          {message && <p className={styles.message} aria-live="polite">{message}</p>}
        </form>

        <section className={styles.library}>
          <div className={styles.libraryHeading}><div><small>Saved sources</small><h2>{resumes.length} resume{resumes.length === 1 ? "" : "s"}</h2></div><FileText /></div>
          {loading ? (
            <div className={styles.empty}><LoaderCircle className={styles.spin} /> Loading your private library…</div>
          ) : resumes.length === 0 ? (
            <div className={styles.empty}><FileLock2 /><strong>No resumes stored yet.</strong><span>Upload your first truthful base resume to begin.</span></div>
          ) : (
            <div className={styles.resumeList}>
              {resumes.map((resume) => (
                <article key={resume.id}>
                  <span className={styles.fileIcon}><FileText /></span>
                  <div><strong>{resume.name}</strong><p>{resume.roleType}</p><small>v{resume.version} · {resume.originalFilename} · {formatBytes(resume.byteSize)}</small></div>
                  <div className={styles.actions}>
                    {PREVIEWABLE_RESUME_TYPES.has(resume.contentType) && <a href={`/api/hosted/resumes/${resume.id}/preview`} target="_blank" rel="noreferrer"><Eye /> Preview</a>}
                    <a href={`/api/hosted/resumes/${resume.id}/download`}><Download /> Download</a>
                    <button type="button" onClick={() => remove(resume)}><Trash2 /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
