import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { createSupplier } from "../../services/suppliersApi";

const ID_TYPES = [
  { value: "NATIONAL_ID", label: "National ID (Rwanda)" },
  { value: "PASSPORT", label: "Passport" },
];

const SOURCE_TYPES = [
  { value: "BOUGHT", label: "Bought" },
  { value: "GIFT", label: "Gift" },
  { value: "TRADE_IN", label: "Trade-in" },
  { value: "CONSIGNMENT", label: "Consignment" },
  { value: "OTHER", label: "Other" },
];

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function panel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

export default function SupplierCreate() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    idType: "NATIONAL_ID",
    idNumber: "",
    phone: "",
    email: "",
    address: "",
    sourceType: "BOUGHT",
    sourceDetails: "",
    notes: "",
    companyName: "",
    taxId: "",
  });

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) return toast.error("Supplier name is required");
    if (!form.idNumber.trim()) return toast.error("ID number is required");

    setSaving(true);

    try {
      await createSupplier({
        name: form.name.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        sourceType: form.sourceType,
        sourceDetails: form.sourceDetails.trim() || null,
        notes: form.notes.trim() || null,
        companyName: form.companyName.trim() || null,
        taxId: form.taxId.trim() || null,
      });

      toast.success("Supplier created");
      nav("/app/suppliers");
    } catch (e2) {
      console.error(e2);
      toast.error(
        e2?.message || e2?.response?.data?.message || "Failed to create supplier"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", mutedText())}>
                Suppliers
              </div>
              <h1 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
                Add Supplier
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Save supplier identity and source information to reduce risk and keep proof of origin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav("/app/suppliers")}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
            >
              Back to Suppliers
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className={cx(panel(), "p-5 sm:p-6")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Supplier name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    className="app-input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Example: John / ABC Phones Ltd"
                    required
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    ID type
                  </label>
                  <select
                    className="app-input"
                    value={form.idType}
                    onChange={(e) => setField("idType", e.target.value)}
                  >
                    {ID_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    ID number <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    className="app-input"
                    value={form.idNumber}
                    onChange={(e) => setField("idNumber", e.target.value)}
                    placeholder="Example: 1199... / Passport No."
                    required
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Phone
                  </label>
                  <input
                    className="app-input"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+2507..."
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Email
                  </label>
                  <input
                    className="app-input"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="example@mail.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Address
                  </label>
                  <input
                    className="app-input"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Kigali, Gasabo..."
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Company name
                  </label>
                  <input
                    className="app-input"
                    value={form.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                    placeholder="Example: ABC Phones Ltd"
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Tax ID
                  </label>
                  <input
                    className="app-input"
                    value={form.taxId}
                    onChange={(e) => setField("taxId", e.target.value)}
                    placeholder="TIN"
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Where items come from
                  </label>
                  <select
                    className="app-input"
                    value={form.sourceType}
                    onChange={(e) => setField("sourceType", e.target.value)}
                  >
                    {SOURCE_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    More details
                  </label>
                  <input
                    className="app-input"
                    value={form.sourceDetails}
                    onChange={(e) => setField("sourceDetails", e.target.value)}
                    placeholder="Example: bought in Dubai / gift from..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Notes
                  </label>
                  <textarea
                    className="app-textarea w-full"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Any warning, trust level, or internal note..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => nav("/app/suppliers")}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
                disabled={saving}
              >
                Cancel
              </button>

              <AsyncButton
                type="submit"
                loading={saving}
                loadingText="Saving..."
                variant="primary"
              >
                Save Supplier
              </AsyncButton>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}