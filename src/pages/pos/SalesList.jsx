import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { listSales, cancelSale as cancelSaleApi } from "../../services/posApi";
import TableSkeleton from "../../components/ui/TableSkeleton";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

const PAGE_SIZE = 10;
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
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function panel() {
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function dangerBtn(disabled = false) {
  return cx(
    "inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
    disabled
      ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-400 opacity-70 dark:border-rose-900/30 dark:bg-rose-950/10 dark:text-rose-300/50"
      : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/30"
  );
}

function StatusTag({ status }) {
  const cls =
    status === "PAID"
      ? "badge-success"
      : status === "OVERDUE"
      ? "badge-danger"
      : "badge-warning";

  return <span className={cls}>{status}</span>;
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-rose-500"
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

function EmptyState({ title, text }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className={cx("text-base font-semibold", strongText())}>{title}</div>
        <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
      </div>
    </div>
  );
}

function SaleTypePill({ saleType }) {
  const isCash = String(saleType || "").toUpperCase() === "CASH";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
        isCash
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
      )}
    >
      {saleType}
    </span>
  );
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
  return d.toLocaleDateString();
}

export default function SalesList() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelSaleId, setCancelSaleId] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function load() {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await listSales();
      if (!mountedRef.current || controller.signal.aborted) return;

      const list = Array.isArray(data?.sales) ? data.sales : [];
      setSales(list);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error(e);

      if (!handleSubscriptionBlockedError(e, { toastId: "sales-list-blocked" })) {
        toast.error(e?.message || "Failed to load sales");
      }

      if (!mountedRef.current) return;
      setSales([]);
      setVisibleCount(PAGE_SIZE);
    } finally {
      if (!mountedRef.current || controller.signal.aborted) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sales;

    return sales.filter((x) => {
      const id = String(x.id || "").toLowerCase();
      const cashier = String(x.cashier?.name || "").toLowerCase();
      const customer = String(x.customer?.name || "").toLowerCase();
      const phone = String(x.customer?.phone || "").toLowerCase();
      return id.includes(s) || cashier.includes(s) || customer.includes(s) || phone.includes(s);
    });
  }, [sales, q]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q]);

  const visibleSales = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const hasMore = visibleCount < filtered.length;

  const summary = useMemo(() => {
    const total = sales.length;
    const paid = sales.filter((s) => s.status === "PAID").length;
    const overdue = sales.filter((s) => s.status === "OVERDUE").length;
    const credit = sales.filter((s) => s.saleType === "CREDIT").length;

    return { total, paid, overdue, credit };
  }, [sales]);

  function openCancel(saleId) {
    setCancelSaleId(String(saleId));
    setCancelNote("");
    setCancelOpen(true);
  }

  async function confirmCancel() {
    if (!cancelSaleId) return;
    setCancelBusy(true);
    try {
      await cancelSaleApi(cancelSaleId, { note: cancelNote || null });
      toast.success("Sale cancelled");
      setCancelOpen(false);
      setCancelSaleId("");
      setCancelNote("");
      await load();
    } catch (e) {
      console.error(e);
      if (handleSubscriptionBlockedError(e, { toastId: "sale-list-cancel-blocked" })) {
        return;
      }
      toast.error(e?.message || e?.response?.data?.message || "Failed to cancel sale");
    } finally {
      setCancelBusy(false);
    }
  }

  function canCancelFromList(sale) {
    if (!sale) return false;
    if (sale.saleType !== "CASH") return false;
    return true;
  }

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                POS
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Sales
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Search receipts, review sale history, cancel eligible cash sales, and move into
                refund flow from the receipt page.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => nav("/app/pos")} className={secondaryBtn()}>
                Back to POS
              </button>

              <Link to="/app/pos" className={primaryBtn()}>
                New sale
              </Link>

              <button type="button" onClick={load} disabled={loading} className={secondaryBtn()}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total sales"
            value={summary.total}
            note="All sales currently loaded"
          />
          <SummaryCard
            label="Paid"
            value={summary.paid}
            note="Fully paid sales"
            tone="success"
          />
          <SummaryCard
            label="Credit sales"
            value={summary.credit}
            note="Sales with balance flow"
            tone="warning"
          />
          <SummaryCard
            label="Overdue"
            value={summary.overdue}
            note="Need immediate attention"
            tone="danger"
          />
        </div>
      </section>

      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-4 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Sales ledger</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Find sales by customer, phone, cashier, or sale ID.
              </p>
            </div>

            <div className="w-full max-w-md">
              <input
                className={inputClass()}
                placeholder="Search by customer, phone, cashier, sale id..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className={cx(panel(), "overflow-hidden p-4")}>
              <table className="w-full">
                <tbody>
                  <TableSkeleton rows={8} cols={5} />
                </tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No sales found" text="There are no sales matching your search." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visibleSales.map((s) => {
                  const cancelEnabled = canCancelFromList(s);

                  return (
                    <div
                      key={s.id}
                      className={cx(
                        panel(),
                        "p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      )}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className={cx("text-base font-semibold", strongText())}>
                              {formatMoney(s.total)}
                            </div>
                            <SaleTypePill saleType={s.saleType} />
                            <StatusTag status={s.status} />
                          </div>

                          <div className="mt-2 text-sm">
                            {s.customer ? (
                              <div className="grid grid-cols-[140px_1fr] gap-y-1">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Customer Name
                                </span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {s.customer.name}
                                </span>

                                <span className="text-gray-600 dark:text-gray-400">
                                  Customer Phone
                                </span>
                                <span className="text-gray-800 dark:text-gray-200">
                                  {s.customer.phone || "Not provided"}
                                </span>
                              </div>
                            ) : (
                              <div className="text-gray-500 dark:text-gray-400 italic">
                                Walk-in customer
                              </div>
                            )}
                          </div>

                          <div className={cx("mt-1 text-sm", mutedText())}>
                            Cashier: {s.cashier?.name || "—"}
                          </div>

                          <div className={cx("mt-1 text-xs", softText())}>
                            {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
                          </div>

                          <div className={cx("mt-1 text-xs", softText())}>
                            Updated {relativeTime(s.updatedAt || s.createdAt)}
                          </div>

                          {s.saleType === "CREDIT" ? (
                            <div className={cx("mt-3 text-sm", mutedText())}>
                              Balance due:{" "}
                              <span className={cx("font-medium", strongText())}>
                                {formatMoney(s.balanceDue)}
                              </span>
                            </div>
                          ) : null}

                          <div className={cx("mt-2 text-xs", softText())}>
                            Sale ID: {String(s.id).slice(-8).toUpperCase()}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <Link to={`/app/pos/sales/${s.id}`} className={secondaryBtn()}>
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() => nav(`/app/pos/sales/${s.id}?refund=1`)}
                            className={secondaryBtn()}
                            title="Refund is done on the receipt page"
                          >
                            Refund
                          </button>

                          <button
                            type="button"
                            disabled={!cancelEnabled || cancelBusy}
                            onClick={() => openCancel(s.id)}
                            className={dangerBtn(!cancelEnabled || cancelBusy)}
                            title={!cancelEnabled ? "Only CASH sales can be cancelled here" : ""}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore ? (
                <div className="mt-5 flex justify-center">
                  <button type="button" onClick={handleLoadMore} className={primaryBtn()}>
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {cancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className={cx(shell(), "w-full max-w-md p-5")}>
            <div className={cx("text-lg font-semibold", strongText())}>Cancel sale</div>
            <p className={cx("mt-1 text-sm", mutedText())}>
              This will restock the items and mark the sale as cancelled.
            </p>

            <textarea
              className={cx(
                "mt-4 min-h-[96px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-rose-400 dark:focus:ring-rose-950/30"
              )}
              rows={3}
              placeholder="Reason / note (optional)"
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                disabled={cancelBusy}
                className={secondaryBtn()}
              >
                Close
              </button>

              <button
                type="button"
                disabled={cancelBusy}
                onClick={confirmCancel}
                className={dangerBtn(false)}
              >
                {cancelBusy ? "Cancelling..." : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}