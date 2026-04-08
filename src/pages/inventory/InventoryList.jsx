import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import {
  activateProduct,
  adjustStock,
  deleteProduct,
  downloadInventoryExcel,
  getInventorySummary,
  listProducts,
} from "../../services/inventoryApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

const PAGE_SIZE = 10;

const LOSS_REASON_OPTIONS = [
  { value: "STOLEN", label: "Stolen" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "LOST", label: "Lost" },
  { value: "EXPIRED", label: "Expired" },
  { value: "INTERNAL_USE", label: "Internal use" },
  { value: "COUNTING_ERROR", label: "Counting error" },
  { value: "OTHER", label: "Other" },
];

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatMoney(n) {
  return `Rwf ${Number(n || 0).toLocaleString("en-US")}`;
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
  return "rounded-[20px] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function textareaClass() {
  return "min-h-[110px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60";
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8l-9-5-9 5 9 5 9-5zm-18 3v8l9 5 9-5v-8" />
    </svg>
  );
}

function BoxesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7.5 8 5l5 2.5L8 10 3 7.5Zm10 0L18 5l3 1.5V11l-5 2.5L11 11V6.5ZM8 10v6l5 3v-6l-5-3Z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2H6a2 2 0 0 0-2 2V7Z" />
      <path d="M4 11a2 2 0 0 1 2-2h14v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" />
      <circle cx="16" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 16l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function SummaryCard({ label, value, note, tone = "neutral", icon = null }) {
  const toneStyles = {
    neutral: {
      box: "bg-[#dff1ff] text-[#4aa8ff]",
      ring: "shadow-[inset_0_0_0_1px_rgba(74,163,255,0.10)]",
    },
    warning: {
      box: "bg-[#ffe3d4] text-[#ff8b4a]",
      ring: "shadow-[inset_0_0_0_1px_rgba(255,139,74,0.10)]",
    },
    danger: {
      box: "bg-[#fff1c9] text-[#d9a700]",
      ring: "shadow-[inset_0_0_0_1px_rgba(217,167,0,0.10)]",
    },
    success: {
      box: "bg-[#dcfce7] text-[#16a34a]",
      ring: "shadow-[inset_0_0_0_1px_rgba(22,163,74,0.10)]",
    },
  };

  const style = toneStyles[tone] || toneStyles.neutral;

  return (
    <article
      className={cx(
        pageCard(),
        "relative overflow-hidden p-5 sm:p-6"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--color-border)]" />

      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className={cx(
            "flex h-18 w-18 shrink-0 items-center justify-center rounded-[22px] sm:h-20 sm:w-20",
            style.box,
            style.ring
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={cx(
              "text-sm font-semibold leading-6 sm:text-[15px]",
              strongText()
            )}
          >
            {label}
          </div>

          <div
            className={cx(
              "mt-2 break-words text-[1.5rem] font-black leading-tight tracking-[-0.02em] sm:text-[1.9rem]",
              strongText()
            )}
          >
            {value}
          </div>

          {note ? (
            <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ kind = "neutral", children }) {
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

function FilterChip({ active, children, onClick, tone = "neutral" }) {
  const activeCls =
    tone === "danger"
      ? "bg-[var(--color-danger)] text-white"
      : tone === "warning"
      ? "bg-amber-500 text-white"
      : "bg-[var(--color-primary)] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition",
        active
          ? activeCls
          : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <div className={cx("text-[1.55rem] font-black leading-none sm:text-[1.8rem]", strongText())}>
          {title}
        </div>
        {subtitle ? <div className={cx("mt-2 text-sm", mutedText())}>{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function ActionMenu({
  product,
  busyId,
  onEdit,
  onAdjust,
  onDeactivate,
  onActivate,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }

    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90"
        aria-label="Open actions"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[140] min-w-[220px] rounded-[22px] border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/5">          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAdjust(product);
            }}
            className="flex h-11 w-full items-center rounded-2xl px-4 text-left text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)]"
          >
            Adjust stock
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(product.id);
            }}
            className="flex h-11 w-full items-center rounded-2xl px-4 text-left text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)]"
          >
            Edit product
          </button>

          {product.isActive ? (
              <AsyncButton
                loading={busyId === product.id}
                onClick={() => {
                  setOpen(false);
                  onDeactivate(product);
                }}
                className="mt-1 flex h-11 w-full items-center justify-start rounded-2xl bg-[rgba(138, 16, 12, 0.08)] px-4 text-sm font-medium text-[var(--color-danger)] transition hover:bg-[rgba(219,80,74,0.14)]"
              >
                Deactivate
              </AsyncButton>
            ) : (
              <AsyncButton
                loading={busyId === product.id}
                onClick={() => {
                  setOpen(false);
                  onActivate(product);
                }}
                className="mt-1 flex h-11 w-full items-center justify-start rounded-2xl bg-[var(--color-primary-soft)] px-4 text-sm font-medium text-[var(--color-primary)] transition hover:opacity-90"
              >
                Activate
              </AsyncButton>
            )}
        </div>
      ) : null}
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cx(pageCard(), "w-full max-w-md")}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-danger)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 8v5m0 4h.01M10.29 3.86l-8 14A1 1 0 003.16 19h17.68a1 1 0 00.87-1.5l-8-14a1 1 0 00-1.74 0z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className={cx("text-lg font-semibold", strongText())}>{title}</h3>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>{message}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={secondaryBtn()}
              >
                Cancel
              </button>
              <AsyncButton loading={loading} onClick={onConfirm} className={dangerBtn()}>
                {confirmLabel}
              </AsyncButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshBar({ visible }) {
  return (
    <div
      className={cx(
        "overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface-2)] transition-all",
        visible ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 text-xs">
        <span className={mutedText()}>Refreshing inventory…</span>
        <span className="inline-flex items-center gap-2 text-[var(--color-text-muted)]">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Syncing
        </span>
      </div>
    </div>
  );
}

function StockAdjustDialog({
  open,
  product,
  loading,
  form,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open || !product) return null;

  const currentQty = Number(product.stockQty || 0);
  const quantity = Number(form.quantity || 0);
  const correctionQty = Number(form.newStockQty || 0);

  let preview = null;
  if (form.type === "CORRECTION") {
    if (Number.isFinite(correctionQty) && correctionQty >= 0) preview = Math.floor(correctionQty);
  } else if (Number.isFinite(quantity) && quantity > 0) {
    preview =
      form.type === "RESTOCK"
        ? currentQty + Math.floor(quantity)
        : currentQty - Math.floor(quantity);
  }

  const previewInvalid = preview != null && preview < 0;
  const showLossReason = form.type === "LOSS";
  const showOtherReason = showLossReason && form.lossReason === "OTHER";

  const tone =
    form.type === "LOSS" ? "danger" : form.type === "CORRECTION" ? "warning" : "success";

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[4px]"
        onClick={loading ? undefined : onClose}
      />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 lg:p-6">
          <div className={cx(pageCard(), "w-full max-w-6xl overflow-hidden")}>
            <div className="border-b border-[var(--color-border)] px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div
                    className={cx(
                      "text-[11px] font-semibold uppercase tracking-[0.16em]",
                      softText()
                    )}
                  >
                    Controlled stock movement
                  </div>
                  <h3 className={cx("mt-2 text-2xl font-semibold tracking-tight", strongText())}>
                    Adjust stock
                  </h3>
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Record replenishment, shrinkage, or counted corrections with a strict reason
                    trail.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className={secondaryBtn()}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-6 py-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className={cx(softPanel(), "p-5")}>
                    <div className={cx("text-base font-semibold", strongText())}>{product.name}</div>
                    <div className={cx("mt-1 text-sm", mutedText())}>{product.brand || "—"}</div>

                    <div className="mt-5 grid grid-cols-1 gap-3">
                      <div className={cx(pageCard(), "px-4 py-4")}>
                        <div className={softText()}>Current stock</div>
                        <div
                          className={cx(
                            "mt-2 text-3xl font-semibold tracking-tight",
                            strongText()
                          )}
                        >
                          {currentQty}
                        </div>
                      </div>

                      <div className={cx(pageCard(), "px-4 py-4")}>
                        <div className={softText()}>Sell price</div>
                        <div
                          className={cx(
                            "mt-2 text-2xl font-semibold tracking-tight break-words",
                            strongText()
                          )}
                        >
                          {formatMoney(product.sellPrice)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cx(softPanel(), "p-5")}>
                    <div className={cx("text-base font-semibold", strongText())}>Preview</div>
                    <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                      Review the stock result before saving this movement.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3">
                      <div className={cx(pageCard(), "px-4 py-4")}>
                        <div className={softText()}>Before</div>
                        <div
                          className={cx(
                            "mt-2 text-3xl font-semibold tracking-tight",
                            strongText()
                          )}
                        >
                          {currentQty}
                        </div>
                      </div>

                      <div className={cx(pageCard(), "px-4 py-4")}>
                        <div className={softText()}>After</div>
                        <div
                          className={cx(
                            "mt-2 text-3xl font-semibold tracking-tight",
                            previewInvalid ? "text-red-600 dark:text-red-400" : strongText()
                          )}
                        >
                          {preview == null ? "—" : preview}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {preview == null ? (
                        <StatusBadge>Enter values</StatusBadge>
                      ) : previewInvalid ? (
                        <StatusBadge kind="danger">Invalid result</StatusBadge>
                      ) : form.type === "RESTOCK" ? (
                        <StatusBadge kind="success">Stock increases</StatusBadge>
                      ) : form.type === "LOSS" ? (
                        <StatusBadge kind="danger">Stock decreases</StatusBadge>
                      ) : (
                        <StatusBadge kind="warning">Stock corrected</StatusBadge>
                      )}
                    </div>
                  </div>
                </div>

                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-base font-semibold", strongText())}>Movement type</div>
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Choose the exact type so the audit trail stays clean.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => onChange("type", "RESTOCK")}
                      className={cx(
                        "rounded-[24px] p-5 text-left transition",
                        form.type === "RESTOCK"
                          ? "bg-emerald-50 shadow-sm dark:bg-emerald-950/20"
                          : cx(pageCard(), "hover:opacity-90")
                      )}
                    >
                      <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        RESTOCK
                      </div>
                      <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                        Incoming stock, replenishment, or supplier delivery received.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChange("type", "LOSS")}
                      className={cx(
                        "rounded-[24px] p-5 text-left transition",
                        form.type === "LOSS"
                          ? "bg-red-50 shadow-sm dark:bg-red-950/20"
                          : cx(pageCard(), "hover:opacity-90")
                      )}
                    >
                      <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                        LOSS
                      </div>
                      <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                        Use for stolen, damaged, expired, internal-use, or missing units.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChange("type", "CORRECTION")}
                      className={cx(
                        "rounded-[24px] p-5 text-left transition",
                        form.type === "CORRECTION"
                          ? "bg-amber-50 shadow-sm dark:bg-amber-950/20"
                          : cx(pageCard(), "hover:opacity-90")
                      )}
                    >
                      <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        CORRECTION
                      </div>
                      <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                        Use only after a real count to set the actual stock quantity.
                      </div>
                    </button>
                  </div>
                </div>

                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-base font-semibold", strongText())}>Movement details</div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>
                        {form.type === "CORRECTION" ? "New stock quantity" : "Quantity"}
                      </label>
                      {form.type === "CORRECTION" ? (
                        <input
                          type="number"
                          min="0"
                          className={cx(inputClass(), "mt-2")}
                          value={form.newStockQty}
                          onChange={(e) => onChange("newStockQty", e.target.value)}
                          placeholder="Enter corrected quantity"
                          disabled={loading}
                        />
                      ) : (
                        <input
                          type="number"
                          min="1"
                          className={cx(inputClass(), "mt-2")}
                          value={form.quantity}
                          onChange={(e) => onChange("quantity", e.target.value)}
                          placeholder={
                            form.type === "LOSS"
                              ? "How many units were lost?"
                              : "How many units arrived?"
                          }
                          disabled={loading}
                        />
                      )}
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>
                        {showLossReason ? "Loss reason" : "Short label"}
                      </label>

                      {showLossReason ? (
                        <select
                          className={cx(inputClass(), "mt-2")}
                          value={form.lossReason}
                          onChange={(e) => onChange("lossReason", e.target.value)}
                          disabled={loading}
                        >
                          <option value="">Select reason</option>
                          {LOSS_REASON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.shortNote}
                          onChange={(e) => onChange("shortNote", e.target.value)}
                          placeholder="Optional short label"
                          disabled={loading}
                        />
                      )}
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>
                        {showOtherReason ? "Other reason details" : "Operator reminder"}
                      </label>

                      {showOtherReason ? (
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.lossOtherReason}
                          onChange={(e) => onChange("lossOtherReason", e.target.value)}
                          placeholder="Describe the reason"
                          disabled={loading}
                        />
                      ) : (
                        <div
                          className={cx(
                            softPanel(),
                            "mt-2 flex h-11 items-center px-3.5 text-sm",
                            mutedText()
                          )}
                        >
                          {form.type === "RESTOCK"
                            ? "Supplier / replenishment context"
                            : form.type === "LOSS"
                            ? "Reason is mandatory"
                            : "Count result must be verified"}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-3">
                      <label className={cx("text-sm font-medium", strongText())}>Audit note</label>
                      <textarea
                        className={cx(textareaClass(), "mt-2")}
                        value={form.note}
                        onChange={(e) => onChange("note", e.target.value)}
                        placeholder={
                          form.type === "LOSS"
                            ? "Example: 1 unit stolen from shelf during evening shift"
                            : form.type === "RESTOCK"
                            ? "Example: supplier restock delivery received"
                            : "Example: physical count completed and confirmed by manager"
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-base font-semibold", strongText())}>Discipline</div>
                  <ul className={cx("mt-4 space-y-3 text-sm leading-6", mutedText())}>
                    <li>
                      Use <span className="font-semibold">RESTOCK</span> for incoming units.
                    </li>
                    <li>
                      Use <span className="font-semibold">LOSS</span> for stolen, damaged, lost,
                      expired, internal-use, or count-loss cases.
                    </li>
                    <li>
                      Use <span className="font-semibold">CORRECTION</span> only after a real
                      physical count.
                    </li>
                    <li>
                      For <span className="font-semibold">STOLEN</span> and{" "}
                      <span className="font-semibold">OTHER</span>, note is required.
                    </li>
                  </ul>
                </div>

                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-base font-semibold", strongText())}>Save</div>
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                    This movement updates stock immediately and should be fully explainable later.
                  </p>

                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className={secondaryBtn()}
                    >
                      Cancel
                    </button>

                    <AsyncButton
                      loading={loading}
                      onClick={onSubmit}
                      className={
                        tone === "danger"
                          ? dangerBtn()
                          : tone === "warning"
                          ? warningBtn()
                          : primaryBtn()
                      }
                    >
                      Save adjustment
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

function DesktopRow({
  product,
  threshold,
  busyId,
  onEdit,
  onAdjust,
  onDeactivate,
  onActivate,
}) {
  const qty = Number(product.stockQty || 0);
  const min = Number.isFinite(Number(product.minStockLevel))
    ? Number(product.minStockLevel)
    : null;

  const thresholdToUse = min != null && min >= 0 ? min : threshold;
  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= thresholdToUse;

  const categoryText =
    [product.category, product.subcategory].filter(Boolean).join(" • ") || "Uncategorized";

  return (
    <div className="rounded-[22px] bg-[var(--color-surface-2)] px-6 py-5 transition hover:translate-y-[-1px] hover:shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_170px_220px_72px] items-center gap-10">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 8l-9-5-9 5 9 5 9-5zm-18 3v8l9 5 9-5v-8" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className={cx("truncate text-[15px] font-bold", strongText())}>
                {product.name}
              </div>
              <div className={cx("mt-1 truncate text-sm", mutedText())}>
                {product.brand || "Unknown brand"}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className={cx("truncate text-sm font-semibold", strongText())}>{categoryText}</div>
          <div className={cx("mt-1 text-xs", mutedText())}>
            {product.isActive ? "Active product" : "Inactive product"}
          </div>
        </div>

        <div className="text-right">
          <div className={cx("text-base font-black", strongText())}>
            {formatMoney(product.sellPrice)}
          </div>
        </div>

        <div className="pl-2">
          <div className="flex items-center gap-3">
            <span className={cx("text-2xl font-black leading-none", strongText())}>{qty}</span>

            <div className="flex flex-wrap gap-2">
              {isOut ? <StatusBadge kind="danger">Out</StatusBadge> : null}
              {!isOut && isLow ? <StatusBadge kind="warning">Low</StatusBadge> : null}
              {!isOut && !isLow ? <StatusBadge kind="success">Healthy</StatusBadge> : null}
              {!product.isActive ? <StatusBadge>Inactive</StatusBadge> : null}
            </div>
          </div>

          <div className={cx("mt-2 text-xs", mutedText())}>Min level {thresholdToUse}</div>
        </div>

        <div className="flex justify-end">
          <ActionMenu
            product={product}
            busyId={busyId}
            onEdit={onEdit}
            onAdjust={onAdjust}
            onDeactivate={onDeactivate}
            onActivate={onActivate}
          />
        </div>
      </div>
    </div>
  );
}

function MobileCard({
  product,
  threshold,
  busyId,
  onEdit,
  onAdjust,
  onDeactivate,
  onActivate,
}) {
  const qty = Number(product.stockQty || 0);
  const min = Number.isFinite(Number(product.minStockLevel))
    ? Number(product.minStockLevel)
    : null;
  const thresholdToUse = min != null && min >= 0 ? min : threshold;
  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= thresholdToUse;

  return (
    <div className={cx(pageCard(), "overflow-hidden p-4 sm:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-primary)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 8l-9-5-9 5 9 5 9-5zm-18 3v8l9 5 9-5v-8" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className={cx("truncate text-base font-bold", strongText())}>{product.name}</div>
            <div className={cx("mt-1 truncate text-sm", mutedText())}>{product.brand || "Unknown brand"}</div>
          </div>
        </div>

        <ActionMenu
          product={product}
          busyId={busyId}
          onEdit={onEdit}
          onAdjust={onAdjust}
          onDeactivate={onDeactivate}
          onActivate={onActivate}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
            Category
          </div>
          <div className={cx("mt-2 text-sm font-semibold", strongText())}>
            {[product.category, product.subcategory].filter(Boolean).join(" • ") || "Uncategorized"}
          </div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
            Selling price
          </div>
          <div className={cx("mt-2 text-base font-black", strongText())}>
            {formatMoney(product.sellPrice)}
          </div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
            Units in stock
          </div>
          <div className={cx("mt-2 text-2xl font-black leading-none", strongText())}>{qty}</div>
          <div className={cx("mt-2 text-xs", mutedText())}>Min level {thresholdToUse}</div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
            Status
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {isOut ? <StatusBadge kind="danger">Out of stock</StatusBadge> : null}
            {!isOut && isLow ? <StatusBadge kind="warning">Low stock</StatusBadge> : null}
            {!isOut && !isLow ? <StatusBadge kind="success">Healthy</StatusBadge> : null}
            {!product.isActive ? <StatusBadge>Inactive</StatusBadge> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryList() {
  const navigate = useNavigate();
  const requestSeqRef = useRef(0);

  const [initialSummaryLoading, setInitialSummaryLoading] = useState(true);
  const [initialListLoading, setInitialListLoading] = useState(true);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(false);
  const [refreshingList, setRefreshingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    product: null,
    loading: false,
  });

  const [adjustState, setAdjustState] = useState({
    open: false,
    product: null,
    loading: false,
    form: {
      type: "RESTOCK",
      quantity: "",
      newStockQty: "",
      lossReason: "",
      lossOtherReason: "",
      shortNote: "",
      note: "",
    },
  });

  const [summary, setSummary] = useState({
    totalActiveProducts: 0,
    totalStockUnits: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    stockCostValue: 0,
    stockSellValue: 0,
  });

  const [products, setProducts] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    sort: "newest",
    active: "true",
    lowStock: false,
    outOfStock: false,
    threshold: 5,
    category: "",
    brand: "",
  });

  const [debouncedQuery, setDebouncedQuery] = useState("");

  const safeThreshold = useMemo(() => {
    const n = Number(filters.threshold);
    return Number.isFinite(n) && n >= 0 ? n : 5;
  }, [filters.threshold]);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function buildListParams(cursor = undefined) {
    return {
      q: debouncedQuery.trim() || undefined,
      sort: filters.sort,
      active: filters.active === "true",
      lowStock: filters.lowStock,
      outOfStock: filters.outOfStock,
      threshold: safeThreshold,
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      limit: PAGE_SIZE,
      cursor,
    };
  }

  async function loadSummary({ silent = false } = {}) {
    if (!silent) setInitialSummaryLoading(true);

    try {
      const data = await getInventorySummary();
      setSummary(
        data?.summary || {
          totalActiveProducts: 0,
          totalStockUnits: 0,
          outOfStockCount: 0,
          lowStockCount: 0,
          stockCostValue: 0,
          stockSellValue: 0,
        }
      );
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "inventory-summary-blocked" })) return;
      toast.error(err?.message || "Failed to load inventory summary");
    } finally {
      if (!silent) setInitialSummaryLoading(false);
    }
  }

  async function loadFirstPage() {
    const requestId = ++requestSeqRef.current;
    const hasExistingRows = products.length > 0;

    if (hasExistingRows) setRefreshingList(true);
    else setInitialListLoading(true);

    try {
      const data = await listProducts(buildListParams());

      if (requestId !== requestSeqRef.current) return;

      setProducts(Array.isArray(data?.products) ? data.products : []);
      setNextCursor(data?.nextCursor || null);
    } catch (err) {
      if (requestId !== requestSeqRef.current) return;
      if (handleSubscriptionBlockedError(err, { toastId: "inventory-list-blocked" })) return;

      toast.error(err?.message || "Failed to load products");

      if (!hasExistingRows) {
        setProducts([]);
        setNextCursor(null);
      }
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialListLoading(false);
        setRefreshingList(false);
      }
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await listProducts(buildListParams(nextCursor));
      const more = Array.isArray(data?.products) ? data.products : [];
      setProducts((prev) => [...prev, ...more]);
      setNextCursor(data?.nextCursor || null);
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "inventory-loadmore-blocked" })) return;
      toast.error(err?.message || "Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadSummary({ silent: true }), loadFirstPage()]);
  }

  async function handleDownloadExcel() {
    if (downloadingExcel) return;

    setDownloadingExcel(true);
    try {
      const { blob, filename } = await downloadInventoryExcel({
        q: debouncedQuery.trim() || undefined,
        sort: filters.sort,
        active: filters.active === "true",
        lowStock: filters.lowStock,
        outOfStock: filters.outOfStock,
        threshold: safeThreshold,
        category: filters.category || undefined,
        brand: filters.brand || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "storvex-inventory.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded");
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "inventory-export-blocked" })) return;
      toast.error(err?.message || "Failed to download Excel");
    } finally {
      setDownloadingExcel(false);
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(filters.q);
    }, 180);

    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedQuery,
    filters.sort,
    filters.active,
    filters.lowStock,
    filters.outOfStock,
    filters.threshold,
    filters.category,
    filters.brand,
  ]);

  useEffect(() => {
    if (!initialListLoading) {
      setShowInitialSkeleton(false);
      return;
    }

    const t = setTimeout(() => {
      setShowInitialSkeleton(true);
    }, 120);

    return () => clearTimeout(t);
  }, [initialListLoading]);

  function openDeactivateDialog(product) {
    setConfirmState({
      open: true,
      product,
      loading: false,
    });
  }

  function closeDeactivateDialog() {
    if (confirmState.loading) return;
    setConfirmState({ open: false, product: null, loading: false });
  }

  async function confirmDeactivate() {
    const product = confirmState.product;
    if (!product) return;

    setConfirmState((prev) => ({ ...prev, loading: true }));
    setBusyId(product.id);

    try {
      await deleteProduct(product.id);
      toast.success("Product deactivated");
      setConfirmState({ open: false, product: null, loading: false });
      await refreshAll();
    } catch (err) {
      if (!handleSubscriptionBlockedError(err, { toastId: "inventory-deactivate-blocked" })) {
        toast.error(err?.message || "Failed to deactivate product");
      }
      setConfirmState((prev) => ({ ...prev, loading: false }));
    } finally {
      setBusyId("");
    }
  }

  async function handleActivate(product) {
    setBusyId(product.id);
    try {
      await activateProduct(product.id);
      toast.success("Product activated");
      await refreshAll();
    } catch (err) {
      if (!handleSubscriptionBlockedError(err, { toastId: "inventory-activate-blocked" })) {
        toast.error(err?.message || "Failed to activate product");
      }
    } finally {
      setBusyId("");
    }
  }

  function openAdjustDialog(product) {
    setAdjustState({
      open: true,
      product,
      loading: false,
      form: {
        type: "RESTOCK",
        quantity: "",
        newStockQty: "",
        lossReason: "",
        lossOtherReason: "",
        shortNote: "",
        note: "",
      },
    });
  }

  function closeAdjustDialog() {
    if (adjustState.loading) return;
    setAdjustState({
      open: false,
      product: null,
      loading: false,
      form: {
        type: "RESTOCK",
        quantity: "",
        newStockQty: "",
        lossReason: "",
        lossOtherReason: "",
        shortNote: "",
        note: "",
      },
    });
  }

  function setAdjustField(key, value) {
    setAdjustState((prev) => {
      const nextForm = { ...prev.form, [key]: value };

      if (key === "type") {
        nextForm.quantity = "";
        nextForm.newStockQty = "";
        nextForm.lossReason = "";
        nextForm.lossOtherReason = "";
        nextForm.shortNote = "";
        nextForm.note = "";
      }

      if (key === "lossReason" && value !== "OTHER") {
        nextForm.lossOtherReason = "";
      }

      return { ...prev, form: nextForm };
    });
  }

  async function submitAdjustStock() {
    const { product, form } = adjustState;
    if (!product) return;

    const currentQty = Number(product.stockQty || 0);
    let payload = null;

    if (form.type === "CORRECTION") {
      const newStockQty = Number(form.newStockQty);
      if (!Number.isFinite(newStockQty) || newStockQty < 0) {
        toast.error("New stock quantity must be 0 or more");
        return;
      }

      payload = {
        type: "CORRECTION",
        newStockQty: Math.floor(newStockQty),
        note: [String(form.shortNote || "").trim(), String(form.note || "").trim()]
          .filter(Boolean)
          .join(" | ") || null,
      };
    } else {
      const quantity = Number(form.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error("Quantity must be more than 0");
        return;
      }

      if (form.type === "LOSS") {
        if (!form.lossReason) {
          toast.error("Select a loss reason");
          return;
        }

        const allowedLossReasons = [
          "STOLEN",
          "DAMAGED",
          "LOST",
          "EXPIRED",
          "INTERNAL_USE",
          "COUNTING_ERROR",
          "OTHER",
        ];

        if (!allowedLossReasons.includes(form.lossReason)) {
          toast.error("Invalid loss reason");
          return;
        }

        if (
          (form.lossReason === "STOLEN" || form.lossReason === "OTHER") &&
          !String(form.note || "").trim()
        ) {
          toast.error("A note is required for stolen or other loss");
          return;
        }

        if (form.lossReason === "OTHER" && !String(form.lossOtherReason || "").trim()) {
          toast.error("Enter the other loss reason");
          return;
        }

        if (currentQty - Math.floor(quantity) < 0) {
          toast.error("Stock cannot go below 0");
          return;
        }

        payload = {
          type: "LOSS",
          quantity: Math.floor(quantity),
          lossReason: form.lossReason,
          note:
            form.lossReason === "OTHER"
              ? [
                  String(form.lossOtherReason || "").trim(),
                  String(form.note || "").trim(),
                ]
                  .filter(Boolean)
                  .join(" | ")
              : String(form.note || "").trim() || null,
        };
      } else {
        payload = {
          type: "RESTOCK",
          quantity: Math.floor(quantity),
          note: [String(form.shortNote || "").trim(), String(form.note || "").trim()]
            .filter(Boolean)
            .join(" | ") || null,
        };
      }
    }

    setAdjustState((prev) => ({ ...prev, loading: true }));

    try {
      await adjustStock(product.id, payload);
      toast.success("Stock updated");
      closeAdjustDialog();
      await refreshAll();
    } catch (err) {
      if (!handleSubscriptionBlockedError(err, { toastId: "inventory-adjust-blocked" })) {
        toast.error(err?.message || "Failed to adjust stock");
      }
      setAdjustState((prev) => ({ ...prev, loading: false }));
    }
  }

  const inventoryHealthTone =
    summary.outOfStockCount > 0
      ? "danger"
      : summary.lowStockCount > 0
      ? "warning"
      : "success";

  const inventoryHealthText =
    summary.outOfStockCount > 0
      ? `${summary.outOfStockCount} items need urgent replenishment`
      : summary.lowStockCount > 0
      ? `${summary.lowStockCount} items are approaching stock risk`
      : "Inventory is currently healthy";

  const currentScopeLabel = filters.outOfStock
    ? "Showing products that are already out of stock."
    : filters.lowStock
    ? `Showing products at or below low-stock level (${safeThreshold} default).`
    : "Showing current catalog state across active inventory.";

  return (
    <div className="space-y-5 sm:space-y-6">
      <ConfirmDialog
        open={confirmState.open}
        title="Deactivate product"
        message={
          confirmState.product
            ? `"${confirmState.product.name}" will be hidden from active inventory and daily selling flows until you activate it again.`
            : ""
        }
        confirmLabel="Deactivate"
        loading={confirmState.loading}
        onCancel={closeDeactivateDialog}
        onConfirm={confirmDeactivate}
      />

      <StockAdjustDialog
        open={adjustState.open}
        product={adjustState.product}
        loading={adjustState.loading}
        form={adjustState.form}
        onChange={setAdjustField}
        onClose={closeAdjustDialog}
        onSubmit={submitAdjustStock}
      />

      <section className="space-y-5 sm:space-y-6">
        <div>
          <h1 className={cx("text-4xl font-black tracking-tight sm:text-5xl", strongText())}>
            Inventory
          </h1>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {initialSummaryLoading ? (
            <div className="col-span-full">
              <PageSkeleton variant="dashboard" />
            </div>
          ) : (
            <>
              <SummaryCard
                label="Active products"
                value={summary.totalActiveProducts}
                note="Products currently available in your catalog"
                tone="neutral"
                icon={<CubeIcon />}
              />

              <SummaryCard
                label="Units in stock"
                value={summary.totalStockUnits}
                note="Total sellable units currently on hand"
                tone="warning"
                icon={<BoxesIcon />}
              />

              <SummaryCard
                label="Inventory cost value"
                value={formatMoney(summary.stockCostValue)}
                note="Capital currently tied up in stock"
                tone="neutral"
                icon={<WalletIcon />}
              />

              <SummaryCard
                label="Inventory retail value"
                value={formatMoney(summary.stockSellValue)}
                note={inventoryHealthText}
                tone={inventoryHealthTone}
                icon={<TrendUpIcon />}
              />
            </>
          )}
        </section>
      </section>

      {!initialSummaryLoading ? (
        <section className={cx(pageCard(), "p-5 sm:p-6")}>
          <SectionHeader title="Inventory focus" subtitle={currentScopeLabel} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className={cx(softPanel(), "px-4 py-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Out of stock
              </div>
              <div className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>
                {summary.outOfStockCount}
              </div>
            </div>

            <div className={cx(softPanel(), "px-4 py-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Low stock
              </div>
              <div className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>
                {summary.lowStockCount}
              </div>
            </div>

            <div className={cx(softPanel(), "px-4 py-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Current focus
              </div>
              <div className={cx("mt-3 text-sm leading-6", strongText())}>{currentScopeLabel}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <SectionHeader
          title="Inventory control"
          subtitle="Monitor stock position, value on hand, replenishment risk, and catalog quality from one operational screen."
          right={
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/app/inventory/reorder")}
                className={secondaryBtn()}
              >
                Reorder list
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/inventory/stock-history")}
                className={secondaryBtn()}
              >
                Stock history
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className={secondaryBtn()}
              >
                {downloadingExcel ? "Downloading..." : "Download Excel"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/inventory/create")}
                className={primaryBtn()}
              >
                Add product
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className={cx("text-sm font-medium", strongText())}>Search</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="Search product name..."
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Sort</label>
            <select
              className={cx(inputClass(), "mt-2")}
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="stock_low">Stock low → high</option>
              <option value="stock_high">Stock high → low</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Status</label>
            <select
              className={cx(inputClass(), "mt-2")}
              value={filters.active}
              onChange={(e) => setFilter("active", e.target.value)}
            >
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Category</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="Phones, Laptops..."
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Brand</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="Apple, Samsung..."
              value={filters.brand}
              onChange={(e) => setFilter("brand", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={!filters.lowStock && !filters.outOfStock}
              onClick={() => {
                setFilter("lowStock", false);
                setFilter("outOfStock", false);
              }}
            >
              All products
            </FilterChip>

            <FilterChip
              active={filters.lowStock && !filters.outOfStock}
              tone="warning"
              onClick={() => {
                setFilter("lowStock", true);
                setFilter("outOfStock", false);
              }}
            >
              Low stock
            </FilterChip>

            <FilterChip
              active={filters.outOfStock}
              tone="danger"
              onClick={() => {
                setFilter("outOfStock", true);
                setFilter("lowStock", false);
              }}
            >
              Out of stock
            </FilterChip>
          </div>

          <div className="flex items-center gap-2">
            <label className={cx("text-sm", mutedText())}>Default low-stock level</label>
            <input
              type="number"
              min="0"
              className="h-11 w-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
              value={filters.threshold}
              onChange={(e) => setFilter("threshold", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="hidden xl:block">
          <div className={pageCard()}>
            <RefreshBar visible={refreshingList} />

            <div className="border-b border-[var(--color-border)] px-6 py-4">
              <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_170px_220px_72px] gap-10">
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Product
                </div>
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Category
                </div>
                <div className={cx("text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Selling price
                </div>
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Stock state
                </div>
                <div className={cx("text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  More
                </div>
              </div>
            </div>

            {initialListLoading && showInitialSkeleton && products.length === 0 ? (
              <div className="px-5 py-6">
                <PageSkeleton titleWidth="w-40" lines={1} showTable={true} />
              </div>
            ) : !initialListLoading && products.length === 0 ? (
              <div className={cx("px-5 py-14 text-center text-sm", mutedText())}>
                No products found for the current filters.
              </div>
            ) : (
              <div className={cx("space-y-3 px-4 py-4", refreshingList ? "opacity-80" : "opacity-100")}>
                {products.map((product) => (
                  <DesktopRow
                    key={product.id}
                    product={product}
                    threshold={safeThreshold}
                    busyId={busyId}
                    onEdit={(id) => navigate(`/app/inventory/${id}/edit`)}
                    onAdjust={openAdjustDialog}
                    onDeactivate={openDeactivateDialog}
                    onActivate={handleActivate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:hidden">
          {initialListLoading && showInitialSkeleton && products.length === 0 ? (
            <PageSkeleton titleWidth="w-40" lines={1} showTable={true} />
          ) : !initialListLoading && products.length === 0 ? (
            <div className={cx(pageCard(), "px-4 py-10 text-center text-sm", mutedText())}>
              No products found for the current filters.
            </div>
          ) : (
            <>
              {refreshingList ? (
                <div className={cx(pageCard(), "px-4 py-2 text-xs", mutedText())}>
                  Refreshing inventory…
                </div>
              ) : null}

              <div className={cx("grid grid-cols-1 gap-3", refreshingList ? "opacity-80" : "opacity-100")}>
                {products.map((product) => (
                  <MobileCard
                    key={product.id}
                    product={product}
                    threshold={safeThreshold}
                    busyId={busyId}
                    onEdit={(id) => navigate(`/app/inventory/${id}/edit`)}
                    onAdjust={openAdjustDialog}
                    onDeactivate={openDeactivateDialog}
                    onActivate={handleActivate}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!initialListLoading && products.length > 0 ? (
          <div className="flex flex-col items-center gap-2">
            {nextCursor ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className={cx(secondaryBtn(), "min-w-[160px]")}
              >
                {loadingMore ? "Loading..." : "Load 10 more"}
              </button>
            ) : (
              <div className={cx("text-sm", mutedText())}>All matching products loaded</div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}