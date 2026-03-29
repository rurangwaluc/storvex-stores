// src/pages/reports/Reports.jsx

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

import PageSkeleton from "../../components/ui/PageSkeleton";
import CardSkeleton from "../../components/ui/CardSkeleton";
import ListSkeleton from "../../components/ui/ListSkeleton";

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function isoDateLocal(d = new Date()) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekSunday(d) {
  const s = startOfWeekMonday(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(0, 0, 0, 0);
  return e;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 1);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - 1);
  return x;
}

function startOfYear(d) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Card({ title, value, hint, tone = "neutral" }) {
  const bar =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-rose-500"
      : "bg-slate-500";

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{value}</p>
          {hint ? <p className="text-xs text-slate-500 mt-2">{hint}</p> : null}
        </div>
        <div className={`h-10 w-1 rounded-full ${bar}`} />
      </div>
    </div>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function pctFmt(x) {
  if (x == null) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

// ----------------------
// WhatsApp helpers
// ----------------------
function normalizeRwPhoneTo250Digits(phone) {
  const raw = String(phone || "").trim().replace(/[^\d]/g, "");
  if (!raw) return null;

  if (raw.startsWith("07") && raw.length === 10) return `250${raw.slice(1)}`;
  if (/^2507\d{8}$/.test(raw)) return raw;
  if (raw.startsWith("2507") && raw.length === 12) return raw;

  return null;
}

function buildWaMeLink(phoneDigits250, message) {
  const msg = encodeURIComponent(String(message || ""));
  return `https://wa.me/${phoneDigits250}?text=${msg}`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function buildCollectionMessage({ customerName, overdueAmountRwf, storeName }) {
  const name = customerName ? String(customerName).trim() : "there";
  const amount = formatMoney(overdueAmountRwf);
  const store = String(storeName || "").trim() || "your store";

  return [
    `Hello ${name},`,
    "",
    `This is ${store} following up on your outstanding balance of ${amount}.`,
    `Please send payment today or tell us when you will pay.`,
    "",
    `Thank you.`,
  ].join("\n");
}

// ----------------------
// Top sellers helpers
// ----------------------
function sellerUnits(s) {
  // accept multiple possible keys safely
  const n =
    s?.qty ??
    s?.unitsSold ??
    s?.units ??
    s?.count ??
    s?.soldQty ??
    null;

  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function sellerRevenue(s) {
  const n = s?.revenue ?? s?.totalRevenue ?? s?.amount ?? null;
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

function sellerName(s) {
  return (
    s?.name ||
    s?.productName ||
    s?.title ||
    s?.sku ||
    "Unnamed product"
  );
}

function TopSellersSkeleton({ rows = 8 }) {
  return (
    <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-4 w-56 bg-stone-100 rounded animate-pulse" />
            <div className="mt-2 h-3 w-32 bg-stone-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-6 w-16 bg-stone-100 rounded animate-pulse" />
            <div className="h-6 w-24 bg-stone-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const todayISO = useMemo(() => isoDateLocal(new Date()), []);
  const [tab, setTab] = useState("DAILY"); // DAILY | PERIOD

  const [tenantName, setTenantName] = useState("your store");
  const [pageLoading, setPageLoading] = useState(true);

  // Daily
  const [dailyDate, setDailyDate] = useState(todayISO);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [daily, setDaily] = useState(null);
  const [dailyInsights, setDailyInsights] = useState(null);

  // Period
  const [preset, setPreset] = useState("THIS_WEEK");
  const [customFrom, setCustomFrom] = useState(todayISO);
  const [customTo, setCustomTo] = useState(todayISO);

  const [periodLoading, setPeriodLoading] = useState(false);
  const [period, setPeriod] = useState(null);
  const [periodRange, setPeriodRange] = useState(null);

  const [topLoading, setTopLoading] = useState(false);
  const [top, setTop] = useState([]);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await apiFetch("/auth/me");
        const name = me?.tenant?.name || me?.tenantName || null;
        if (!cancelled && name) setTenantName(String(name));
      } catch (e) {
        console.error("Failed to load tenant name:", e);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function computeRangeFromPreset(p) {
    const now = new Date();

    if (p === "THIS_WEEK") {
      const s = startOfWeekMonday(now);
      const e = endOfWeekSunday(now);
      return { from: isoDateLocal(s), to: isoDateLocal(e), label: "This week" };
    }
    if (p === "LAST_WEEK") {
      const s = startOfWeekMonday(now);
      s.setDate(s.getDate() - 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return { from: isoDateLocal(s), to: isoDateLocal(e), label: "Last week" };
    }
    if (p === "THIS_MONTH") {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      return { from: isoDateLocal(s), to: isoDateLocal(e), label: "This month" };
    }
    if (p === "LAST_MONTH") {
      const x = new Date(now);
      x.setMonth(x.getMonth() - 1);
      const s = startOfMonth(x);
      const e = endOfMonth(x);
      return { from: isoDateLocal(s), to: isoDateLocal(e), label: "Last month" };
    }
    if (p === "THIS_YEAR") {
      const s = startOfYear(now);
      return { from: isoDateLocal(s), to: isoDateLocal(now), label: "This year (to date)" };
    }

    return { from: customFrom, to: customTo, label: "Custom" };
  }

  async function loadDaily(dISO) {
    setDailyLoading(true);

    try {
      const res = await getDailyClose(dISO);
      setDaily(res);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load daily close");
      setDaily(null);
    } finally {
      setDailyLoading(false);
    }

    setInsightsLoading(true);
    try {
      const ins = await getInsights({ from: dISO, to: dISO }, 10, 5);
      setDailyInsights(ins);
    } catch (e) {
      console.error(e);
      setDailyInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function loadPeriod() {
    const r = computeRangeFromPreset(preset);
    if (!r.from || !r.to) return toast.error("Pick a valid range");
    if (new Date(r.from) > new Date(r.to)) return toast.error("Range invalid: from is after to");

    setPeriodLoading(true);
    setTopLoading(true);
    setInsightsLoading(true);

    try {
      const [dash, tops, ins] = await Promise.all([
        getReportsDashboard({ from: r.from, to: r.to }),
        getTopSellers({ from: r.from, to: r.to }, 10),
        getInsights({ from: r.from, to: r.to }, 10, 5),
      ]);

      setPeriod(dash);
      setTop(Array.isArray(tops?.topSellers) ? tops.topSellers : []);
      setInsights(ins || null);
      setPeriodRange(r);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load period report");
      setPeriod(null);
      setTop([]);
      setInsights(null);
      setPeriodRange(r);
    } finally {
      setPeriodLoading(false);
      setTopLoading(false);
      setInsightsLoading(false);
    }
  }

  async function exportDailyPdf() {
    try {
      const blob = await downloadDailyClosePdf(dailyDate);
      downloadBlob(blob, `storvex-daily-close-${dailyDate}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    }
  }

  async function exportPeriodPdf() {
    const r = computeRangeFromPreset(preset);
    if (!r.from || !r.to) return toast.error("Pick a valid range");
    if (new Date(r.from) > new Date(r.to)) return toast.error("Range invalid: from is after to");

    try {
      const blob = await downloadPeriodPdf({ from: r.from, to: r.to }, 10);
      downloadBlob(blob, `storvex-period-${r.from}-to-${r.to}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    }
  }

  async function whatsappCollect(c) {
    const phoneDigits = normalizeRwPhoneTo250Digits(c?.phone);
    if (!phoneDigits) {
      toast.error("Customer phone invalid for WhatsApp");
      return;
    }

    const msg = buildCollectionMessage({
      customerName: c?.name,
      overdueAmountRwf: c?.overdueAmount,
      storeName: tenantName,
    });

    const url = buildWaMeLink(phoneDigits, msg);
    window.open(url, "_blank", "noopener,noreferrer");

    const ok = await copyToClipboard(msg);
    if (ok) toast.success("WhatsApp opened. Message copied too.");
    else toast.success("WhatsApp opened.");
  }

  async function copyCollectMessage(c) {
    const msg = buildCollectionMessage({
      customerName: c?.name,
      overdueAmountRwf: c?.overdueAmount,
      storeName: tenantName,
    });

    const ok = await copyToClipboard(msg);
    if (ok) toast.success("Message copied");
    else toast.error("Failed to copy");
  }

  useEffect(() => {
    (async () => {
      await loadDaily(dailyDate);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "PERIOD" && !period && !periodLoading) {
      loadPeriod();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const profitTone = (x) => (x > 0 ? "success" : x < 0 ? "danger" : "neutral");

  if (pageLoading) {
    return <PageSkeleton titleWidth="w-40" lines={2} showTable={false} />;
  }

  const dailyHeaderBusy = dailyLoading || insightsLoading;
  const periodHeaderBusy = periodLoading || insightsLoading || topLoading;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-600 mt-1">Numbers + Actions + Trend.</p>
          <p className="text-xs text-slate-500 mt-1">
            Store: <span className="font-medium">{tenantName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("DAILY")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium border",
              tab === "DAILY"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-900 border-stone-300 hover:bg-stone-50",
            ].join(" ")}
          >
            Daily
          </button>

          <button
            onClick={() => setTab("PERIOD")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium border",
              tab === "PERIOD"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-900 border-stone-300 hover:bg-stone-50",
            ].join(" ")}
          >
            Week / Month / Year
          </button>
        </div>
      </div>

      {/* DAILY */}
      {tab === "DAILY" ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <label className="text-xs text-slate-600">Date</label>
              <input
                type="date"
                className="block rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => loadDaily(dailyDate)}
                disabled={dailyHeaderBusy}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {dailyHeaderBusy ? "Loading…" : "Refresh"}
              </button>

              <button
                onClick={exportDailyPdf}
                disabled={dailyLoading}
                className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Export PDF
              </button>
            </div>
          </div>

          {dailyLoading ? (
            <CardSkeleton count={3} />
          ) : !daily ? (
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
              <p className="text-slate-600">No data.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Cash collected" value={formatMoney(daily.cashCollectedToday)} tone="success" />
                <Card title="Revenue" value={formatMoney(daily.sales?.revenueToday || 0)} />
                <Card
                  title="Profit estimate"
                  value={formatMoney(daily.profitEstimateToday || 0)}
                  tone={profitTone(daily.profitEstimateToday || 0)}
                />
              </div>

              <Section
                title="Owner actions"
                right={insightsLoading ? <span className="text-xs text-slate-500">Loading…</span> : null}
              >
                {!dailyInsights ? (
                  <p className="text-sm text-slate-500">No insights.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                        <div className="font-semibold text-slate-900">Trend</div>
                        <div className="mt-2 text-slate-700">
                          Revenue: <b>{pctFmt(dailyInsights.comparison?.percent?.revenue)}</b>
                        </div>
                        <div className="text-slate-700">
                          Profit: <b>{pctFmt(dailyInsights.comparison?.percent?.profit)}</b>
                        </div>
                      </div>

                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                        <div className="font-semibold text-slate-900">Reorder</div>
                        <div className="mt-2 text-slate-700">
                          {dailyInsights.reorderSuggestions?.items?.length || 0} product(s) low stock
                        </div>
                      </div>

                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                        <div className="font-semibold text-slate-900">Collect</div>
                        <div className="mt-2 text-slate-700">
                          {dailyInsights.collections?.items?.length || 0} overdue customer(s)
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-semibold text-slate-900">Collect now</div>

                      {!dailyInsights.collections?.items?.length ? (
                        <p className="text-sm text-slate-500 mt-2">No overdue customers.</p>
                      ) : (
                        <div className="mt-2 divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden">
                          {dailyInsights.collections.items.slice(0, 5).map((c) => (
                            <div key={c.customerId} className="p-3 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-slate-900">{c.name}</div>
                                <div className="text-xs text-slate-600">
                                  {c.phone} • {c.overdueSalesCount} sale(s)
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-rose-700">
                                  {formatMoney(c.overdueAmount)}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => whatsappCollect(c)}
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-medium"
                                >
                                  WhatsApp
                                </button>

                                <button
                                  type="button"
                                  onClick={() => copyCollectMessage(c)}
                                  className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-xs font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Section>
            </>
          )}
        </>
      ) : null}

      {/* PERIOD */}
      {tab === "PERIOD" ? (
        <>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Preset</label>
                <select
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                >
                  <option value="THIS_WEEK">This week</option>
                  <option value="LAST_WEEK">Last week</option>
                  <option value="THIS_MONTH">This month</option>
                  <option value="LAST_MONTH">Last month</option>
                  <option value="THIS_YEAR">This year (to date)</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              {preset === "CUSTOM" ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700">From</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">To</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={loadPeriod}
                disabled={periodHeaderBusy}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {periodHeaderBusy ? "Loading…" : "Load report"}
              </button>

              <button
                onClick={exportPeriodPdf}
                disabled={periodLoading}
                className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Export PDF
              </button>
            </div>

            {periodRange ? (
              <div className="mt-3 text-xs text-slate-500">
                Range: <b>{periodRange.from}</b> → <b>{periodRange.to}</b> ({periodRange.label})
              </div>
            ) : null}
          </div>

          {periodLoading ? (
            <CardSkeleton count={3} />
          ) : !period ? (
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
              <p className="text-slate-600">No data.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Revenue" value={formatMoney(period.sales?.total || 0)} />
                <Card title="Approved expenses" value={formatMoney(period.expenses?.approvedTotal || 0)} />
                <Card
                  title="Profit estimate"
                  value={formatMoney(period.profitEstimate || 0)}
                  tone={profitTone(period.profitEstimate || 0)}
                />
              </div>

              {/* ✅ TOP SELLERS */}
              <Section
                title="Top sellers"
                right={topLoading ? <span className="text-xs text-slate-500">Loading…</span> : null}
              >
                {topLoading ? (
                  <TopSellersSkeleton rows={8} />
                ) : !Array.isArray(top) || top.length === 0 ? (
                  <p className="text-sm text-slate-500">No top sellers in this range.</p>
                ) : (
                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden">
                    {top.map((s, idx) => {
                      const name = sellerName(s);
                      const units = sellerUnits(s);
                      const rev = sellerRevenue(s);

                      return (
                        <div key={s?.productId || s?.id || `${name}-${idx}`} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
                            <div className="text-xs text-slate-600">
                              Rank #{idx + 1}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-2.5 py-1 text-xs border border-stone-200">
                              {units} sold
                            </span>

                            {rev != null ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-1 text-xs border border-emerald-100">
                                {formatMoney(rev)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-stone-100 text-stone-700 px-2.5 py-1 text-xs border border-stone-200">
                                Revenue —
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              <Section
                title="Collect now (Overdue customers)"
                right={insightsLoading ? <span className="text-xs text-slate-500">Loading…</span> : null}
              >
                {insightsLoading ? (
                  <ListSkeleton rows={6} />
                ) : !insights?.collections?.items?.length ? (
                  <p className="text-sm text-slate-500">No overdue customers.</p>
                ) : (
                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden">
                    {insights.collections.items.map((c) => (
                      <div key={c.customerId} className="p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-600">
                            {c.phone} • {c.overdueSalesCount} sale(s)
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-rose-700">
                            {formatMoney(c.overdueAmount)}
                          </div>

                          <button
                            type="button"
                            onClick={() => whatsappCollect(c)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-medium"
                          >
                            WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => copyCollectMessage(c)}
                            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-xs font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}