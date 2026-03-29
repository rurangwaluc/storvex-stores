import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  addSalePayment,
  getReceipt,
  cancelSale as cancelSaleApi,
  createRefund as createRefundApi,
} from "../../services/posApi";
import { getReceiptPrintUrl } from "../../services/receiptsApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

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

function textareaClass() {
  return "min-h-[96px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function warningBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-amber-600 px-4 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-800 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/30";
}

function safeDate(x) {
  const d = x ? new Date(x) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function clampInt(n, min, max) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function StatusPill({ status }) {
  const normalized = String(status || "").toUpperCase();

  const cls =
    normalized === "PAID"
      ? "badge-success"
      : normalized === "OVERDUE"
      ? "badge-danger"
      : normalized === "PARTIAL" || normalized === "UNPAID"
      ? "badge-warning"
      : normalized === "CANCELLED"
      ? "badge-neutral"
      : "badge-info";

  return <span className={cls}>{normalized}</span>;
}

function SkeletonLine({ w = "w-full" }) {
  return <div className={`h-4 ${w} rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]`} />;
}

function ReceiptSkeleton() {
  return (
    <div className="space-y-5">
      <div className={cx(shell(), "p-6 animate-pulse")}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 w-full">
            <div className="h-6 w-32 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
            <div className="h-3 w-72 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 rounded-full bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
            <div className="h-4 w-14 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <SkeletonLine w="w-56" />
          <SkeletonLine w="w-64" />
          <SkeletonLine w="w-80" />
          <SkeletonLine w="w-72" />
        </div>

        <div className="my-4 h-px bg-stone-200 dark:bg-[rgb(var(--border))]" />

        <div className="space-y-3">
          <div className="flex justify-between">
            <SkeletonLine w="w-48" />
            <SkeletonLine w="w-20" />
          </div>
          <div className="flex justify-between">
            <SkeletonLine w="w-52" />
            <SkeletonLine w="w-20" />
          </div>
          <div className="flex justify-between">
            <SkeletonLine w="w-44" />
            <SkeletonLine w="w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getDisplayNumber(receipt) {
  return receipt?.number || receipt?.id || "—";
}

function WarrantyBlock({ receipt, saleDate, store, compact = false }) {
  const warranties = Array.isArray(receipt?.warranties) ? receipt.warranties : [];
  const hasWarranty = warranties.length > 0;

  return (
    <div className={cx("rounded-[24px] border border-stone-200 p-4 dark:border-[rgb(var(--border))]", compact ? "" : "mt-2")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-stone-950 dark:text-[rgb(var(--text))]">Warranty</div>
          <div className="mt-1 text-xs text-stone-600 dark:text-[rgb(var(--text-muted))]">
            Keep this document for warranty and service support.
          </div>
        </div>

        <div className="text-right text-xs text-stone-600 dark:text-[rgb(var(--text-muted))]">
          {store?.name ? (
            <div className="font-medium text-stone-900 dark:text-[rgb(var(--text))]">{store.name}</div>
          ) : null}
          <div>Receipt: {getDisplayNumber(receipt)}</div>
          <div>Date: {saleDate ? saleDate.toLocaleDateString() : "—"}</div>
        </div>
      </div>

      <div className="my-3 h-px bg-stone-200 dark:bg-[rgb(var(--border))]" />

      {!hasWarranty ? (
        <div className="text-sm text-stone-700 dark:text-[rgb(var(--text-muted))]">
          <div className="font-medium text-stone-900 dark:text-[rgb(var(--text))]">
            No warranty recorded for this receipt.
          </div>
          <div className="mt-1 text-xs">
            When warranty records are stored, this section will list covered units, start/end dates, and policy.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {warranties.map((w, idx) => {
            const starts = safeDate(w.startsAt);
            const ends = safeDate(w.endsAt);

            return (
              <div
                key={w.id || idx}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-stone-950 dark:text-[rgb(var(--text))]">
                    {w.warrantyNumber || `Warranty #${idx + 1}`}
                  </div>
                  <div className="text-xs text-stone-600 dark:text-[rgb(var(--text-muted))]">
                    Start: {starts ? starts.toLocaleDateString() : "—"} • End: {ends ? ends.toLocaleDateString() : "—"}
                  </div>
                </div>

                {w.policy ? (
                  <div className="mt-2 whitespace-pre-wrap text-xs text-stone-600 dark:text-[rgb(var(--text-muted))]">
                    <span className="font-semibold text-stone-900 dark:text-[rgb(var(--text))]">Policy:</span> {w.policy}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PosReceipt() {
  const { id } = useParams();
  const nav = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [refundReason, setRefundReason] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [refundQtyByIdx, setRefundQtyByIdx] = useState({});

  async function load() {
    setLoading(true);
    try {
      const data = await getReceipt(id);
      setReceipt(data || null);
    } catch (e) {
      console.error(e);
      if (handleSubscriptionBlockedError(e, { toastId: "receipt-load-blocked" })) {
        setReceipt(null);
      } else {
        toast.error(e?.message || "Failed to load receipt");
        setReceipt(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  const store = receipt?.store || null;
  const saleDate = safeDate(receipt?.date || receipt?.createdAt);

  const subtotal = useMemo(() => {
    if (!receipt?.items?.length) return Number(receipt?.subtotal || 0);
    return receipt.items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
  }, [receipt]);

  const paid = Number(receipt?.amountPaid || 0);
  const balance = Number(receipt?.balanceDue || 0);
  const refundedTotal = Number(receipt?.refundedTotal || 0);

  const canAddPayment = useMemo(() => {
    if (!receipt) return false;
    return receipt.saleType === "CREDIT" && Number(receipt.balanceDue || 0) > 0;
  }, [receipt]);

  async function submitPayment(e) {
    e.preventDefault();
    if (!canAddPayment) return;

    const amt = Number(String(payAmount || "").replace(/[^\d]/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Enter a valid amount");

    try {
      await addSalePayment(id, { amount: amt, method: payMethod, note: payNote || null });
      toast.success("Payment recorded");
      setPayAmount("");
      setPayNote("");
      await load();
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "sale-payment-blocked" })) return;
      toast.error(err?.response?.data?.message || err?.message || "Failed to add payment");
    }
  }

  const canCancel = useMemo(() => {
    if (!receipt) return false;
    if (receipt.isCancelled === true) return false;
    if (receipt.saleType !== "CASH") return false;
    if (Number(receipt.refundedTotal || 0) > 0) return false;
    return true;
  }, [receipt]);

  const canRefund = useMemo(() => {
    if (!receipt) return false;
    if (receipt.isCancelled === true) return false;
    const refundable = Math.max(0, Number(receipt.amountPaid || 0) - Number(receipt.refundedTotal || 0));
    return refundable > 0;
  }, [receipt]);

  async function confirmCancel() {
    setCancelBusy(true);
    try {
      await cancelSaleApi(id, { note: cancelNote || null });
      toast.success("Sale cancelled");
      setCancelOpen(false);
      setCancelNote("");
      await load();
    } catch (e) {
      console.error(e);
      if (handleSubscriptionBlockedError(e, { toastId: "sale-cancel-blocked" })) return;
      toast.error(e?.response?.data?.message || e?.message || "Failed to cancel sale");
    } finally {
      setCancelBusy(false);
    }
  }

  function openRefund() {
    setRefundQtyByIdx({});
    setRefundMethod("CASH");
    setRefundReason("");
    setRefundNote("");
    setRefundOpen(true);
  }

  function setQty(idx, qty) {
    setRefundQtyByIdx((prev) => ({ ...prev, [idx]: qty }));
  }

  const refundPreview = useMemo(() => {
    if (!receipt || !Array.isArray(receipt.items)) return { items: [], total: 0 };

    const chosen = [];
    let total = 0;

    receipt.items.forEach((it, idx) => {
      const maxQty = Number(it.quantity || 0);
      const q = clampInt(refundQtyByIdx[idx] ?? 0, 0, maxQty);
      if (q <= 0) return;

      const unit = Number(it.price || 0);
      const lineTotal = unit * q;

      chosen.push({
        idx,
        productId: it.productId,
        qty: q,
        unit,
        lineTotal,
        productName: it.productName,
      });

      total += lineTotal;
    });

    return { items: chosen, total };
  }, [receipt, refundQtyByIdx]);

  async function confirmRefund() {
    if (!receipt) return;

    if (!Array.isArray(receipt.items) || receipt.items.some((x) => !x.productId)) {
      toast.error("Refund needs productId per item. Receipt response is missing productId.");
      return;
    }

    const items = receipt.items
      .map((it, idx) => {
        const maxQty = Number(it.quantity || 0);
        const q = clampInt(refundQtyByIdx[idx] ?? 0, 0, maxQty);
        if (q <= 0) return null;
        return { productId: it.productId, quantity: q };
      })
      .filter(Boolean);

    if (!items.length) return toast.error("Select at least one item quantity to refund");

    setRefundBusy(true);
    try {
      await createRefundApi(id, {
        items,
        method: refundMethod,
        reason: refundReason || null,
        note: refundNote || null,
      });

      toast.success("Refund created");
      setRefundOpen(false);
      setRefundQtyByIdx({});
      setRefundReason("");
      setRefundNote("");
      await load();
    } catch (e) {
      console.error(e);
      if (handleSubscriptionBlockedError(e, { toastId: "sale-refund-blocked" })) return;
      toast.error(e?.response?.data?.message || e?.message || "Failed to create refund");
    } finally {
      setRefundBusy(false);
    }
  }

  const printUrl = getReceiptPrintUrl(receipt?.id);
  const previewRoute = receipt?.id
    ? `/app/documents/receipts/${encodeURIComponent(receipt.id)}/preview`
    : "/app/documents/receipts";

  if (loading) return <ReceiptSkeleton />;

  if (!receipt) {
    return (
      <div className="space-y-5">
        <div className={cx(shell(), "p-6")}>
          <p className={mutedText()}>Receipt not found</p>
          <div className="mt-4">
            <Link to="/app/pos" className={primaryBtn()}>
              New sale
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "relative overflow-hidden p-5 md:p-6")}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 opacity-[0.03] dark:from-white dark:via-white dark:to-white dark:opacity-[0.04]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Sales document
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Receipt detail
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              Review the sale record, track payments and refunds, and open the branded receipt preview from the unified document experience.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/pos/sales" className={secondaryBtn()}>
              Sales list
            </Link>
            <Link to={previewRoute} className={secondaryBtn()}>
              Preview document
            </Link>
            <a href={printUrl} target="_blank" rel="noreferrer" className={primaryBtn()}>
              Open print view
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={cx(shell(), "overflow-hidden p-6")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {store?.logoUrl ? (
                <img src={store.logoUrl} alt="Store logo" className="h-12 w-12 object-contain rounded-xl" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs text-stone-500 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                  LOGO
                </div>
              )}

              <div>
                <div className={cx("text-lg font-semibold", strongText())}>
                  {store?.name || "Store"}
                </div>

                <div className={cx("text-xs", mutedText())}>
                  {store?.receiptHeader ? <div className="whitespace-pre-wrap">{store.receiptHeader}</div> : null}
                  <div className="flex gap-3 flex-wrap">
                    {store?.phone ? <span>Tel: {store.phone}</span> : null}
                    {store?.email ? <span>Email: {store.email}</span> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={cx("text-2xl font-extrabold tracking-wide", strongText())}>RECEIPT</div>

              <div className={cx("mt-1 text-xs", mutedText())}>
                <div>
                  <span className="font-medium">Receipt No:</span> {receipt.number || "—"}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {saleDate ? saleDate.toLocaleString() : "—"}
                </div>
                <div>
                  <span className="font-medium">Cashier:</span> {receipt.cashierName || "—"}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <StatusPill status={receipt.status} />
                <span className={cx("text-xs", mutedText())}>{receipt.saleType}</span>
              </div>

              {receipt.isCancelled ? (
                <div className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  CANCELLED
                </div>
              ) : null}
            </div>
          </div>

          <div className="my-5 h-px bg-stone-200 dark:bg-[rgb(var(--border))]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className={cx("text-xs font-semibold", softText())}>BILL TO</div>
              <div className={cx("mt-1", strongText())}>
                {receipt.customer ? (
                  <>
                    <div className="font-medium">{receipt.customer.name}</div>
                    <div className={cx("text-xs", mutedText())}>{receipt.customer.phone}</div>
                  </>
                ) : (
                  <div className="font-medium">Walk-in Customer</div>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              {receipt.saleType === "CREDIT" ? (
                <div className={cx("text-xs space-y-1", mutedText())}>
                  <div>
                    <span className="font-semibold">Due date:</span>{" "}
                    {receipt.dueDate ? new Date(receipt.dueDate).toLocaleDateString() : "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Paid:</span> {formatMoney(receipt.amountPaid)}
                  </div>
                  <div>
                    <span className="font-semibold">Balance:</span> {formatMoney(receipt.balanceDue)}
                  </div>
                </div>
              ) : (
                <div className={cx("text-xs", mutedText())}>
                  <span className="font-semibold">Paid:</span> {formatMoney(receipt.amountPaid)}
                </div>
              )}
            </div>
          </div>

          <div className={cx(panel(), "mt-5 overflow-hidden")}>
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-[rgb(var(--bg-muted))]">
                <tr className={cx("text-left text-xs", mutedText())}>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 w-16">Qty</th>
                  <th className="px-4 py-3 w-28 text-right">Rate</th>
                  <th className="px-4 py-3 w-28 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
                {receipt.items.map((it, idx) => (
                  <tr key={it.saleItemId || it.id || idx}>
                    <td className="px-4 py-3">
                      <div className={cx("font-medium", strongText())}>{it.productName || "Unnamed product"}</div>
                      <div className={cx("text-[11px]", mutedText())}>
                        {it.sku ? <span>SKU: {it.sku}</span> : null}
                        {it.sku && it.barcode ? <span> • </span> : null}
                        {it.barcode ? <span>Barcode: {it.barcode}</span> : null}
                        {!it.sku && !it.barcode && it.serial ? <span>Serial: {it.serial}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{it.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(it.price)}</td>
                    <td className={cx("px-4 py-3 text-right font-semibold", strongText())}>
                      {formatMoney(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className={cx("text-xs", mutedText())}>
              <div className={cx("font-semibold", strongText())}>Terms & Notes</div>
              <div className="mt-1">
                Keep this receipt for warranty and service support.
              </div>

              {receipt.cancelNote ? (
                <div className="mt-2 text-rose-700 dark:text-rose-300">
                  <span className="font-semibold">Cancel note:</span> {receipt.cancelNote}
                </div>
              ) : null}

              {store?.receiptFooter ? (
                <div className="mt-3 whitespace-pre-wrap">{store.receiptFooter}</div>
              ) : null}
            </div>

            <div className="sm:justify-self-end w-full sm:w-80">
              <div className={cx(panel(), "p-4")}>
                <div className="flex justify-between text-sm">
                  <span className={mutedText()}>Subtotal</span>
                  <span className={cx("font-medium", strongText())}>{formatMoney(subtotal)}</span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span className={mutedText()}>Discount</span>
                  <span className={cx("font-medium", strongText())}>{formatMoney(0)}</span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span className={mutedText()}>Tax</span>
                  <span className={cx("font-medium", strongText())}>{formatMoney(0)}</span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span className={mutedText()}>Refunded</span>
                  <span className={cx("font-medium", strongText())}>{formatMoney(refundedTotal)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl bg-stone-950 px-4 py-3 text-white dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-extrabold">{formatMoney(receipt.total)}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className={mutedText()}>Paid</span>
                  <span className={cx("font-medium", strongText())}>{formatMoney(paid)}</span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span className={mutedText()}>Balance</span>
                  <span className={cx("font-medium", strongText())}>{formatMoney(balance)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <WarrantyBlock receipt={receipt} saleDate={saleDate} store={store} compact />
          </div>
        </section>

        <aside className="space-y-5">
          {Array.isArray(receipt.payments) && receipt.payments.length ? (
            <div className={cx(shell(), "p-5")}>
              <div className={cx("text-base font-semibold", strongText())}>Payments</div>
              <div className={cx("mt-1 text-sm", mutedText())}>Recorded payment timeline for this sale.</div>

              <div className="mt-4 space-y-2">
                {receipt.payments.map((p, idx) => (
                  <div key={p.id || idx} className={cx(panel(), "p-3 text-sm")}>
                    <div className={cx("font-medium", strongText())}>
                      {formatMoney(p.amount)} • {p.method}
                    </div>
                    <div className={cx("text-xs", mutedText())}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                    </div>
                    {p.note ? <div className={cx("text-xs", mutedText())}>Note: {p.note}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {canAddPayment ? (
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300">Add payment</h3>

              <form onSubmit={submitPayment} className="mt-3 space-y-3">
                <input
                  inputMode="numeric"
                  className={inputClass()}
                  placeholder="Amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value.replace(/[^\d]/g, ""))}
                />

                <select className={inputClass()} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="CASH">CASH</option>
                  <option value="MOMO">MOMO</option>
                  <option value="BANK">BANK</option>
                  <option value="OTHER">OTHER</option>
                </select>

                <input
                  className={inputClass()}
                  placeholder="Note (optional)"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />

                <button className={cx(warningBtn(), "w-full")}>Record payment</button>
              </form>
            </div>
          ) : null}

          <div className={cx(shell(), "p-5")}>
            <div className={cx("text-base font-semibold", strongText())}>Actions</div>
            <div className={cx("mt-1 text-sm", mutedText())}>
              Manage the financial lifecycle of this sale from one place.
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={openRefund} disabled={!canRefund} className={secondaryBtn()}>
                Refund
              </button>

              <button type="button" onClick={() => setCancelOpen(true)} disabled={!canCancel} className={dangerBtn()}>
                Cancel sale
              </button>

              <Link to="/app/pos" className={primaryBtn()}>
                New sale
              </Link>
            </div>
          </div>
        </aside>

        {cancelOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
            <div className={cx(shell(), "w-full max-w-md p-5")}>
              <div className={cx("text-lg font-semibold", strongText())}>Cancel sale</div>
              <p className={cx("mt-1 text-sm", mutedText())}>
                This will restock items and mark the sale cancelled.
              </p>

              <textarea
                className={cx(textareaClass(), "mt-4")}
                rows={3}
                placeholder="Reason / note (optional)"
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setCancelOpen(false)} disabled={cancelBusy} className={secondaryBtn()}>
                  Close
                </button>

                <button type="button" disabled={cancelBusy} onClick={confirmCancel} className={dangerBtn()}>
                  {cancelBusy ? "Cancelling..." : "Confirm cancel"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {refundOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
            <div className={cx(shell(), "w-full max-w-2xl p-5")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={cx("text-lg font-semibold", strongText())}>Create refund</div>
                  <p className={cx("mt-1 text-sm", mutedText())}>
                    Choose quantities to refund. Backend rules enforce paid amount and previous refunds.
                  </p>
                </div>

                <button type="button" onClick={() => setRefundOpen(false)} className={secondaryBtn()}>
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {receipt.items.map((it, idx) => {
                  const maxQty = Number(it.quantity || 0);
                  const current = clampInt(refundQtyByIdx[idx] ?? 0, 0, maxQty);

                  return (
                    <div
                      key={it.saleItemId || idx}
                      className={cx(panel(), "p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2")}
                    >
                      <div>
                        <div className={cx("text-sm font-medium", strongText())}>
                          {it.productName || "Unnamed product"}
                        </div>
                        <div className={cx("text-xs", mutedText())}>
                          Sold: <span className="font-medium">{maxQty}</span> • Unit:{" "}
                          <span className="font-medium">{formatMoney(it.price)}</span>
                        </div>

                        {!it.productId ? (
                          <div className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                            Missing productId in receipt response — refund submit will be blocked.
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button type="button" className={secondaryBtn()} onClick={() => setQty(idx, Math.max(0, current - 1))}>
                          −
                        </button>

                        <input
                          inputMode="numeric"
                          className="h-10 w-16 rounded-2xl border border-stone-300 px-2 text-sm text-center outline-none dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))]"
                          value={String(current)}
                          onChange={(e) => {
                            const v = String(e.target.value || "").replace(/[^\d]/g, "");
                            setQty(idx, clampInt(v || 0, 0, maxQty));
                          }}
                        />

                        <button type="button" className={secondaryBtn()} onClick={() => setQty(idx, Math.min(maxQty, current + 1))}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Method</label>
                  <select className={cx(inputClass(), "mt-1")} value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                    <option value="CASH">CASH</option>
                    <option value="MOMO">MOMO</option>
                    <option value="BANK">BANK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={cx("text-sm font-medium", strongText())}>Reason (optional)</label>
                  <input
                    className={cx(inputClass(), "mt-1")}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. defective item"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={cx("text-sm font-medium", strongText())}>Note (optional)</label>
                  <input
                    className={cx(inputClass(), "mt-1")}
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    placeholder="extra details"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className={cx("text-sm", mutedText())}>
                  Refund total (preview):{" "}
                  <span className={cx("font-semibold", strongText())}>{formatMoney(refundPreview.total)}</span>
                </div>

                <button type="button" disabled={refundBusy} onClick={confirmRefund} className={primaryBtn()}>
                  {refundBusy ? "Creating..." : "Create refund"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}