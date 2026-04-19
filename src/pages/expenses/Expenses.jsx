// src/pages/expenses/Expenses.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  approveExpense,
  createExpense,
  deleteExpense,
  getExpenses,
} from "../../services/expensesApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "RENT",        label: "Rent" },
  { value: "SALARY",      label: "Salary" },
  { value: "UTILITIES",   label: "Utilities" },
  { value: "TRANSPORT",   label: "Transport" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER",       label: "Other" },
];

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const PAGE_SIZE = 15;

const formatMoney = (n) => `Rwf ${Number(n || 0).toLocaleString("en-US")}`;

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function relativeTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

// ─── style helpers (matching SalesList/CashDrawer exactly) ────────────────────

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}
function strongText() { return "text-[var(--color-text)]"; }
function mutedText()  { return "text-[var(--color-text-muted)]"; }
function softText()   { return "text-[var(--color-text-muted)]"; }

function pageCard() {
  return "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}
function raisedPanel() {
  return "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]";
}
function softPanel() {
  return "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-2)]";
}
function inputClass() { return "app-input"; }

function primaryBtn(disabled = false) {
  return cx(
    "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95",
    disabled ? "cursor-not-allowed opacity-60" : ""
  );
}
function secondaryBtn(disabled = false) {
  return cx(
    "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90",
    disabled ? "cursor-not-allowed opacity-60" : ""
  );
}
function dangerBtn(disabled = false) {
  return cx(
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition",
    disabled
      ? "cursor-not-allowed bg-[rgba(219,80,74,0.08)] text-[var(--color-danger)] opacity-50"
      : "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)] hover:opacity-90"
  );
}
function successBtn(disabled = false) {
  return cx(
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition",
    disabled
      ? "cursor-not-allowed bg-[rgba(21,128,61,0.08)] text-[#15803d] opacity-50"
      : "bg-[#dcfce7] text-[#15803d] hover:opacity-90"
  );
}

// ─── small atoms ─────────────────────────────────────────────────────────────

function SkeletonBlock({ className = "" }) {
  return (
    <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />
  );
}

function StatusBadge({ status }) {
  const approved = status === "APPROVED";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        approved
          ? "bg-[#dcfce7] text-[#15803d]"
          : "bg-[#fff1c9] text-[#b88900]"
      )}
    >
      {approved ? "Approved" : "Pending"}
    </span>
  );
}

function CategoryPill({ category }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
      {CATEGORY_LABEL[category] || category}
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
      {subtitle ? (
        <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const iconTone =
    tone === "danger"  ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
    : tone === "warning" ? "bg-[#fff1c9] text-[#b88900]"
    : tone === "success" ? "bg-[#dcfce7] text-[#15803d]"
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
            <rect x="3" y="6" width="18" height="12" rx="2.5" />
            <path d="M7 12h4M15 12h2M12 9v6" strokeLinecap="round" />
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

function EmptyState({ onAdd }) {
  return (
    <div className={cx(softPanel(), "px-4 py-16 text-center")}>
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]"
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M7 12h10M12 9v6" strokeLinecap="round" />
        </svg>
      </div>
      <div className={cx("text-base font-bold", strongText())}>No expenses yet</div>
      <div className={cx("mt-2 text-sm leading-6", mutedText())}>
        Use the form to log a business expense for owner review.
      </div>
      {onAdd ? (
        <button type="button" onClick={onAdd} className={cx(primaryBtn(), "mt-5")}>
          Log first expense
        </button>
      ) : null}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-4 sm:p-5")}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-7 w-32 rounded-full" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
            <div className="flex justify-end gap-2">
              <SkeletonBlock className="h-11 w-24 rounded-2xl" />
              <SkeletonBlock className="h-11 w-24 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── expense card ─────────────────────────────────────────────────────────────

function ExpenseCard({ expense, onApprove, onDelete, approveBusy, deleteBusy, index }) {
  const isApproved = expense.status === "APPROVED";

  return (
    <div
      className={cx(
        pageCard(),
        "relative overflow-hidden p-4 sm:p-5",
        index % 2 === 0 ? "bg-[var(--color-card)]" : "bg-[var(--color-surface)]"
      )}
    >
      {/* left accent bar */}
      <div
        className={cx(
          "absolute left-0 top-0 h-full w-1.5",
          isApproved ? "bg-[#15803d]" : "bg-[#b88900]",
          "opacity-80"
        )}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--color-border)]" />

      <div className="pl-2">
        <div className="flex flex-col gap-4">
          {/* header row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx("text-[1.1rem] font-black tracking-tight", strongText())}>
                  {formatMoney(expense.amount)}
                </span>
                <StatusBadge status={expense.status} />
                <CategoryPill category={expense.category} />
              </div>
              <div className={cx("mt-1.5 text-sm font-semibold", strongText())}>
                {expense.title}
              </div>
              {expense.notes ? (
                <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                  {expense.notes}
                </div>
              ) : null}
            </div>

            {/* actions */}
            <div className="flex flex-shrink-0 flex-wrap gap-2 sm:justify-end">
              {!isApproved ? (
                <button
                  type="button"
                  disabled={approveBusy}
                  onClick={() => onApprove(expense.id)}
                  className={successBtn(approveBusy)}
                  title="Mark this expense as approved and record it as a real cash outflow"
                >
                  {approveBusy ? "Approving…" : "Approve"}
                </button>
              ) : null}

              <button
                type="button"
                disabled={isApproved || deleteBusy}
                onClick={() => onDelete(expense)}
                className={dangerBtn(isApproved || deleteBusy)}
                title={isApproved ? "Approved expenses cannot be deleted" : "Delete this pending expense"}
              >
                Delete
              </button>
            </div>
          </div>

          {/* detail tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={cx(raisedPanel(), "p-3.5")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Logged by
              </div>
              <div className={cx("mt-2.5 text-sm font-bold leading-snug", strongText())}>
                {expense.createdBy?.name || "—"}
              </div>
              <div className={cx("mt-0.5 text-xs", mutedText())}>
                {relativeTime(expense.createdAt)}
              </div>
            </div>

            <div className={cx(raisedPanel(), "p-3.5")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Date
              </div>
              <div className={cx("mt-2.5 text-sm font-bold", strongText())}>
                {formatDate(expense.createdAt)}
              </div>
            </div>

            <div className={cx(raisedPanel(), "p-3.5")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Category
              </div>
              <div className={cx("mt-2.5 text-sm font-bold", strongText())}>
                {CATEGORY_LABEL[expense.category] || expense.category}
              </div>
            </div>

            <div
              className={cx(
                "rounded-[22px] border p-3.5 shadow-[var(--shadow-soft)]",
                isApproved
                  ? "border-[#bbf7d0] bg-[#dcfce7]"
                  : "border-[#fde68a] bg-[#fff1c9]"
              )}
            >
              <div
                className={cx(
                  "text-[10px] font-semibold uppercase tracking-[0.18em]",
                  isApproved ? "text-[rgba(15,23,42,0.62)]" : "text-[rgba(15,23,42,0.62)]"
                )}
              >
                {isApproved ? "Approved by" : "Awaiting"}
              </div>
              <div
                className={cx(
                  "mt-2.5 text-sm font-bold",
                  isApproved ? "text-[#166534]" : "text-[#92400e]"
                )}
              >
                {isApproved
                  ? (expense.approvedBy?.name || "Owner")
                  : "Owner approval"}
              </div>
              {isApproved && expense.approvedAt ? (
                <div className="mt-0.5 text-xs text-[#166534]">
                  {formatDate(expense.approvedAt)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── create form ──────────────────────────────────────────────────────────────

const EMPTY_FORM = { title: "", category: "RENT", amount: "", notes: "" };

function CreateExpenseForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const title = String(form.title || "").trim();
    if (!title) { toast.error("Title is required"); return; }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid positive amount");
      return;
    }

    setBusy(true);
    try {
      const expense = await createExpense({
        title,
        category: form.category,
        amount,
        notes: String(form.notes || "").trim() || undefined,
      });

      toast.success("Expense logged successfully");
      setForm(EMPTY_FORM);
      onCreated(expense);
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "expense-create-blocked" })) return;
      toast.error(err?.message || "Failed to log expense");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cx(pageCard(), "p-5 sm:p-6")}>
      <div className={cx("text-base font-bold", strongText())}>Log new expense</div>
      <p className={cx("mt-1.5 text-sm leading-6", mutedText())}>
        Submitted expenses are <span className={cx("font-semibold", strongText())}>pending</span> until an owner approves them. Approved expenses are recorded as real cash outflows.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
            Title <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            className={inputClass()}
            placeholder="e.g. Monthly electricity bill"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
              Category <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              className={inputClass()}
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
              Amount (Rwf) <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              className={inputClass()}
              placeholder="0"
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
            Notes <span className={cx("font-normal", mutedText())}>(optional)</span>
          </label>
          <textarea
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)] min-h-[80px] resize-none"
            placeholder="Any supporting detail…"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {onCancel ? (
            <button type="button" disabled={busy} onClick={onCancel} className={secondaryBtn(busy)}>
              Cancel
            </button>
          ) : null}
          <button type="submit" disabled={busy} className={primaryBtn(busy)}>
            {busy ? "Logging…" : "Log expense"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── confirm delete dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({ expense, busy, onConfirm, onClose }) {
  if (!expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className={cx(pageCard(), "w-full max-w-md p-5 sm:p-6")}>
        <div className={cx("text-lg font-bold", strongText())}>Delete expense?</div>

        <div className={cx("mt-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4")}>
          <div className={cx("text-base font-black", strongText())}>
            {formatMoney(expense.amount)}
          </div>
          <div className={cx("mt-1 text-sm font-semibold", strongText())}>
            {expense.title}
          </div>
          <div className={cx("mt-1 text-xs", mutedText())}>
            {CATEGORY_LABEL[expense.category]} · logged {relativeTime(expense.createdAt)}
          </div>
        </div>

        <p className={cx("mt-4 text-sm leading-6", mutedText())}>
          This will permanently remove the pending expense. Only pending expenses can be deleted — approved ones are part of the financial record.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" disabled={busy} onClick={onClose} className={secondaryBtn(busy)}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className={dangerBtn(busy)}>
            {busy ? "Deleting…" : "Delete expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Expenses() {
  const [loading, setLoading]       = useState(true);
  const [expenses, setExpenses]     = useState([]);
  const [q, setQ]                   = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showForm, setShowForm]     = useState(false);

  // approve
  const [approveBusy, setApproveBusy] = useState("");

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy]     = useState(false);

  const abortRef   = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── load ──────────────────────────────────────────────────────────────────

  async function load() {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await getExpenses();
      if (!mountedRef.current || controller.signal.aborted) return;

      const list = Array.isArray(data?.expenses) ? data.expenses : [];
      setExpenses(list);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (!handleSubscriptionBlockedError(err, { toastId: "expenses-load-blocked" })) {
        toast.error(err?.message || "Failed to load expenses");
      }
      if (!mountedRef.current) return;
      setExpenses([]);
    } finally {
      if (!mountedRef.current || controller.signal.aborted) return;
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line

  // ── filter ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = expenses;

    if (filterStatus !== "ALL") {
      list = list.filter((e) => e.status === filterStatus);
    }

    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((e) =>
        String(e.title || "").toLowerCase().includes(s) ||
        String(e.category || "").toLowerCase().includes(s) ||
        String(e.createdBy?.name || "").toLowerCase().includes(s) ||
        String(e.notes || "").toLowerCase().includes(s)
      );
    }

    return list;
  }, [expenses, q, filterStatus]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [q, filterStatus]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // ── summary ───────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const total     = expenses.length;
    const pending   = expenses.filter((e) => e.status === "PENDING").length;
    const approved  = expenses.filter((e) => e.status === "APPROVED").length;
    const totalAmt  = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const approvedAmt = expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    return { total, pending, approved, totalAmt, approvedAmt };
  }, [expenses]);

  // ── approve ───────────────────────────────────────────────────────────────

  async function handleApprove(id) {
    setApproveBusy(id);
    try {
      const updated = await approveExpense(id);
      // Merge only scalar fields — preserve createdBy/approvedBy relations from the list
      // (approve endpoint returns expense without includes)
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status:      updated?.status      ?? "APPROVED",
                approvedAt:  updated?.approvedAt  ?? new Date().toISOString(),
                approvedById:updated?.approvedById ?? null,
              }
            : e
        )
      );
      toast.success("Expense approved — recorded as cash outflow");
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "expense-approve-blocked" })) return;
      toast.error(err?.message || "Failed to approve expense");
    } finally {
      setApproveBusy("");
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  function openDelete(expense) {
    setDeleteTarget(expense);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteExpense(deleteTarget.id);
      setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Expense deleted");
      setDeleteTarget(null);
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "expense-delete-blocked" })) return;
      toast.error(err?.message || "Failed to delete expense");
    } finally {
      setDeleteBusy(false);
    }
  }

  // ── create callback ───────────────────────────────────────────────────────

  function handleCreated(expense) {
    setExpenses((prev) => [expense, ...prev]);
    setShowForm(false);
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* page heading + top actions */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionHeading
            eyebrow="Finance"
            title="Expenses"
            subtitle="Log, review, and approve business cash outflows. Pending expenses require owner approval before they become part of the financial record."
          />

          <div className="flex flex-wrap gap-2">
            <AsyncButton loading={loading} onClick={load} className={secondaryBtn()}>
              Refresh
            </AsyncButton>
            <button
              type="button"
              onClick={() => setShowForm((p) => !p)}
              className={primaryBtn()}
            >
              {showForm ? "Close form" : "Log expense"}
            </button>
          </div>
        </div>

        {/* summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total logged"
            value={summary.total}
            note="All expense entries"
          />
          <SummaryCard
            label="Pending approval"
            value={summary.pending}
            note="Not yet approved by owner"
            tone="warning"
          />
          <SummaryCard
            label="Approved"
            value={summary.approved}
            note="Confirmed cash outflows"
            tone="success"
          />
          <SummaryCard
            label="Approved total"
            value={formatMoney(summary.approvedAmt)}
            note="Real money out of the business"
            tone="danger"
          />
        </section>
      </section>

      {/* create form (inline toggle) */}
      {showForm ? (
        <CreateExpenseForm
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {/* list section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* sidebar filters */}
        <aside className={cx(pageCard(), "h-fit p-5 sm:p-6")}>
          <div className={cx("text-base font-bold", strongText())}>Filter expenses</div>

          <div className="mt-4 space-y-4">
            <div>
              <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                Search
              </label>
              <input
                className={inputClass()}
                placeholder="Title, category, logged by…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                Status
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: "ALL",      label: "All expenses" },
                  { value: "PENDING",  label: "Pending only" },
                  { value: "APPROVED", label: "Approved only" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterStatus(opt.value)}
                    className={cx(
                      "rounded-2xl border px-4 py-2.5 text-left text-sm font-semibold transition",
                      filterStatus === opt.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Showing
              </div>
              <div className={cx("mt-2.5 text-lg font-bold", strongText())}>
                {filtered.length} expense{filtered.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Approval rule
              </div>
              <div className={cx("mt-2.5 text-sm leading-6", mutedText())}>
                Only <span className={cx("font-semibold", strongText())}>pending</span> expenses can be deleted. Approved expenses are permanent financial records.
              </div>
            </div>
          </div>
        </aside>

        {/* expense list */}
        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={cx("text-xl font-bold", strongText())}>Expense ledger</div>
                <div className={cx("mt-1.5 text-sm leading-6", mutedText())}>
                  Approve pending requests or delete erroneous entries before they become permanent records.
                </div>
              </div>

              {!loading ? (
                <span className="inline-flex items-center self-start rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  {visible.length} of {filtered.length}
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <ListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState onAdd={expenses.length === 0 ? () => setShowForm(true) : null} />
            ) : (
              <>
                <div className="space-y-3">
                  {visible.map((expense, index) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      index={index}
                      onApprove={handleApprove}
                      onDelete={openDelete}
                      approveBusy={approveBusy === expense.id}
                      deleteBusy={deleteBusy && deleteTarget?.id === expense.id}
                    />
                  ))}
                </div>

                <div className="mt-5 flex justify-center">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}
                      className={secondaryBtn()}
                    >
                      Load more
                    </button>
                  ) : (
                    <div className={cx("text-sm", mutedText())}>
                      All {filtered.length} expenses shown
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* delete confirm modal */}
      <DeleteConfirmDialog
        expense={deleteTarget}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
