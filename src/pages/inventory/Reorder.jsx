import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  adjustStock,
  downloadReorderPdf,
  getStockAdjustments,
  listProducts,
} from "../../services/inventoryApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const formatMoney = (n) => `Rwf ${Number(n || 0).toLocaleString("en-US")}`;
const PAGE_SIZE = 10;

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
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[#d9a700] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function successBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
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
      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>
      {subtitle ? <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function MetricCard({ label, value, note, tone = "neutral" }) {
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
        <div className={cx("flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] shadow-[var(--shadow-soft)]", iconTone)}>
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M4 16l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
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

function TabButton({ active, tone = "neutral", children, onClick }) {
  const activeCls =
    tone === "danger"
      ? "bg-[var(--color-danger)] text-white"
      : tone === "warning"
      ? "bg-[#d9a700] text-white"
      : "bg-[var(--color-primary)] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition",
        active ? activeCls : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className={cx("text-xl font-bold", strongText())}>{title}</div>
        <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
      </div>
    </div>
  );
}

function AdjustmentTypeCard({ active, tone = "neutral", title, subtitle, onClick }) {
  const activeCls =
    tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : "bg-[#fff1c9] text-[#b88900]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-[22px] p-4 text-left transition",
        active ? activeCls : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className={cx("mt-2 text-sm leading-6", active ? "text-current/80" : mutedText())}>{subtitle}</div>
    </button>
  );
}

function InfoTile({ label, value, tone = "neutral" }) {
  const toneCls =
    tone === "success"
      ? "bg-[#dcfce7]"
      : tone === "warning"
      ? "bg-[#fff1c9]"
      : tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)]"
      : "bg-[var(--color-surface-2)]";

  return (
    <div className={cx("rounded-[22px] p-4 shadow-[var(--shadow-soft)]", toneCls)}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>{label}</div>
      <div className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>{value}</div>
    </div>
  );
}

function reasonLabel(v) {
  if (v === "STOLEN") return "Stolen";
  if (v === "DAMAGED") return "Damaged";
  if (v === "EXPIRED") return "Expired";
  if (v === "MISSING") return "Missing";
  if (v === "DEFECTIVE") return "Defective";
  if (v === "OTHER") return "Other";
  return v || "—";
}

function lossReasonOptions() {
  return [
    { value: "STOLEN", label: "Stolen" },
    { value: "DAMAGED", label: "Damaged" },
    { value: "EXPIRED", label: "Expired" },
    { value: "MISSING", label: "Missing after count" },
    { value: "DEFECTIVE", label: "Defective" },
    { value: "OTHER", label: "Other" },
  ];
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function ReorderListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-4 sm:p-5")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-5 w-48" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
            <SkeletonBlock className="h-8 w-16 rounded-full" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>

          <div className="mt-4 flex justify-end">
            <SkeletonBlock className="h-11 w-36 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StockAdjustModal({
  open,
  product,
  stockType,
  setStockType,
  stockQty,
  setStockQty,
  stockNewQty,
  setStockNewQty,
  stockReason,
  setStockReason,
  stockNote,
  setStockNote,
  stockHistory,
  stockHistoryLoading,
  preview,
  stockBusy,
  onClose,
  onSubmit,
}) {
  if (!open || !product) return null;

  const isRestock = stockType === "RESTOCK";
  const isLoss = stockType === "LOSS";
  const isCorrection = stockType === "CORRECTION";

  const submitClass = isRestock ? successBtn() : isLoss ? dangerBtn() : warningBtn();
  const saveLabel = isRestock ? "Save restock" : isLoss ? "Record loss" : "Save correction";

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={stockBusy ? undefined : onClose} />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
          <div className={cx(pageCard(), "w-full max-w-5xl overflow-hidden")}>
            <div className="border-b border-[var(--color-border)] px-5 py-5 md:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                    Inventory movement
                  </div>
                  <h3 className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>Adjust stock</h3>
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Record a controlled stock movement with a clear reason, live impact preview, and audit-friendly notes.
                  </p>
                </div>

                <button type="button" onClick={onClose} disabled={stockBusy} className={secondaryBtn()}>
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[1.18fr_0.82fr]">
              <div className="space-y-5 min-w-0">
                <div className={cx(softPanel(), "p-5")}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <AdjustmentTypeCard
                      active={isRestock}
                      tone="success"
                      title="Restock"
                      subtitle="Use this when new units arrive from a supplier or a replenishment delivery."
                      onClick={() => {
                        setStockType("RESTOCK");
                        setStockQty("");
                        setStockNewQty("");
                        setStockReason("");
                      }}
                    />

                    <AdjustmentTypeCard
                      active={isLoss}
                      tone="danger"
                      title="Loss"
                      subtitle="Use this for stolen, damaged, expired, defective, or missing units."
                      onClick={() => {
                        setStockType("LOSS");
                        setStockQty("");
                        setStockNewQty("");
                      }}
                    />

                    <AdjustmentTypeCard
                      active={isCorrection}
                      tone="warning"
                      title="Correction"
                      subtitle="Use this only after a real count to set the exact physical stock quantity."
                      onClick={() => {
                        setStockType("CORRECTION");
                        setStockQty("");
                        setStockNewQty("");
                        setStockReason("");
                      }}
                    />
                  </div>
                </div>

                <div className={cx(pageCard(), "p-5")}>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>
                        {isCorrection ? "Correct stock to" : "Quantity"}
                      </label>
                      <input
                        type="number"
                        min={isCorrection ? "0" : "1"}
                        value={isCorrection ? stockNewQty : stockQty}
                        onChange={(e) =>
                          isCorrection ? setStockNewQty(e.target.value) : setStockQty(e.target.value)
                        }
                        className={cx(inputClass(), "mt-2")}
                        placeholder={isCorrection ? "Enter the real counted quantity" : "How many units are moving?"}
                      />
                      <p className={cx("mt-2 text-xs leading-5", softText())}>
                        {isCorrection ? "This sets the final stock quantity directly." : "Enter the number of units to add or remove."}
                      </p>
                    </div>

                    {isLoss ? (
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Loss reason</label>
                        <select
                          value={stockReason}
                          onChange={(e) => setStockReason(e.target.value)}
                          className={cx(inputClass(), "mt-2")}
                        >
                          <option value="">Select a reason</option>
                          {lossReasonOptions().map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <p className={cx("mt-2 text-xs leading-5", softText())}>
                          Loss entries should always carry a clear reason for review.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Movement summary</label>
                        <input
                          value={stockNote}
                          onChange={(e) => setStockNote(e.target.value)}
                          className={cx(inputClass(), "mt-2")}
                          placeholder={isRestock ? "Example: supplier delivery received" : "Example: physical count correction"}
                        />
                        <p className={cx("mt-2 text-xs leading-5", softText())}>
                          Keep it short and operationally useful.
                        </p>
                      </div>
                    )}

                    <div className="lg:col-span-2">
                      <label className={cx("text-sm font-medium", strongText())}>
                        Audit note {isLoss ? "(required)" : "(optional)"}
                      </label>
                      <textarea
                        value={stockNote}
                        onChange={(e) => setStockNote(e.target.value)}
                        className="mt-2 min-h-[110px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                        placeholder={
                          isLoss
                            ? "Describe what happened, when it was discovered, and any accountability details."
                            : isRestock
                            ? "Optional details about this replenishment."
                            : "Optional explanation for the counted correction."
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className={cx(pageCard(), "p-5")}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className={cx("text-base font-bold", strongText())}>Recent changes</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>Latest movements for this product.</div>
                    </div>
                    {stockHistoryLoading ? <div className={cx("text-sm", mutedText())}>Loading…</div> : null}
                  </div>

                  {stockHistoryLoading ? (
                    <div className="mt-4 grid gap-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonBlock key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : stockHistory.length === 0 ? (
                    <div className="mt-4 rounded-[20px] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                      No stock history yet for this product.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {stockHistory.slice(0, 6).map((h) => (
                        <div key={h.id} className={cx(softPanel(), "p-4")}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className={cx("text-sm font-semibold", strongText())}>
                                {h.type} • {h.beforeQty} → {h.afterQty}
                              </div>
                              <div className={cx("mt-1 text-xs", mutedText())}>
                                {new Date(h.createdAt).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {h.type === "RESTOCK" ? <StatusBadge kind="success">Restock</StatusBadge> : null}
                              {h.type === "LOSS" ? <StatusBadge kind="danger">Loss</StatusBadge> : null}
                              {h.type === "CORRECTION" ? <StatusBadge kind="warning">Correction</StatusBadge> : null}
                            </div>
                          </div>

                          {h.note ? <div className={cx("mt-2 break-words text-xs leading-5", mutedText())}>Note: {h.note}</div> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-5 min-w-0">
                <div className={cx(pageCard(), "p-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={cx("truncate text-lg font-bold", strongText())}>{product.name}</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>{product.brand || "No brand set"}</div>
                    </div>

                    <div className="shrink-0">
                      {product.stockQty <= 0 ? <StatusBadge kind="danger">Out</StatusBadge> : <StatusBadge kind="success">Tracked</StatusBadge>}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <InfoTile label="Current stock" value={Number(product.stockQty || 0)} />
                    <InfoTile label="Sell price" value={formatMoney(product.sellPrice)} />
                  </div>
                </div>

                <div className={cx(pageCard(), "p-5")}>
                  <div className={cx("text-base font-bold", strongText())}>Live preview</div>
                  <div className={cx("mt-1 text-sm", mutedText())}>Review the exact stock result before saving this movement.</div>

                  <div className="mt-5 grid gap-3">
                    <InfoTile label="Before" value={Number(product.stockQty || 0)} />
                    <InfoTile
                      label="Change"
                      value={preview ? (preview.delta > 0 ? `+${preview.delta}` : String(preview.delta)) : "—"}
                      tone={!preview ? "neutral" : preview.delta > 0 ? "success" : preview.delta < 0 ? "danger" : "warning"}
                    />
                    <InfoTile
                      label="After"
                      value={preview ? preview.after : "—"}
                      tone={!preview ? "neutral" : preview.after === 0 ? "danger" : "success"}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!preview ? <StatusBadge>Enter values</StatusBadge> : null}
                    {isLoss && stockReason ? <StatusBadge kind="danger">{reasonLabel(stockReason)}</StatusBadge> : null}
                    {isCorrection ? <StatusBadge kind="warning">Count-based set</StatusBadge> : null}
                    {isRestock ? <StatusBadge kind="success">Inbound units</StatusBadge> : null}
                  </div>
                </div>

                <div className={cx(pageCard(), "p-5")}>
                  <div className={cx("text-base font-bold", strongText())}>Discipline</div>
                  <div className={cx("mt-3 space-y-3 text-sm leading-6", mutedText())}>
                    <div>Use <span className={cx("font-semibold", strongText())}>RESTOCK</span> for incoming units.</div>
                    <div>Use <span className={cx("font-semibold", strongText())}>LOSS</span> for stolen, damaged, expired, defective, or missing units.</div>
                    <div>Use <span className={cx("font-semibold", strongText())}>CORRECTION</span> only after a real physical count.</div>
                  </div>
                </div>

                <div className={cx(pageCard(), "p-5")}>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={onClose} disabled={stockBusy} className={secondaryBtn()}>
                      Cancel
                    </button>

                    <AsyncButton loading={stockBusy} onClick={onSubmit} disabled={!preview} className={submitClass}>
                      {saveLabel}
                    </AsyncButton>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReorderProductCard({ product, onAdjust, tab }) {
  return (
    <div className={cx(pageCard(), "p-4 sm:p-5")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className={cx("truncate text-lg font-bold", strongText())}>{product.name}</div>
          <div className={cx("mt-1 text-sm", mutedText())}>{product.category || "—"}</div>
          {product.serial ? <div className={cx("mt-1 break-all text-xs", mutedText())}>Serial: {product.serial}</div> : null}
        </div>

        <div className="shrink-0">
          {tab === "OUT" ? <StatusBadge kind="danger">Out of stock</StatusBadge> : <StatusBadge kind="warning">Low stock</StatusBadge>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>Current stock</div>
          <div className={cx("mt-2 text-2xl font-black", strongText())}>{product.stockQty}</div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>Sell price</div>
          <div className={cx("mt-2 text-base font-bold", strongText())}>{formatMoney(product.sellPrice)}</div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>Brand</div>
          <div className={cx("mt-2 text-base font-bold", strongText())}>{product.brand || "—"}</div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => onAdjust(product)} className={primaryBtn()}>
          Adjust stock
        </button>
      </div>
    </div>
  );
}

export default function Reorder() {
  const nav = useNavigate();

  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [outRows, setOutRows] = useState([]);
  const [lowRows, setLowRows] = useState([]);
  const [tab, setTab] = useState("OUT");
  const [downloading, setDownloading] = useState(false);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [stockOpen, setStockOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockBusy, setStockBusy] = useState(false);
  const [stockType, setStockType] = useState("RESTOCK");
  const [stockQty, setStockQty] = useState("");
  const [stockNewQty, setStockNewQty] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [stockHistory, setStockHistory] = useState([]);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const th = Number(threshold || 5);
      const safeTh = Number.isFinite(th) && th >= 0 ? Math.floor(th) : 5;

      const [outRes, lowRes] = await Promise.all([
        listProducts({ outOfStock: true, active: true, limit: 200, sort: "name" }),
        listProducts({
          lowStock: true,
          threshold: safeTh,
          active: true,
          limit: 200,
          sort: "stock_low",
        }),
      ]);

      setOutRows(Array.isArray(outRes?.products) ? outRes.products : []);
      setLowRows(Array.isArray(lowRes?.products) ? lowRes.products : []);
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "reorder-load-blocked" })) return;
      toast.error(err?.message || "Failed to load reorder list");
      setOutRows([]);
      setLowRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [threshold]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tab, threshold, outRows.length, lowRows.length]);

  async function handleDownloadPdf() {
    if (downloading) return;

    setDownloading(true);
    try {
      const blobData = await downloadReorderPdf({ threshold });
      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "storvex-reorder-list.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "reorder-pdf-blocked" })) return;
      toast.error(err?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function openStockModal(product) {
    setStockProduct(product);
    setStockType("RESTOCK");
    setStockQty("");
    setStockNewQty("");
    setStockReason("");
    setStockNote("");
    setStockHistory([]);
    setStockOpen(true);

    setStockHistoryLoading(true);
    try {
      const data = await getStockAdjustments(product.id);
      const rows = Array.isArray(data?.adjustments) ? data.adjustments : [];
      setStockHistory(rows.slice(0, 10));
    } catch (err) {
      if (!handleSubscriptionBlockedError(err, { toastId: "stock-history-blocked" })) {
        setStockHistory([]);
      }
    } finally {
      setStockHistoryLoading(false);
    }
  }

  function closeStockModal() {
    if (stockBusy) return;
    setStockOpen(false);
    setStockProduct(null);
  }

  function calcPreview() {
    const current = Number(stockProduct?.stockQty || 0);
    if (!stockProduct) return null;

    if (stockType === "CORRECTION") {
      const n = Number(stockNewQty);
      if (!Number.isFinite(n) || n < 0) return null;

      const after = Math.floor(n);
      return { before: current, after, delta: after - current };
    }

    const qty = Number(stockQty);
    if (!Number.isFinite(qty) || qty <= 0) return null;

    const normalizedQty = Math.floor(qty);

    if (stockType === "RESTOCK") {
      return { before: current, after: current + normalizedQty, delta: normalizedQty };
    }

    if (stockType === "LOSS") {
      const after = current - normalizedQty;
      if (after < 0) return null;
      return { before: current, after, delta: -normalizedQty };
    }

    return null;
  }

  async function submitStock() {
    if (!stockProduct) return;

    const preview = calcPreview();
    if (!preview) {
      toast.error("Please enter a valid stock value");
      return;
    }

    if (stockType === "LOSS" && !stockReason) {
      toast.error("Loss reason is required");
      return;
    }

    if (stockType === "LOSS" && !String(stockNote || "").trim()) {
      toast.error("Audit note is required for loss");
      return;
    }

    setStockBusy(true);
    try {
      const composedNote =
        stockType === "LOSS"
          ? `[${reasonLabel(stockReason)}] ${String(stockNote || "").trim()}`
          : String(stockNote || "").trim() || null;

      const payload =
        stockType === "CORRECTION"
          ? { type: "CORRECTION", newStockQty: preview.after, note: composedNote }
          : { type: stockType, quantity: Math.abs(preview.delta), note: composedNote };

      await adjustStock(stockProduct.id, payload);

      toast.success("Stock updated");
      setStockOpen(false);
      setStockProduct(null);
      await load();
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "stock-adjust-blocked" })) return;
      toast.error(err?.message || "Failed to update stock");
    } finally {
      setStockBusy(false);
    }
  }

  const rows = tab === "OUT" ? outRows : lowRows;
  const preview = calcPreview();
  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  const summaryCards = useMemo(
    () => [
      { label: "Out of stock", value: outRows.length, note: "Immediate replenishment needed", tone: "danger" },
      { label: "Low stock", value: lowRows.length, note: "At risk of missed sales", tone: "warning" },
      { label: "Threshold", value: threshold, note: "Default low-stock trigger", tone: "neutral" },
    ],
    [outRows.length, lowRows.length, threshold]
  );

  return (
    <div className="space-y-6">
      <StockAdjustModal
        open={stockOpen}
        product={stockProduct}
        stockType={stockType}
        setStockType={setStockType}
        stockQty={stockQty}
        setStockQty={setStockQty}
        stockNewQty={stockNewQty}
        setStockNewQty={setStockNewQty}
        stockReason={stockReason}
        setStockReason={setStockReason}
        stockNote={stockNote}
        setStockNote={setStockNote}
        stockHistory={stockHistory}
        stockHistoryLoading={stockHistoryLoading}
        preview={preview}
        stockBusy={stockBusy}
        onClose={closeStockModal}
        onSubmit={submitStock}
      />

      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="Inventory"
              title="Reorder command center"
              subtitle="Act on stock risk before it becomes lost revenue. Review stock-outs, low-stock items, and launch controlled adjustments with full accountability."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => nav("/app/inventory")} className={secondaryBtn()}>
              Back to inventory
            </button>

            <button type="button" onClick={load} className={secondaryBtn()}>
              Refresh
            </button>

            <button type="button" onClick={handleDownloadPdf} disabled={downloading} className={primaryBtn()}>
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <MetricCard key={card.label} label={card.label} value={card.value} note={card.note} tone={card.tone} />
          ))}
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className={cx("text-base font-bold", strongText())}>Filters & focus</div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Tighten what counts as low stock and switch between urgent risk buckets.
          </div>

          <div className="mt-5">
            <label className={cx("text-sm font-medium", strongText())}>Default low-stock threshold</label>
            <input
              type="number"
              min="0"
              className={cx(inputClass(), "mt-2")}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value || 5))}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <TabButton active={tab === "OUT"} tone="danger" onClick={() => setTab("OUT")}>
              Out of stock
            </TabButton>

            <TabButton active={tab === "LOW"} tone="warning" onClick={() => setTab("LOW")}>
              Low stock
            </TabButton>
          </div>

          <div className="mt-5 space-y-3">
            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Current view
              </div>
              <div className={cx("mt-3 text-sm leading-6", strongText())}>
                {tab === "OUT" ? "Products already unavailable for sale." : "Products still selling, but approaching risk."}
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Adjustment discipline
              </div>
              <div className={cx("mt-3 space-y-3 text-sm leading-6", mutedText())}>
                <div>Use <span className={cx("font-semibold", strongText())}>RESTOCK</span> for incoming units.</div>
                <div>Use <span className={cx("font-semibold", strongText())}>LOSS</span> for stolen or damaged items.</div>
                <div>Use <span className={cx("font-semibold", strongText())}>CORRECTION</span> only for count fixes.</div>
              </div>
            </div>
          </div>
        </aside>

        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={cx("text-xl font-bold", strongText())}>
                  {tab === "OUT" ? "Out-of-stock items" : "Low-stock items"}
                </div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  {tab === "OUT"
                    ? "These products are already unavailable and need immediate replenishment."
                    : "These products are below their low-stock threshold and should be reviewed before revenue is lost."}
                </div>
              </div>

              <div className="shrink-0">
                {tab === "OUT" ? <StatusBadge kind="danger">{rows.length} items</StatusBadge> : <StatusBadge kind="warning">{rows.length} items</StatusBadge>}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <ReorderListSkeleton />
            ) : rows.length === 0 ? (
              <EmptyState
                title={tab === "OUT" ? "No products are out of stock" : "No products are currently low stock"}
                text={
                  tab === "OUT"
                    ? "Good. Nothing is fully unavailable right now."
                    : "Good. Your current threshold is not flagging any immediate low-stock risk."
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {visibleRows.map((p) => (
                    <ReorderProductCard key={p.id} product={p} onAdjust={openStockModal} tab={tab} />
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
                    <div className={cx("text-sm", mutedText())}>All matching items loaded</div>
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