// src/pages/suppliers/SupplierCreate.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
      const msg =
        e2?.message ||
        e2?.response?.data?.message ||
        "Failed to create supplier";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Add Supplier</h1>
          <p className="text-sm text-slate-600 mt-1">
            We save ID to reduce risk of stolen items.
          </p>
        </div>

        <button
          type="button"
          onClick={() => nav("/app/suppliers")}
          className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
        >
          ← Back
        </button>
      </div>

      <form
        onSubmit={submit}
        className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Supplier name</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Example: John / ABC Phones Ltd"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">ID type</label>
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
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
            <label className="text-sm font-medium text-slate-700">ID number</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.idNumber}
              onChange={(e) => setField("idNumber", e.target.value)}
              placeholder="Example: 1199... / Passport No."
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+2507..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="example@mail.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Address (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Kigali, Gasabo..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Company name (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              placeholder="Example: ABC Phones Ltd"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Tax ID (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.taxId}
              onChange={(e) => setField("taxId", e.target.value)}
              placeholder="TIN"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Where items come from</label>
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
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
            <label className="text-sm font-medium text-slate-700">More details (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.sourceDetails}
              onChange={(e) => setField("sourceDetails", e.target.value)}
              placeholder="Example: bought in Dubai / gift from..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Any warning, trust level, etc."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => nav("/app/suppliers")}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-sm"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}