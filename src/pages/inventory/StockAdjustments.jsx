import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { downloadStockAdjustmentsExcel, listAllStockAdjustments } from "../../services/inventoryApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

const PAGE_SIZE = 10;

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function toISODate(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function labelType(t) {
  if (t === "RESTOCK") return "Restock";
  if (t === "LOSS") return "Loss / Damage";
  if (t === "CORRECTION") return "Correction";
  return String(t || "—");
}

function formatDelta(n) {
  const x = Number(n || 0);
  if (x > 0) return `+${x}`;
  return String(x);
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:opacity-60";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60";
}

function StatusBadge({ kind = "neutral", children }) {
  const cls =
    kind === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : kind === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : kind === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h1 className={cx("mt-3 text-[1.7rem] font-black tracking-tight sm:text-[2rem]", strongText())}>
        {title}
      </h1>
      {subtitle ? <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function StatCard({ label, value, note, tone = "neutral" }) {
  const iconTone =
    tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : tone === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[#dff1ff] text-[#4aa8ff]";

  return (
    <article className={cx(pageCard(), "p-5 sm:p-6")}>
      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className={cx(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] shadow-[var(--shadow-soft)]",
            iconTone
          )}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M5 19V9M12 19V5M19 19v-8" strokeLinecap="round" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className={cx("text-sm font-semibold", strongText())}>{label}</div>
          <div className={cx("mt-2 text-[1.7rem] font-black leading-tight tracking-[-0.02em]", strongText())}>
            {value}
          </div>
          {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
        </div>
      </div>
    </article>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function StockHistorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-4 w-36" />
            </div>
            <SkeletonBlock className="h-8 w-24 rounded-full" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>

          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryCard({ row, index }) {
  const delta = Number(row.delta || 0);
  const striped = index % 2 === 1;

  return (
    <div
      className={cx(
        pageCard(),
        "relative overflow-hidden border p-4 sm:p-5",
        striped
          ? "border-[rgba(74,163,255,0.12)] bg-[linear-gradient(180deg,rgba(74,163,255,0.035),rgba(74,163,255,0.01))]"
          : "border-[var(--color-border)]"
      )}
    >
      <div
        className={cx(
          "absolute left-0 top-0 h-full w-1.5",
          row.type === "RESTOCK"
            ? "bg-[#16a34a]"
            : row.type === "LOSS"
            ? "bg-[var(--color-danger)]"
            : row.type === "CORRECTION"
            ? "bg-[#d9a700]"
            : "bg-[var(--color-primary)]"
        )}
      />

      <div className="pl-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className={cx("truncate text-lg font-bold", strongText())}>
              {row.product?.name || "—"}
            </div>
            <div className={cx("mt-1 text-sm", mutedText())}>
              {new Date(row.createdAt).toLocaleString()}
            </div>
            <div className={cx("mt-1 text-sm", mutedText())}>
              {row.product?.category || ""}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {row.type === "RESTOCK" ? <StatusBadge kind="success">Restock</StatusBadge> : null}
            {row.type === "LOSS" ? <StatusBadge kind="danger">Loss / Damage</StatusBadge> : null}
            {row.type === "CORRECTION" ? <StatusBadge kind="warning">Correction</StatusBadge> : null}
            {!["RESTOCK", "LOSS", "CORRECTION"].includes(row.type) ? (
              <StatusBadge>{labelType(row.type)}</StatusBadge>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={cx(softPanel(), "p-4 shadow-[var(--shadow-soft)]")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              Delta
            </div>
            <div
              className={cx(
                "mt-2 text-2xl font-black",
                delta > 0
                  ? "text-[#15803d]"
                  : delta < 0
                  ? "text-[var(--color-danger)]"
                  : strongText()
              )}
            >
              {formatDelta(delta)}
            </div>
          </div>

          <div className={cx(softPanel(), "p-4 shadow-[var(--shadow-soft)]")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              Before
            </div>
            <div className={cx("mt-2 text-xl font-black", strongText())}>{row.beforeQty}</div>
          </div>

          <div className={cx(softPanel(), "p-4 shadow-[var(--shadow-soft)]")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              After
            </div>
            <div className={cx("mt-2 text-xl font-black", strongText())}>{row.afterQty}</div>
          </div>

          <div className={cx(softPanel(), "p-4 shadow-[var(--shadow-soft)]")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              By
            </div>
            <div className={cx("mt-2 text-sm font-semibold", strongText())}>
              {row.createdBy?.name || "System"}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
            Audit note
          </div>
          <div className={cx("mt-2 break-words text-sm leading-6", mutedText())}>
            {row.note || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockAdjustments() {
  const nav = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(toISODate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toISODate(today));
  const [type, setType] = useState("");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function load() {
    setLoading(true);
    try {
      const data = await listAllStockAdjustments({
        from,
        to,
        type: type || undefined,
        q: q.trim() || undefined,
        limit: 200,
      });

      const list = Array.isArray(data?.adjustments) ? data.adjustments : [];
      setRows(list);
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "stock-history-load-blocked" })) return;
      toast.error(err?.message || "Failed to load stock history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadExcel() {
    if (downloadingExcel) return;

    setDownloadingExcel(true);
    try {
      const { blob, filename } = await downloadStockAdjustmentsExcel({
        from,
        to,
        type: type || undefined,
        q: q.trim() || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "storvex-stock-history.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded");
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "stock-history-export-blocked" })) return;
      toast.error(err?.message || "Failed to download Excel");
    } finally {
      setDownloadingExcel(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [from, to, type, q]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [from, to, type, q, rows.length]);

  const restockCount = rows.filter((r) => r.type === "RESTOCK").length;
  const lossCount = rows.filter((r) => r.type === "LOSS").length;
  const correctionCount = rows.filter((r) => r.type === "CORRECTION").length;

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionHeading
            eyebrow="Inventory"
            title="Stock history"
            subtitle="Every stock movement should be explainable by product, person, type, and note."
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => nav("/app/inventory")} className={secondaryBtn()}>
              Back to inventory
            </button>

            <button type="button" onClick={load} className={secondaryBtn()}>
              Refresh
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className={primaryBtn()}
            >
              {downloadingExcel ? "Downloading..." : "Download Excel"}
            </button>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total changes" value={rows.length} note="Current filtered results" />
          <StatCard label="Restocks" value={restockCount} note="Inbound units recorded" tone="success" />
          <StatCard label="Losses" value={lossCount} note="Damage, theft, missing, expiry" tone="danger" />
          <StatCard label="Corrections" value={correctionCount} note="Count-based stock resets" tone="warning" />
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className={cx("text-base font-bold", strongText())}>Filters</div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Narrow changes by period, movement type, or product search.
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className={cx("text-sm font-medium", strongText())}>From</label>
              <input type="date" className={cx(inputClass(), "mt-2")} value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div>
              <label className={cx("text-sm font-medium", strongText())}>To</label>
              <input type="date" className={cx(inputClass(), "mt-2")} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div>
              <label className={cx("text-sm font-medium", strongText())}>Type</label>
              <select className={cx(inputClass(), "mt-2")} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All</option>
                <option value="RESTOCK">Restock</option>
                <option value="LOSS">Loss / Damage</option>
                <option value="CORRECTION">Correction</option>
              </select>
            </div>

            <div>
              <label className={cx("text-sm font-medium", strongText())}>Search</label>
              <input
                className={cx(inputClass(), "mt-2")}
                placeholder="Product / code / serial / barcode"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Result count
              </div>
              <div className={cx("mt-3 text-lg font-bold", strongText())}>{rows.length} change(s)</div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Audit discipline
              </div>
              <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                Suspicious changes should be investigated using the user name, note, and timestamp.
              </div>
            </div>
          </div>
        </aside>

        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className={cx("text-xl font-bold", strongText())}>Movement log</div>
            <div className={cx("mt-2 text-sm leading-6", mutedText())}>
              Detailed stock movement history across the selected time window.
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <StockHistorySkeleton />
            ) : rows.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                No stock changes found for this period.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {visibleRows.map((r, index) => (
                    <HistoryCard key={r.id} row={r} index={index} />
                  ))}
                </div>

                <div className="mt-5 flex justify-center">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className={secondaryBtn()}
                    >
                      Load 10 more
                    </button>
                  ) : (
                    <div className={cx("text-sm", mutedText())}>All matching changes loaded</div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}