import { createDeal, updateDeal } from "../../services/interStoreApi";
import { useEffect, useState } from "react";

export default function InterStoreCreateModal({ onClose, onSaved, deal }) {
  const [form, setForm] = useState({
    supplierType: "EXTERNAL",
    externalSupplierName: "",
    productName: "",
    serial: "",
    agreedPrice: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form for editing
  useEffect(() => {
    if (deal) {
      setForm({
        supplierType: deal.supplierTenantId ? "INTERNAL" : "EXTERNAL",
        externalSupplierName: deal.externalSupplierName || "",
        productName: deal.productName || "",
        serial: deal.serial || "",
        agreedPrice: deal.agreedPrice || "",
      });
    }
  }, [deal]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        productName: form.productName,
        serial: form.serial,
        agreedPrice: Number(form.agreedPrice),
        externalSupplierName:
          form.supplierType === "EXTERNAL" ? form.externalSupplierName : null,
      };

      if (deal?.id) {
        await updateDeal(deal.id, payload);
      } else {
        await createDeal(payload);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to save deal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal">
      <form onSubmit={submit} className="card w-96">
        <h2 className="text-lg font-bold mb-4">
          {deal ? "Edit Deal" : "New Inter-Store Deal"}
        </h2>

        <select
          className="input mb-3"
          value={form.supplierType}
          onChange={(e) => updateField("supplierType", e.target.value)}
        >
          <option value="EXTERNAL">External Supplier</option>
          <option value="INTERNAL">Internal Store</option>
        </select>

        {form.supplierType === "EXTERNAL" && (
          <input
            className="input mb-3"
            placeholder="External Supplier Name"
            value={form.externalSupplierName}
            onChange={(e) => updateField("externalSupplierName", e.target.value)}
            required
          />
        )}

        <input
          className="input mb-3"
          placeholder="Product Name"
          value={form.productName}
          onChange={(e) => updateField("productName", e.target.value)}
          required
        />

        <input
          className="input mb-3"
          placeholder="Serial Number"
          value={form.serial}
          onChange={(e) => updateField("serial", e.target.value)}
        />

        <input
          type="number"
          className="input mb-3"
          placeholder="Agreed Price"
          value={form.agreedPrice}
          onChange={(e) => updateField("agreedPrice", e.target.value)}
          required
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
