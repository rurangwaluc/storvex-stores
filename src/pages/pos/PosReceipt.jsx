import { useEffect, useState } from "react"

import { Link } from "react-router-dom";
import { getReceipt } from "../../services/posApi";
import { useParams } from "react-router-dom";

export default function PosReceipt() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    getReceipt(id).then(setReceipt).catch(console.error);
  }, [id]);

  if (!receipt) {
    return <p>Loading receipt...</p>;
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Receipt</h1>

      <p><strong>Cashier:</strong> {receipt.cashier}</p>
      <p><strong>Date:</strong> {new Date(receipt.date).toLocaleString()}</p>

      {receipt.customer && (
        <p>
          <strong>Customer:</strong> {receipt.customer.name} ({receipt.customer.phone})
        </p>
      )}

      <hr className="my-4" />

      <ul className="space-y-2">
        {receipt.items.map((item, i) => (
          <li key={i} className="flex justify-between">
            <span>
              {item.product} × {item.quantity}
            </span>
            <span>{item.subtotal.toLocaleString()} RWF</span>
          </li>
        ))}
      </ul>

      <hr className="my-4" />

      <p className="text-lg font-bold text-right">
        Total: {receipt.total.toLocaleString()} RWF
      </p>
       <Link
        to="/pos"
        className="inline-block mt-4 px-4 py-2 bg-gray-800 text-white rounded"
      >
        Back to POS
      </Link>
    </div>
  );
}
