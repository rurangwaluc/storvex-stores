import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";
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

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function strongText() {
  return "text-stone-950 dark:text-[rgb(var(--text))]";
}

function mutedText() {
  return "text-stone-600 dark:text-[rgb(var(--text-muted))]";
}

function softText() {
  return "text-stone-500 dark:text-[rgb(var(--text-soft))]";
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function panel() {
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "min-h-[104px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-amber-600 px-4 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60";
}

function successBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";
}

function statusBadge(kind = "neutral", children) {
  const cls =
    kind === "danger"
      ? "badge-danger"
      : kind === "warning"
      ? "badge-warning"
      : kind === "success"
      ? "badge-success"
      : "badge-neutral";

  return <span className={cls}>{children}</span>;
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-2 text-xl font-semibold tracking-tight", strongText())}>{title}</h2>
      {subtitle ? <p className={cx("mt-2 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function MetricCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "danger"
      ? "bg-rose-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "success"
      ? "bg-emerald-500"
      : "bg-stone-900 dark:bg-[rgb(var(--text))]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-5")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-3 text-3xl font-semibold", strongText())}>{value}</div>
        {note ? <div className={cx("mt-2 text-sm", mutedText())}>{note}</div> : null}
      </div>
    </div>
  );
}

function TabButton({ active, tone = "neutral", children, onClick }) {
  const activeCls =
    tone === "danger"
      ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
      : tone === "warning"
      ? "border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
      : "border-stone-950 bg-stone-950 text-white hover:bg-stone-800 dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
        active
          ? activeCls
          : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]"
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
        <div className={cx("text-xl font-semibold", strongText())}>{title}</div>
        <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
      </div>
    </div>
  );
}

function AdjustmentTypeCard({
  active,
  tone = "neutral",
  title,
  subtitle,
  onClick,
}) {
  const activeCls =
    tone === "success"
      ? "border-emerald-500 bg-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.12)] dark:bg-emerald-950/20 dark:border-emerald-700"
      : tone === "danger"
      ? "border-rose-500 bg-rose-50 shadow-[0_0_0_1px_rgba(244,63,94,0.12)] dark:bg-rose-950/20 dark:border-rose-700"
      : "border-amber-500 bg-amber-50 shadow-[0_0_0_1px_rgba(245,158,11,0.12)] dark:bg-amber-950/20 dark:border-amber-700";

  const stripe =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "danger"
      ? "bg-rose-500"
      : "bg-amber-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "relative overflow-hidden rounded-[24px] border p-4 text-left transition-all duration-200",
        active
          ? activeCls
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:hover:bg-[rgb(var(--bg-muted))]"
      )}
    >
      <div className={cx("absolute left-0 top-0 h-full w-1.5", stripe)} />
      <div className="pl-2">
        <div className={cx("text-sm font-semibold", strongText())}>{title}</div>
        <div className={cx("mt-2 text-sm leading-6", mutedText())}>{subtitle}</div>
      </div>
    </button>
  );
}

function InfoTile({ label, value, tone = "neutral" }) {
  const toneCls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
      : tone === "danger"
      ? "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
      : "border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";

  return (
    <div className={cx("rounded-[22px] border p-4", toneCls)}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-3 text-2xl font-semibold", strongText())}>{value}</div>
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

  const saveLabel = isRestock
    ? "Save restock"
    : isLoss
    ? "Record loss"
    : "Save correction";

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-[3px]"
        onClick={stockBusy ? undefined : onClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
          <div className={cx(shell(), "w-full max-w-6xl overflow-hidden")}>
            <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))] md:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                    Inventory movement
                  </div>
                  <h3 className={cx("mt-2 text-2xl font-semibold tracking-tight", strongText())}>
                    Adjust stock
                  </h3>
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Record a controlled stock movement with a clear reason, live impact preview, and audit-friendly notes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={stockBusy}
                  className={secondaryBtn()}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div className={cx(panel(), "p-5")}>
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

                <div className={cx(panel(), "p-5")}>
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
                          isCorrection
                            ? setStockNewQty(e.target.value)
                            : setStockQty(e.target.value)
                        }
                        className={cx(inputClass(), "mt-2")}
                        placeholder={
                          isCorrection
                            ? "Enter the real counted quantity"
                            : "How many units are moving?"
                        }
                      />
                      <p className={cx("mt-2 text-xs leading-5", softText())}>
                        {isCorrection
                          ? "This sets the final stock quantity directly."
                          : "Enter the number of units to add or remove."}
                      </p>
                    </div>

                    {isLoss ? (
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>
                          Loss reason
                        </label>
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
                        <label className={cx("text-sm font-medium", strongText())}>
                          Movement summary
                        </label>
                        <input
                          value={stockNote}
                          onChange={(e) => setStockNote(e.target.value)}
                          className={cx(inputClass(), "mt-2")}
                          placeholder={
                            isRestock
                              ? "Example: supplier delivery received"
                              : "Example: physical count correction"
                          }
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
                        className={cx(textareaClass(), "mt-2")}
                        placeholder={
                          isLoss
                            ? "Describe what happened, when it was discovered, and any accountability details."
                            : isRestock
                            ? "Optional details about this replenishment."
                            : "Optional explanation for the counted correction."
                        }
                      />
                      <p className={cx("mt-2 text-xs leading-5", softText())}>
                        This note should make the movement understandable later without asking follow-up questions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={cx(panel(), "p-5")}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className={cx("text-base font-semibold", strongText())}>Recent changes</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>
                        Latest movements for this product.
                      </div>
                    </div>

                    {stockHistoryLoading ? (
                      <div className={cx("text-sm", mutedText())}>Loading…</div>
                    ) : null}
                  </div>

                  {stockHistoryLoading ? (
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-stone-200 dark:border-[rgb(var(--border))]">
                      <table className="w-full">
                        <tbody>
                          <TableSkeleton rows={4} cols={4} />
                        </tbody>
                      </table>
                    </div>
                  ) : stockHistory.length === 0 ? (
                    <div className="mt-4 rounded-[20px] border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-600 dark:border-[rgb(var(--border))] dark:text-[rgb(var(--text-muted))]">
                      No stock history yet for this product.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {stockHistory.slice(0, 6).map((h) => (
                        <div
                          key={h.id}
                          className={cx(panel(), "p-3")}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className={cx("text-sm font-medium", strongText())}>
                                {h.type} • {h.beforeQty} → {h.afterQty}
                              </div>
                              <div className={cx("mt-1 text-xs", mutedText())}>
                                {new Date(h.createdAt).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {h.type === "RESTOCK" ? statusBadge("success", "Restock") : null}
                              {h.type === "LOSS" ? statusBadge("danger", "Loss") : null}
                              {h.type === "CORRECTION" ? statusBadge("warning", "Correction") : null}
                            </div>
                          </div>

                          {h.note ? (
                            <div className={cx("mt-2 text-xs leading-5", mutedText())}>
                              Note: {h.note}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-5">
                <div className={cx(panel(), "p-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={cx("text-lg font-semibold", strongText())}>{product.name}</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>{product.brand || "No brand set"}</div>
                    </div>

                    <div className="shrink-0">
                      {product.stockQty <= 0
                        ? statusBadge("danger", "Out")
                        : statusBadge("success", "Tracked")}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoTile label="Current stock" value={Number(product.stockQty || 0)} />
                    <InfoTile label="Sell price" value={formatMoney(product.sellPrice)} />
                  </div>
                </div>

                <div className={cx(panel(), "p-5")}>
                  <div className={cx("text-base font-semibold", strongText())}>Live preview</div>
                  <div className={cx("mt-1 text-sm", mutedText())}>
                    Review the exact stock result before saving this movement.
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <InfoTile label="Before" value={Number(product.stockQty || 0)} />
                    <InfoTile
                      label="Change"
                      value={
                        preview
                          ? preview.delta > 0
                            ? `+${preview.delta}`
                            : String(preview.delta)
                          : "—"
                      }
                      tone={
                        !preview
                          ? "neutral"
                          : preview.delta > 0
                          ? "success"
                          : preview.delta < 0
                          ? "danger"
                          : "warning"
                      }
                    />
                    <InfoTile
                      label="After"
                      value={preview ? preview.after : "—"}
                      tone={!preview ? "neutral" : preview.after === 0 ? "danger" : "success"}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!preview ? statusBadge("neutral", "Enter values") : null}
                    {isLoss && stockReason ? statusBadge("danger", reasonLabel(stockReason)) : null}
                    {isCorrection ? statusBadge("warning", "Count-based set") : null}
                    {isRestock ? statusBadge("success", "Inbound units") : null}
                  </div>
                </div>

                <div className={cx(panel(), "p-5")}>
                  <div className={cx("text-base font-semibold", strongText())}>Discipline</div>
                  <div className={cx("mt-3 space-y-3 text-sm leading-6", mutedText())}>
                    <div>
                      Use <span className={cx("font-semibold", strongText())}>RESTOCK</span> for incoming units.
                    </div>
                    <div>
                      Use <span className={cx("font-semibold", strongText())}>LOSS</span> for stolen, damaged, expired, defective, or missing units.
                    </div>
                    <div>
                      Use <span className={cx("font-semibold", strongText())}>CORRECTION</span> only after a real physical count.
                    </div>
                  </div>
                </div>

                <div className={cx(panel(), "p-5")}>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={stockBusy}
                      className={secondaryBtn()}
                    >
                      Cancel
                    </button>

                    <AsyncButton
                      loading={stockBusy}
                      onClick={onSubmit}
                      disabled={!preview}
                      className={submitClass}
                    >
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

export default function Reorder() {
  const nav = useNavigate();

  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [outRows, setOutRows] = useState([]);
  const [lowRows, setLowRows] = useState([]);
  const [tab, setTab] = useState("OUT");
  const [downloading, setDownloading] = useState(false);

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
      return {
        before: current,
        after,
        delta: after - current,
      };
    }

    const qty = Number(stockQty);
    if (!Number.isFinite(qty) || qty <= 0) return null;

    const normalizedQty = Math.floor(qty);

    if (stockType === "RESTOCK") {
      return {
        before: current,
        after: current + normalizedQty,
        delta: normalizedQty,
      };
    }

    if (stockType === "LOSS") {
      const after = current - normalizedQty;
      if (after < 0) return null;

      return {
        before: current,
        after,
        delta: -normalizedQty,
      };
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
          ? {
              type: "CORRECTION",
              newStockQty: preview.after,
              note: composedNote,
            }
          : {
              type: stockType,
              quantity: Math.abs(preview.delta),
              note: composedNote,
            };

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

  const summaryCards = useMemo(
    () => [
      {
        label: "Out of stock",
        value: outRows.length,
        note: "Immediate replenishment needed",
        tone: "danger",
      },
      {
        label: "Low stock",
        value: lowRows.length,
        note: "At risk of missed sales",
        tone: "warning",
      },
      {
        label: "Threshold",
        value: threshold,
        note: "Default low-stock trigger",
        tone: "neutral",
      },
    ],
    [outRows.length, lowRows.length, threshold]
  );

  return (
    <div className="space-y-5">
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

      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <SectionHeading
                eyebrow="Inventory"
                title="Reorder command center"
                subtitle="Act on stock risk before it becomes lost revenue. Review stock-outs, low-stock items, and launch controlled adjustments with full accountability."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => nav("/app/inventory")}
                className={secondaryBtn()}
              >
                Back to inventory
              </button>

              <button
                type="button"
                onClick={load}
                className={secondaryBtn()}
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className={primaryBtn()}
              >
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-3">
          {summaryCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              note={card.note}
              tone={card.tone}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={cx(shell(), "p-5")}>
          <div className={cx("text-base font-semibold", strongText())}>Filters & focus</div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Tighten what counts as low stock and switch between urgent risk buckets.
          </div>

          <div className="mt-5">
            <label className={cx("text-sm font-medium", strongText())}>
              Default low-stock threshold
            </label>
            <input
              type="number"
              min="0"
              className={cx(inputClass(), "mt-2")}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value || 5))}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <TabButton
              active={tab === "OUT"}
              tone="danger"
              onClick={() => setTab("OUT")}
            >
              Out of stock
            </TabButton>

            <TabButton
              active={tab === "LOW"}
              tone="warning"
              onClick={() => setTab("LOW")}
            >
              Low stock
            </TabButton>
          </div>

          <div className="mt-5 space-y-3">
            <div className={cx(panel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                Current view
              </div>
              <div className={cx("mt-3 text-sm leading-6", strongText())}>
                {tab === "OUT"
                  ? "Products already unavailable for sale."
                  : "Products still selling, but approaching risk."}
              </div>
            </div>

            <div className={cx(panel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                Adjustment discipline
              </div>
              <div className={cx("mt-3 space-y-3 text-sm leading-6", mutedText())}>
                <div>
                  Use <span className={cx("font-semibold", strongText())}>RESTOCK</span> for incoming units.
                </div>
                <div>
                  Use <span className={cx("font-semibold", strongText())}>LOSS</span> for stolen or damaged items.
                </div>
                <div>
                  Use <span className={cx("font-semibold", strongText())}>CORRECTION</span> only for count fixes.
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={cx("text-xl font-semibold", strongText())}>
                  {tab === "OUT" ? "Out-of-stock items" : "Low-stock items"}
                </div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  {tab === "OUT"
                    ? "These products are already unavailable and need immediate replenishment."
                    : `These products are below their low-stock threshold and should be reviewed before revenue is lost.`}
                </div>
              </div>

              <div className="shrink-0">
                {tab === "OUT"
                  ? statusBadge("danger", `${rows.length} items`)
                  : statusBadge("warning", `${rows.length} items`)}
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <TableSkeleton rows={8} cols={5} />
                  </tbody>
                </table>
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title={
                  tab === "OUT"
                    ? "No products are out of stock"
                    : "No products are currently low stock"
                }
                text={
                  tab === "OUT"
                    ? "Good. Nothing is fully unavailable right now."
                    : "Good. Your current threshold is not flagging any immediate low-stock risk."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="border-b border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                    <tr>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Product
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Category
                      </th>
                      <th className={cx("px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Stock
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Sell
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-stone-200 last:border-b-0 dark:border-[rgb(var(--border))]"
                      >
                        <td className="px-4 py-4">
                          <div className={cx("text-sm font-medium", strongText())}>{p.name}</div>
                          {p.serial ? (
                            <div className={cx("mt-1 text-xs", mutedText())}>Serial: {p.serial}</div>
                          ) : null}
                        </td>

                        <td className={cx("px-4 py-4 text-sm", mutedText())}>
                          {p.category || "—"}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className={cx("text-lg font-semibold", strongText())}>{p.stockQty}</div>
                        </td>

                        <td className={cx("px-4 py-4 text-right text-sm font-medium", strongText())}>
                          {formatMoney(p.sellPrice)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openStockModal(p)}
                            className={primaryBtn()}
                          >
                            Adjust stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className={cx("mt-4 text-xs leading-5", mutedText())}>
                  Use stock adjustments when items arrive, are damaged, are stolen, expire, or physical count differs.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}