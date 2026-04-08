import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { listOutstandingCredit, listOverdueCredit } from "../../services/posApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

const PAGE_SIZE = 10;
const formatMoney = (n) => `Rwf ${Number(n || 0).toLocaleString("en-US")}`;

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
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

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
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
            <path d="M4 7h16M7 12h10M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
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

function CreditListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-4 sm:p-5")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-4 w-52" />
            </div>

            <div className="flex gap-2">
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>

          <div className="mt-4 flex justify-end">
            <SkeletonBlock className="h-11 w-32 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CreditInfoTile({ label, value, tone = "neutral" }) {
  const toneCls =
    tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] border-[rgba(219,80,74,0.20)]"
      : tone === "warning"
      ? "bg-[#fff1c9] border-[#fde68a]"
      : tone === "success"
      ? "bg-[#dcfce7] border-[#bbf7d0]"
      : "bg-[var(--color-surface-2)] border-[var(--color-border)]";

  const valueCls =
    tone === "danger"
      ? "text-[var(--color-danger)]"
      : tone === "warning"
      ? "text-[#9a6b00]"
      : tone === "success"
      ? "text-[#166534]"
      : strongText();

  return (
    <div className={cx("rounded-[22px] border p-4 shadow-[var(--shadow-soft)]", toneCls)}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>{label}</div>
      <div className={cx("mt-3 text-sm font-bold leading-6", valueCls)}>{value}</div>
    </div>
  );
}

function relativeDaysLabel(dueDate) {
  if (!dueDate) return "No due date";
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "No due date";

  const today = new Date();
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = dueOnly.getTime() - todayOnly.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays < 0) return `${Math.abs(diffDays)} day(s) overdue`;
  if (diffDays === 0) return "Due today";
  return `Due in ${diffDays} day(s)`;
}

function CreditCard({ sale, tone = "warning" }) {
  const isOverdue = tone === "danger";
  const customerName = sale.customer?.name || "Unknown customer";
  const customerPhone = sale.customer?.phone || "No phone";
  const balanceDue = Number(sale.balanceDue || 0);
  const total = Number(sale.total || 0);
  const paid = Math.max(0, total - balanceDue);

  return (
    <article className={cx(pageCard(), "border border-[var(--color-border)] p-4 sm:p-5")}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cx("text-lg font-black tracking-tight", strongText())}>
              {formatMoney(balanceDue)}
            </div>
            {isOverdue ? (
              <StatusBadge kind="danger">Overdue</StatusBadge>
            ) : (
              <StatusBadge kind="warning">Outstanding</StatusBadge>
            )}
            <StatusBadge kind="neutral">Credit sale</StatusBadge>
          </div>

          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Customer: <span className={cx("font-semibold", strongText())}>{customerName}</span>
            {" • "}
            {customerPhone}
          </div>
        </div>

        <Link to={`/app/pos/sales/${sale.id}`} className={primaryBtn()}>
          View receipt
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CreditInfoTile
          label="Customer"
          value={
            <div>
              <div>{customerName}</div>
              <div className="mt-1 text-xs font-medium opacity-80">{customerPhone}</div>
            </div>
          }
        />

        <CreditInfoTile
          label="Sale total"
          value={formatMoney(total)}
          tone="neutral"
        />

        <CreditInfoTile
          label="Paid so far"
          value={formatMoney(paid)}
          tone={paid > 0 ? "success" : "neutral"}
        />

        <CreditInfoTile
          label="Due status"
          value={
            <div>
              <div>{sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : "—"}</div>
              <div className="mt-1 text-xs font-medium opacity-80">{relativeDaysLabel(sale.dueDate)}</div>
            </div>
          }
          tone={isOverdue ? "danger" : "warning"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Cashier
          </div>
          <div className={cx("mt-3 text-sm font-bold leading-6", strongText())}>
            {sale.cashier?.name || "Unknown cashier"}
          </div>
          <div className={cx("mt-1 text-sm leading-6", mutedText())}>
            {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—"}
          </div>
        </div>

        <div
          className={cx(
            "rounded-[22px] border p-4 shadow-[var(--shadow-soft)]",
            isOverdue
              ? "border-[rgba(219,80,74,0.20)] bg-[rgba(219,80,74,0.12)]"
              : "border-[#fde68a] bg-[#fff1c9]"
          )}
        >
          <div
            className={cx(
              "text-[11px] font-semibold uppercase tracking-[0.18em]",
              isOverdue ? "text-[var(--color-danger)]" : "text-[#b88900]"
            )}
          >
            Collection note
          </div>
          <div
            className={cx(
              "mt-3 text-sm font-bold leading-6",
              isOverdue ? "text-[var(--color-danger)]" : "text-[#9a6b00]"
            )}
          >
            {isOverdue ? "Needs immediate follow-up" : "Balance still active"}
          </div>
        </div>
      </div>
    </article>
  );
}

function CreditSection({
  title,
  subtitle,
  rows,
  loading,
  tone = "warning",
  visibleCount,
  onLoadMore,
}) {
  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <section className={cx(pageCard(), "overflow-hidden")}>
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={cx("text-xl font-black tracking-tight", strongText())}>{title}</div>
            <div className={cx("mt-2 text-sm leading-6", mutedText())}>{subtitle}</div>
          </div>

          {!loading ? (
            tone === "danger" ? (
              <StatusBadge kind="danger">{rows.length} account(s)</StatusBadge>
            ) : (
              <StatusBadge kind="warning">{rows.length} account(s)</StatusBadge>
            )
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <CreditListSkeleton />
        ) : rows.length === 0 ? (
          <div className={cx("rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm", mutedText())}>
            {tone === "danger"
              ? "No overdue credit accounts right now."
              : "No outstanding credit accounts right now."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {visibleRows.map((sale, idx) => (
                <div
                  key={sale.id}
                  className={cx(
                    idx % 2 === 0 ? "relative" : "relative"
                  )}
                >
                  <CreditCard sale={sale} tone={tone} />
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col items-center gap-2">
              {hasMore ? (
                <button type="button" onClick={onLoadMore} className={primaryBtn()}>
                  Load 10 more
                </button>
              ) : (
                <div className={cx("text-sm", mutedText())}>All matching accounts loaded</div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function CreditDashboard() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [outstanding, setOutstanding] = useState([]);
  const [overdue, setOverdue] = useState([]);

  const [outstandingVisible, setOutstandingVisible] = useState(PAGE_SIZE);
  const [overdueVisible, setOverdueVisible] = useState(PAGE_SIZE);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [o1, o2] = await Promise.all([listOutstandingCredit(), listOverdueCredit()]);
      if (!mountedRef.current) return;

      setOutstanding(Array.isArray(o1?.sales) ? o1.sales : []);
      setOverdue(Array.isArray(o2?.sales) ? o2.sales : []);
      setOutstandingVisible(PAGE_SIZE);
      setOverdueVisible(PAGE_SIZE);
    } catch (e) {
      console.error(e);
      if (!handleSubscriptionBlockedError(e, { toastId: "credit-dashboard-blocked" })) {
        toast.error(e?.message || "Failed to load credit sales");
      }
      if (!mountedRef.current) return;
      setOutstanding([]);
      setOverdue([]);
      setOutstandingVisible(PAGE_SIZE);
      setOverdueVisible(PAGE_SIZE);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const outstandingTotal = useMemo(() => {
    return outstanding.reduce((sum, s) => sum + Number(s.balanceDue || 0), 0);
  }, [outstanding]);

  const overdueTotal = useMemo(() => {
    return overdue.reduce((sum, s) => sum + Number(s.balanceDue || 0), 0);
  }, [overdue]);

  const totalAccounts = overdue.length + outstanding.length;

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionHeading
            eyebrow="POS"
            title="Credit control"
            subtitle="Track overdue balances, open receivables, and customer exposure from one collection dashboard."
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => nav("/app/pos")} className={secondaryBtn()}>
              Back to POS
            </button>

            <Link to="/app/pos" className={primaryBtn()}>
              New sale
            </Link>

            <AsyncButton loading={loading} onClick={load} className={secondaryBtn()}>
              Refresh
            </AsyncButton>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Outstanding accounts"
            value={outstanding.length}
            note="Open credit records"
            tone="warning"
          />
          <MetricCard
            label="Outstanding value"
            value={formatMoney(outstandingTotal)}
            note="Receivable balance still open"
            tone="warning"
          />
          <MetricCard
            label="Overdue accounts"
            value={overdue.length}
            note="Accounts needing urgent action"
            tone="danger"
          />
          <MetricCard
            label="Overdue value"
            value={formatMoney(overdueTotal)}
            note={`${totalAccounts} total active credit account${totalAccounts === 1 ? "" : "s"}`}
            tone="danger"
          />
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className={cx("text-base font-bold", strongText())}>Collections focus</div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Use this screen to prioritize who needs follow-up first and where cash is still trapped.
          </div>

          <div className="mt-5 space-y-3">
            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Immediate risk
              </div>
              <div className={cx("mt-3 text-lg font-bold", strongText())}>
                {overdue.length} overdue account{overdue.length === 1 ? "" : "s"}
              </div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Prioritize balances that already crossed their due date.
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Open exposure
              </div>
              <div className={cx("mt-3 text-lg font-bold", strongText())}>
                {formatMoney(outstandingTotal + overdueTotal)}
              </div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Total credit still not collected.
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Collection discipline
              </div>
              <div className={cx("mt-3 space-y-3 text-sm leading-6", mutedText())}>
                <div>Start with overdue balances first.</div>
                <div>Review receipt details before contacting the customer.</div>
                <div>Push partial payers toward full settlement quickly.</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <CreditSection
            title="Overdue"
            subtitle="Balances past their due date and needing urgent follow-up."
            rows={overdue}
            loading={loading}
            tone="danger"
            visibleCount={overdueVisible}
            onLoadMore={() => setOverdueVisible((prev) => prev + PAGE_SIZE)}
          />

          <CreditSection
            title="Outstanding"
            subtitle="Open credit balances that are still within active collection."
            rows={outstanding}
            loading={loading}
            tone="warning"
            visibleCount={outstandingVisible}
            onLoadMore={() => setOutstandingVisible((prev) => prev + PAGE_SIZE)}
          />
        </div>
      </div>
    </div>
  );
}