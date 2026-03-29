import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";

import { listOutstandingCredit, listOverdueCredit } from "../../services/posApi";

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

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
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "danger"
      ? "bg-rose-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "success"
      ? "bg-emerald-500"
      : "bg-stone-900 dark:bg-[rgb(var(--text))]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
        {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
      </div>
    </div>
  );
}

function CreditList({ title, rows, loading, tone = "neutral" }) {
  const headerTone =
    tone === "danger"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "warning"
      ? "text-amber-700 dark:text-amber-300"
      : strongText();

  return (
    <div className={shell()}>
      <div className="border-b border-stone-200 px-5 py-4 dark:border-[rgb(var(--border))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={cx("text-lg font-semibold", headerTone)}>{title}</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              {title === "Overdue"
                ? "Balances past their due date and needing urgent follow-up."
                : "Open credit balances that are still within active collection."}
            </p>
          </div>

          {!loading ? (
            <div className={cx("text-sm", mutedText())}>
              {rows.length} record{rows.length === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="p-4">
          <table className="w-full">
            <tbody>
              <TableSkeleton rows={6} cols={4} />
            </tbody>
          </table>
        </div>
      ) : rows.length === 0 ? (
        <div className={cx("px-5 py-10 text-center text-sm", mutedText())}>No records.</div>
      ) : (
        <div className="divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
          {rows.map((s) => (
            <Link
              key={s.id}
              to={`/app/pos/sales/${s.id}`}
              className="block px-5 py-4 transition hover:bg-stone-50 dark:hover:bg-[rgb(var(--bg-muted))]"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className={cx("text-sm font-semibold", strongText())}>
                    {formatMoney(s.balanceDue)} due
                    <span className={cx("mx-2", softText())}>•</span>
                    Total {formatMoney(s.total)}
                  </div>

                  <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                    Customer: {s.customer?.name || "—"} ({s.customer?.phone || "—"})
                    <span className={cx("mx-2", softText())}>•</span>
                    Due: {s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}
                  </div>
                </div>

                <div className="text-left lg:text-right">
                  <div className={cx("text-xs", softText())}>Created</div>
                  <div className={cx("mt-1 text-sm font-medium", strongText())}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreditDashboard() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [outstanding, setOutstanding] = useState([]);
  const [overdue, setOverdue] = useState([]);

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
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load credit sales");
      if (!mountedRef.current) return;
      setOutstanding([]);
      setOverdue([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const outstandingTotal = useMemo(() => {
    return outstanding.reduce((sum, s) => sum + Number(s.balanceDue || 0), 0);
  }, [outstanding]);

  const overdueTotal = useMemo(() => {
    return overdue.reduce((sum, s) => sum + Number(s.balanceDue || 0), 0);
  }, [overdue]);

  const totalAccounts = overdue.length + outstanding.length;

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                POS
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Credit control
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Track overdue balances, open receivables, and customer exposure from one
                collection dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => nav("/app/pos")}
                className={secondaryBtn()}
              >
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
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cx(shell(), "p-4 animate-pulse")}>
                    <div className="h-3 w-24 rounded bg-stone-200" />
                    <div className="mt-3 h-7 w-28 rounded bg-stone-200" />
                    <div className="mt-2 h-4 w-36 rounded bg-stone-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <SummaryCard
                label="Outstanding accounts"
                value={outstanding.length}
                note="Open credit records"
                tone="warning"
              />
              <SummaryCard
                label="Outstanding value"
                value={formatMoney(outstandingTotal)}
                note="Receivable balance still open"
                tone="warning"
              />
              <SummaryCard
                label="Overdue accounts"
                value={overdue.length}
                note="Accounts needing urgent action"
                tone="danger"
              />
              <SummaryCard
                label="Overdue value"
                value={formatMoney(overdueTotal)}
                note={`${totalAccounts} total active credit account${totalAccounts === 1 ? "" : "s"}`}
                tone="danger"
              />
            </>
          )}
        </div>
      </section>

      <CreditList title="Overdue" rows={overdue} loading={loading} tone="danger" />
      <CreditList title="Outstanding" rows={outstanding} loading={loading} tone="warning" />
    </div>
  );
}