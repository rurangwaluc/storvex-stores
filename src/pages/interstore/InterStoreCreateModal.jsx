// src/pages/interstore/InterStoreCreateModal.jsx
import { useState } from "react";
import { createDeal } from "../../services/interStoreApi";

const EMPTY_FORM = {
  supplierType: "EXTERNAL",
  externalSupplierName: "",
  resellerName: "",
  resellerPhone: "",
  resellerStore: "",
  productName: "",
  serial: "",
  agreedPrice: "",
  notes: "",
};

export default function InterStoreCreateModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        externalSupplierName:
          form.supplierType === "EXTERNAL" ? form.externalSupplierName.trim() : null,
        resellerName: form.resellerName.trim(),
        resellerPhone: form.resellerPhone.trim(),
        resellerStore: form.resellerStore.trim() || null,
        productName: form.productName.trim(),
        serial: form.serial.trim(),
        agreedPrice: Number(form.agreedPrice),
        notes: form.notes.trim() || null,
      };

      await createDeal(payload);

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal">
      <form onSubmit={submit} className="card w-full max-w-xl">
        <h2 className="mb-4 text-lg font-bold">New Inter-Store Deal</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Supplier type</label>
            <select
              className="input"
              value={form.supplierType}
              onChange={(e) => updateField("supplierType", e.target.value)}
            >
              <option value="EXTERNAL">External Supplier</option>
              <option value="INTERNAL" disabled>
                Internal Store (backend-ready, UI wiring later)
              </option>
            </select>
          </div>

          {form.supplierType === "EXTERNAL" && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">External supplier name</label>
              <input
                className="input"
                placeholder="e.g. Kigali Tech Supply"
                value={form.externalSupplierName}
                onChange={(e) => updateField("externalSupplierName", e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Reseller name</label>
            <input
              className="input"
              placeholder="e.g. Jean Claude"
              value={form.resellerName}
              onChange={(e) => updateField("resellerName", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Reseller phone</label>
            <input
              className="input"
              placeholder="e.g. 078..."
              value={form.resellerPhone}
              onChange={(e) => updateField("resellerPhone", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Reseller store</label>
            <input
              className="input"
              placeholder="Optional"
              value={form.resellerStore}
              onChange={(e) => updateField("resellerStore", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Product name</label>
            <input
              className="input"
              placeholder="e.g. iPhone 13 Pro"
              value={form.productName}
              onChange={(e) => updateField("productName", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Serial</label>
            <input
              className="input"
              placeholder="Serialized product required"
              value={form.serial}
              onChange={(e) => updateField("serial", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Agreed price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0"
              value={form.agreedPrice}
              onChange={(e) => updateField("agreedPrice", e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              className="input min-h-[96px]"
              placeholder="Optional"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Create deal"}
          </button>
        </div>
      </form>
    </div>
  );
}