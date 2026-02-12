import { createProduct } from "../../services/inventoryApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function InventoryCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    serial: "",
    costPrice: "",
    sellPrice: "",
    stockQty: "",
  });

  async function submit(e) {
    e.preventDefault();

    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        serial: form.serial.trim() || null,
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        stockQty: Number(form.stockQty),
      };

      console.log("CREATE payload", payload);

      await createProduct(payload);
      navigate("/inventory");
    } catch (err) {
      console.error("Create failed:", err);
      setError(err?.message || "Failed to create product");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Add Product</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <input
        placeholder="Product name"
        className="input"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <input
        placeholder="SKU"
        className="input mt-3"
        value={form.sku}
        onChange={(e) => setForm({ ...form, sku: e.target.value })}
        required
      />

      <input
        placeholder="Serial (optional)"
        className="input mt-3"
        value={form.serial}
        onChange={(e) => setForm({ ...form, serial: e.target.value })}
      />

      <input
        placeholder="Cost price"
        type="number"
        className="input mt-3"
        value={form.costPrice}
        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
        required
      />

      <input
        placeholder="Sell price"
        type="number"
        className="input mt-3"
        value={form.sellPrice}
        onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
        required
      />

      <input
        placeholder="Stock quantity"
        type="number"
        className="input mt-3"
        value={form.stockQty}
        onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
        required
      />

      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
