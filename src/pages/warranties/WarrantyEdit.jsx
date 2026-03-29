import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getSale } from "../../services/posApi";
import { getWarranty, updateWarranty } from "../../services/warrantiesApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function panel() {
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
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

function labelClass() {
  return "mb-2 block text-sm font-medium text-stone-900 dark:text-[rgb(var(--text))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function smallBtn() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function summaryRow(label, value, strong = false) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-stone-600 dark:text-[rgb(var(--text-muted))]">{label}</span>
      <span
        className={cx(
          "text-sm text-right",
          strong ? "font-semibold" : "font-medium",
          strong ? strongText() : mutedText()
        )}
      >
        {value}
      </span>
    </div>
  );
}

function money(n, currency = "RWF") {
  return `${currency} ${Number(n || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function badgeClass(kind = "neutral") {
  if (kind === "success") {
    return "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300";
  }
  if (kind === "warning") {
    return "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
  }
  if (kind === "danger") {
    return "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300";
  }
  return "inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-700 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))] dark:text-[rgb(var(--text-muted))]";
}

function statusKind(status) {
  const s = String(status || "").toUpperCase();
  if (["PAID", "COMPLETED", "ACTIVE"].includes(s)) return "success";
  if (["PARTIAL", "UNPAID", "PENDING"].includes(s)) return "warning";
  if (["CANCELLED", "EXPIRED", "OVERDUE"].includes(s)) return "danger";
  return "neutral";
}

function saleReferenceLabel(sale) {
  return sale?.receiptNumber || sale?.invoiceNumber || sale?.id || "Sale";
}

function saleCaption(sale) {
  const customer = sale?.customer?.name || sale?.customer?.phone || "Walk-in Customer";
  const cashier = sale?.cashier?.name || "—";
  return `${customer} • Cashier: ${cashier}`;
}

function normalizeSaleDetail(raw) {
  const sale = raw?.sale || raw || {};
  const items = Array.isArray(sale?.items) ? sale.items : [];

  return {
    id: sale?.id || null,
    receiptNumber: sale?.receiptNumber || null,
    invoiceNumber: sale?.invoiceNumber || null,
    total: Number(sale?.total || 0),
    createdAt: sale?.createdAt || null,
    saleType: sale?.saleType || null,
    status: sale?.status || null,
    customer: sale?.customer || null,
    cashier: sale?.cashier || (sale?.cashierName ? { name: sale.cashierName } : null),
    items,
  };
}

function normalizeWarrantyDetail(raw) {
  const warranty = raw?.warranty || raw || {};
  const units = Array.isArray(warranty?.units) ? warranty.units : [];

  return {
    id: warranty?.id || null,
    number: warranty?.number || warranty?.warrantyNumber || null,
    warrantyNumber: warranty?.warrantyNumber || warranty?.number || null,
    saleId: warranty?.saleId || null,
    policy: warranty?.policy || "",
    durationMonths: warranty?.durationMonths ?? "",
    durationDays: warranty?.durationDays ?? "",
    startsAt: warranty?.startsAt || null,
    endsAt: warranty?.endsAt || null,
    createdAt: warranty?.createdAt || null,
    customer: warranty?.customer || null,
    cashierName: warranty?.cashierName || null,
    receiptNumber: warranty?.receiptNumber || null,
    invoiceNumber: warranty?.invoiceNumber || null,
    saleDate: warranty?.saleDate || null,
    units,
  };
}

function buildSelectableItemsFromSaleAndWarranty(sale, warranty) {
  const saleItems = Array.isArray(sale?.items) ? sale.items : [];
  const warrantyUnits = Array.isArray(warranty?.units) ? warranty.units : [];

  const unitMap = new Map(
    warrantyUnits.map((unit) => [
      String(unit.saleItemId || ""),
      {
        serial: unit?.serial || "",
        imei1: unit?.imei1 || "",
        imei2: unit?.imei2 || "",
        unitLabel: unit?.unitLabel || "",
      },
    ])
  );

  return saleItems.map((item, index) => {
    const existing = unitMap.get(String(item?.id || "")) || null;

    return {
      key: item?.id || `${item?.productId || "product"}-${index}`,
      checked: Boolean(existing),
      saleItemId: item?.id ? String(item.id) : "",
      productId: item?.productId ? String(item.productId) : "",
      unitLabel:
        existing?.unitLabel ||
        item?.product?.name ||
        item?.productName ||
        "Covered Unit",
      serial: existing?.serial || item?.product?.serial || item?.serial || "",
      imei1: existing?.imei1 || "",
      imei2: existing?.imei2 || "",
      quantity: Number(item?.quantity || 1),
    };
  });
}

export default function WarrantyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [warranty, setWarranty] = useState(null);
  const [sale, setSale] = useState(null);

  const [form, setForm] = useState({
    policy: "",
    startsAt: "",
    endsAt: "",
    durationMonths: "",
    durationDays: "",
  });

  const [selectableItems, setSelectableItems] = useState([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSelectableItem(index, key, value) {
    setSelectableItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function toggleAllCovered(nextChecked) {
    setSelectableItems((prev) => prev.map((item) => ({ ...item, checked: nextChecked })));
  }

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        setLoading(true);

        const warrantyRaw = await getWarranty(id);
        const normalizedWarranty = normalizeWarrantyDetail(warrantyRaw);

        if (!normalizedWarranty?.saleId) {
          throw new Error("Warranty sale is missing");
        }

        const saleRaw = await getSale(normalizedWarranty.saleId);
        const normalizedSale = normalizeSaleDetail(saleRaw);

        if (!mountedRef.current) return;

        setWarranty(normalizedWarranty);
        setSale(normalizedSale);

        setForm({
          policy: normalizedWarranty.policy || "",
          startsAt: toInputDate(normalizedWarranty.startsAt),
          endsAt: toInputDate(normalizedWarranty.endsAt),
          durationMonths:
            normalizedWarranty.durationMonths === null ||
            normalizedWarranty.durationMonths === undefined
              ? ""
              : String(normalizedWarranty.durationMonths),
          durationDays:
            normalizedWarranty.durationDays === null ||
            normalizedWarranty.durationDays === undefined
              ? ""
              : String(normalizedWarranty.durationDays),
        });

        setSelectableItems(
          buildSelectableItemsFromSaleAndWarranty(normalizedSale, normalizedWarranty)
        );
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Failed to load warranty");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    load();
  }, [id]);

  const selectedCoveredItems = useMemo(() => {
    return selectableItems.filter(
      (item) =>
        item.checked &&
        String(item.saleItemId || "").trim() &&
        String(item.productId || "").trim()
    );
  }, [selectableItems]);

  const totalSoldItems = selectableItems.length;
  const totalCoveredItems = selectedCoveredItems.length;

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.policy.trim()) {
      toast.error("Warranty policy is required");
      return;
    }

    if (!selectedCoveredItems.length) {
      toast.error("Select at least one sold item to cover");
      return;
    }

    try {
      setSaving(true);

      await updateWarranty(id, {
        policy: form.policy.trim(),
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
        durationMonths: form.durationMonths ? Number(form.durationMonths) : undefined,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        units: selectedCoveredItems.map((item) => ({
          saleItemId: String(item.saleItemId),
          productId: String(item.productId),
          unitLabel: item.unitLabel?.trim() || undefined,
          serial: item.serial?.trim() || undefined,
          imei1: item.imei1?.trim() || undefined,
          imei2: item.imei2?.trim() || undefined,
        })),
      });

      toast.success("Warranty updated");
      navigate(`/app/documents/warranties/${encodeURIComponent(id)}/preview`);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update warranty");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <section className={cx(shell(), "p-5 md:p-6")}>
          <div className="h-6 w-40 animate-pulse rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
        </section>

        <section className={cx(panel(), "p-4 md:p-5")}>
          <div className="h-40 animate-pulse rounded-2xl bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
        </section>
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
              Document editing
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Edit Warranty
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              Update the warranty terms and confirm which sold items remain covered.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/documents/warranties" className={secondaryBtn()}>
              Back to Warranties
            </Link>
            <Link
              to={`/app/documents/warranties/${encodeURIComponent(id)}/preview`}
              className={secondaryBtn()}
            >
              Preview
            </Link>
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className={cx(panel(), "p-4 md:p-5")}>
            <h2 className={cx("text-base font-semibold", strongText())}>Linked sale</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              This warranty stays attached to its original sale.
            </p>

            {sale ? (
              <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Selected sale
                    </div>
                    <div className="mt-1 text-sm text-emerald-700 dark:text-emerald-200">
                      {saleReferenceLabel(sale)}
                    </div>
                    <div className="mt-1 text-sm text-emerald-700/90 dark:text-emerald-200/90">
                      {saleCaption(sale)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">
                      <span>Date: {formatDate(sale?.createdAt)}</span>
                      <span>Total: {money(sale?.total || 0, "RWF")}</span>
                      <span>Sale Type: {sale?.saleType || "—"}</span>
                      {warranty?.warrantyNumber ? <span>Warranty: {warranty.warrantyNumber}</span> : null}
                    </div>
                  </div>

                  <span className={badgeClass(statusKind(sale?.status))}>
                    {sale?.status || "SALE"}
                  </span>
                </div>
              </div>
            ) : (
              <div className={cx("mt-5 rounded-[20px] border border-dashed border-stone-300 p-5 text-sm", mutedText())}>
                Sale information is unavailable.
              </div>
            )}
          </section>

          <section className={cx(panel(), "p-4 md:p-5")}>
            <h2 className={cx("text-base font-semibold", strongText())}>Warranty setup</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Update the coverage period and the policy shown on the certificate.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass()}>Starts at</label>
                <input
                  value={form.startsAt}
                  onChange={(e) => updateField("startsAt", e.target.value)}
                  className={inputClass()}
                  type="date"
                />
              </div>

              <div>
                <label className={labelClass()}>Ends at</label>
                <input
                  value={form.endsAt}
                  onChange={(e) => updateField("endsAt", e.target.value)}
                  className={inputClass()}
                  type="date"
                />
              </div>

              <div>
                <label className={labelClass()}>Duration months</label>
                <input
                  value={form.durationMonths}
                  onChange={(e) => updateField("durationMonths", e.target.value)}
                  className={inputClass()}
                  type="number"
                  min="0"
                />
              </div>

              <div>
                <label className={labelClass()}>Duration days</label>
                <input
                  value={form.durationDays}
                  onChange={(e) => updateField("durationDays", e.target.value)}
                  className={inputClass()}
                  type="number"
                  min="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass()}>Warranty policy</label>
                <textarea
                  value={form.policy}
                  onChange={(e) => updateField("policy", e.target.value)}
                  className={textareaClass()}
                  placeholder="Describe the warranty coverage clearly"
                  rows={5}
                  required
                />
              </div>
            </div>
          </section>

          <section className={cx(panel(), "p-4 md:p-5")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className={cx("text-base font-semibold", strongText())}>Covered sold items</h2>
                <p className={cx("mt-1 text-sm", mutedText())}>
                  Keep items checked when they should remain covered.
                </p>
              </div>

              {sale && selectableItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllCovered(true)}
                    className={smallBtn()}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllCovered(false)}
                    className={smallBtn()}
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>

            {!sale ? (
              <div className={cx("mt-5 rounded-[20px] border border-dashed border-stone-300 p-5 text-sm", mutedText())}>
                Sale information is unavailable.
              </div>
            ) : selectableItems.length === 0 ? (
              <div className={cx("mt-5 rounded-[20px] border border-dashed border-stone-300 p-5 text-sm", mutedText())}>
                This sale has no loaded items available for warranty.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className={cx(shell(), "p-4")}>
                    <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                      Sold items
                    </div>
                    <div className={cx("mt-2 text-2xl font-semibold", strongText())}>
                      {totalSoldItems}
                    </div>
                  </div>

                  <div className={cx(shell(), "p-4")}>
                    <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                      Covered now
                    </div>
                    <div className={cx("mt-2 text-2xl font-semibold", strongText())}>
                      {totalCoveredItems}
                    </div>
                  </div>

                  <div className={cx(shell(), "p-4")}>
                    <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                      Excluded
                    </div>
                    <div className={cx("mt-2 text-2xl font-semibold", strongText())}>
                      {Math.max(0, totalSoldItems - totalCoveredItems)}
                    </div>
                  </div>
                </div>

                {selectableItems.map((item, index) => (
                  <div
                    key={item.key}
                    className={cx(
                      "rounded-[20px] border p-4 transition",
                      item.checked
                        ? "border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]"
                        : "border-stone-200/80 bg-white opacity-80 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => updateSelectableItem(index, "checked", e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={cx("text-sm font-semibold", strongText())}>
                            {item.unitLabel || `Sold item ${index + 1}`}
                          </div>
                          <span className={badgeClass(item.checked ? "success" : "neutral")}>
                            {item.checked ? "Covered" : "Excluded"}
                          </span>
                        </div>

                        <div className={cx("mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs", softText())}>
                          <span>Qty: {item.quantity || 1}</span>
                          <span>Sold item linked</span>
                        </div>

                        {item.checked ? (
                          <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div>
                              <label className={labelClass()}>Label</label>
                              <input
                                value={item.unitLabel}
                                onChange={(e) => updateSelectableItem(index, "unitLabel", e.target.value)}
                                className={inputClass()}
                                placeholder="Product name / covered unit"
                              />
                            </div>

                            <div>
                              <label className={labelClass()}>Serial</label>
                              <input
                                value={item.serial}
                                onChange={(e) => updateSelectableItem(index, "serial", e.target.value)}
                                className={inputClass()}
                                placeholder="Serial number"
                              />
                            </div>

                            <div>
                              <label className={labelClass()}>IMEI 1</label>
                              <input
                                value={item.imei1}
                                onChange={(e) => updateSelectableItem(index, "imei1", e.target.value)}
                                className={inputClass()}
                                placeholder="IMEI 1"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className={labelClass()}>IMEI 2</label>
                              <input
                                value={item.imei2}
                                onChange={(e) => updateSelectableItem(index, "imei2", e.target.value)}
                                className={inputClass()}
                                placeholder="IMEI 2"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className={cx("mt-3 text-sm", mutedText())}>
                            This sold item will not be included in the warranty.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className={cx(shell(), "p-4 md:p-5 xl:sticky xl:top-5")}>
            <div>
              <h2 className={cx("text-base font-semibold", strongText())}>Summary</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Review before saving changes.
              </p>
            </div>

            <div className="mt-5 divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
              {summaryRow("Warranty number", warranty?.warrantyNumber || warranty?.number || "—")}
              {summaryRow("Sale reference", sale ? saleReferenceLabel(sale) : "—")}
              {summaryRow(
                "Customer",
                sale ? sale?.customer?.name || sale?.customer?.phone || "Walk-in Customer" : "—"
              )}
              {summaryRow("Covered items", String(totalCoveredItems))}
              {summaryRow("Months", form.durationMonths || "0")}
              {summaryRow("Days", form.durationDays || "0")}
              {summaryRow("Starts", form.startsAt || "—")}
              {summaryRow("Ends", form.endsAt || "Auto / derived")}
              {summaryRow("Policy", form.policy ? "Provided" : "Missing", true)}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button type="submit" className={primaryBtn()} disabled={saving}>
                {saving ? "Saving..." : "Save Warranty"}
              </button>

              <Link
                to={`/app/documents/warranties/${encodeURIComponent(id)}/preview`}
                className={secondaryBtn()}
              >
                Cancel
              </Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}