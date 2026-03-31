import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  addDealPayment,
  getDeal,
  getDealPayments,
  markPaid,
  markReceived,
  markReturned,
  markSold,
} from "../../services/interStoreApi";

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
  return "rounded-[26px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "min-h-[96px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function successBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-amber-500 bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-rose-600 bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60";
}

function formatMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function toDateLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function toDateTimeLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusMeta(status) {
  const map = {
    BORROWED: {
      label: "Borrowed",
      chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
    },
    RECEIVED: {
      label: "Received",
      chip: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300",
    },
    SOLD: {
      label: "Sold",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
    },
    PAID: {
      label: "Paid",
      chip: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300",
    },
    RETURNED: {
      label: "Returned",
      chip: "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200",
    },
  };

  return (
    map[String(status || "").toUpperCase()] || {
      label: String(status || "Unknown"),
      chip: "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200",
    }
  );
}

function StatusPill({ status }) {
  const meta = statusMeta(status);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.chip
      )}
    >
      {meta.label}
    </span>
  );
}

function InfoCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
      <div className={softText()}>{label}</div>
      <div className={cx("mt-1 text-sm font-semibold", strongText())}>{value || "—"}</div>
      {sub ? <div className={cx("mt-1 text-xs", mutedText())}>{sub}</div> : null}
    </div>
  );
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

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className={cx(shell(), "p-6")}>
        <div className="h-5 w-28 rounded bg-stone-200 dark:bg-stone-700" />
        <div className="mt-3 h-8 w-72 rounded bg-stone-200 dark:bg-stone-700" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-stone-100 dark:bg-stone-800" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cx(shell(), "h-28")} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cx(shell(), "h-[520px]")} />
        <div className={cx(shell(), "h-[520px]")} />
      </div>
    </div>
  );
}

function MiniActionModal({
  open,
  tone = "neutral",
  title,
  subtitle,
  children,
  confirmLabel,
  confirmClassName,
  loading,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  const toneBar =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-rose-500"
      : "bg-stone-900";

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-2xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]">
          <div className={cx("h-1.5 w-full", toneBar)} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className={cx("text-xl font-semibold", strongText())}>{title}</h3>
                {subtitle ? (
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>{subtitle}</p>
                ) : null}
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

            <div className="mt-5">{children}</div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={secondaryBtn()}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={confirmClassName}
              >
                {loading ? "Saving..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterStoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    owed: 0,
    totalPaid: 0,
    balanceDue: 0,
    count: 0,
    status: null,
    soldQuantity: 0,
    agreedPrice: 0,
  });

  const [busyAction, setBusyAction] = useState("");

  const [sellForm, setSellForm] = useState({
    soldPrice: "",
    soldQuantity: "1",
  });

  const [returnForm, setReturnForm] = useState({
    returnedQuantity: "1",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH",
    note: "",
  });

  const [markPaidForm, setMarkPaidForm] = useState({
    paidAmount: "",
    paymentMethod: "CASH",
  });

  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  async function loadAll() {
    try {
      setLoading(true);

      const [dealData, paymentsData] = await Promise.all([
        getDeal(String(id)),
        getDealPayments(String(id)),
      ]);

      setDeal(dealData || null);
      setPayments(Array.isArray(paymentsData?.payments) ? paymentsData.payments : []);
      setPaymentSummary(
        paymentsData?.summary || {
          owed: 0,
          totalPaid: 0,
          balanceDue: 0,
          count: 0,
          status: null,
          soldQuantity: 0,
          agreedPrice: 0,
        }
      );

      setSellForm({
        soldPrice: dealData?.soldPrice ? String(Number(dealData.soldPrice)) : "",
        soldQuantity: "1",
      });

      setReturnForm({
        returnedQuantity: "1",
      });

      setMarkPaidForm({
        paidAmount:
          paymentsData?.summary?.balanceDue > 0
            ? String(Number(paymentsData.summary.balanceDue))
            : "",
        paymentMethod: "CASH",
      });
    } catch (err) {
      toast.error(err?.message || "Failed to load deal");
      setDeal(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  const supplierLabel = useMemo(() => {
    if (!deal) return "—";
    return deal.supplierTenantId
      ? "Internal store"
      : deal.externalSupplierName || "External supplier";
  }, [deal]);

  const canReceive = deal?.status === "BORROWED";
  const canReturn = deal?.status === "BORROWED" || deal?.status === "RECEIVED";
  const canSell = deal?.status === "RECEIVED";
  const canAddPayment = deal?.status === "SOLD";
  const canMarkPaid = deal?.status === "SOLD";

  async function runAction(key, fn, successMessage) {
    try {
      setBusyAction(key);
      await fn();
      toast.success(successMessage);
      await loadAll();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusyAction("");
    }
  }

  async function handleReceive() {
    await runAction("receive", () => markReceived(String(id)), "Deal marked as received");
  }

  async function handleReturn() {
    const qty = Number(returnForm.returnedQuantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Returned quantity must be more than 0");
      return;
    }

    await runAction(
      "return",
      () =>
        markReturned(String(id), {
          returnedQuantity: Math.floor(qty),
        }),
      "Return recorded"
    );

    setReturnModalOpen(false);
  }

  async function handleSell() {
    const soldQuantity = Number(sellForm.soldQuantity);
    const soldPrice = Number(sellForm.soldPrice);

    if (!Number.isFinite(soldQuantity) || soldQuantity <= 0) {
      toast.error("Sold quantity must be more than 0");
      return;
    }

    if (sellForm.soldPrice !== "" && (!Number.isFinite(soldPrice) || soldPrice <= 0)) {
      toast.error("Sold price must be more than 0");
      return;
    }

    await runAction(
      "sell",
      () =>
        markSold(String(id), {
          soldQuantity: Math.floor(soldQuantity),
          soldPrice: sellForm.soldPrice === "" ? undefined : soldPrice,
        }),
      "Sale recorded"
    );

    setSellModalOpen(false);
  }

  async function handleAddPayment() {
    const amount = Number(paymentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Payment amount must be more than 0");
      return;
    }

    await runAction(
      "payment",
      () =>
        addDealPayment(String(id), {
          amount,
          method: paymentForm.method,
          note: String(paymentForm.note || "").trim() || null,
        }),
      "Payment recorded"
    );

    setPaymentForm({
      amount: "",
      method: "CASH",
      note: "",
    });
  }

  async function handleMarkPaid() {
    const paidAmount = Number(markPaidForm.paidAmount);

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      toast.error("Paid amount must be more than 0");
      return;
    }

    await runAction(
      "paid",
      () =>
        markPaid(String(id), {
          paidAmount,
          paymentMethod: markPaidForm.paymentMethod,
        }),
      "Deal marked as paid"
    );
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!deal) {
    return (
      <div className={cx(shell(), "px-5 py-12 text-center")}>
        <div className={cx("text-lg font-semibold", strongText())}>Deal not found</div>
        <div className={cx("mt-2 text-sm", mutedText())}>
          This deal could not be loaded.
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => navigate("/app/interstore")}
            className={secondaryBtn()}
          >
            Back to inter-store
          </button>
        </div>
      </div>
    );
  }

  const remainingUnits =
    Number(deal.quantity || 0) -
    Number(deal.soldQuantity || 0) -
    Number(deal.returnedQuantity || 0);

  const sellPreviewQty = Number(sellForm.soldQuantity || 0);
  const returnPreviewQty = Number(returnForm.returnedQuantity || 0);

  return (
    <div className="space-y-5">
      <MiniActionModal
        open={sellModalOpen}
        tone="warning"
        title="Record sale"
        subtitle="Confirm how many units were sold and the selling price before updating the deal."
        loading={busyAction === "sell"}
        onClose={() => {
          if (busyAction === "sell") return;
          setSellModalOpen(false);
        }}
        onConfirm={handleSell}
        confirmLabel="Confirm sale"
        confirmClassName={warningBtn()}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoCard label="Product" value={deal.productName} />
            <InfoCard label="Reseller" value={deal.resellerName} />
            <InfoCard label="Units remaining" value={String(Math.max(remainingUnits, 0))} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={cx("text-sm font-medium", strongText())}>Sold quantity</label>
              <input
                type="number"
                min="1"
                className={cx(inputClass(), "mt-2")}
                value={sellForm.soldQuantity}
                onChange={(e) =>
                  setSellForm((prev) => ({ ...prev, soldQuantity: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={cx("text-sm font-medium", strongText())}>Sold price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={cx(inputClass(), "mt-2")}
                value={sellForm.soldPrice}
                onChange={(e) =>
                  setSellForm((prev) => ({ ...prev, soldPrice: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            {Number.isFinite(sellPreviewQty) && sellPreviewQty > 0 ? (
              <>
                You are about to record a sale of{" "}
                <span className="font-semibold">{sellPreviewQty}</span> unit(s).
              </>
            ) : (
              <>Enter the sold quantity to preview this action.</>
            )}
          </div>
        </div>
      </MiniActionModal>

      <MiniActionModal
        open={returnModalOpen}
        tone="danger"
        title="Record return"
        subtitle="Confirm how many unsold units are being returned to the supplier."
        loading={busyAction === "return"}
        onClose={() => {
          if (busyAction === "return") return;
          setReturnModalOpen(false);
        }}
        onConfirm={handleReturn}
        confirmLabel="Confirm return"
        confirmClassName={dangerBtn()}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoCard label="Product" value={deal.productName} />
            <InfoCard label="Supplier" value={supplierLabel} />
            <InfoCard label="Units remaining" value={String(Math.max(remainingUnits, 0))} />
          </div>

          <div>
            <label className={cx("text-sm font-medium", strongText())}>Returned quantity</label>
            <input
              type="number"
              min="1"
              className={cx(inputClass(), "mt-2")}
              value={returnForm.returnedQuantity}
              onChange={(e) => setReturnForm({ returnedQuantity: e.target.value })}
            />
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
            {Number.isFinite(returnPreviewQty) && returnPreviewQty > 0 ? (
              <>
                You are about to return{" "}
                <span className="font-semibold">{returnPreviewQty}</span> unit(s) from this deal.
              </>
            ) : (
              <>Enter the returned quantity to preview this action.</>
            )}
          </div>
        </div>
      </MiniActionModal>

      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Inter-store detail
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className={cx("text-3xl font-semibold tracking-tight", strongText())}>
                  {deal.productName || "Unnamed product"}
                </h1>
                <StatusPill status={deal.status} />
              </div>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Full operational view for this deal: supplier, reseller, product movement,
                payments, and next allowed action.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/app/interstore")}
                className={secondaryBtn()}
              >
                Back to deals
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Agreed price"
            value={formatMoney(deal.agreedPrice)}
            note="Price promised to supplier"
          />
          <SummaryCard
            label="Amount owed"
            value={formatMoney(paymentSummary.owed)}
            note="Based on sold quantity"
            tone={paymentSummary.owed > 0 ? "warning" : "neutral"}
          />
          <SummaryCard
            label="Paid so far"
            value={formatMoney(paymentSummary.totalPaid)}
            note={`${paymentSummary.count} payment(s) recorded`}
            tone={paymentSummary.totalPaid > 0 ? "success" : "neutral"}
          />
          <SummaryCard
            label="Balance due"
            value={formatMoney(paymentSummary.balanceDue)}
            note={paymentSummary.balanceDue > 0 ? "Still outstanding" : "No remaining balance"}
            tone={paymentSummary.balanceDue > 0 ? "danger" : "success"}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className={cx(shell(), "p-5")}>
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Deal overview</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Clear business summary for non-technical users.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <InfoCard label="Serial number" value={deal.serial} />
              <InfoCard label="Supplier" value={supplierLabel} sub={deal.externalSupplierPhone || null} />
              <InfoCard label="Reseller" value={deal.resellerName} sub={deal.resellerPhone || null} />
              <InfoCard label="Reseller store" value={deal.resellerStore || "—"} />
              <InfoCard label="Quantity" value={String(deal.quantity || 0)} />
              <InfoCard label="Sold quantity" value={String(deal.soldQuantity || 0)} />
              <InfoCard label="Returned quantity" value={String(deal.returnedQuantity || 0)} />
              <InfoCard label="Due date" value={toDateLabel(deal.dueDate)} />
              <InfoCard label="Created" value={toDateLabel(deal.createdAt)} sub={toDateTimeLabel(deal.createdAt)} />
            </div>

            {deal.notes ? (
              <div className="mt-4 rounded-2xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-700 dark:border-[rgb(var(--border))] dark:text-[rgb(var(--text-muted))]">
                {deal.notes}
              </div>
            ) : null}
          </section>

          <section className={cx(shell(), "p-5")}>
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Payments</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Record installments and see the running balance clearly.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <InfoCard label="Owed" value={formatMoney(paymentSummary.owed)} />
              <InfoCard label="Total paid" value={formatMoney(paymentSummary.totalPaid)} />
              <InfoCard label="Balance due" value={formatMoney(paymentSummary.balanceDue)} />
            </div>

            {canAddPayment ? (
              <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                <div className={cx("text-sm font-semibold", strongText())}>Add installment payment</div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={cx(inputClass(), "mt-2")}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Method</label>
                    <select
                      className={cx(inputClass(), "mt-2")}
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOMO">MoMo</option>
                      <option value="BANK">Bank</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={cx("text-sm font-medium", strongText())}>Note</label>
                    <textarea
                      className={cx(textareaClass(), "mt-2")}
                      value={paymentForm.note}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Optional note about this payment"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    disabled={busyAction === "payment"}
                    className={successBtn()}
                  >
                    {busyAction === "payment" ? "Saving..." : "Record payment"}
                  </button>
                </div>
              </div>
            ) : null}

            {payments.length === 0 ? (
              <div className={cx("mt-5 rounded-2xl border border-dashed px-4 py-8 text-center text-sm", mutedText())}>
                No payments recorded yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className={cx("text-sm font-semibold", strongText())}>
                          {formatMoney(payment.amount)}
                        </div>
                        <div className={cx("mt-1 text-sm", mutedText())}>
                          {payment.method || "—"}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className={cx("text-sm", strongText())}>{toDateTimeLabel(payment.createdAt)}</div>
                      </div>
                    </div>

                    {payment.note ? (
                      <div className={cx("mt-3 text-sm", mutedText())}>{payment.note}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className={cx(shell(), "p-5")}>
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Next actions</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Only show what still makes sense for this deal.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {canReceive ? (
                <button
                  type="button"
                  onClick={handleReceive}
                  disabled={busyAction === "receive"}
                  className={successBtn()}
                >
                  {busyAction === "receive" ? "Receiving..." : "Mark as received"}
                </button>
              ) : null}

              {canSell ? (
                <button
                  type="button"
                  onClick={() => setSellModalOpen(true)}
                  disabled={busyAction !== ""}
                  className={warningBtn()}
                >
                  Record sale
                </button>
              ) : null}

              {canReturn ? (
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(true)}
                  disabled={busyAction !== ""}
                  className={dangerBtn()}
                >
                  Record return
                </button>
              ) : null}

              {canMarkPaid ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                  <div className={cx("text-sm font-semibold", strongText())}>Complete payment</div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Paid amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={cx(inputClass(), "mt-2")}
                        value={markPaidForm.paidAmount}
                        onChange={(e) => setMarkPaidForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                        placeholder="Enter final paid amount"
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Method</label>
                      <select
                        className={cx(inputClass(), "mt-2")}
                        value={markPaidForm.paymentMethod}
                        onChange={(e) => setMarkPaidForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <option value="CASH">Cash</option>
                        <option value="MOMO">MoMo</option>
                        <option value="BANK">Bank</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkPaid}
                      disabled={busyAction === "paid"}
                      className={primaryBtn()}
                    >
                      {busyAction === "paid" ? "Saving..." : "Mark fully paid"}
                    </button>
                  </div>
                </div>
              ) : null}

              {!canReceive && !canSell && !canReturn && !canAddPayment && !canMarkPaid ? (
                <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-600 dark:border-[rgb(var(--border))] dark:text-[rgb(var(--text-muted))]">
                  No further operational action is needed for this deal right now.
                </div>
              ) : null}
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Timeline</h2>
            </div>

            <div className="mt-4 space-y-3">
              <InfoCard label="Borrowed at" value={toDateTimeLabel(deal.borrowedAt)} />
              <InfoCard label="Taken at" value={toDateTimeLabel(deal.takenAt)} />
              <InfoCard label="Received at" value={toDateTimeLabel(deal.receivedAt)} />
              <InfoCard label="Sold at" value={toDateTimeLabel(deal.soldAt)} />
              <InfoCard label="Returned at" value={toDateTimeLabel(deal.returnedAt)} />
              <InfoCard label="Paid at" value={toDateTimeLabel(deal.paidAt)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}