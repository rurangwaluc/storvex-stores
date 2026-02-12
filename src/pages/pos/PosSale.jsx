import { useEffect, useState } from "react";

import StoreLayout from "../../components/StoreLayout";
import { createSale } from "../../services/posApi";
import { getProducts } from "../../services/inventoryApi";
import { useNavigate } from "react-router-dom";

export default function PosSale() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products
  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.sellPrice,
          quantity: 1,
        },
      ];
    });
  }

  function total() {
    return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

 

  async function completeSale() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    const res = await createSale(payload);

    setCart([]);
    navigate(`/pos/sales/${res.saleId}`);
  } catch (err) {
    console.error(err);
    alert("Failed to complete sale");
  } finally {
    setLoading(false);
  }
}


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* PRODUCTS */}
        <div className="col-span-2">
          <h2 className="font-semibold mb-2">Products</h2>

          {loading && <p>Loading...</p>}

          <div className="grid grid-cols-3 gap-4">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="border p-4 rounded hover:bg-gray-100"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">
                  {p.sellPrice} RWF
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* CART */}
        <div>
          <h2 className="font-semibold mb-2">Cart</h2>

          {cart.length === 0 && (
            <p className="text-gray-500">No items</p>
          )}

          {cart.map((i) => (
            <div key={i.productId} className="flex justify-between mb-2">
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>{i.price * i.quantity} RWF</span>
            </div>
          ))}

          <hr className="my-3" />

          <p className="font-bold mb-3">Total: {total()} RWF</p>

          <button
            onClick={completeSale}
            className="w-full bg-black text-white py-2 rounded"
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}
