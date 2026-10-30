"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  LockKeyhole,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

import { CoMark } from "@/components/co-mark";
import { instrumentSerif } from "@/lib/fonts";

import styles from "./onboarding-experience.module.css";

const steps = ["Your search", "Resumes", "Automation", "Ready"];
const roles = ["Senior Data Engineer", "Staff Data Engineer", "AI Data Engineer"];
const resumes = [
  ["Senior Data Engineer", "Best for hands-on platform and pipeline roles"],
  ["Staff Data Engineer", "Best for architecture, influence, and platform ownership"],
  ["AI Data Engineer", "Best for AI infrastructure and data-for-models roles"],
];

export function OnboardingExperience() {
  const [step, setStep] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(roles));
  const [selectedResume, setSelectedResume] = useState(1);
  const [cadence, setCadence] = useState("Daily");

  const toggleRole = (role: string) => {
    setSelectedRoles((current) => {
      const next = new Set(current);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/welcome#top" className={styles.brand} aria-label="RoleLinked home">
          <CoMark size={35} />
          <span className={instrumentSerif.className}>RoleLinked</span>
        </Link>
        <Link href="/app/today" className={styles.skip}>Preview workspace <ArrowRight /></Link>
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

          <p className={styles.previewNote}><Sparkles /> Preview mode: these choices demonstrate onboarding and are not saved yet.</p>
        </aside>

        <section className={styles.setupPanel}>
          <div className={styles.stepHeader}>
            <div><span>Setup progress</span><b>{step + 1} of {steps.length}</b></div>
            <div className={styles.progress}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
            <ol>
              {steps.map((label, index) => (
                <li key={label} className={index === step ? styles.currentStep : index < step ? styles.completeStep : undefined}>
                  <span>{index < step ? <Check /> : index + 1}</span>{label}
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.stepContent}>
            {step === 0 && (
              <>
                <p className={styles.eyebrow}>01 · Search profile</p>
                <h2>What should reach your review queue?</h2>
                <p className={styles.lede}>Choose the roles and constraints that should shape discovery before AI evaluates anything.</p>
                <div className={styles.fieldGroup}>
                  <label>Target roles</label>
                  <div className={styles.roleGrid}>
                    {roles.map((role) => (
                      <button key={role} type="button" className={selectedRoles.has(role) ? styles.selectedChoice : undefined} onClick={() => toggleRole(role)}>
                        <Target /> <span>{role}</span>{selectedRoles.has(role) && <Check />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.constraintGrid}>
                  <div><MapPin /><span>Location</span><strong>Remote US · NYC/NJ hybrid</strong><small>Edit in profile settings later</small></div>
                  <div><span className={styles.dollar}>$</span><span>Compensation</span><strong>$180K minimum</strong><small>Target range can stay private</small></div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className={styles.eyebrow}>02 · Resume library</p>
                <h2>Give each kind of role the right starting point.</h2>
                <p className={styles.lede}>Keep multiple truthful base resumes. RoleLinked will emphasize supported evidence without changing employers, titles, dates, or facts.</p>
                <div className={styles.resumeList}>
                  {resumes.map(([name, description], index) => (
                    <button key={name} type="button" onClick={() => setSelectedResume(index)} className={selectedResume === index ? styles.selectedResume : undefined}>
                      <FileText />
                      <span><strong>{name}</strong><small>{description}</small></span>
                      <b>{selectedResume === index ? <Check /> : "Select"}</b>
                    </button>
                  ))}
                </div>
                <button className={styles.uploadPlaceholder} type="button" disabled><Upload /> Upload another resume <small>Available after private storage is connected</small></button>
              </>
            )}

            {step === 2 && (
              <>
                <p className={styles.eyebrow}>03 · Automation rules</p>
                <h2>Automate the search, not the decision.</h2>
                <p className={styles.lede}>Choose how often RoleLinked looks for roles. Approval remains mandatory before applications or messages leave your workspace.</p>
                <div className={styles.cadenceGrid}>
                  {["Daily", "Twice daily", "Weekly"].map((option) => (
                    <button key={option} type="button" onClick={() => setCadence(option)} className={cadence === option ? styles.selectedCadence : undefined}>
                      <span>{option}</span><small>{option === "Daily" ? "Recommended" : option === "Twice daily" ? "For active searches" : "Low-volume search"}</small>
                    </button>
                  ))}
                </div>
                <div className={styles.safetyRule}>
                  <ShieldCheck /><span><strong>Approval gate is always on</strong><small>RoleLinked can prepare a packet, but only you can authorize the external action.</small></span><b>Required</b>
                </div>
              </>
            )}

            {step === 3 && (
              <div className={styles.readyState}>
                <span><Check /></span>
                <p className={styles.eyebrow}>Setup preview complete</p>
                <h2>Your workspace has a clear starting point.</h2>
                <p>This sample setup targets {selectedRoles.size} role types, starts from the {resumes[selectedResume][0]} resume, and scans {cadence.toLowerCase()}.</p>
                <div className={styles.readySummary}>
                  <div><strong>{selectedRoles.size}</strong><span>target roles</span></div>
                  <div><strong>{cadence}</strong><span>discovery cadence</span></div>
                  <div><strong>Always</strong><span>approval required</span></div>
                </div>
                <Link href="/app/today">Open Today workspace <ArrowRight /></Link>
              </div>
            )}
          </div>

          {step < 3 && (
            <footer className={styles.stepFooter}>
              <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft /> Back</button>
              <button type="button" onClick={() => setStep((value) => Math.min(3, value + 1))}>Continue <ArrowRight /></button>
            </footer>
          )}
        </section>
      </section>
    </main>
  );
}
