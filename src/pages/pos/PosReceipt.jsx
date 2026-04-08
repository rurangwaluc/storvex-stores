import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  addSalePayment,
  getReceipt,
  cancelSale as cancelSaleApi,
  createRefund as createRefundApi,
} from "../../services/posApi";
import { getReceiptPrintUrl } from "../../services/receiptsApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

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

function inputClass() {
  return "app-input";
}

function textareaClass() {
  return "min-h-[104px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[#d9a700] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
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

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>
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

function StatusPill({ status }) {
  const normalized = String(status || "").toUpperCase();

  const kind =
    normalized === "PAID"
      ? "success"
      : normalized === "OVERDUE"
      ? "danger"
      : normalized === "PARTIAL" || normalized === "UNPAID"
      ? "warning"
      : normalized === "CANCELLED"
      ? "neutral"
      : "neutral";

  return <StatusBadge kind={kind}>{normalized}</StatusBadge>;
}

function SaleTypePill({ value }) {
  const normalized = String(value || "").toUpperCase();
  const cls =
    normalized === "CASH"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[#fff1c9] text-[#b88900]";

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
      {normalized}
    </span>
  );
}

function SummaryTile({ label, value, note, tone = "neutral" }) {
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
      ? "text-[var(--color-danger)]"
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
    <div className={cx("rounded-[22px] border p-4 shadow-[var(--shadow-soft)]", toneCls)}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", labelCls)}>
        {label}
      </div>
      <div className={cx("mt-3 text-[1.35rem] font-black tracking-tight", valueCls)}>{value}</div>
      {note ? <div className={cx("mt-2 text-sm leading-6", labelCls)}>{note}</div> : null}
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
      ? "text-[var(--color-danger)]"
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
    <div className={cx("rounded-[22px] border p-4 shadow-[var(--shadow-soft)]", toneCls)}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", labelCls)}>
        {label}
      </div>
      <div className={cx("mt-3 text-sm font-bold leading-6", valueCls)}>{value}</div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function ReceiptSkeleton() {
  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-12 w-64" />
            <SkeletonBlock className="h-4 w-[28rem] max-w-full" />
            <SkeletonBlock className="h-4 w-[22rem] max-w-full" />
          </div>

          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-11 w-32 rounded-2xl" />
            <SkeletonBlock className="h-11 w-36 rounded-2xl" />
            <SkeletonBlock className="h-11 w-36 rounded-2xl" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-8 w-28" />
                <SkeletonBlock className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <section className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="h-14 w-14 rounded-[18px]" />
              <div className="space-y-3">
                <SkeletonBlock className="h-6 w-44" />
                <SkeletonBlock className="h-4 w-60" />
                <SkeletonBlock className="h-4 w-52" />
              </div>
            </div>

            <div className="space-y-2">
              <SkeletonBlock className="h-8 w-24" />
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
          </div>

          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-24 w-full rounded-[22px]" />
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SkeletonBlock className="h-40 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
        </section>

        <aside className="space-y-5">
          <SkeletonBlock className="h-64 w-full rounded-[28px]" />
          <SkeletonBlock className="h-52 w-full rounded-[28px]" />
          <SkeletonBlock className="h-52 w-full rounded-[28px]" />
        </aside>
      </div>
    </div>
  );
}

function WarrantyBlock({ receipt, saleDate, store, compact = false }) {
  const warranties = Array.isArray(receipt?.warranties) ? receipt.warranties : [];
  const hasWarranty = warranties.length > 0;

  return (
    <div className={cx(pageCard(), compact ? "p-5" : "p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Warranty
          </div>
          <div className={cx("mt-3 text-lg font-black tracking-tight", strongText())}>
            Warranty coverage
          </div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            Keep this record for product support and service verification.
          </div>
        </div>

        <div className={cx("text-xs leading-6 md:text-right", mutedText())}>
          {store?.name ? (
            <div className={cx("font-semibold", strongText())}>{store.name}</div>
          ) : null}
          <div>Receipt: {receipt?.number || receipt?.id || "—"}</div>
          <div>Date: {saleDate ? saleDate.toLocaleDateString() : "—"}</div>
        </div>
      </div>

      {!hasWarranty ? (
        <div className={cx(softPanel(), "mt-5 p-5")}>
          <div className={cx("text-sm font-semibold", strongText())}>No warranty recorded</div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            When warranties are added, this section will show reference number, active dates, and policy notes.
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {warranties.map((w, idx) => {
            const starts = safeDate(w.startsAt);
            const ends = safeDate(w.endsAt);

            return (
              <div key={w.id || idx} className={cx(softPanel(), "p-5")}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className={cx("text-base font-bold", strongText())}>
                      {w.warrantyNumber || `Warranty #${idx + 1}`}
                    </div>
                    <div className={cx("mt-1 text-sm", mutedText())}>
                      Support coverage recorded for this sale.
                    </div>
                  </div>

                  <div className={cx("text-xs leading-6 md:text-right", mutedText())}>
                    <div>Start: {starts ? starts.toLocaleDateString() : "—"}</div>
                    <div>End: {ends ? ends.toLocaleDateString() : "—"}</div>
                  </div>
                </div>

                {w.policy ? (
                  <div className={cx("mt-4 whitespace-pre-wrap text-sm leading-6", mutedText())}>
                    <span className={cx("font-semibold", strongText())}>Policy:</span> {w.policy}
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("refund") === "1") {
      setRefundOpen(true);
      setSearchParams({});
    }
  }, [setSearchParams]);

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
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

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

    if (!items.length) {
      toast.error("Select at least one item quantity to refund");
      return;
    }

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

  const paymentCount = Array.isArray(receipt?.payments) ? receipt.payments.length : 0;
  const itemCount = Array.isArray(receipt?.items)
    ? receipt.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0)
    : 0;

  if (loading) return <ReceiptSkeleton />;

  if (!receipt) {
    return (
      <div className="space-y-6">
        <div className={cx(pageCard(), "p-6")}>
          <div className={cx("text-xl font-black tracking-tight", strongText())}>Receipt not found</div>
          <p className={cx("mt-2 text-sm leading-6", mutedText())}>
            This receipt could not be loaded.
          </p>
          <div className="mt-5">
            <Link to="/app/pos" className={primaryBtn()}>
              New sale
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionHeading
            eyebrow="POS"
            title="Receipt detail"
            subtitle="Review the sale record, verify payments and balances, and manage the sale’s financial lifecycle with confidence."
          />

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

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Receipt number"
            value={receipt.number || receipt.id || "—"}
            note="Primary sale document reference"
          />
          <SummaryTile
            label="Total"
            value={formatMoney(receipt.total)}
            note={`${itemCount} unit${itemCount === 1 ? "" : "s"} sold`}
            tone="success"
          />
          <SummaryTile
            label="Paid"
            value={formatMoney(paid)}
            note={`${paymentCount} payment${paymentCount === 1 ? "" : "s"} recorded`}
            tone={paid > 0 ? "success" : "neutral"}
          />
          <SummaryTile
            label="Balance due"
            value={formatMoney(balance)}
            note={receipt.saleType === "CREDIT" ? "Credit balance still open" : "No balance expected"}
            tone={balance > 0 ? "warning" : "neutral"}
          />
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <section className="space-y-5">
          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                {store?.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt="Store logo"
                    className="h-14 w-14 rounded-[18px] object-contain"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-text-muted)]">
                    LOGO
                  </div>
                )}

                <div className="min-w-0">
                  <div className={cx("text-lg font-black tracking-tight", strongText())}>
                    {store?.name || "Store"}
                  </div>

                  <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                    {store?.receiptHeader ? (
                      <div className="whitespace-pre-wrap">{store.receiptHeader}</div>
                    ) : (
                      <div>Official sale receipt and payment record.</div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {store?.phone ? <span>Tel: {store.phone}</span> : null}
                      {store?.email ? <span>Email: {store.email}</span> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-left lg:text-right">
                <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                  Document state
                </div>

                <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                  <SaleTypePill value={receipt.saleType} />
                  <StatusPill status={receipt.status} />
                  {receipt.isCancelled ? <StatusBadge kind="danger">Cancelled</StatusBadge> : null}
                </div>

                <div className={cx("mt-3 space-y-1 text-sm", mutedText())}>
                  <div>
                    <span className={cx("font-semibold", strongText())}>Date:</span>{" "}
                    {saleDate ? saleDate.toLocaleString() : "—"}
                  </div>
                  <div>
                    <span className={cx("font-semibold", strongText())}>Cashier:</span>{" "}
                    {receipt.cashierName || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className={cx(softPanel(), "p-5")}>
                <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                  Bill to
                </div>

                <div className="mt-3">
                  {receipt.customer ? (
                    <>
                      <div className={cx("text-base font-bold", strongText())}>{receipt.customer.name}</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>{receipt.customer.phone || "No phone"}</div>
                    </>
                  ) : (
                    <>
                      <div className={cx("text-base font-bold", strongText())}>Walk-in customer</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>
                        No saved customer record was attached.
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={cx(softPanel(), "p-5")}>
                <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                  Credit detail
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className={mutedText()}>Due date</span>
                    <span className={cx("font-semibold", strongText())}>
                      {receipt.dueDate ? new Date(receipt.dueDate).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className={mutedText()}>Paid</span>
                    <span className={cx("font-semibold", strongText())}>{formatMoney(receipt.amountPaid)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className={mutedText()}>Balance</span>
                    <span className={cx("font-semibold", strongText())}>{formatMoney(receipt.balanceDue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={cx(pageCard(), "overflow-hidden")}>
            <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
              <div className={cx("text-lg font-black tracking-tight", strongText())}>Sold items</div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Finalized items captured under this receipt.
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3">
                {receipt.items.map((it, idx) => (
                  <article key={it.saleItemId || it.id || idx} className={cx(softPanel(), "p-5")}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className={cx("text-lg font-bold", strongText())}>
                          {it.productName || "Unnamed product"}
                        </div>

                        <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                          {it.sku ? <span>SKU: {it.sku}</span> : null}
                          {it.sku && it.barcode ? <span> • </span> : null}
                          {it.barcode ? <span>Barcode: {it.barcode}</span> : null}
                          {!it.sku && !it.barcode && it.serial ? <span>Serial: {it.serial}</span> : null}
                          {!it.sku && !it.barcode && !it.serial ? <span>No extra code recorded</span> : null}
                        </div>
                      </div>

                      <div className="grid w-full max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-3">
                        <InfoTile label="Quantity" value={it.quantity} />
                        <InfoTile label="Rate" value={formatMoney(it.price)} />
                        <InfoTile label="Amount" value={formatMoney(it.subtotal)} tone="success" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Notes
              </div>
              <div className={cx("mt-3 text-lg font-black tracking-tight", strongText())}>
                Terms & support
              </div>

              <div className={cx("mt-4 space-y-3 text-sm leading-6", mutedText())}>
                <div>Keep this receipt for warranty and service support.</div>

                {receipt.cancelNote ? (
                  <div className="rounded-[18px] bg-[rgba(219,80,74,0.10)] px-4 py-3 text-[var(--color-danger)]">
                    <span className="font-semibold">Cancel note:</span> {receipt.cancelNote}
                  </div>
                ) : null}

                {store?.receiptFooter ? (
                  <div className="whitespace-pre-wrap">{store.receiptFooter}</div>
                ) : null}
              </div>
            </div>

            <div className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Financial summary
              </div>
              <div className={cx("mt-3 text-lg font-black tracking-tight", strongText())}>
                Sale totals
              </div>

              <div className="mt-5 space-y-3">
                <div className={cx(softPanel(), "p-4")}>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className={mutedText()}>Subtotal</span>
                      <span className={cx("font-semibold", strongText())}>{formatMoney(subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className={mutedText()}>Discount</span>
                      <span className={cx("font-semibold", strongText())}>{formatMoney(0)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className={mutedText()}>Tax</span>
                      <span className={cx("font-semibold", strongText())}>{formatMoney(0)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className={mutedText()}>Refunded</span>
                      <span className={cx("font-semibold", strongText())}>{formatMoney(refundedTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] bg-[var(--color-primary)] px-5 py-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em]">Total</span>
                    <span className="text-[1.5rem] font-black tracking-tight">{formatMoney(receipt.total)}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Paid" value={formatMoney(paid)} tone={paid > 0 ? "success" : "neutral"} />
                  <InfoTile label="Balance" value={formatMoney(balance)} tone={balance > 0 ? "warning" : "neutral"} />
                </div>
              </div>
            </div>
          </section>

          <WarrantyBlock receipt={receipt} saleDate={saleDate} store={store} compact />
        </section>

        <aside className="space-y-5">
          {Array.isArray(receipt.payments) && receipt.payments.length ? (
            <section className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Payments
              </div>
              <div className={cx("mt-3 text-lg font-black tracking-tight", strongText())}>
                Payment timeline
              </div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Recorded payment activity for this sale.
              </div>

              <div className="mt-5 space-y-3">
                {receipt.payments.map((p, idx) => (
                  <div key={p.id || idx} className={cx(softPanel(), "p-4")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={cx("text-base font-bold", strongText())}>
                          {formatMoney(p.amount)}
                        </div>
                        <div className={cx("mt-1 text-sm", mutedText())}>{p.method}</div>
                      </div>

                      <StatusBadge kind="success">Recorded</StatusBadge>
                    </div>

                    <div className={cx("mt-3 text-xs leading-6", mutedText())}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                    </div>

                    {p.note ? (
                      <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                        Note: {p.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {canAddPayment ? (
            <section className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Credit action
              </div>
              <div className={cx("mt-3 text-lg font-black tracking-tight", strongText())}>
                Add payment
              </div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Record a new payment against the remaining balance.
              </div>

              <form onSubmit={submitPayment} className="mt-5 space-y-4">
                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Amount</label>
                  <input
                    inputMode="numeric"
                    className={cx(inputClass(), "mt-2")}
                    placeholder="Amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Method</label>
                  <select className={cx(inputClass(), "mt-2")} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    <option value="CASH">CASH</option>
                    <option value="MOMO">MOMO</option>
                    <option value="BANK">BANK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Note</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    placeholder="Optional note"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                  />
                </div>

                <button className={cx(warningBtn(), "w-full")} type="submit">
                  Record payment
                </button>
              </form>
            </section>
          ) : null}

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              Actions
            </div>
            <div className={cx("mt-3 text-lg font-black tracking-tight", strongText())}>
              Sale controls
            </div>
            <div className={cx("mt-2 text-sm leading-6", mutedText())}>
              Manage the final lifecycle of this sale from one place.
            </div>

            <div className="mt-5 flex flex-col gap-2">
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
          </section>
        </aside>
      </div>

      {cancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className={cx(pageCard(), "w-full max-w-md p-5 sm:p-6")}>
            <div className={cx("text-lg font-black tracking-tight", strongText())}>Cancel sale</div>
            <p className={cx("mt-2 text-sm leading-6", mutedText())}>
              This will restock items and mark the sale as cancelled.
            </p>

            <textarea
              className={cx(textareaClass(), "mt-4")}
              rows={3}
              placeholder="Reason / note (optional)"
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          <div className={cx(pageCard(), "w-full max-w-3xl p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={cx("text-lg font-black tracking-tight", strongText())}>Create refund</div>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Choose the quantities to refund. Backend rules still enforce paid amount and previous refunds.
                </p>
              </div>

              <button type="button" onClick={() => setRefundOpen(false)} className={secondaryBtn()}>
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {receipt.items.map((it, idx) => {
                const maxQty = Number(it.quantity || 0);
                const current = clampInt(refundQtyByIdx[idx] ?? 0, 0, maxQty);

                return (
                  <div key={it.saleItemId || idx} className={cx(softPanel(), "p-4")}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className={cx("text-base font-bold", strongText())}>
                          {it.productName || "Unnamed product"}
                        </div>
                        <div className={cx("mt-1 text-sm", mutedText())}>
                          Sold: <span className={cx("font-semibold", strongText())}>{maxQty}</span>
                          {" • "}
                          Unit: <span className={cx("font-semibold", strongText())}>{formatMoney(it.price)}</span>
                        </div>

                        {!it.productId ? (
                          <div className="mt-2 text-sm text-[var(--color-danger)]">
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
                          className="h-11 w-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-center text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
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
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={cx("text-sm font-medium", strongText())}>Method</label>
                <select className={cx(inputClass(), "mt-2")} value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                  <option value="CASH">CASH</option>
                  <option value="MOMO">MOMO</option>
                  <option value="BANK">BANK</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>Reason</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. defective item"
                />
              </div>

              <div className="md:col-span-3">
                <label className={cx("text-sm font-medium", strongText())}>Note</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Extra details"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className={cx("text-sm", mutedText())}>
                Refund total preview:{" "}
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
  );
}