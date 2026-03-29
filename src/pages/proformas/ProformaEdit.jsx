import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getProformaById, updateProforma } from "../../services/proformasApi";

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
  return "inline-flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function summaryRow(label, value, strong = false) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-stone-600 dark:text-[rgb(var(--text-muted))]">
        {label}
      </span>
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
  if (["SENT", "CONVERTED", "ACTIVE"].includes(s)) return "success";
  if (["DRAFT", "PENDING"].includes(s)) return "warning";
  if (["CANCELLED", "EXPIRED"].includes(s)) return "danger";
  return "neutral";
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

function money(n, currency = "RWF") {
  return `${currency} ${Number(n || 0).toLocaleString()}`;
}

function emptyItem() {
  return {
    key: `new-${Math.random().toString(36).slice(2, 10)}`,
    id: null,
    productId: "",
    productName: "",
    serial: "",
    quantity: 1,
    unitPrice: 0,
  };
}

function normalizeProforma(raw) {
  const doc = raw?.proforma || raw || {};
  const items = Array.isArray(doc?.items) ? doc.items : [];

  return {
    id: doc?.id || null,
    number: doc?.number || null,
    status: doc?.status || "DRAFT",
    customerName: doc?.customerName || "",
    customerPhone: doc?.customerPhone || "",
    customerEmail: doc?.customerEmail || "",
    customerAddress: doc?.customerAddress || "",
    currency: doc?.currency || "RWF",
    validUntil: doc?.validUntil || null,
    preparedBy: doc?.preparedBy || "",
    reference: doc?.reference || "",
    notes: doc?.notes || "",
    createdAt: doc?.createdAt || null,
    convertedToSaleId: doc?.convertedToSaleId || null,
    items: items.map((item, index) => ({
      key: item?.id || `row-${index}`,
      id: item?.id || null,
      productId: item?.productId || "",
      productName: item?.productName || item?.product?.name || "",
      serial: item?.serial || item?.product?.serial || "",
      quantity: Number(item?.quantity || 1),
      unitPrice: Number(item?.unitPrice || 0),
    })),
  };
}

export default function ProformaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [documentData, setDocumentData] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    currency: "RWF",
    validUntil: "",
    preparedBy: "",
    reference: "",
    notes: "",
    status: "DRAFT",
  });
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        setLoading(true);
        const raw = await getProformaById(id);
        const doc = normalizeProforma(raw);

        if (!mountedRef.current) return;

        setDocumentData(doc);
        setForm({
          customerName: doc.customerName || "",
          customerPhone: doc.customerPhone || "",
          customerEmail: doc.customerEmail || "",
          customerAddress: doc.customerAddress || "",
          currency: doc.currency || "RWF",
          validUntil: toInputDate(doc.validUntil),
          preparedBy: doc.preparedBy || "",
          reference: doc.reference || "",
          notes: doc.notes || "",
          status: doc.status || "DRAFT",
        });
        setItems(doc.items?.length ? doc.items : [emptyItem()]);
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Failed to load proforma");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    load();
  }, [id]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index, key, value) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]:
                key === "quantity" || key === "unitPrice"
                  ? Number(value || 0)
                  : value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  const normalizedItems = useMemo(() => {
    return items.filter(
      (item) =>
        String(item.productName || "").trim() &&
        Number(item.quantity || 0) > 0 &&
        Number(item.unitPrice || 0) >= 0
    );
  }, [items]);

  const subtotal = useMemo(() => {
    return normalizedItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );
  }, [normalizedItems]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!normalizedItems.length) {
      toast.error("Add at least one valid proforma item");
      return;
    }

    try {
      setSaving(true);

      await updateProforma(id, {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        customerEmail: form.customerEmail.trim() || undefined,
        customerAddress: form.customerAddress.trim() || undefined,
        currency: form.currency.trim() || "RWF",
        validUntil: form.validUntil || null,
        preparedBy: form.preparedBy.trim() || undefined,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
        items: normalizedItems.map((item) => ({
          productId: item.productId || undefined,
          productName: item.productName.trim(),
          serial: item.serial.trim() || undefined,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
        })),
      });

      toast.success("Proforma updated");
      navigate(`/app/documents/proformas/${encodeURIComponent(id)}/preview`);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update proforma");
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
              Edit Proforma
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              Revise customer details, quotation items, validity, and commercial notes without losing the premium document flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/documents/proformas" className={secondaryBtn()}>
              Back to Proformas
            </Link>
            <Link
              to={`/app/documents/proformas/${encodeURIComponent(id)}/preview`}
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
            <h2 className={cx("text-base font-semibold", strongText())}>Document summary</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Review the quotation reference and current commercial state.
            </p>

            <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Proforma
                  </div>
                  <div className="mt-1 text-sm text-emerald-700 dark:text-emerald-200">
                    {documentData?.number || "Proforma"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">
                    <span>Date: {formatDate(documentData?.createdAt)}</span>
                    {documentData?.convertedToSaleId ? <span>Converted: Yes</span> : <span>Converted: No</span>}
                  </div>
                </div>

                <span className={badgeClass(statusKind(form.status))}>
                  {form.status || "DRAFT"}
                </span>
              </div>
            </div>
          </section>

          <section className={cx(panel(), "p-4 md:p-5")}>
            <h2 className={cx("text-base font-semibold", strongText())}>Customer and commercial details</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Keep the quotation details clear, credible, and ready for approval.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass()}>Customer name</label>
                <input
                  value={form.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  className={inputClass()}
                  placeholder="Customer name"
                  required
                />
              </div>

              <div>
                <label className={labelClass()}>Customer phone</label>
                <input
                  value={form.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  className={inputClass()}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className={labelClass()}>Customer email</label>
                <input
                  value={form.customerEmail}
                  onChange={(e) => updateField("customerEmail", e.target.value)}
                  className={inputClass()}
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className={labelClass()}>Valid until</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => updateField("validUntil", e.target.value)}
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass()}>Customer address</label>
                <input
                  value={form.customerAddress}
                  onChange={(e) => updateField("customerAddress", e.target.value)}
                  className={inputClass()}
                  placeholder="Address"
                />
              </div>

              <div>
                <label className={labelClass()}>Prepared by</label>
                <input
                  value={form.preparedBy}
                  onChange={(e) => updateField("preparedBy", e.target.value)}
                  className={inputClass()}
                  placeholder="Staff member"
                />
              </div>

              <div>
                <label className={labelClass()}>Reference</label>
                <input
                  value={form.reference}
                  onChange={(e) => updateField("reference", e.target.value)}
                  className={inputClass()}
                  placeholder="Reference"
                />
              </div>

              <div>
                <label className={labelClass()}>Currency</label>
                <input
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className={inputClass()}
                  placeholder="RWF"
                />
              </div>

              <div>
                <label className={labelClass()}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className={inputClass()}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass()}>Notes / terms</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className={textareaClass()}
                  placeholder="Commercial notes or terms"
                  rows={4}
                />
              </div>
            </div>
          </section>

          <section className={cx(panel(), "p-4 md:p-5")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className={cx("text-base font-semibold", strongText())}>Quotation items</h2>
                <p className={cx("mt-1 text-sm", mutedText())}>
                  Keep the quotation clean, accurate, and easy to validate.
                </p>
              </div>

              <button type="button" onClick={addItem} className={smallBtn()}>
                Add Item
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={cx("text-sm font-semibold", strongText())}>
                        Item {index + 1}
                      </div>
                      <div className={cx("mt-1 text-xs", softText())}>
                        This line appears on the proforma.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className={smallBtn()}
                      disabled={items.length <= 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <label className={labelClass()}>Product name</label>
                      <input
                        value={item.productName}
                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                        className={inputClass()}
                        placeholder="Quoted product"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        className={inputClass()}
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Unit price</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        className={inputClass()}
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className={labelClass()}>Serial / identifier</label>
                      <input
                        value={item.serial}
                        onChange={(e) => updateItem(index, "serial", e.target.value)}
                        className={inputClass()}
                        placeholder="Serial number or identifier"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Line total</label>
                      <div className="flex h-11 items-center rounded-2xl border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-900 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))]">
                        {money(Number(item.quantity || 0) * Number(item.unitPrice || 0), form.currency || "RWF")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className={cx(shell(), "p-4 md:p-5 xl:sticky xl:top-5")}>
            <div>
              <h2 className={cx("text-base font-semibold", strongText())}>Summary</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Review before saving proforma changes.
              </p>
            </div>

            <div className="mt-5 divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
              {summaryRow("Document", documentData?.number || "—")}
              {summaryRow("Customer", form.customerName || "—")}
              {summaryRow("Prepared by", form.preparedBy || "—")}
              {summaryRow("Status", form.status || "DRAFT")}
              {summaryRow("Validity", form.validUntil || "—")}
              {summaryRow("Items", String(normalizedItems.length))}
              {summaryRow("Subtotal", money(subtotal, form.currency || "RWF"), true)}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button type="submit" className={primaryBtn()} disabled={saving}>
                {saving ? "Saving..." : "Save Proforma"}
              </button>

              <Link
                to={`/app/documents/proformas/${encodeURIComponent(id)}/preview`}
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