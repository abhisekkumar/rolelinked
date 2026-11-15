"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Globe2, Radar, ShieldCheck } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./career-operations.module.css";

type Source = { key: string; name: string; kind: "job-board" | "company-ats"; provider: string; enabled: boolean };

export function SourceControls() {
  const [sources, setSources] = useState<Source[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/hosted/sources", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setSources(body.sources || []); else setMessage(body.error || "Sources are unavailable.");
  }, []);
  useEffect(() => { void load(); }, [load]);
  const groups = useMemo(() => ({ boards: sources.filter((item) => item.kind === "job-board"), companies: sources.filter((item) => item.kind === "company-ats") }), [sources]);
  async function toggle(source: Source) {
    setBusy(source.key); setMessage(null);
    const response = await fetch("/api/hosted/sources", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceKey: source.key, enabled: !source.enabled }) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) { setSources((current) => current.map((item) => item.key === source.key ? { ...item, enabled: !item.enabled } : item)); setMessage(`${source.name} ${source.enabled ? "disabled" : "enabled"} for future scans.`); }
    else setMessage(body.error || "The source could not be updated.");
    setBusy(null);
  }
  const renderGroup = (title: string, lead: string, items: Source[], icon: React.ReactNode) => <section className={styles.card}><div className={styles.libraryHead}><div><small>{lead}</small><h2>{title}</h2></div>{icon}</div><div className={styles.sourceList}>{items.map((source) => <div className={styles.sourceRow} key={source.key}><div><strong>{source.name}</strong><small>{source.provider} · {source.enabled ? "Included in discovery" : "Paused"}</small></div><button type="button" className={`${styles.switch} ${source.enabled ? styles.switchOn : ""}`} onClick={() => toggle(source)} disabled={busy === source.key} aria-label={`${source.enabled ? "Disable" : "Enable"} ${source.name}`} aria-pressed={source.enabled}><span /></button></div>)}</div></section>;
  return <div className={styles.page}><header className={styles.heading}><div><p className={styles.eyebrow}>Discovery sources</p><h1 className={instrumentSerif.className}>Choose where RoleLinked looks.</h1><p>Control job boards and company ATS feeds per account. Changes affect future scans only; existing saved roles remain in your private pipeline.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Public sources only</strong>No LinkedIn session scraping or credential sharing</span></div></header>{message && <p className={styles.message} aria-live="polite">{message}</p>}<div className={styles.sourceGroups}>{renderGroup("Remote job boards", "Broad public feeds", groups.boards, <Globe2 />)}{renderGroup("Company career sites", "Public ATS feeds", groups.companies, <Building2 />)}</div><div className={styles.safety} style={{ marginTop: "1rem" }}><Radar /><span><strong>{sources.filter((item) => item.enabled).length} sources enabled</strong>Discovery continues to apply your role, location, compensation, and sponsorship rules.</span></div></div>;
}
