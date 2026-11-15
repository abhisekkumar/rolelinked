"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, LockKeyhole, ShieldCheck } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./career-operations.module.css";

type Schedule = { enabled: boolean; cadence: "daily" | "twice-daily" | "weekly"; localTime: string; timezone: string; qstashScheduleId: string | null; lastError: string | null };

export function AutomationControls() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/hosted/automation", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setSchedule(body.schedule || null); else setMessage(body.error || "Automation settings are unavailable.");
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = { enabled: form.get("enabled") === "on", cadence: form.get("cadence"), localTime: form.get("localTime"), timezone: form.get("timezone") };
    const response = await fetch("/api/hosted/automation", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) { setSchedule(body.schedule); setMessage(body.schedule.enabled ? "Scheduled discovery is active." : "Scheduled discovery is paused."); }
    else setMessage(body.error || "The schedule could not be saved.");
    setBusy(false);
  }
  return <div className={styles.page}><header className={styles.heading}><div><p className={styles.eyebrow}>Safe automations</p><h1 className={instrumentSerif.className}>Let discovery run. Keep decisions human.</h1><p>Schedule account-private job discovery. Automations can research and save roles, but cannot apply, message, or change application status.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Hard approval boundary</strong>No external action is available to this scheduler</span></div></header><section className={styles.grid}><form className={`${styles.card} ${styles.form}`} onSubmit={save}><h2>Discovery schedule</h2><p className={styles.cardLead}>Times use your selected IANA timezone and adjust for daylight saving time.</p><label>Cadence<select name="cadence" defaultValue={schedule?.cadence || "daily"}><option value="daily">Daily</option><option value="twice-daily">Every 12 hours</option><option value="weekly">Weekly on Monday</option></select></label><label>Local time<input name="localTime" type="time" defaultValue={schedule?.localTime || "09:00"} required /></label><label>Timezone<input name="timezone" defaultValue={schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"} placeholder="America/New_York" required /></label><label><span><input name="enabled" type="checkbox" defaultChecked={schedule?.enabled || false} /> Enable scheduled discovery</span></label><button disabled={busy}><CalendarClock />{busy ? "Saving…" : "Save schedule"}</button>{message && <p className={styles.message} aria-live="polite">{message}</p>}</form><section className={`${styles.card} ${styles.library}`}><div className={styles.libraryHead}><div><small>Automation boundary</small><h2>What can run</h2></div><LockKeyhole /></div><div className={styles.scheduleStatus}><div><strong>{schedule?.enabled ? "Discovery active" : "Discovery paused"}</strong><p>{schedule?.enabled ? `${schedule.cadence} at ${schedule.localTime} · ${schedule.timezone}` : "No recurring discovery will run."}</p></div><span className={`${styles.dot} ${schedule?.enabled ? styles.dotOn : ""}`} /></div><div className={styles.approval}><strong>Allowed:</strong> scan selected public sources, filter against your saved preferences, and save private leads.<br /><br /><strong>Blocked:</strong> application submission, form filling, messages, and pipeline status changes.</div>{schedule?.lastError && <p className={styles.message}>Last error: {schedule.lastError}</p>}</section></section></div>;
}
