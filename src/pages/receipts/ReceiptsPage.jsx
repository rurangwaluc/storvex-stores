import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { listReceipts, getReceiptDetail, getReceiptPrintUrl } from "../../services/receiptsApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatMoney(value) {
  const amount = Number(value || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `RWF ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(safeAmount)}`;
}

function safeDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value) {
  const date = safeDate(value);
  return date ? date.toLocaleDateString("en-RW", { dateStyle: "medium" }) : "—";
}

function formatDateTime(value) {
  const date = safeDate(value);
  return date
    ? date.toLocaleString("en-RW", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-soft)]";
}

function shell() {
  return "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function panel() {
  return "rounded-[24px] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return [
    "h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]",
    "px-3.5 text-sm font-medium text-[var(--color-text)] outline-none transition",
    "placeholder:text-[var(--color-text-muted)]",
    "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ].join(" ");
}

function buttonBase() {
  return "inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
}

function primaryBtn() {
  return cx(
    buttonBase(),
    "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] hover:opacity-95"
  );
}

function secondaryBtn() {
  return cx(
    buttonBase(),
    "bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-soft)] hover:opacity-90"
  );
}

function badgeClass(kind = "neutral") {
  if (kind === "success") return "badge-success";
  if (kind === "warning") return "badge-warning";
  if (kind === "danger") return "badge-danger";
  if (kind === "info") return "badge-info";
  return "badge-neutral";
}

function statusKind(status) {
  const value = String(status || "").toUpperCase();

  if (value === "PAID") return "success";
  if (value === "PARTIAL" || value === "UNPAID") return "warning";
  if (value === "OVERDUE" || value === "CANCELLED") return "danger";

  return "neutral";
}

function saleTypeKind(type) {
  const value = String(type || "").toUpperCase();

  if (value === "CASH") return "success";
  if (value === "CREDIT") return "warning";

  return "neutral";
}

function SummaryCard({ label, value, note, tone = "neutral", loading = false }) {
  const accent =
    tone === "danger"
      ? "bg-[var(--color-danger)]"
      : tone === "warning"
        ? "bg-amber-500"
        : tone === "success"
          ? "bg-emerald-500"
          : "bg-[var(--color-primary)]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />

      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>

        {loading ? (
          <>
            <div className="mt-3 h-8 w-28 animate-pulse rounded bg-[var(--color-surface-2)]" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[var(--color-surface-2)]" />
          </>
        ) : (
          <>
            <div className={cx("mt-2 text-2xl font-black tracking-[-0.03em]", strongText())}>
              {value}
            </div>
            {note ? <div className={cx("mt-1 text-sm leading-5", mutedText())}>{note}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}

function CardSkeletonRows({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={cx(shell(), "animate-pulse p-4")}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-5 w-40 rounded-full bg-[var(--color-surface-2)]" />
              <div className="mt-3 h-4 w-64 max-w-full rounded-full bg-[var(--color-surface-2)]" />
              <div className="mt-3 h-4 w-52 max-w-full rounded-full bg-[var(--color-surface-2)]" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="h-10 w-24 rounded-2xl bg-[var(--color-surface-2)]" />
              <div className="h-10 w-24 rounded-2xl bg-[var(--color-surface-2)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, note }) {
  return (
    <div className={cx(shell(), "p-10 text-center")}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 8h6M9 12h6M9 16h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className={cx("mt-4 text-lg font-black tracking-tight", strongText())}>{title}</h3>
      <p className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</p>
    </div>
  );
}

function ReceiptDetailDrawer({ open, onClose, receipt, loading }) {
  if (!open) return null;

  const printUrl = receipt?.id ? getReceiptPrintUrl(receipt.id) : "#";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close drawer"
        onClick={onClose}
      />

      <div className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-card)]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Receipt detail
              </div>

              <div className={cx("mt-1 text-xl font-black tracking-tight", strongText())}>
                {receipt?.number || "Receipt"}
              </div>
            </div>

            <div className="flex gap-2">
              {receipt?.id ? (
                <a href={printUrl} target="_blank" rel="noreferrer" className={primaryBtn()}>
                  Print
                </a>
              ) : null}

              <button type="button" onClick={onClose} className={secondaryBtn()}>
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <CardSkeletonRows rows={4} />
          ) : !receipt ? (
            <EmptyState title="Receipt not found" note="Unable to load receipt details." />
          ) : (
            <div className="space-y-5">
              <section className={cx(shell(), "p-5")}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    {receipt.store?.logoUrl ? (
                      <img
                        src={receipt.store.logoUrl}
                        alt="Store logo"
                        className="h-12 w-12 rounded-xl border border-[var(--color-border)] bg-white object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-xs font-black text-[var(--color-text-muted)]">
                        LOGO
                      </div>
                    )}

                    <div>
                      <div className={cx("text-lg font-black tracking-tight", strongText())}>
                        {receipt.store?.name || "Store"}
                      </div>

                      <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                        {receipt.store?.phone ? <div>Tel: {receipt.store.phone}</div> : null}
                        {receipt.store?.email ? <div>Email: {receipt.store.email}</div> : null}
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className={cx("text-2xl font-black tracking-wide", strongText())}>
                      RECEIPT
                    </div>

                    <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                      <div>Receipt No: {receipt.number || "—"}</div>
                      <div>Date: {formatDateTime(receipt.date || receipt.createdAt)}</div>
                      <div>Staff: {receipt.cashierName || "—"}</div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 md:justify-end">
                      <span className={badgeClass(statusKind(receipt.status))}>
                        {String(receipt.status || "UNKNOWN").toUpperCase()}
                      </span>

                      <span className={badgeClass(saleTypeKind(receipt.saleType))}>
                        {String(receipt.saleType || "—").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className={cx(panel(), "p-4")}>
                    <div className={cx("text-xs font-semibold uppercase tracking-[0.14em]", softText())}>
                      Customer
                    </div>

                    <div className={cx("mt-2 text-sm font-bold", strongText())}>
                      {receipt.customer?.name || "Walk-in Customer"}
                    </div>

                    <div className={cx("mt-1 text-sm", mutedText())}>
                      {receipt.customer?.phone || "—"}
                    </div>
                  </div>

                  <div className={cx(panel(), "p-4")}>
                    <div className={cx("text-xs font-semibold uppercase tracking-[0.14em]", softText())}>
                      Totals
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className={mutedText()}>Subtotal</span>
                        <span className={strongText()}>{formatMoney(receipt.subtotal)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className={mutedText()}>Total</span>
                        <span className={strongText()}>{formatMoney(receipt.total)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className={mutedText()}>Paid</span>
                        <span className={strongText()}>{formatMoney(receipt.amountPaid)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className={mutedText()}>Balance</span>
                        <span className={strongText()}>{formatMoney(receipt.balanceDue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={cx(shell(), "overflow-hidden")}>
                <div className="border-b border-[var(--color-border)] px-5 py-4">
                  <div className={cx("text-lg font-black tracking-tight", strongText())}>Items</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[var(--color-surface-2)]">
                      <tr className={mutedText()}>
                        <th className="px-5 py-3 text-left">Item</th>
                        <th className="px-5 py-3 text-left">Details</th>
                        <th className="px-5 py-3 text-right">Qty</th>
                        <th className="px-5 py-3 text-right">Price</th>
                        <th className="px-5 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--color-border)]">
                      {(receipt.items || []).map((item, index) => (
                        <tr key={item.saleItemId || index}>
                          <td className="px-5 py-4">
                            <div className={cx("font-bold", strongText())}>
                              {item.productName || "Unnamed product"}
                            </div>
                          </td>

                          <td className={cx("px-5 py-4 text-xs", mutedText())}>
                            {item.sku ? `SKU: ${item.sku}` : item.barcode ? `Barcode: ${item.barcode}` : "—"}
                          </td>

                          <td className={cx("px-5 py-4 text-right", mutedText())}>{item.quantity}</td>
                          <td className={cx("px-5 py-4 text-right", mutedText())}>
                            {formatMoney(item.price)}
                          </td>

                          <td className={cx("px-5 py-4 text-right font-black", strongText())}>
                            {formatMoney(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {(receipt.payments || []).length ? (
                <section className={cx(shell(), "p-5")}>
                  <div className={cx("text-lg font-black tracking-tight", strongText())}>Payments</div>

                  <div className="mt-4 space-y-3">
                    {receipt.payments.map((payment, index) => (
                      <div key={payment.id || index} className={cx(panel(), "p-4")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={cx("text-sm font-bold", strongText())}>
                              {formatMoney(payment.amount)} • {payment.method || "—"}
                            </div>

                            <div className={cx("mt-1 text-xs", mutedText())}>
                              {formatDateTime(payment.createdAt)}
                            </div>
                          </div>

                          {payment.note ? (
                            <div className={cx("max-w-xs text-right text-xs", mutedText())}>
                              {payment.note}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptCard({ row, onView }) {
  const printUrl = getReceiptPrintUrl(row.id);

  return (
    <article className={cx(shell(), "overflow-hidden p-4 transition hover:ring-1 hover:ring-[var(--color-primary-ring)] sm:p-5")}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cx("text-base font-black tracking-tight", strongText())}>
              {row.number || "Receipt"}
            </h3>

            <span className={badgeClass(statusKind(row.status))}>
              {String(row.status || "UNKNOWN").toUpperCase()}
            </span>

            <span className={badgeClass(saleTypeKind(row.saleType))}>
              {String(row.saleType || "—").toUpperCase()}
            </span>
          </div>

          {row.invoiceNumber ? (
            <div className={cx("mt-1 text-xs font-medium", mutedText())}>
              Invoice: {row.invoiceNumber}
            </div>
          ) : null}

          <div className={cx("mt-3 grid gap-1 text-sm sm:grid-cols-2", mutedText())}>
            <div>
              <span className="font-semibold text-[var(--color-text)]">Customer:</span>{" "}
              {row.customerName || "Walk-in Customer"}
            </div>

            <div>
              <span className="font-semibold text-[var(--color-text)]">Phone:</span>{" "}
              {row.customerPhone || "—"}
            </div>

            <div>
              <span className="font-semibold text-[var(--color-text)]">Staff:</span>{" "}
              {row.cashierName || "—"}
            </div>

            <div>
              <span className="font-semibold text-[var(--color-text)]">Date:</span>{" "}
              {formatDate(row.date || row.createdAt)}
            </div>
          </div>
        </div>

        <div className="shrink-0 xl:min-w-[280px]">
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <div className={cx(panel(), "px-3 py-2")}>
              <div className={cx("text-[10px] font-black uppercase tracking-[0.14em]", softText())}>
                Total
              </div>
              <div className={cx("mt-1 text-sm font-black", strongText())}>
                {formatMoney(row.total)}
              </div>
            </div>

            <div className={cx(panel(), "px-3 py-2")}>
              <div className={cx("text-[10px] font-black uppercase tracking-[0.14em]", softText())}>
                Paid
              </div>
              <div className={cx("mt-1 text-sm font-black", strongText())}>
                {formatMoney(row.amountPaid)}
              </div>
            </div>

            <div className={cx(panel(), "px-3 py-2")}>
              <div className={cx("text-[10px] font-black uppercase tracking-[0.14em]", softText())}>
                Balance
              </div>
              <div className={cx("mt-1 text-sm font-black", strongText())}>
                {formatMoney(row.balanceDue)}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-start gap-2 xl:justify-end">
            <button type="button" onClick={() => onView(row.id)} className={secondaryBtn()}>
              View
            </button>

            <a href={printUrl} target="_blank" rel="noreferrer" className={primaryBtn()}>
              Print
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ReceiptsPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rows, setRows] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReceipt, setDetailReceipt] = useState(null);

  async function loadReceipts(search = "", { silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await listReceipts(search);
      setRows(Array.isArray(response?.receipts) ? response.receipts : []);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to load receipts");
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function openDetail(id) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailReceipt(null);

    try {
      const response = await getReceiptDetail(id);
      setDetailReceipt(response?.receipt || null);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to load receipt detail");
      setDetailReceipt(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipts(submittedQuery);
  }, [submittedQuery]);

  const summary = useMemo(() => {
    return {
      count: rows.length,
      total: rows.reduce((sum, row) => sum + Number(row.total || 0), 0),
      paid: rows.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
      balance: rows.reduce((sum, row) => sum + Number(row.balanceDue || 0), 0),
    };
  }, [rows]);

  function submitSearch(event) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function clearSearch() {
    setQuery("");
    setSubmittedQuery("");
  }

  return (
    <>
      <div className="space-y-5">
        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Documents
                </div>

                <h1 className={cx("mt-2 text-3xl font-black tracking-tight", strongText())}>
                  Receipts
                </h1>

                <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Review generated receipts, inspect payment details clearly, and open print-ready
                  versions for professional customer proof.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <AsyncButton
                  type="button"
                  loading={refreshing}
                  loadingText="Refreshing..."
                  onClick={() => loadReceipts(submittedQuery, { silent: true })}
                  className={secondaryBtn()}
                >
                  Refresh
                </AsyncButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4 sm:px-6">
            <SummaryCard
              label="Receipts"
              value={summary.count}
              note="Loaded in current result set"
              loading={loading}
            />

            <SummaryCard
              label="Total value"
              value={formatMoney(summary.total)}
              note="Combined receipt total"
              tone="success"
              loading={loading}
            />

            <SummaryCard
              label="Paid"
              value={formatMoney(summary.paid)}
              note="Amount already collected"
              tone="success"
              loading={loading}
            />

            <SummaryCard
              label="Balance"
              value={formatMoney(summary.balance)}
              note="Outstanding across loaded receipts"
              tone={summary.balance > 0 ? "warning" : "neutral"}
              loading={loading}
            />
          </div>
        </section>

        <section className={cx(shell(), "p-4 sm:p-5")}>
          <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row">
            <input
              className={inputClass()}
              placeholder="Search by receipt number, invoice number, customer, phone, or staff..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <div className="flex gap-2">
              <AsyncButton type="submit" loading={loading && Boolean(query.trim())} variant="primary">
                Search
              </AsyncButton>

              <button type="button" className={secondaryBtn()} onClick={clearSearch}>
                Clear
              </button>
            </div>
          </form>
        </section>

        {loading ? (
          <CardSkeletonRows rows={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No receipts found"
            note={
              submittedQuery
                ? "Try another search term."
                : "When sales are completed, receipts will appear here."
            }
          />
        ) : (
          <section className="space-y-3">
            {rows.map((row) => (
              <ReceiptCard key={row.id} row={row} onView={openDetail} />
            ))}
          </section>
        )}
      </div>

      <ReceiptDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        receipt={detailReceipt}
        loading={detailLoading}
      />
    </>
  );
}