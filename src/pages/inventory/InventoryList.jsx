import { deleteProduct, getProducts } from "../../services/inventoryApi";
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

export default function InventoryList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await getProducts();

      // SAFETY: ensure array
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;

    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      console.error(err);
      setError("Failed to delete product");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p>Loading inventory…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>

        <Link
          to="/inventory/create"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">Price</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-center">{p.stockQty}</td>
                <td className="p-3 text-center">{p.sellPrice}</td>
                <td className="p-3 text-center space-x-2">
                  <Link
                    to={`/inventory/${p.id}/edit`}
                    className="text-blue-600"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
