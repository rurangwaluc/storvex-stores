import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { listSales, cancelSale as cancelSaleApi } from "../../services/posApi";
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
  return "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function raisedPanel() {
  return "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]";
}

function softPanel() {
  return "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn(disabled = false) {
  return cx(
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition",
    disabled
      ? "cursor-not-allowed bg-[rgba(219,80,74,0.08)] text-[var(--color-danger)] opacity-50"
      : "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)] hover:opacity-90"
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
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

function SaleTypePill({ saleType }) {
  const isCash = String(saleType || "").toUpperCase() === "CASH";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        isCash ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fff1c9] text-[#b88900]"
      )}
    >
      {isCash ? "Cash" : "Credit"}
    </span>
  );
}

function SummaryCard({ label, value, note, tone = "neutral", icon = "default" }) {
  const iconTone =
    tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : tone === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[#dff1ff] text-[#4aa8ff]";

  function CardIcon() {
    const common = {
      className: "h-7 w-7",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.9,
    };

    if (icon === "sales") {
      return (
        <svg {...common}>
          <path d="M5 19V9M12 19V5M19 19v-8" strokeLinecap="round" />
        </svg>
      );
    }

    if (icon === "paid") {
      return (
        <svg {...common}>
          <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (icon === "credit") {
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M7 12h10" strokeLinecap="round" />
        </svg>
      );
    }

    if (icon === "overdue") {
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    return (
      <svg {...common}>
        <path d="M5 19V9M12 19V5M19 19v-8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <article className={cx(pageCard(), "p-5 sm:p-6")}>
      <div className="flex items-start gap-4 sm:gap-5">
        <div className={cx("flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] shadow-[var(--shadow-soft)]", iconTone)}>
          <CardIcon />
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

function canCancelFromList(sale) {
  if (!sale) return false;
  if (sale.saleType !== "CASH") return false;
  if (sale.isCancelled) return false;
  return true;
}

function SalesListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-4 sm:p-5")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-8 w-28 rounded-full" />
              <SkeletonBlock className="h-8 w-20 rounded-full" />
              <SkeletonBlock className="h-8 w-20 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
              </div>
              <SkeletonBlock className="h-24 w-full" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <SkeletonBlock className="h-11 w-24 rounded-2xl" />
              <SkeletonBlock className="h-11 w-24 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(softPanel(), "px-4 py-12 text-center")}>
      <div className={cx("text-base font-bold", strongText())}>{title}</div>
      <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
    </div>
  );
}

function InfoTile({ label, value, tone = "neutral" }) {
  const toneCls =
    tone === "success"
      ? "bg-[#dcfce7] border-[#bbf7d0]"
      : tone === "warning"
      ? "bg-[#fff1c9] border-[#fde68a]"
      : tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] border-[rgba(219,80,74,0.22)]"
      : "bg-[var(--color-surface-2)] border-[var(--color-border)]";

  const labelCls =
    tone === "success" || tone === "warning"
      ? "text-[rgba(15,23,42,0.62)]"
      : tone === "danger"
      ? "text-[rgba(219,80,74,0.9)]"
      : "text-[var(--color-text-muted)]";

  const valueCls =
    tone === "success"
      ? "text-[#166534]"
      : tone === "warning"
      ? "text-[#92400e]"
      : tone === "danger"
      ? "text-[var(--color-danger)]"
      : "text-[var(--color-text)]";

  return (
    <div
      className={cx(
        "rounded-[22px] border p-4 shadow-[var(--shadow-soft)]",
        toneCls
      )}
    >
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", labelCls)}>
        {label}
      </div>

      <div className={cx("mt-3 text-sm font-bold leading-6", valueCls)}>
        {value}
      </div>
    </div>
  );
}

function SaleCard({ sale, onOpenCancel, cancelBusy, index }) {
  const cancelEnabled = canCancelFromList(sale);
  const saleType = String(sale.saleType || "").toUpperCase();
  const status = String(sale.status || "").toUpperCase();
  const balanceDue = Number(sale.balanceDue || 0);

  const financeTone =
    saleType === "CREDIT"
      ? status === "OVERDUE"
        ? "danger"
        : "warning"
      : "success";

  return (
    <div
      className={cx(
        pageCard(),
        "relative overflow-hidden p-4 sm:p-5",
        index % 2 === 0 ? "bg-[var(--color-card)]" : "bg-[var(--color-surface)]"
      )}
    >
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--color-primary)] opacity-70" />
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--color-border)]" />

      <div className="pl-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className={cx("text-[1.15rem] font-black tracking-tight", strongText())}>
                  {formatMoney(sale.total)}
                </div>
                <SaleTypePill saleType={saleType} />
                <StatusBadge
                  kind={
                    status === "PAID"
                      ? "success"
                      : status === "OVERDUE"
                      ? "danger"
                      : "warning"
                  }
                >
                  {status}
                </StatusBadge>
              </div>

              <div className={cx("mt-2 text-xs", softText())}>
                Sale ID: {String(sale.id || "").slice(-8).toUpperCase() || "—"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Link to={`/app/pos/sales/${sale.id}`} className={secondaryBtn()}>
                View
              </Link>

              <button
                type="button"
                onClick={() => onOpenCancel(sale.id)}
                disabled={!cancelEnabled || cancelBusy}
                className={dangerBtn(!cancelEnabled || cancelBusy)}
                title={!cancelEnabled ? "Only active cash sales can be cancelled here" : ""}
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cx(raisedPanel(), "p-4")}>
                <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                  Customer
                </div>
                <div className={cx("mt-3 text-sm font-bold", strongText())}>
                  {sale.customer?.name || "Walk-in customer"}
                </div>
                <div className={cx("mt-1 text-xs", mutedText())}>
                  {sale.customer?.phone || "No phone attached"}
                </div>
              </div>

              <div className={cx(raisedPanel(), "p-4")}>
                <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                  Cashier
                </div>
                <div className={cx("mt-3 text-sm font-bold", strongText())}>
                  {sale.cashier?.name || "—"}
                </div>
                <div className={cx("mt-1 text-xs", mutedText())}>
                  {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Final state
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className={cx("text-xs", mutedText())}>Updated</span>
                  <span className={cx("text-xs font-semibold", strongText())}>
                    {relativeTime(sale.updatedAt || sale.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className={cx("text-xs", mutedText())}>
                    {saleType === "CREDIT" ? "Balance due" : "Settlement"}
                  </span>
                  <span
                    className={cx(
                      "text-sm font-black",
                      financeTone === "success"
                        ? "text-[#15803d]"
                        : financeTone === "warning"
                        ? "text-[#b88900]"
                        : "text-[var(--color-danger)]"
                    )}
                  >
                    {saleType === "CREDIT" ? formatMoney(balanceDue) : "Paid immediately"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile
              label="Created"
              value={sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
            />
            <InfoTile
              label="Status note"
              value={
                saleType === "CREDIT"
                  ? status === "OVERDUE"
                    ? "Needs follow-up"
                    : "Credit still active"
                  : "Cash sale completed"
              }
              tone={financeTone}
            />
          </div>
        </div>
      </div>
    </div>
  );
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

  const visibleSales = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
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

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionHeading
            eyebrow="POS"
            title="Sales"
            subtitle="Search receipts, review sale history, and manage eligible cash sale cancellations from a cleaner premium ledger."
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={() => nav("/app/pos")} className={secondaryBtn()}>
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
          <SummaryCard
            label="Total sales"
            value={summary.total}
            note="All sales currently loaded"
            icon="sales"
          />
          <SummaryCard
            label="Paid"
            value={summary.paid}
            note="Fully paid sales"
            tone="success"
            icon="paid"
          />
          <SummaryCard
            label="Credit sales"
            value={summary.credit}
            note="Sales with balance flow"
            tone="warning"
            icon="credit"
          />
          <SummaryCard
            label="Overdue"
            value={summary.overdue}
            note="Need immediate attention"
            tone="danger"
            icon="overdue"
          />
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className={cx("text-base font-bold", strongText())}>Find a sale</div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Search by customer name, phone, cashier, or sale ID.
          </div>

          <div className="mt-5">
            <label className={cx("text-sm font-medium", strongText())}>Search</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="Customer, phone, cashier, sale id..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="mt-5 space-y-3">
            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Visible now
              </div>
              <div className={cx("mt-3 text-lg font-bold", strongText())}>
                {filtered.length} matching sale{filtered.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Cancellation rule
              </div>
              <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                Only active <span className={cx("font-semibold", strongText())}>cash sales</span> can be cancelled from this list.
              </div>
            </div>
          </div>
        </aside>

        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={cx("text-xl font-bold", strongText())}>Sales ledger</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Each sale is grouped into a compact operational card with clearer separation in both dark and light mode.
                </div>
              </div>

              {!loading ? (
                <StatusBadge kind="success">
                  Showing {visibleSales.length} of {filtered.length}
                </StatusBadge>
              ) : null}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <SalesListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No sales found"
                text="There are no sales matching your current search."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {visibleSales.map((sale, index) => (
                    <SaleCard
                      key={sale.id}
                      sale={sale}
                      onOpenCancel={openCancel}
                      cancelBusy={cancelBusy}
                      index={index}
                    />
                  ))}
                </div>

                <div className="mt-5 flex justify-center">
                  {hasMore ? (
                    <button type="button" onClick={handleLoadMore} className={primaryBtn()}>
                      Load 10 more
                    </button>
                  ) : (
                    <div className={cx("text-sm", mutedText())}>All matching sales loaded</div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {cancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className={cx(pageCard(), "w-full max-w-md p-5")}>
            <div className={cx("text-lg font-bold", strongText())}>Cancel sale</div>
            <p className={cx("mt-2 text-sm leading-6", mutedText())}>
              This will restock the items and mark the sale as cancelled.
            </p>

            <textarea
              className="mt-4 min-h-[110px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
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