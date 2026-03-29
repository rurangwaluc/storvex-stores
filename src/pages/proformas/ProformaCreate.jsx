// src/pages/proformas/ProformaCreate.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createProforma } from "../../services/proformasApi";

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

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function labelClass() {
  return "mb-2 block text-sm font-medium text-stone-900 dark:text-[rgb(var(--text))]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function smallBtn() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function summaryRow(label, value, strong = false) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-stone-600 dark:text-[rgb(var(--text-muted))]">{label}</span>
      <span className={cx("text-sm", strong ? "font-semibold" : "font-medium", strong ? strongText() : mutedText())}>
        {value}
      </span>
    </div>
  );
}

function makeEmptyItem() {
  return {
    productName: "",
    serial: "",
    quantity: 1,
    unitPrice: "",
  };
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(n, currency = "RWF") {
  return `${currency} ${Number(n || 0).toLocaleString()}`;
}

export default function ProformaCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    validUntil: "",
    preparedBy: "",
    reference: "",
    notes: "",
    currency: "RWF",
    status: "DRAFT",
  });

  const [items, setItems] = useState([makeEmptyItem()]);
  const [saving, setSaving] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index, key, value) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, makeEmptyItem()]);
  }

  function removeItem(index) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10) || 1);
      const unitPrice = Math.max(0, toNumber(item.unitPrice));
      return {
        ...item,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    });
  }, [items]);

  const subtotal = useMemo(
    () => normalizedItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [normalizedItems]
  );

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const validItems = normalizedItems
      .filter((item) => item.productName.trim())
      .map((item) => ({
        productName: item.productName.trim(),
        serial: item.serial.trim() || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

    if (!validItems.length) {
      toast.error("Add at least one valid item");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        customerEmail: form.customerEmail.trim() || undefined,
        customerAddress: form.customerAddress.trim() || undefined,
        validUntil: form.validUntil || undefined,
        preparedBy: form.preparedBy.trim() || undefined,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
        currency: form.currency || "RWF",
        status: form.status || "DRAFT",
        items: validItems,
      };

      const result = await createProforma(payload);
      const createdId = result?.proforma?.id;

      toast.success("Proforma created");

      if (createdId) {
        navigate(`/app/documents/proformas/${encodeURIComponent(createdId)}/preview`);
        return;
      }

      navigate("/app/documents/proformas");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to create proforma");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "relative overflow-hidden p-5 md:p-6")}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 opacity-[0.03] dark:from-white dark:via-white dark:to-white dark:opacity-[0.04]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Document creation
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Create Proforma
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              Build a branded proforma that can be previewed, printed, and shared with a customer
              before final payment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/documents/proformas" className={secondaryBtn()}>
              Back to Proformas
            </Link>
            <Link to="/app/documents" className={secondaryBtn()}>
              Document Center
            </Link>
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className={cx(panel(), "p-4 md:p-5")}>
            <h2 className={cx("text-base font-semibold", strongText())}>Customer details</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Add only the details that matter for the document.
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
                <label className={labelClass()}>Phone</label>
                <input
                  value={form.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  className={inputClass()}
                  placeholder="Customer phone"
                />
              </div>

              <div>
                <label className={labelClass()}>Email</label>
                <input
                  value={form.customerEmail}
                  onChange={(e) => updateField("customerEmail", e.target.value)}
                  className={inputClass()}
                  placeholder="Customer email"
                  type="email"
                />
              </div>

              <div>
                <label className={labelClass()}>Valid until</label>
                <input
                  value={form.validUntil}
                  onChange={(e) => updateField("validUntil", e.target.value)}
                  className={inputClass()}
                  type="date"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass()}>Address</label>
                <textarea
                  value={form.customerAddress}
                  onChange={(e) => updateField("customerAddress", e.target.value)}
                  className={textareaClass()}
                  placeholder="Customer address"
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className={cx(panel(), "p-4 md:p-5")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className={cx("text-base font-semibold", strongText())}>Items</h2>
                <p className={cx("mt-1 text-sm", mutedText())}>
                  Build the quotation lines clearly and cleanly.
                </p>
              </div>

              <button type="button" onClick={addItem} className={smallBtn()}>
                Add item
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {normalizedItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-[20px] border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={cx("text-sm font-semibold", strongText())}>Item {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className={smallBtn()}
                      disabled={normalizedItems.length === 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className={labelClass()}>Product name</label>
                      <input
                        value={item.productName}
                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                        className={inputClass()}
                        placeholder="Product name"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Serial / identifier</label>
                      <input
                        value={item.serial}
                        onChange={(e) => updateItem(index, "serial", e.target.value)}
                        className={inputClass()}
                        placeholder="Serial / IMEI / identifier"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Quantity</label>
                      <input
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        className={inputClass()}
                        type="number"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Unit price</label>
                      <input
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        className={inputClass()}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className={labelClass()}>Line total</label>
                      <div className="flex h-11 items-center rounded-2xl border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-900 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))]">
                        {money(item.total, form.currency || "RWF")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cx(panel(), "p-4 md:p-5")}>
            <h2 className={cx("text-base font-semibold", strongText())}>Document details</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              These fields help owners and staff track context cleanly.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass()}>Prepared by</label>
                <input
                  value={form.preparedBy}
                  onChange={(e) => updateField("preparedBy", e.target.value)}
                  className={inputClass()}
                  placeholder="Prepared by"
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
                  onChange={(e) => updateField("currency", e.target.value.toUpperCase())}
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
                <label className={labelClass()}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className={textareaClass()}
                  placeholder="Notes or quotation terms"
                  rows={5}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className={cx(shell(), "p-4 md:p-5 xl:sticky xl:top-5")}>
            <div>
              <h2 className={cx("text-base font-semibold", strongText())}>Summary</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Review before creating the proforma.
              </p>
            </div>

            <div className="mt-5 divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
              {summaryRow("Items", String(normalizedItems.filter((x) => x.productName.trim()).length))}
              {summaryRow("Currency", form.currency || "RWF")}
              {summaryRow("Prepared by", form.preparedBy || "—")}
              {summaryRow("Valid until", form.validUntil || "—")}
              {summaryRow("Status", form.status || "DRAFT")}
              {summaryRow("Subtotal", money(subtotal, form.currency || "RWF"), true)}
              {summaryRow("Total", money(subtotal, form.currency || "RWF"), true)}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button type="submit" className={primaryBtn()} disabled={saving}>
                {saving ? "Creating..." : "Create Proforma"}
              </button>

              <Link to="/app/documents/proformas" className={secondaryBtn()}>
                Cancel
              </Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}