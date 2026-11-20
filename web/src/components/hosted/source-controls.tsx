"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Building2, ExternalLink, Globe2, MapPinned, Network, Radar, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";

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

type Market = "primary" | "india" | "international";
type MarketFilter = Market | "all";

const MARKET_TABS: Record<MarketFilter, { label: string; eyebrow: string; description: string }> = {
  primary: { label: "US & global", eyebrow: "Primary market", description: "US roles and globally eligible remote opportunities." },
  india: { label: "India", eyebrow: "Regional opt-in", description: "India-only ATS feeds and local search portals." },
  international: { label: "International", eyebrow: "Regional opt-in", description: "Europe, LATAM, Nordics, Spain, and other regional boards." },
  all: { label: "All sources", eyebrow: "Catalog view", description: "Inspect every automated feed and manual portal together." },
};

const ATS_NETWORKS: Record<string, { label: string; description: string }> = {
  greenhouse: { label: "Greenhouse", description: "Automated public company boards across technology, data, AI, finance, and operations." },
  ashby: { label: "Ashby", description: "Automated public feeds from high-growth AI, data-platform, infrastructure, and software companies." },
  lever: { label: "Lever", description: "Automated public company boards with broad engineering and business-role coverage." },
  workable: { label: "Workable", description: "Automated public company feeds exposed through Workable career sites." },
  icims: { label: "iCIMS", description: "Automated public enterprise career feeds exposed through iCIMS." },
};

function providerLabel(provider: string) {
  return ATS_NETWORKS[provider]?.label || provider;
}

function sourceMarket(source: Pick<Source | ManualSource, "coverage">): Market {
  const coverage = source.coverage.toLowerCase();
  if (coverage.includes("india") && !/(united states|global)/i.test(coverage)) return "india";
  if (/(europe|latin america|nordics|spain|apac)/i.test(coverage) && !/(united states|global)/i.test(coverage)) return "international";
  return "primary";
}

function matchesMarket(source: Pick<Source | ManualSource, "coverage">, market: MarketFilter) {
  return market === "all" || sourceMarket(source) === market;
}

function marketLabel(source: Pick<Source | ManualSource, "coverage">) {
  const market = sourceMarket(source);
  return market === "primary" ? "US & global" : market === "india" ? "India" : "International";
}

export function SourceControls() {
  const [sources, setSources] = useState<Source[]>([]);
  const [manualSources, setManualSources] = useState<ManualSource[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "paused">("all");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("primary");
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

  const marketSources = useMemo(() => sources.filter((source) => matchesMarket(source, marketFilter)), [marketFilter, sources]);
  const marketCounts = useMemo(() => {
    const catalog = [...sources, ...manualSources];
    return {
      primary: catalog.filter((source) => sourceMarket(source) === "primary").length,
      india: catalog.filter((source) => sourceMarket(source) === "india").length,
      international: catalog.filter((source) => sourceMarket(source) === "international").length,
      all: catalog.length,
    };
  }, [manualSources, sources]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return marketSources.filter((source) => {
      if (filter === "enabled" && !source.enabled) return false;
      if (filter === "paused" && source.enabled) return false;
      return !needle || `${source.name} ${source.provider} ${source.coverage} ${source.description}`.toLowerCase().includes(needle);
    });
  }, [filter, marketSources, query]);
  const groups = useMemo(() => ({
    boards: visible.filter((item) => item.kind === "job-board"),
    companies: visible.filter((item) => item.kind === "company-ats"),
  }), [visible]);
  const atsNetworks = useMemo(() => Object.entries(ATS_NETWORKS).map(([provider, meta]) => {
    const boards = marketSources.filter((source) => source.kind === "company-ats" && source.provider === provider);
    return { provider, ...meta, boards, enabled: boards.filter((source) => source.enabled).length };
  }).filter((network) => network.boards.length > 0), [marketSources]);
  const visibleManual = useMemo(() => {
    if (filter !== "all") return [];
    const needle = query.trim().toLowerCase();
    return manualSources.filter((source) => matchesMarket(source, marketFilter) && (!needle || `${source.name} ${source.provider} ${source.coverage} ${source.description}`.toLowerCase().includes(needle)));
  }, [filter, manualSources, marketFilter, query]);

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

  async function setNetwork(provider: string, enabled: boolean) {
    const changed = sources.filter((source) => matchesMarket(source, marketFilter) && source.kind === "company-ats" && source.provider === provider && source.enabled !== enabled);
    if (!changed.length) return;
    setBusy(new Set(changed.map((source) => source.key)));
    setMessage(null);
    const results = await Promise.allSettled(changed.map((source) => persist(source, enabled)));
    const succeeded = new Set(changed.filter((_, index) => results[index].status === "fulfilled").map((source) => source.key));
    setSources((current) => current.map((source) => succeeded.has(source.key) ? { ...source, enabled } : source));
    const failures = changed.length - succeeded.size;
    const label = providerLabel(provider);
    setMessage(failures
      ? `${succeeded.size} ${label} boards updated; ${failures} could not be changed.`
      : `${label} automated scanning ${enabled ? "enabled" : "paused"} for ${succeeded.size} company boards.`);
    setBusy(new Set());
  }

  const marketCardClass = marketFilter === "india" ? styles.marketCardIndia : marketFilter === "international" ? styles.marketCardInternational : marketFilter === "primary" ? styles.marketCardPrimary : styles.marketCardAll;

  const renderGroup = (title: string, lead: string, items: Source[], icon: React.ReactNode) => (
    <section className={`${styles.card} ${styles.marketCard} ${marketCardClass}`}>
      <div className={styles.libraryHead}><div><small>{lead}</small><h2>{title}</h2><p>{items.filter((item) => item.enabled).length} enabled · {items.length} shown</p></div>{icon}</div>
      <div className={styles.sourceList}>{items.length ? items.map((source) => (
        <div className={styles.sourceRow} data-market={sourceMarket(source)} key={source.key}>
          <div className={styles.sourceCopy}>
            <div className={styles.sourceTitle}><strong>{source.name}</strong><span className={styles.marketBadge}>{marketLabel(source)}</span>{!source.defaultEnabled && <span>Optional</span>}</div>
            <p>{source.description}</p>
            <small>{providerLabel(source.provider)} · {source.coverage}</small>
          </div>
          <button type="button" className={`${styles.switch} ${source.enabled ? styles.switchOn : ""}`} onClick={() => toggle(source)} disabled={busy.has(source.key)} aria-label={`${source.enabled ? "Disable" : "Enable"} ${source.name}`} aria-pressed={source.enabled}><span /></button>
        </div>
      )) : <div className={styles.empty}>No sources match this view.</div>}</div>
    </section>
  );

  const renderManualGroup = () => (
    <section className={`${styles.card} ${styles.manualSources} ${styles.marketCard} ${marketCardClass}`}>
      <div className={styles.libraryHead}><div><small>Open on demand · never scraped</small><h2>Manual search portals</h2><p>{visibleManual.length} shown</p></div><BookOpen /></div>
      <div className={styles.sourceList}>{visibleManual.length ? visibleManual.map((source) => (
        <div className={styles.sourceRow} data-market={sourceMarket(source)} key={source.key}>
          <div className={styles.sourceCopy}>
            <div className={styles.sourceTitle}><strong>{source.name}</strong><span className={styles.marketBadge}>{marketLabel(source)}</span><span>Manual</span></div>
            <p>{source.description}</p>
            <small>{source.coverage}</small>
          </div>
          <a className={styles.sourceLink} href={source.url} target="_blank" rel="noreferrer">Open board <ExternalLink /></a>
        </div>
      )) : <div className={styles.empty}>No manual portals match this search.</div>}</div>
    </section>
  );

  const enabledCount = marketSources.filter((item) => item.enabled).length;
  const marketCopy = MARKET_TABS[marketFilter];
  return <div className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Discovery sources</p><h1 className={instrumentSerif.className}>Choose where RoleLinked looks.</h1><p>Use public job boards and direct company ATS feeds. Each account controls its own source mix; existing saved roles stay in its private pipeline.</p></div><div className={styles.safety}><ShieldCheck /><span><strong>Public sources only</strong>No LinkedIn session scraping or credential sharing</span></div></header>
    {message && <p className={styles.message} aria-live="polite">{message}</p>}
    <section className={styles.marketScope} aria-labelledby="market-scope-title">
      <div className={styles.marketScopeIntro}><span><MapPinned /></span><div><small>Discovery market</small><h2 id="market-scope-title">US-first, without mixing regional feeds.</h2><p>India-only and other regional sources stay isolated until you choose that market. Global feeds remain in the primary US view.</p></div></div>
      <div className={styles.marketTabs}>
        {(Object.keys(MARKET_TABS) as MarketFilter[]).map((market) => {
          const copy = MARKET_TABS[market];
          return <button type="button" className={`${styles.marketTab} ${styles[`marketTab${market[0].toUpperCase()}${market.slice(1)}`]} ${marketFilter === market ? styles.marketTabActive : ""}`} onClick={() => setMarketFilter(market)} aria-pressed={marketFilter === market} key={market}>
            <span><small>{copy.eyebrow}</small><strong>{copy.label}</strong></span><b>{marketCounts[market]}</b><em>{copy.description}</em>
          </button>;
        })}
      </div>
    </section>
    <section className={styles.sourceToolbar} aria-label="Source catalog controls">
      <label className={styles.sourceSearch}><Search /><span className="sr-only">Search sources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search boards, regions, or providers" /></label>
      <div className={styles.sourceFilters}><SlidersHorizontal />{(["all", "enabled", "paused"] as const).map((value) => <button type="button" className={filter === value ? styles.activeFilter : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "All" : value === "enabled" ? "Enabled" : "Paused"}</button>)}</div>
      <div className={styles.sourceBulk}><button type="button" onClick={() => setVisible(true)}>Enable shown</button><button type="button" onClick={() => setVisible(false)}>Pause shown</button></div>
    </section>
    <div className={`${styles.sourceSummary} ${styles[`sourceSummary${marketFilter[0].toUpperCase()}${marketFilter.slice(1)}`]}`}><strong>{enabledCount} of {marketSources.length} automated sources enabled in {marketCopy.label}</strong><span>{marketFilter === "primary" ? "This is the default discovery market. India-only and other regional feeds are opt-in." : `${marketCopy.description} Changes here do not alter your US & global source selection.`}</span></div>
    <section className={`${styles.atsNetworks} ${marketCardClass}`}>
      <div className={styles.libraryHead}><div><small>Automated public APIs and feeds · {marketCopy.label}</small><h2>ATS networks</h2><p>Network switches apply only to the market selected above.</p></div><Network /></div>
      <div className={styles.atsNetworkGrid}>{atsNetworks.map((network) => {
        const allEnabled = network.enabled === network.boards.length;
        const networkBusy = network.boards.some((source) => busy.has(source.key));
        return <div className={styles.atsNetworkCard} key={network.provider}>
          <div><span>Automated</span><strong>{network.label}</strong><p>{network.description}</p><small>{network.enabled} of {network.boards.length} company boards enabled</small></div>
          <button type="button" className={`${styles.switch} ${allEnabled ? styles.switchOn : ""}`} onClick={() => setNetwork(network.provider, !allEnabled)} disabled={networkBusy} aria-label={`${allEnabled ? "Pause" : "Enable"} ${network.label} automated scanning`} aria-pressed={allEnabled}><span /></button>
        </div>;
      })}</div>
    </section>
    <div className={styles.sourceGroups}>{renderGroup("Public job boards", "Broad and specialty feeds", groups.boards, <Globe2 />)}{renderGroup("Company career sites", "Boards scanned through the ATS networks above", groups.companies, <Building2 />)}{filter === "all" && renderManualGroup()}</div>
    <div className={styles.safety} style={{ marginTop: "1rem" }}><Radar /><span><strong>Preferences still decide what survives</strong>Role, location, compensation, and sponsorship filters apply after source collection.</span></div>
  </div>;
}
