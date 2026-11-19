"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Building2, ExternalLink, Globe2, Radar, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { instrumentSerif } from "@/lib/fonts";
import styles from "./career-operations.module.css";

type Source = {
  key: string;
  name: string;
  kind: "job-board" | "company-ats";
  provider: string;
  description: string;
  coverage: string;
  defaultEnabled: boolean;
  enabled: boolean;
};

type ManualSource = {
  key: string;
  name: string;
  kind: "manual-board";
  provider: "Manual search";
  description: string;
  coverage: string;
  url: string;
};

export function SourceControls() {
  const [sources, setSources] = useState<Source[]>([]);
  const [manualSources, setManualSources] = useState<ManualSource[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "paused">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const response = await fetch("/api/hosted/sources", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setSources(body.sources || []);
      setManualSources(body.manualSources || []);
    }
    else setMessage(body.error || "Sources are unavailable.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sources.filter((source) => {
      if (filter === "enabled" && !source.enabled) return false;
      if (filter === "paused" && source.enabled) return false;
      return !needle || `${source.name} ${source.provider} ${source.coverage} ${source.description}`.toLowerCase().includes(needle);
    });
  }, [filter, query, sources]);
  const groups = useMemo(() => ({
    boards: visible.filter((item) => item.kind === "job-board"),
    companies: visible.filter((item) => item.kind === "company-ats"),
  }), [visible]);
  const visibleManual = useMemo(() => {
    if (filter !== "all") return [];
    const needle = query.trim().toLowerCase();
    return manualSources.filter((source) => !needle || `${source.name} ${source.provider} ${source.coverage} ${source.description}`.toLowerCase().includes(needle));
  }, [filter, manualSources, query]);

  async function persist(source: Source, enabled: boolean) {
    const response = await fetch("/api/hosted/sources", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceKey: source.key, enabled }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Could not update ${source.name}.`);
  }

  async function toggle(source: Source) {
    setBusy((current) => new Set(current).add(source.key));
    setMessage(null);
    try {
      await persist(source, !source.enabled);
      setSources((current) => current.map((item) => item.key === source.key ? { ...item, enabled: !item.enabled } : item));
      setMessage(`${source.name} ${source.enabled ? "paused" : "enabled"} for future scans.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The source could not be updated.");
    } finally {
      setBusy((current) => { const next = new Set(current); next.delete(source.key); return next; });
    }
  }

  async function setVisible(enabled: boolean) {
    const changed = visible.filter((source) => source.enabled !== enabled);
    if (!changed.length) return;
    setBusy(new Set(changed.map((source) => source.key)));
    setMessage(null);
    const results = await Promise.allSettled(changed.map((source) => persist(source, enabled)));
    const succeeded = new Set(changed.filter((_, index) => results[index].status === "fulfilled").map((source) => source.key));
    setSources((current) => current.map((source) => succeeded.has(source.key) ? { ...source, enabled } : source));
    const failures = results.length - succeeded.size;
    setMessage(failures ? `${succeeded.size} sources updated; ${failures} could not be changed.` : `${succeeded.size} visible sources ${enabled ? "enabled" : "paused"}.`);
    setBusy(new Set());
  }

  const renderGroup = (title: string, lead: string, items: Source[], icon: React.ReactNode) => (
    <section className={styles.card}>
      <div className={styles.libraryHead}><div><small>{lead}</small><h2>{title}</h2><p>{items.filter((item) => item.enabled).length} enabled · {items.length} shown</p></div>{icon}</div>
      <div className={styles.sourceList}>{items.length ? items.map((source) => (
        <div className={styles.sourceRow} key={source.key}>
          <div className={styles.sourceCopy}>
            <div className={styles.sourceTitle}><strong>{source.name}</strong>{!source.defaultEnabled && <span>Optional</span>}</div>
            <p>{source.description}</p>
            <small>{source.provider} · {source.coverage}</small>
          </div>
          <button type="button" className={`${styles.switch} ${source.enabled ? styles.switchOn : ""}`} onClick={() => toggle(source)} disabled={busy.has(source.key)} aria-label={`${source.enabled ? "Disable" : "Enable"} ${source.name}`} aria-pressed={source.enabled}><span /></button>
        </div>
      )) : <div className={styles.empty}>No sources match this view.</div>}</div>
    </section>
  );

  const renderManualGroup = () => (
    <section className={`${styles.card} ${styles.manualSources}`}>
      <div className={styles.libraryHead}><div><small>Open on demand · never scraped</small><h2>Manual search portals</h2><p>{visibleManual.length} shown</p></div><BookOpen /></div>
      <div className={styles.sourceList}>{visibleManual.length ? visibleManual.map((source) => (
        <div className={styles.sourceRow} key={source.key}>
          <div className={styles.sourceCopy}>
            <div className={styles.sourceTitle}><strong>{source.name}</strong><span>Manual</span></div>
            <p>{source.description}</p>
            <small>{source.coverage}</small>
          </div>
          <a className={styles.sourceLink} href={source.url} target="_blank" rel="noreferrer">Open board <ExternalLink /></a>
        </div>
      )) : <div className={styles.empty}>No manual portals match this search.</div>}</div>
    </section>
  );

  const enabledCount = sources.filter((item) => item.enabled).length;
  return <div className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Discovery sources</p><h1 className={instrumentSerif.className}>Choose where RoleLinked looks.</h1><p>Use public job boards and direct company ATS feeds. Each account controls its own source mix; existing saved roles stay in its private pipeline.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Public sources only</strong>No LinkedIn session scraping or credential sharing</span></div></header>
    {message && <p className={styles.message} aria-live="polite">{message}</p>}
    <section className={styles.sourceToolbar} aria-label="Source catalog controls">
      <label className={styles.sourceSearch}><Search /><span className="sr-only">Search sources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search boards, regions, or providers" /></label>
      <div className={styles.sourceFilters}><SlidersHorizontal />{(["all", "enabled", "paused"] as const).map((value) => <button type="button" className={filter === value ? styles.activeFilter : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "All" : value === "enabled" ? "Enabled" : "Paused"}</button>)}</div>
      <div className={styles.sourceBulk}><button type="button" onClick={() => setVisible(true)}>Enable shown</button><button type="button" onClick={() => setVisible(false)}>Pause shown</button></div>
    </section>
    <div className={styles.sourceSummary}><strong>{enabledCount} of {sources.length} automated sources enabled</strong><span>{manualSources.length} additional portals are listed as manual-only so the product never implies unsupported scraping.</span></div>
    <div className={styles.sourceNetworkSummary}><strong>Direct ATS networks</strong><span>Greenhouse · Lever · Ashby · Workable · iCIMS</span><small>Search “Ashby” or “India” above to isolate those feeds.</small></div>
    <div className={styles.sourceGroups}>{renderGroup("Public job boards", "Broad and specialty feeds", groups.boards, <Globe2 />)}{renderGroup("Company career sites", "Direct public ATS feeds", groups.companies, <Building2 />)}{filter === "all" && renderManualGroup()}</div>
    <div className={styles.safety} style={{ marginTop: "1rem" }}><Radar /><span><strong>Preferences still decide what survives</strong>Role, location, compensation, and sponsorship filters apply after source collection.</span></div>
  </div>;
}
