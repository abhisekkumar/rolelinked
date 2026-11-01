"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  LockKeyhole,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { instrumentSerif } from "@/lib/fonts";

import styles from "./onboarding-experience.module.css";

const steps = ["Your search", "Resumes", "Automation", "Ready"];
const roleSuggestions = ["Senior Data Engineer", "Staff Data Engineer", "AI Data Engineer"];
const resumeSuggestions = [
  ["Senior Data Engineer", "Hands-on platform and pipeline roles"],
  ["Staff Data Engineer", "Architecture, influence, and platform ownership"],
  ["AI Data Engineer", "AI infrastructure and data-for-models roles"],
];

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function OnboardingExperience({ persistent }: { persistent: boolean }) {
  const [step, setStep] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState(() => new Set<string>());
  const [customRole, setCustomRole] = useState("");
  const [locations, setLocations] = useState("");
  const [prioritySkills, setPrioritySkills] = useState("");
  const [remotePreference, setRemotePreference] = useState("flexible");
  const [compensationMinimum, setCompensationMinimum] = useState("");
  const [compensationTarget, setCompensationTarget] = useState("");
  const [sponsorshipRequired, setSponsorshipRequired] = useState(false);
  const [approvedI140, setApprovedI140] = useState(false);
  const [cadence, setCadence] = useState("daily");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const availableRoles = useMemo(
    () => [...new Set([...roleSuggestions, ...selectedRoles])],
    [selectedRoles],
  );

  useEffect(() => {
    if (!persistent) return;
    void fetch("/api/hosted/profile", { cache: "no-store" })
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => {
        if (!response.ok) {
          setStatus(body.error || "Profile storage is not ready.");
          return;
        }
        if (!body.search) return;
        setSelectedRoles(new Set(body.search.targetRoles || []));
        setLocations((body.search.locations || []).join(", "));
        setPrioritySkills((body.search.prioritySkills || []).join(", "));
        setRemotePreference(body.search.remotePreference || "flexible");
        setCompensationMinimum(body.search.compensationMinimum?.toString() || "");
        setCompensationTarget(body.search.compensationTarget?.toString() || "");
        setSponsorshipRequired(Boolean(body.search.sponsorshipRequired));
        setApprovedI140(Boolean(body.search.approvedI140));
        setCadence(body.search.cadencePreference || "daily");
      })
      .catch(() => setStatus("Profile storage is unavailable."));
  }, [persistent]);

  const toggleRole = (role: string) => {
    setSelectedRoles((current) => {
      const next = new Set(current);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const addCustomRole = () => {
    const role = customRole.trim();
    if (role.length < 2) return;
    setSelectedRoles((current) => new Set([...current, role]));
    setCustomRole("");
  };

  const save = async () => {
    if (!persistent) {
      setStep(3);
      return;
    }
    setSaving(true);
    setStatus(null);
    const response = await fetch("/api/hosted/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetRoles: [...selectedRoles],
        prioritySkills: splitList(prioritySkills),
        excludedRoles: [],
        locations: splitList(locations),
        remotePreference,
        compensationCurrency: "USD",
        compensationMinimum: compensationMinimum ? Number(compensationMinimum) : null,
        compensationTarget: compensationTarget ? Number(compensationTarget) : null,
        sponsorshipRequired,
        approvedI140,
        cadencePreference: cadence,
      }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setStatus(body.error || "Your profile could not be saved.");
      return;
    }
    setStatus("Search profile saved privately.");
    setStep(3);
  };

  const continueSetup = () => {
    if (step < 2) setStep((value) => value + 1);
    else void save();
  };

  const firstStepValid = selectedRoles.size > 0 && splitList(locations).length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/welcome#top" className={styles.brand} aria-label="RoleLinked home">
          <CoMark size={35} />
          <span className={instrumentSerif.className}>RoleLinked</span>
        </Link>
        <div className={styles.headerActions}>
          <ThemeToggle className={styles.themeToggle} />
          <Link href="/app/today" className={styles.skip}>Open workspace <ArrowRight /></Link>
        </div>
      </header>

      <section className={styles.frame}>
        <aside className={styles.contextPanel}>
          <p className={styles.kicker}>Private by design</p>
          <h1 className={instrumentSerif.className}>Set up the search once. Improve it every day.</h1>
          <p>RoleLinked uses your approved profile and resumes to filter roles, prepare accurate materials, and keep every decision connected.</p>
          <div className={styles.promiseList}>
            <div><ShieldCheck /><span><strong>No invented qualifications</strong><small>Claims stay tied to sources you approve.</small></span></div>
            <div><LockKeyhole /><span><strong>Nothing submits itself</strong><small>Applications and messages stop at review.</small></span></div>
            <div><Radar /><span><strong>Your rules guide discovery</strong><small>Location, compensation, and sponsorship matter first.</small></span></div>
          </div>
          <p className={styles.previewNote}><Sparkles /> {persistent ? "Your choices are isolated to your authenticated account." : "Local preview mode does not persist these choices."}</p>
        </aside>

        <section className={styles.setupPanel}>
          <div className={styles.stepHeader}>
            <div><span>Setup progress</span><b>{step + 1} of {steps.length}</b></div>
            <div className={styles.progress}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
            <ol>{steps.map((label, index) => <li key={label} className={index === step ? styles.currentStep : index < step ? styles.completeStep : undefined}><span>{index < step ? <Check /> : index + 1}</span>{label}</li>)}</ol>
          </div>

          <div className={styles.stepContent}>
            {step === 0 && <>
              <p className={styles.eyebrow}>01 · Search profile</p>
              <h2>What should reach your review queue?</h2>
              <p className={styles.lede}>Define the roles and constraints that should shape discovery before AI evaluates anything.</p>
              <div className={styles.fieldGroup}>
                <label>Target roles</label>
                <div className={styles.roleGrid}>{availableRoles.map((role) => <button key={role} type="button" className={selectedRoles.has(role) ? styles.selectedChoice : undefined} onClick={() => toggleRole(role)}><Target /><span>{role}</span>{selectedRoles.has(role) && <Check />}</button>)}</div>
                <div className={styles.addRole}><input value={customRole} onChange={(event) => setCustomRole(event.target.value)} placeholder="Add another role title" maxLength={100} /><button type="button" onClick={addCustomRole}>Add role</button></div>
              </div>
              <div className={styles.profileFields}>
                <label><MapPin /><span>Locations</span><input value={locations} onChange={(event) => setLocations(event.target.value)} placeholder="Remote, New York, New Jersey" /></label>
                <label><Target /><span>Priority skills</span><input value={prioritySkills} onChange={(event) => setPrioritySkills(event.target.value)} placeholder="Spark, Python, SQL" /></label>
                <label><span className={styles.dollar}>$</span><span>Minimum compensation</span><input type="number" min="0" value={compensationMinimum} onChange={(event) => setCompensationMinimum(event.target.value)} placeholder="180000" /></label>
                <label><span className={styles.dollar}>$</span><span>Target compensation</span><input type="number" min="0" value={compensationTarget} onChange={(event) => setCompensationTarget(event.target.value)} placeholder="220000" /></label>
                <label><MapPin /><span>Work arrangement</span><select value={remotePreference} onChange={(event) => setRemotePreference(event.target.value)}><option value="flexible">Flexible</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
              </div>
              <div className={styles.checkRow}><label><input type="checkbox" checked={sponsorshipRequired} onChange={(event) => setSponsorshipRequired(event.target.checked)} /> Employer sponsorship required</label><label><input type="checkbox" checked={approvedI140} onChange={(event) => setApprovedI140(event.target.checked)} /> Approved I-140</label></div>
            </>}

            {step === 1 && <>
              <p className={styles.eyebrow}>02 · Resume library</p>
              <h2>Give each role family the right source.</h2>
              <p className={styles.lede}>Store multiple truthful base resumes privately. RoleLinked can later emphasize supported evidence without changing employers, titles, dates, or facts.</p>
              <div className={styles.resumeList}>{resumeSuggestions.map(([name, description]) => <div key={name}><Database /><span><strong>{name}</strong><small>{description}</small></span></div>)}</div>
              <Link className={styles.uploadPlaceholder} href="/app/resumes"><Database /> Open private resume library <small>Upload and manage multiple sources</small></Link>
            </>}

            {step === 2 && <>
              <p className={styles.eyebrow}>03 · Automation preference</p>
              <h2>Automate the search, not the decision.</h2>
              <p className={styles.lede}>Record how often you want discovery to run. Scheduled execution activates in Phase 3; approval remains mandatory before external actions.</p>
              <div className={styles.cadenceGrid}>{[["daily", "Daily"], ["twice-daily", "Twice daily"], ["weekly", "Weekly"]].map(([value, label]) => <button key={value} type="button" onClick={() => setCadence(value)} className={cadence === value ? styles.selectedCadence : undefined}><span>{label}</span><small>{value === "daily" ? "Recommended" : value === "twice-daily" ? "For active searches" : "Low-volume search"}</small></button>)}</div>
              <div className={styles.safetyRule}><ShieldCheck /><span><strong>Approval gate is always on</strong><small>RoleLinked can prepare a packet, but only you can authorize an external action.</small></span><b>Required</b></div>
            </>}

            {step === 3 && <div className={styles.readyState}>
              <span><Check /></span><p className={styles.eyebrow}>Setup complete</p><h2>Your private workspace has a clear starting point.</h2>
              <p>Your profile targets {selectedRoles.size} role type{selectedRoles.size === 1 ? "" : "s"} and records a {cadence.replace("-", " ")} discovery preference.</p>
              <div className={styles.readySummary}><div><strong>{selectedRoles.size}</strong><span>target roles</span></div><div><strong>{cadence.replace("-", " ")}</strong><span>cadence preference</span></div><div><strong>Always</strong><span>approval required</span></div></div>
              <Link href="/app/today">Open Today workspace <ArrowRight /></Link>
            </div>}
          </div>

          {status && <p className={styles.formStatus} aria-live="polite">{status}</p>}
          {step < 3 && <footer className={styles.stepFooter}><button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft /> Back</button><button type="button" onClick={continueSetup} disabled={saving || (step === 0 && !firstStepValid)}>{saving ? "Saving…" : step === 2 ? "Save profile" : "Continue"} <ArrowRight /></button></footer>}
        </section>
      </section>
    </main>
  );
}
