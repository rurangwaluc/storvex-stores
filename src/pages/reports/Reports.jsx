// src/pages/reports/Reports.jsx
// ─────────────────────────────────────────────────────────────────────────────
// All business logic preserved exactly. Only the UI layer has been rebuilt to
// use the Storvex design system (var(--color-*) tokens, AsyncButton, inline
// pulse skeletons, app-input, mobile-first responsive layout).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  getDailyClose,
  getReportsDashboard,
  getTopSellers,
  getInsights,
  downloadDailyClosePdf,
  downloadPeriodPdf,
} from "../../services/reportsApi";
import { apiFetch } from "../../services/apiClient";
import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { cn } from "../../lib/cn";

// ─── formatters ───────────────────────────────────────────────────────────────
const fmt = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function isoDateLocal(d = new Date()) {
  const x = new Date(d);
  return [
    x.getFullYear(),
    String(x.getMonth() + 1).padStart(2, "0"),
    String(x.getDate()).padStart(2, "0"),
  ].join("-");
}
function pctFmt(x) {
  if (x == null) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// ─── date helpers (unchanged) ─────────────────────────────────────────────────
function startOfWeekMonday(d) {
  const x = new Date(d); const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1)); x.setHours(0,0,0,0); return x;
}
function endOfWeekSunday(d) {
  const s = startOfWeekMonday(d); const e = new Date(s); e.setDate(e.getDate() + 6); return e;
}
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d)   { const x = new Date(d); x.setMonth(x.getMonth()+1,1); x.setHours(0,0,0,0); x.setDate(x.getDate()-1); return x; }
function startOfYear(d)  { const x = new Date(d); x.setMonth(0,1); x.setHours(0,0,0,0); return x; }

// ─── WhatsApp helpers (unchanged) ─────────────────────────────────────────────
function normalizeRwPhoneTo250Digits(phone) {
  const raw = String(phone || "").trim().replace(/\D/g, "");
  if (!raw) return null;
  if (raw.startsWith("07") && raw.length === 10) return `250${raw.slice(1)}`;
  if (/^2507\d{8}$/.test(raw)) return raw;
  if (raw.startsWith("2507") && raw.length === 12) return raw;
  return null;
}
function buildWaMeLink(phoneDigits250, message) {
  return `https://wa.me/${phoneDigits250}?text=${encodeURIComponent(String(message || ""))}`;
}
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
function buildCollectionMessage({ customerName, overdueAmountRwf, storeName }) {
  const name  = customerName ? String(customerName).trim() : "there";
  const store = String(storeName || "").trim() || "your store";
  return [
    `Hello ${name},`, "",
    `This is ${store} following up on your outstanding balance of ${fmt(overdueAmountRwf)}.`,
    "Please send payment today or tell us when you will pay.", "", "Thank you.",
  ].join("\n");
}

// ─── Top sellers helpers (unchanged) ─────────────────────────────────────────
function sellerUnits(s)   { const n = s?.qty ?? s?.unitsSold ?? s?.units ?? s?.count ?? null; const x = Number(n); return Number.isFinite(x) ? x : 0; }
function sellerRevenue(s) { const n = s?.revenue ?? s?.totalRevenue ?? s?.amount ?? null; const x = Number(n); return n != null && Number.isFinite(x) ? x : null; }
function sellerName(s)    { return s?.name || s?.productName || s?.title || s?.sku || "Unnamed product"; }

// ─── PDF download helper ──────────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ─── Design token shorthands ──────────────────────────────────────────────────
const S  = () => "text-[var(--color-text)]";
const M  = () => "text-[var(--color-text-muted)]";
const CARD  = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const PANEL = () => "rounded-[22px] bg-[var(--color-surface-2)]";

// ─── Inline pulse skeletons ───────────────────────────────────────────────────
// (replaces the broken CardSkeleton / ListSkeleton imports that used stale tokens)
function Pulse({ className = "" }) {
  return <div className={cn("animate-pulse rounded-full bg-[var(--color-surface-2)]", className)} />;
}
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[0,1,2].map(i => (
        <div key={i} className={cn(CARD(), "p-5 space-y-3")}>
          <Pulse className="h-3 w-20" /><Pulse className="h-8 w-32" /><Pulse className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(PANEL(), "flex items-center justify-between gap-3 p-3")}>
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-3.5 w-44" /><Pulse className="h-3 w-28" />
          </div>
          <div className="flex gap-2 shrink-0">
            <Pulse className="h-8 w-16 rounded-2xl" /><Pulse className="h-8 w-20 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared atom components ───────────────────────────────────────────────────
const TONE_BAR = { success:"bg-emerald-500", warning:"bg-amber-500", danger:"bg-[var(--color-danger)]", info:"bg-[var(--color-primary)]", neutral:"bg-[var(--color-text-muted)]" };

function KpiCard({ title, value, hint, tone = "neutral" }) {
  return (
    <div className={cn(CARD(), "relative overflow-hidden p-5")}>
      <div className={cn("absolute left-0 top-0 h-full w-1.5", TONE_BAR[tone] || TONE_BAR.neutral)} />
      <div className="pl-2">
        <div className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", M())}>{title}</div>
        <div className={cn("mt-2 text-2xl font-black tracking-tight", S())}>{value}</div>
        {hint && <div className={cn("mt-1.5 text-sm", M())}>{hint}</div>}
      </div>
    </div>
  );
}

function Section({ title, busy = false, children }) {
  return (
    <div className={cn(CARD(), "p-5 sm:p-6")}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className={cn("text-base font-black tracking-tight", S())}>{title}</div>
        {busy && <span className={cn("text-xs", M())}>Loading…</span>}
      </div>
      {children}
    </div>
  );
}

function InsightPanel({ label, value, sub }) {
  return (
    <div className={cn(PANEL(), "p-4")}>
      <div className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", M())}>{label}</div>
      <div className={cn("mt-2 text-base font-bold", S())}>{value}</div>
      {sub && <div className={cn("mt-1 text-xs leading-5", M())}>{sub}</div>}
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const cls = {
    success: "bg-[#7cfcc6] text-[#0b3b2e]",
    danger:  "bg-[rgba(219,80,74,0.14)] text-[var(--color-danger)]",
    neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
    info:    "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  }[tone] || "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{children}</span>;
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition",
        active ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >{children}</button>
  );
}

// ─── CollectRow ───────────────────────────────────────────────────────────────
function CollectRow({ c, tenantName }) {
  const [copying, setCopying] = useState(false);

  async function onWhatsApp() {
    const digits = normalizeRwPhoneTo250Digits(c?.phone);
    if (!digits) { toast.error("Phone invalid for WhatsApp"); return; }
    const msg = buildCollectionMessage({ customerName: c.name, overdueAmountRwf: c.overdueAmount, storeName: tenantName });
    window.open(buildWaMeLink(digits, msg), "_blank", "noopener,noreferrer");
    const ok = await copyToClipboard(msg);
    if (ok) toast.success("WhatsApp opened · message copied");
  }

  async function onCopy() {
    setCopying(true);
    const msg = buildCollectionMessage({ customerName: c.name, overdueAmountRwf: c.overdueAmount, storeName: tenantName });
    const ok = await copyToClipboard(msg);
    toast[ok ? "success" : "error"](ok ? "Message copied" : "Failed to copy");
    setCopying(false);
  }

  return (
    <div className={cn(PANEL(), "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between")}>
      <div className="min-w-0">
        <div className={cn("text-sm font-bold truncate", S())}>{c.name}</div>
        <div className={cn("text-xs mt-0.5", M())}>{c.phone} · {c.overdueSalesCount} sale(s)</div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[var(--color-danger)]">{fmt(c.overdueAmount)}</span>
        {/* AsyncButton for WhatsApp action */}
        <AsyncButton loading={false} loadingText="" variant="primary" onClick={onWhatsApp}
          className="h-8 rounded-2xl px-3 text-xs">WhatsApp</AsyncButton>
        {/* AsyncButton for copy action */}
        <AsyncButton loading={copying} loadingText="Copying…" variant="secondary" onClick={onCopy}
          className="h-8 rounded-2xl px-3 text-xs">Copy</AsyncButton>
      </div>
    </div>
  );
}

// ─── TopSellerRow ─────────────────────────────────────────────────────────────
function TopSellerRow({ s, rank }) {
  const rev = sellerRevenue(s);
  return (
    <div className={cn(PANEL(), "flex items-center justify-between gap-3 p-3")}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
          rank === 1 ? "bg-amber-400 text-amber-900" : rank === 2 ? "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]" : rank === 3 ? "bg-amber-700/20 text-amber-800" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
        )}>{rank}</span>
        <div className={cn("truncate text-sm font-bold", S())}>{sellerName(s)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Pill tone="neutral">{sellerUnits(s)} sold</Pill>
        {rev != null ? <Pill tone="success">{fmt(rev)}</Pill> : <Pill tone="neutral">—</Pill>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reports() {
  const todayISO = useMemo(() => isoDateLocal(), []);

  const [tab, setTab]               = useState("DAILY");
  const [tenantName, setTenantName] = useState("your store");
  const [pageLoading, setPageLoading] = useState(true);

  // Daily state
  const [dailyDate, setDailyDate]     = useState(todayISO);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [daily, setDaily]             = useState(null);
  const [dailyInsights, setDailyInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Period state
  const [preset, setPreset]           = useState("THIS_WEEK");
  const [customFrom, setCustomFrom]   = useState(todayISO);
  const [customTo, setCustomTo]       = useState(todayISO);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [period, setPeriod]           = useState(null);
  const [periodRange, setPeriodRange] = useState(null);
  const [topLoading, setTopLoading]   = useState(false);
  const [top, setTop]                 = useState([]);
  const [insights, setInsights]       = useState(null);

  // Export state
  const [exportingDaily,  setExportingDaily]  = useState(false);
  const [exportingPeriod, setExportingPeriod] = useState(false);

  // Load tenant name
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch("/auth/me");
        const n = me?.tenant?.name || me?.tenantName;
        if (!cancelled && n) setTenantName(String(n));
      } catch(e) { console.error(e); }
      finally { if (!cancelled) setPageLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  function computeRangeFromPreset(p) {
    const now = new Date();
    if (p === "THIS_WEEK")  return { from: isoDateLocal(startOfWeekMonday(now)), to: isoDateLocal(endOfWeekSunday(now)),  label: "This week" };
    if (p === "LAST_WEEK")  { const s = startOfWeekMonday(now); s.setDate(s.getDate()-7); const e=new Date(s); e.setDate(e.getDate()+6); return { from: isoDateLocal(s), to: isoDateLocal(e), label: "Last week" }; }
    if (p === "THIS_MONTH") return { from: isoDateLocal(startOfMonth(now)), to: isoDateLocal(endOfMonth(now)), label: "This month" };
    if (p === "LAST_MONTH") { const x=new Date(now); x.setMonth(x.getMonth()-1); return { from: isoDateLocal(startOfMonth(x)), to: isoDateLocal(endOfMonth(x)), label: "Last month" }; }
    if (p === "THIS_YEAR")  return { from: isoDateLocal(startOfYear(now)), to: isoDateLocal(now), label: "This year (to date)" };
    return { from: customFrom, to: customTo, label: "Custom" };
  }

  async function loadDaily(dISO) {
    setDailyLoading(true); setInsightsLoading(true);
    try {
      const [res, ins] = await Promise.all([
        getDailyClose(dISO),
        getInsights({ from: dISO, to: dISO }, 10, 5),
      ]);
      setDaily(res); setDailyInsights(ins);
    } catch(e) {
      console.error(e); toast.error(e?.message || "Failed to load daily report");
      setDaily(null); setDailyInsights(null);
    } finally {
      setDailyLoading(false); setInsightsLoading(false);
    }
  }

  async function loadPeriod() {
    const r = computeRangeFromPreset(preset);
    if (!r.from || !r.to) return toast.error("Pick a valid range");
    if (new Date(r.from) > new Date(r.to)) return toast.error("From is after To");
    setPeriodLoading(true); setTopLoading(true); setInsightsLoading(true);
    try {
      const [dash, tops, ins] = await Promise.all([
        getReportsDashboard({ from: r.from, to: r.to }),
        getTopSellers({ from: r.from, to: r.to }, 10),
        getInsights({ from: r.from, to: r.to }, 10, 5),
      ]);
      setPeriod(dash); setTop(Array.isArray(tops?.topSellers) ? tops.topSellers : []); setInsights(ins || null); setPeriodRange(r);
    } catch(e) {
      console.error(e); toast.error(e?.message || "Failed to load period report");
      setPeriod(null); setTop([]); setInsights(null); setPeriodRange(r);
    } finally {
      setPeriodLoading(false); setTopLoading(false); setInsightsLoading(false);
    }
  }

  async function exportDailyPdf() {
    setExportingDaily(true);
    try { downloadBlob(await downloadDailyClosePdf(dailyDate), `daily-close-${dailyDate}.pdf`); }
    catch(e) { console.error(e); toast.error("Failed to export PDF"); }
    finally { setExportingDaily(false); }
  }

  async function exportPeriodPdf() {
    const r = computeRangeFromPreset(preset);
    if (!r.from || !r.to) return toast.error("Pick a valid range");
    if (new Date(r.from) > new Date(r.to)) return toast.error("From is after To");
    setExportingPeriod(true);
    try { downloadBlob(await downloadPeriodPdf({ from: r.from, to: r.to }, 10), `period-${r.from}-to-${r.to}.pdf`); }
    catch(e) { console.error(e); toast.error("Failed to export PDF"); }
    finally { setExportingPeriod(false); }
  }

  // Load on mount; lazy-load period on first tab switch
  useEffect(() => { void loadDaily(dailyDate); }, []); // eslint-disable-line
  useEffect(() => { if (tab === "PERIOD" && !period && !periodLoading) loadPeriod(); }, [tab]); // eslint-disable-line

  const profitTone = (x) => (Number(x || 0) > 0 ? "success" : Number(x || 0) < 0 ? "danger" : "neutral");
  const dailyBusy  = dailyLoading || insightsLoading;
  const periodBusy = periodLoading || topLoading || insightsLoading;

  if (pageLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className={cn(CARD(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", M())}>Analytics</div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", S())}>Reports</h1>
              <p className={cn("mt-2 text-sm leading-6", M())}>
                Daily close · Period insights · Top sellers · Overdue collection
                {" · "}<span className={cn("font-semibold", S())}>{tenantName}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <TabBtn active={tab === "DAILY"}  onClick={() => setTab("DAILY")}>Daily</TabBtn>
              <TabBtn active={tab === "PERIOD"} onClick={() => setTab("PERIOD")}>Period</TabBtn>
            </div>
          </div>
        </div>
      </div>

      {/* ── DAILY TAB ── */}
      {tab === "DAILY" && (
        <div className="space-y-5">
          {/* Controls — AsyncButton for Refresh and Export PDF */}
          <div className={cn(CARD(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label className={cn("mb-1.5 block text-sm font-medium", S())}>Date</label>
                {/* app-input class for consistent dark/light styling */}
                <input type="date" className="app-input w-52" value={dailyDate}
                  onChange={e => { setDailyDate(e.target.value); }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {/* AsyncButton shows spinner + "Loading…" while busy */}
                <AsyncButton loading={dailyBusy} loadingText="Loading…"
                  variant="primary" onClick={() => loadDaily(dailyDate)}>Refresh</AsyncButton>
                <AsyncButton loading={exportingDaily} loadingText="Exporting…"
                  variant="secondary" onClick={exportDailyPdf} disabled={dailyLoading}>Export PDF</AsyncButton>
              </div>
            </div>
          </div>

          {/* KPI cards — pulse skeleton while dailyLoading */}
          {dailyLoading ? <KpiSkeleton /> : !daily ? (
            <div className={cn(CARD(), "px-5 py-10 text-center")}>
              <div className={cn("text-sm", M())}>No data for this date.</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard title="Cash collected"  value={fmt(daily.cashCollectedToday)}       tone="success" />
                <KpiCard title="Revenue"          value={fmt(daily.sales?.revenueToday || 0)} tone="info" />
                <KpiCard title="Profit estimate"  value={fmt(daily.profitEstimateToday || 0)} tone={profitTone(daily.profitEstimateToday)} />
              </div>

              <Section title="Daily insights" busy={insightsLoading}>
                {insightsLoading ? <RowSkeleton rows={3} /> : !dailyInsights ? (
                  <div className={cn("text-sm", M())}>No insights available.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <InsightPanel label="vs Yesterday"
                        value={pctFmt(dailyInsights.comparison?.percent?.revenue)}
                        sub={`Profit: ${pctFmt(dailyInsights.comparison?.percent?.profit)}`} />
                      <InsightPanel label="Low stock"
                        value={`${dailyInsights.reorderSuggestions?.items?.length || 0} product(s)`}
                        sub="Need restocking" />
                      <InsightPanel label="Overdue"
                        value={`${dailyInsights.collections?.items?.length || 0} customer(s)`}
                        sub="With outstanding balance" />
                    </div>
                    {dailyInsights.collections?.items?.length > 0 && (
                      <div>
                        <div className={cn("mb-2 text-sm font-bold", S())}>Collect now</div>
                        <div className="space-y-2">
                          {dailyInsights.collections.items.slice(0, 5).map(c => (
                            <CollectRow key={c.customerId} c={c} tenantName={tenantName} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      )}

      {/* ── PERIOD TAB ── */}
      {tab === "PERIOD" && (
        <div className="space-y-5">
          {/* Range controls */}
          <div className={cn(CARD(), "p-5 sm:p-6")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={cn("mb-1.5 block text-sm font-medium", S())}>Preset range</label>
                <select className="app-input" value={preset} onChange={e => setPreset(e.target.value)}>
                  <option value="THIS_WEEK">This week</option>
                  <option value="LAST_WEEK">Last week</option>
                  <option value="THIS_MONTH">This month</option>
                  <option value="LAST_MONTH">Last month</option>
                  <option value="THIS_YEAR">This year (to date)</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              {preset === "CUSTOM" && (
                <>
                  <div>
                    <label className={cn("mb-1.5 block text-sm font-medium", S())}>From</label>
                    <input type="date" className="app-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className={cn("mb-1.5 block text-sm font-medium", S())}>To</label>
                    <input type="date" className="app-input" value={customTo}   onChange={e => setCustomTo(e.target.value)} />
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* AsyncButton — shows spinner while loading period */}
              <AsyncButton loading={periodBusy} loadingText="Loading…" variant="primary" onClick={loadPeriod}>
                Load report
              </AsyncButton>
              <AsyncButton loading={exportingPeriod} loadingText="Exporting…" variant="secondary"
                onClick={exportPeriodPdf} disabled={periodLoading}>Export PDF</AsyncButton>
              {periodRange && (
                <span className={cn("text-xs", M())}>{periodRange.from} → {periodRange.to} · {periodRange.label}</span>
              )}
            </div>
          </div>

          {/* Period KPIs */}
          {periodLoading ? <KpiSkeleton /> : !period ? (
            <div className={cn(CARD(), "px-5 py-10 text-center")}>
              <div className={cn("text-sm", M())}>Click "Load report" to view period data.</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard title="Revenue"           value={fmt(period.sales?.total || 0)}            tone="info" />
                <KpiCard title="Approved expenses" value={fmt(period.expenses?.approvedTotal || 0)} tone="warning" />
                <KpiCard title="Profit estimate"   value={fmt(period.profitEstimate || 0)}          tone={profitTone(period.profitEstimate)} />
              </div>

              {/* Top sellers — RowSkeleton while topLoading */}
              <Section title="Top sellers" busy={topLoading}>
                {topLoading ? <RowSkeleton rows={8} /> : !top.length ? (
                  <div className={cn("text-sm", M())}>No top sellers in this range.</div>
                ) : (
                  <div className="space-y-2">
                    {top.map((s, i) => <TopSellerRow key={s?.productId || s?.id || i} s={s} rank={i+1} />)}
                  </div>
                )}
              </Section>

              {/* Overdue collection */}
              <Section title="Collect now — overdue customers" busy={insightsLoading}>
                {insightsLoading ? <RowSkeleton rows={5} /> : !insights?.collections?.items?.length ? (
                  <div className={cn("text-sm", M())}>No overdue customers in this range.</div>
                ) : (
                  <div className="space-y-2">
                    {insights.collections.items.map(c => (
                      <CollectRow key={c.customerId} c={c} tenantName={tenantName} />
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}