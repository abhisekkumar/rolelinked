"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, FileCheck2, LockKeyhole, PackageCheck, ShieldCheck } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./career-operations.module.css";

type Job = { id: string; company: string; title: string; url: string; location: string; status: string; descriptionExcerpt: string };
type Resume = { id: string; name: string; roleType: string };
type Packet = { packet: { id: string; jobId: string; resumeId: string | null; status: string; content: Record<string, unknown>; reviewNotes: string | null; updatedAt: string }; job: Job; resumeName: string | null };
type ApplicationAnswer = { question: string; answer: string };

export function ApplicationPackets() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [chosenJobId, setChosenJobId] = useState(searchParams.get("jobId") || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [jobsResponse, resumesResponse, packetsResponse] = await Promise.all([
      fetch("/api/hosted/jobs?view=pipeline", { cache: "no-store" }),
      fetch("/api/hosted/resumes", { cache: "no-store" }),
      fetch("/api/hosted/application-packets", { cache: "no-store" }),
    ]);
    const [jobsBody, resumesBody, packetsBody] = await Promise.all([
      jobsResponse.json().catch(() => ({})), resumesResponse.json().catch(() => ({})), packetsResponse.json().catch(() => ({})),
    ]);
    if (jobsResponse.ok) setJobs(jobsBody.jobs || []);
    if (resumesResponse.ok) setResumes(resumesBody.resumes || []);
    if (packetsResponse.ok) setPackets(packetsBody.packets || []);
    else setMessage(packetsBody.error || "Application packets are unavailable.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  const packetByJob = useMemo(() => new Map(packets.map((item) => [item.packet.jobId, item])), [packets]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const jobId = String(form.get("jobId") || "");
    const existing = packetByJob.get(jobId);
    const status = String(form.get("status") || "draft");
    if (status === "approved" && !window.confirm("Approve this exact packet inside RoleLinked? This does not submit an application or send a message.")) { setBusy(false); return; }
    const payload = {
      jobId,
      resumeId: String(form.get("resumeId") || "") || null,
      status,
      reviewNotes: String(form.get("reviewNotes") || "") || null,
      content: {
        professionalSummary: String(form.get("professionalSummary") || ""),
        coverNote: String(form.get("coverNote") || ""),
        answers: form.getAll("answerQuestion").map((question, index) => ({
          question: String(question).trim(),
          answer: String(form.getAll("answerText")[index] || "").trim(),
        })).filter((answer) => answer.question),
      },
    };
    const response = await fetch(existing ? `/api/hosted/application-packets/${existing.packet.id}` : "/api/hosted/application-packets", {
      method: existing ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? (status === "approved" ? "Packet approved inside RoleLinked. Nothing was submitted." : "Packet saved privately.") : body.error || "The packet could not be saved.");
    if (response.ok) { setSelectedPacket(null); await load(); }
    setBusy(false);
  }

  const selectedJobId = selectedPacket?.packet.jobId || chosenJobId || jobs[0]?.id || "";
  const selectedJob = jobs.find((job) => job.id === selectedJobId) || selectedPacket?.job;
  const content = selectedPacket?.packet.content || {};
  const existingAnswers = Array.isArray(content.answers)
    ? (content.answers as ApplicationAnswer[]).filter((answer) => answer && typeof answer.question === "string")
    : [];
  const answerRows = existingAnswers.length ? existingAnswers : [{ question: "", answer: "" }];

  return <div className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Application workspace</p><h1 className={instrumentSerif.className}>Prepare the packet. Keep the final action yours.</h1><p>Build an exact, reviewable packet from a saved role and resume. RoleLinked never invents qualifications and never submits or sends anything.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Approval gate enforced</strong>Approved is an internal state—not an external action</span></div></header>
    <section className={styles.packetGrid}>
      <form className={`${styles.card} ${styles.form}`} onSubmit={save} key={`${selectedPacket?.packet.id || "new"}:${selectedJobId}`}><h2>{selectedPacket ? "Review packet" : "Create a packet"}</h2><p className={styles.cardLead}>Use only claims supported by your selected resume and documents. Empty is safer than invented.</p><label>Role<select name="jobId" value={selectedJobId} onChange={(event) => { setChosenJobId(event.target.value); setSelectedPacket(packetByJob.get(event.target.value) || null); }} required>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} — {job.title}</option>)}</select></label>{selectedJob && <div className={styles.snapshot}><strong>{selectedJob.company} · {selectedJob.title}</strong><p>{selectedJob.location || "Location not stated"}</p><p>{selectedJob.descriptionExcerpt || "No excerpt captured. Open the original listing before drafting."}</p><div className={styles.actions}><a href={selectedJob.url} target="_blank" rel="noreferrer">Open listing <ExternalLink /></a></div></div>}<label>Resume<select name="resumeId" defaultValue={selectedPacket?.packet.resumeId || ""}><option value="">No resume selected</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} — {resume.roleType}</option>)}</select></label><label>Supported professional summary<textarea name="professionalSummary" defaultValue={String(content.professionalSummary || "")} placeholder="Write only claims supported by the selected resume." /></label><label>Cover note<textarea name="coverNote" defaultValue={String(content.coverNote || "")} placeholder="Explain the truthful fit without adding qualifications." /></label><fieldset className={styles.answerSet}><legend>Application answers</legend><p>Copy the exact application question, then draft only what your approved sources support.</p>{answerRows.map((answer, index) => <div className={styles.answerRow} key={`${selectedPacket?.packet.id || "new"}:${index}`}><label>Question<input name="answerQuestion" defaultValue={answer.question} placeholder="Why are you interested in this role?" /></label><label>Truthful answer<textarea name="answerText" defaultValue={answer.answer} placeholder="Leave blank when the answer is not supported." /></label></div>)}</fieldset><label>Review notes<textarea name="reviewNotes" defaultValue={selectedPacket?.packet.reviewNotes || ""} placeholder="Questions, missing evidence, or facts to verify." /></label><label>Packet state<select name="status" defaultValue={selectedPacket?.packet.status || "draft"}><option value="draft">Draft</option><option value="review">Ready for review</option><option value="approved">Approved internally</option><option value="archived">Archived</option></select></label><div className={styles.approval}><strong>Nothing leaves RoleLinked.</strong> Approval records your decision and the exact payload. Submission and messaging are intentionally unavailable.</div><button disabled={busy || !selectedJobId}><LockKeyhole />{busy ? "Saving…" : "Save packet"}</button>{message && <p className={styles.message} aria-live="polite">{message}</p>}</form>
      <section className={`${styles.card} ${styles.library}`}><div className={styles.libraryHead}><div><small>Approval queue</small><h2>{packets.length} packet{packets.length === 1 ? "" : "s"}</h2></div><PackageCheck /></div>{packets.length === 0 ? <div className={styles.empty}>No packets yet. Select a role and preserve a truthful draft.</div> : packets.map((item) => <article className={styles.packetItem} key={item.packet.id}><div className={styles.packetTop}><div><strong>{item.job.company} · {item.job.title}</strong><p>{item.resumeName ? `Resume: ${item.resumeName}` : "No resume selected"}</p></div><span className={styles.status}>{item.packet.status}</span></div><p>Updated {new Date(item.packet.updatedAt).toLocaleString()}</p><button type="button" onClick={() => { setChosenJobId(item.packet.jobId); setSelectedPacket(item); }}><FileCheck2 /> Open exact packet</button></article>)}</section>
    </section>
  </div>;
}
