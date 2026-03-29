// src/pages/suppliers/SupplierEdit.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getSupplierById, updateSupplier } from "../../services/suppliersApi";

const ID_TYPE_OPTIONS = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PASSPORT", label: "Passport" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "BOUGHT", label: "Bought" },
  { value: "GIFT", label: "Gift" },
  { value: "TRADE_IN", label: "Trade-in" },
  { value: "CONSIGNMENT", label: "Consignment" },
  { value: "OTHER", label: "Other" },
];

function safeStr(x) {
  return x == null ? "" : String(x);
}

function pickInSet(value, allowed, fallback) {
  const v = String(value || "").trim().toUpperCase();
  return allowed.has(v) ? v : fallback;
}

export default function SupplierEdit() {
  const { id } = useParams(); // supplier id
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    idType: "NATIONAL_ID",
    idNumber: "",
    phone: "",
    email: "",
    address: "",
    companyName: "",
    taxId: "",
    sourceType: "OTHER",
    sourceDetails: "",
    notes: "",
  });

  const allowedIdTypes = useMemo(
    () => new Set(ID_TYPE_OPTIONS.map((o) => o.value)),
    []
  );
  const allowedSourceTypes = useMemo(
    () => new Set(SOURCE_TYPE_OPTIONS.map((o) => o.value)),
    []
  );

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const s = await getSupplierById(String(id));
        if (cancelled) return;

        setForm({
          name: safeStr(s?.name),
          idType: pickInSet(s?.idType, allowedIdTypes, "NATIONAL_ID"),
          idNumber: safeStr(s?.idNumber),
          phone: safeStr(s?.phone),
          email: safeStr(s?.email),
          address: safeStr(s?.address),
          companyName: safeStr(s?.companyName),
          taxId: safeStr(s?.taxId),
          sourceType: pickInSet(s?.sourceType, allowedSourceTypes, "OTHER"),
          sourceDetails: safeStr(s?.sourceDetails),
          notes: safeStr(s?.notes),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || "Failed to load supplier");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, allowedIdTypes, allowedSourceTypes]);

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        companyName: form.companyName.trim() || null,
        taxId: form.taxId.trim() || null,
        sourceType: form.sourceType,
        sourceDetails: form.sourceDetails.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (!payload.name) {
        setSaving(false);
        return toast.error("Name is required");
      }
      if (!payload.idNumber) {
        setSaving(false);
        return toast.error("ID number is required");
      }

      await updateSupplier(String(id), payload);

      toast.success("Supplier updated");
      nav(`/app/suppliers/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Failed to update supplier";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (error && !form.name) return <p className="text-rose-700">{error}</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Edit supplier</h1>
          <p className="text-sm text-slate-600 mt-1">
            Keep correct supplier info to avoid stolen products.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => nav(`/app/suppliers/${id}`)}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-4"
      >
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
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
              {ID_TYPE_OPTIONS.map((o) => (
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
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+2507…"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="name@email.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Address (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Kigali…"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Company name (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Tax ID (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.taxId}
              onChange={(e) => setField("taxId", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Where items come from</label>
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              value={form.sourceType}
              onChange={(e) => setField("sourceType", e.target.value)}
            >
              {SOURCE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Details (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.sourceDetails}
              onChange={(e) => setField("sourceDetails", e.target.value)}
              placeholder="Example: bought in Dubai"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Example: trusted supplier, verified ID…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => nav(`/app/suppliers/${id}`)}
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
            {saving ? "Updating…" : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}