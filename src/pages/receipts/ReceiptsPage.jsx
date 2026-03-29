import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { listReceipts, getReceiptDetail, getReceiptPrintUrl } from "../../services/receiptsApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDate(value) {
  const d = safeDate(value);
  return d ? d.toLocaleDateString() : "—";
}

function formatDateTime(value) {
  const d = safeDate(value);
  return d ? d.toLocaleString() : "—";
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

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function badgeClass(kind = "neutral") {
  if (kind === "success") return "badge-success";
  if (kind === "warning") return "badge-warning";
  if (kind === "danger") return "badge-danger";
  if (kind === "info") return "badge-info";
  return "badge-neutral";
}

function statusKind(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return "success";
  if (s === "PARTIAL" || s === "UNPAID") return "warning";
  if (s === "OVERDUE" || s === "CANCELLED") return "danger";
  return "neutral";
}

function saleTypeKind(type) {
  const t = String(type || "").toUpperCase();
  if (t === "CASH") return "success";
  if (t === "CREDIT") return "warning";
  return "neutral";
}

function SummaryCard({ label, value, note, tone = "neutral", loading = false }) {
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

        {loading ? (
          <>
            <div className="mt-3 h-8 w-28 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
            <div className="mt-2 h-4 w-40 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          </>
        ) : (
          <>
            <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
            {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}

function TableSkeletonRows({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-20 rounded-2xl border border-stone-200 bg-stone-50 animate-pulse dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
        />
      ))}
    </div>
  );
}

function EmptyState({ title, note }) {
  return (
    <div className={cx(shell(), "p-10 text-center")}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className={cx("mt-4 text-lg font-semibold", strongText())}>{title}</h3>
      <p className={cx("mt-2 text-sm", mutedText())}>{note}</p>
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

      <div className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-stone-200 bg-white shadow-2xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]">
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]/95">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Receipt detail
              </div>
              <div className={cx("mt-1 text-xl font-semibold", strongText())}>
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
            <TableSkeletonRows rows={4} />
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
                        className="h-12 w-12 rounded-xl object-contain"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-500 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
                        LOGO
                      </div>
                    )}

                    <div>
                      <div className={cx("text-lg font-semibold", strongText())}>
                        {receipt.store?.name || "Store"}
                      </div>
                      <div className={cx("mt-1 text-xs", mutedText())}>
                        {receipt.store?.phone ? <div>Tel: {receipt.store.phone}</div> : null}
                        {receipt.store?.email ? <div>Email: {receipt.store.email}</div> : null}
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className={cx("text-2xl font-extrabold tracking-wide", strongText())}>
                      RECEIPT
                    </div>
                    <div className={cx("mt-1 text-xs", mutedText())}>
                      <div>Receipt No: {receipt.number || "—"}</div>
                      <div>Date: {formatDateTime(receipt.date || receipt.createdAt)}</div>
                      <div>Cashier: {receipt.cashierName || "—"}</div>
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
                    <div className={cx("mt-2 text-sm font-medium", strongText())}>
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
                      <div className="flex items-center justify-between">
                        <span className={mutedText()}>Subtotal</span>
                        <span className={strongText()}>{formatMoney(receipt.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={mutedText()}>Total</span>
                        <span className={strongText()}>{formatMoney(receipt.total)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={mutedText()}>Paid</span>
                        <span className={strongText()}>{formatMoney(receipt.amountPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={mutedText()}>Balance</span>
                        <span className={strongText()}>{formatMoney(receipt.balanceDue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={cx(shell(), "overflow-hidden")}>
                <div className="border-b border-stone-200 px-5 py-4 dark:border-[rgb(var(--border))]">
                  <div className={cx("text-lg font-semibold", strongText())}>Items</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-stone-50 dark:bg-[rgb(var(--bg))]">
                      <tr className={mutedText()}>
                        <th className="px-5 py-3 text-left">Item</th>
                        <th className="px-5 py-3 text-left">Details</th>
                        <th className="px-5 py-3 text-right">Qty</th>
                        <th className="px-5 py-3 text-right">Price</th>
                        <th className="px-5 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
                      {(receipt.items || []).map((it, idx) => (
                        <tr key={it.saleItemId || idx}>
                          <td className="px-5 py-4">
                            <div className={cx("font-medium", strongText())}>
                              {it.productName || "Unnamed product"}
                            </div>
                          </td>
                          <td className={cx("px-5 py-4 text-xs", mutedText())}>
                            {it.sku ? `SKU: ${it.sku}` : it.barcode ? `Barcode: ${it.barcode}` : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">{it.quantity}</td>
                          <td className="px-5 py-4 text-right">{formatMoney(it.price)}</td>
                          <td className={cx("px-5 py-4 text-right font-semibold", strongText())}>
                            {formatMoney(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {(receipt.payments || []).length ? (
                <section className={cx(shell(), "p-5")}>
                  <div className={cx("text-lg font-semibold", strongText())}>Payments</div>
                  <div className="mt-4 space-y-3">
                    {receipt.payments.map((p, idx) => (
                      <div key={p.id || idx} className={cx(panel(), "p-4")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={cx("text-sm font-medium", strongText())}>
                              {formatMoney(p.amount)} • {p.method || "—"}
                            </div>
                            <div className={cx("mt-1 text-xs", mutedText())}>
                              {formatDateTime(p.createdAt)}
                            </div>
                          </div>

                          {p.note ? (
                            <div className={cx("max-w-xs text-right text-xs", mutedText())}>{p.note}</div>
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

export default function ReceiptsPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReceipt, setDetailReceipt] = useState(null);

  async function loadReceipts(q = "") {
    setLoading(true);

    try {
      const res = await listReceipts(q);
      setRows(Array.isArray(res?.receipts) ? res.receipts : []);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load receipts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailReceipt(null);

    try {
      const res = await getReceiptDetail(id);
      setDetailReceipt(res?.receipt || null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load receipt detail");
      setDetailReceipt(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadReceipts(submittedQuery);
  }, [submittedQuery]);

  const summary = useMemo(() => {
    return {
      count: rows.length,
      total: rows.reduce((sum, r) => sum + Number(r.total || 0), 0),
      paid: rows.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0),
      balance: rows.reduce((sum, r) => sum + Number(r.balanceDue || 0), 0),
    };
  }, [rows]);

  function submitSearch(e) {
    e.preventDefault();
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
          <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Documents
                </div>
                <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                  Receipts
                </h1>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Review all generated receipts, inspect details clearly, and open print-ready versions for A4-safe document output.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => loadReceipts(submittedQuery)} className={secondaryBtn()}>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
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

        <section className={cx(shell(), "p-4")}>
          <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row">
            <input
              className={inputClass()}
              placeholder="Search by receipt no, invoice no, customer, phone, cashier, or id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="flex gap-2">
              <button type="submit" className={primaryBtn()}>
                Search
              </button>
              <button type="button" className={secondaryBtn()} onClick={clearSearch}>
                Clear
              </button>
            </div>
          </form>
        </section>

        {loading ? (
          <TableSkeletonRows rows={7} />
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
          <section className={cx(shell(), "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 dark:bg-[rgb(var(--bg))]">
                  <tr className={mutedText()}>
                    <th className="px-5 py-4 text-left">Receipt</th>
                    <th className="px-5 py-4 text-left">Customer</th>
                    <th className="px-5 py-4 text-left">Cashier</th>
                    <th className="px-5 py-4 text-left">Type</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-right">Total</th>
                    <th className="px-5 py-4 text-right">Paid</th>
                    <th className="px-5 py-4 text-right">Balance</th>
                    <th className="px-5 py-4 text-left">Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
                  {rows.map((row) => {
                    const printUrl = getReceiptPrintUrl(row.id);

                    return (
                      <tr key={row.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className={cx("font-medium", strongText())}>{row.number || "—"}</div>
                          {row.invoiceNumber ? (
                            <div className={cx("mt-1 text-xs", mutedText())}>
                              Invoice: {row.invoiceNumber}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <div className={cx("font-medium", strongText())}>
                            {row.customerName || "Walk-in Customer"}
                          </div>
                          <div className={cx("mt-1 text-xs", mutedText())}>
                            {row.customerPhone || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">{row.cashierName || "—"}</td>

                        <td className="px-5 py-4">
                          <span className={badgeClass(saleTypeKind(row.saleType))}>
                            {String(row.saleType || "—").toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={badgeClass(statusKind(row.status))}>
                            {String(row.status || "UNKNOWN").toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">{formatMoney(row.total)}</td>
                        <td className="px-5 py-4 text-right">{formatMoney(row.amountPaid)}</td>
                        <td className="px-5 py-4 text-right">{formatMoney(row.balanceDue)}</td>
                        <td className="px-5 py-4">{formatDate(row.date || row.createdAt)}</td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openDetail(row.id)}
                              className={secondaryBtn()}
                            >
                              View
                            </button>

                            <a
                              href={printUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={primaryBtn()}
                            >
                              Print
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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