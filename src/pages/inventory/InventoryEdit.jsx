import { getProducts, updateProduct } from "../../services/inventoryApi";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function InventoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getProducts();

        const product = data.find(
          (p) => String(p.id) === String(id)
        );

        if (!product) {
          setError("Product not found");
          return;
        }

        setForm(product);
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      }
    }

    load();
  }, [id]);

  async function submit(e) {
    e.preventDefault();

    try {
      await updateProduct(String(id), {
        name: form.name,
        sku: form.sku,
        serial: form.serial,
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        stockQty: Number(form.stockQty),
      });

      navigate("/inventory");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to update product");
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!form) return <p>Loading...</p>;

  return (
    <form onSubmit={submit} className="max-w-md bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Edit Product</h1>

      <input
        className="input"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <input
        className="input mt-3"
        value={form.sku}
        onChange={(e) => setForm({ ...form, sku: e.target.value })}
        required
      />

      <input
        className="input mt-3"
        value={form.serial || ""}
        onChange={(e) => setForm({ ...form, serial: e.target.value })}
      />

      <input
        type="number"
        className="input mt-3"
        value={form.costPrice}
        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
        required
      />

      <input
        type="number"
        className="input mt-3"
        value={form.sellPrice}
        onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
        required
      />

      <input
        type="number"
        className="input mt-3"
        value={form.stockQty}
        onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
        required
      />

      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
        Update
      </button>
    </form>
  );
}
