"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Clipboard, ExternalLink, FileCheck2, FileScan, LockKeyhole, PackageCheck, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import { applicationPacketReadiness, type ApplicationAnswerDraft } from "@/lib/hosted/application-packet-readiness";
import styles from "./career-operations.module.css";

type Job = { id: string; company: string; title: string; url: string; location: string; status: string; descriptionExcerpt: string };
type Resume = { id: string; name: string; roleType: string };
type Evidence = { id: string; title: string; statement: string; category: string; verificationState: "verified" | "corrected"; usageCount: number };
type Packet = { packet: { id: string; jobId: string; resumeId: string | null; status: string; content: Record<string, unknown>; reviewNotes: string | null; updatedAt: string }; job: Job; resumeName: string | null; evidenceIds: string[] };
const EMPTY_ANSWER = { question: "", answer: "" };
const QUEUE_STATES = ["all", "draft", "review", "approved", "archived"] as const;

export function ApplicationPackets() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [chosenJobId, setChosenJobId] = useState(searchParams.get("jobId") || "");
  const [resumeId, setResumeId] = useState("");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [packetStatus, setPacketStatus] = useState("draft");
  const [answerRows, setAnswerRows] = useState<ApplicationAnswerDraft[]>([{ ...EMPTY_ANSWER }]);
  const [queueState, setQueueState] = useState<(typeof QUEUE_STATES)[number]>("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [jobsResponse, resumesResponse, evidenceResponse, packetsResponse] = await Promise.all([
      fetch("/api/hosted/jobs?view=pipeline", { cache: "no-store" }),
      fetch("/api/hosted/resumes", { cache: "no-store" }),
      fetch("/api/hosted/evidence", { cache: "no-store" }),
      fetch("/api/hosted/application-packets", { cache: "no-store" }),
    ]);
    const [jobsBody, resumesBody, evidenceBody, packetsBody] = await Promise.all([
      jobsResponse.json().catch(() => ({})), resumesResponse.json().catch(() => ({})), evidenceResponse.json().catch(() => ({})), packetsResponse.json().catch(() => ({})),
    ]);
    if (jobsResponse.ok) setJobs(jobsBody.jobs || []);
    if (resumesResponse.ok) setResumes(resumesBody.resumes || []);
    if (evidenceResponse.ok) setEvidence((evidenceBody.evidence || []).filter((item: Evidence) => item.verificationState === "verified" || item.verificationState === "corrected"));
    if (packetsResponse.ok) setPackets(packetsBody.packets || []);
    else setMessage(packetsBody.error || "Application packets are unavailable.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  const packetByJob = useMemo(() => new Map(packets.map((item) => [item.packet.jobId, item])), [packets]);
  const selectedJobId = selectedPacket?.packet.jobId || chosenJobId || jobs[0]?.id || "";
  const selectedJob = jobs.find((job) => job.id === selectedJobId) || selectedPacket?.job;

  useEffect(() => {
    const content = selectedPacket?.packet.content || {};
    const existingAnswers = Array.isArray(content.answers)
      ? (content.answers as ApplicationAnswerDraft[]).filter((answer) => answer && typeof answer.question === "string")
      : [];
    setResumeId(selectedPacket?.packet.resumeId || "");
    setSelectedEvidenceIds(selectedPacket?.evidenceIds || []);
    setProfessionalSummary(String(content.professionalSummary || ""));
    setCoverNote(String(content.coverNote || ""));
    setReviewNotes(selectedPacket?.packet.reviewNotes || "");
    setPacketStatus(selectedPacket?.packet.status || "draft");
    setAnswerRows(existingAnswers.length ? existingAnswers : [{ ...EMPTY_ANSWER }]);
  }, [selectedPacket, selectedJobId]);

  const checks = useMemo(() => applicationPacketReadiness({
    jobId: selectedJobId,
    resumeId,
    evidenceIds: selectedEvidenceIds,
    professionalSummary,
    coverNote,
    answers: answerRows,
  }), [answerRows, coverNote, professionalSummary, resumeId, selectedEvidenceIds, selectedJobId]);
  const completion = checks.filter((item) => item.done).length;
  const visiblePackets = queueState === "all" ? packets : packets.filter((item) => item.packet.status === queueState);

  function chooseJob(jobId: string) {
    setChosenJobId(jobId);
    setSelectedPacket(packetByJob.get(jobId) || null);
    setMessage(null);
  }

  function updateAnswer(index: number, field: keyof ApplicationAnswerDraft, value: string) {
    setAnswerRows((current) => current.map((answer, answerIndex) => answerIndex === index ? { ...answer, [field]: value } : answer));
  }

  function toggleEvidence(evidenceId: string) {
    setSelectedEvidenceIds((current) => current.includes(evidenceId)
      ? current.filter((id) => id !== evidenceId)
      : [...current, evidenceId]);
  }

  async function copy(value: string, label: string) {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied. Review it before using it outside RoleLinked.`);
    } catch {
      setMessage("Copy is unavailable in this browser. Select the text and copy it manually.");
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const existing = packetByJob.get(selectedJobId);
    if (packetStatus === "approved" && !window.confirm("Approve this exact packet inside RoleLinked? This does not submit an application or send a message.")) { setBusy(false); return; }
    const payload = {
      jobId: selectedJobId,
      resumeId: resumeId || null,
      evidenceIds: selectedEvidenceIds,
      status: packetStatus,
      reviewNotes: reviewNotes || null,
      content: {
        professionalSummary,
        coverNote,
        answers: answerRows.map((answer) => ({ question: answer.question.trim(), answer: answer.answer.trim() })).filter((answer) => answer.question),
      },
    };
    const response = await fetch(existing ? `/api/hosted/application-packets/${existing.packet.id}` : "/api/hosted/application-packets", {
      method: existing ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? (packetStatus === "approved" ? "Packet approved inside RoleLinked. Nothing was submitted." : "Packet saved privately.") : body.error || "The packet could not be saved.");
    if (response.ok) { setSelectedPacket(null); await load(); }
    setBusy(false);
  }

  return <div className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Application workspace</p><h1 className={instrumentSerif.className}>Prepare the packet. Keep the final action yours.</h1><p>Preserve a source-backed draft, compare it with the listing, and approve the exact packet. RoleLinked never invents qualifications and never submits or sends anything.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Approval gate enforced</strong>Approved is an internal state—not an external action</span></div></header>
    {message && <p className={styles.message} aria-live="polite">{message}</p>}
    <section className={styles.packetGrid}>
      <form className={`${styles.card} ${styles.form} ${styles.packetForm}`} onSubmit={save}>
        <div className={styles.packetSectionHead}><span>01</span><div><small>Source</small><h2>{selectedPacket ? "Review exact packet" : "Create a packet"}</h2></div><strong>{completion}/5 ready</strong></div>
        <label>Role<select value={selectedJobId} onChange={(event) => chooseJob(event.target.value)} required>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} — {job.title}</option>)}</select></label>
        {selectedJob && <div className={styles.snapshot}>
          <div className={styles.snapshotHead}><div><strong>{selectedJob.company} · {selectedJob.title}</strong><p>{selectedJob.location || "Location not stated"}</p></div><a href={selectedJob.url} target="_blank" rel="noreferrer">Open original <ExternalLink /></a></div>
          <details><summary>Read captured job evidence</summary><p>{selectedJob.descriptionExcerpt || "No excerpt captured. Open the original listing before drafting."}</p></details>
        </div>}

        <div className={styles.packetSectionHead}><span>02</span><div><small>Evidence</small><h3>Choose the approved source</h3></div></div>
        <label>Resume<select value={resumeId} onChange={(event) => setResumeId(event.target.value)}><option value="">No resume selected</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} — {resume.roleType}</option>)}</select></label>
        {selectedJobId && resumeId && <a className={styles.atsCheckLink} href={`/app/ats-check?jobId=${encodeURIComponent(selectedJobId)}&resumeId=${encodeURIComponent(resumeId)}`}><FileScan /> Check this resume against the role</a>}
        <fieldset className={styles.evidencePicker}>
          <legend>Verified claims to pin</legend>
          <p>The exact evidence selection is recorded with this packet. Unreviewed and narrative-only claims are intentionally unavailable.</p>
          {evidence.length ? <div className={styles.evidenceChoices}>{evidence.map((item) => <label key={item.id}>
            <input type="checkbox" checked={selectedEvidenceIds.includes(item.id)} onChange={() => toggleEvidence(item.id)} />
            <span><strong>{item.title}</strong><small>{item.statement}</small></span>
          </label>)}</div> : <div className={styles.evidenceEmpty}>No verified evidence yet. <a href="/app/evidence">Review the Evidence Vault first.</a></div>}
        </fieldset>

        <div className={styles.packetSectionHead}><span>03</span><div><small>Draft</small><h3>Write only what the evidence supports</h3></div></div>
        <label>Supported professional summary<div className={styles.fieldWithAction}><textarea value={professionalSummary} onChange={(event) => setProfessionalSummary(event.target.value)} placeholder="Write only claims supported by the selected resume." /><button type="button" onClick={() => copy(professionalSummary, "Summary")} aria-label="Copy professional summary"><Clipboard /></button></div></label>
        <label>Cover note<div className={styles.fieldWithAction}><textarea value={coverNote} onChange={(event) => setCoverNote(event.target.value)} placeholder="Explain the truthful fit without adding qualifications." /><button type="button" onClick={() => copy(coverNote, "Cover note")} aria-label="Copy cover note"><Clipboard /></button></div></label>
        <fieldset className={styles.answerSet}><legend>Application answers</legend><p>Paste the exact question. Leave the answer blank when your approved sources do not support it.</p>{answerRows.map((answer, index) => <div className={styles.answerRow} key={index}><div className={styles.answerHead}><strong>Answer {index + 1}</strong>{answerRows.length > 1 && <button type="button" onClick={() => setAnswerRows((current) => current.filter((_, answerIndex) => answerIndex !== index))}><Trash2 /> Remove</button>}</div><label>Question<input value={answer.question} onChange={(event) => updateAnswer(index, "question", event.target.value)} placeholder="Why are you interested in this role?" /></label><label>Truthful answer<div className={styles.fieldWithAction}><textarea value={answer.answer} onChange={(event) => updateAnswer(index, "answer", event.target.value)} placeholder="Use only source-backed qualifications." /><button type="button" onClick={() => copy(answer.answer, `Answer ${index + 1}`)} aria-label={`Copy answer ${index + 1}`}><Clipboard /></button></div></label></div>)}<button className={styles.secondaryButton} type="button" onClick={() => setAnswerRows((current) => [...current, { ...EMPTY_ANSWER }])}><Plus /> Add another question</button></fieldset>

        <div className={styles.packetSectionHead}><span>04</span><div><small>Review</small><h3>Record the internal decision</h3></div></div>
        <div className={styles.completeness}>{checks.map((item) => <span className={item.done ? styles.complete : ""} key={item.label}>{item.done ? <Check /> : <i />}{item.label}</span>)}</div>
        <label>Review notes<textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Questions, missing evidence, or facts to verify." /></label>
        <label>Packet state<select value={packetStatus} onChange={(event) => setPacketStatus(event.target.value)}><option value="draft">Draft</option><option value="review">Ready for review</option><option value="approved">Approved internally</option><option value="archived">Archived</option></select></label>
        <div className={styles.approval}><strong>Nothing leaves RoleLinked.</strong> Approval records your decision and the exact payload. Submission and messaging are intentionally unavailable.</div>
        <button disabled={busy || !selectedJobId}><LockKeyhole />{busy ? "Saving…" : packetStatus === "approved" ? "Save approved packet" : "Save private packet"}</button>
      </form>

      <section className={`${styles.card} ${styles.library} ${styles.packetQueue}`}>
        <div className={styles.libraryHead}><div><small>Approval queue</small><h2>{packets.length} packet{packets.length === 1 ? "" : "s"}</h2><p>Internal preparation only</p></div><PackageCheck /></div>
        <div className={styles.queueFilters}>{QUEUE_STATES.map((state) => <button type="button" className={queueState === state ? styles.activeFilter : ""} onClick={() => setQueueState(state)} key={state}>{state === "all" ? "All" : state}</button>)}</div>
        {visiblePackets.length === 0 ? <div className={styles.empty}>{packets.length ? "No packets in this state." : "No packets yet. Select a role and preserve a truthful draft."}</div> : visiblePackets.map((item) => <article className={styles.packetItem} key={item.packet.id}><div className={styles.packetTop}><div><strong>{item.job.company} · {item.job.title}</strong><p>{item.resumeName ? `Resume: ${item.resumeName}` : "No resume selected"} · {item.evidenceIds.length} verified claim{item.evidenceIds.length === 1 ? "" : "s"}</p></div><span className={styles.status}>{item.packet.status}</span></div><p>Updated {new Date(item.packet.updatedAt).toLocaleString()}</p><button type="button" onClick={() => { setChosenJobId(item.packet.jobId); setSelectedPacket(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}><FileCheck2 /> Open exact packet</button></article>)}
      </section>
    </section>
  </div>;
}
