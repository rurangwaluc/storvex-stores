import {
  getInventorySummary,
  getRepairsReport,
  getSalesSummary,
} from "../../services/reportsApi";
import { useEffect, useState } from "react";

import { getAuditLogs } from "../../services/auditApi";

export default function Reports() {
  const [sales, setSales] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [repairs, setRepairs] = useState(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    Promise.all([getSalesSummary(), getInventorySummary(), getRepairsReport()])
      .then(([salesRes, inventoryRes, repairsRes]) => {
        setSales(salesRes);
        setInventory(inventoryRes);
        setRepairs(repairsRes);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load reports");
      });
    getAuditLogs().then(setLogs);
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!sales || !inventory || !repairs) {
    return <p>Loading reports...</p>;
  }

  // Compute low/out-of-stock for inventory
  const lowStock = inventory.filter(
    (p) => p.stockQty > 0 && p.stockQty <= 5,
  ).length;
  const outOfStock = inventory.filter((p) => p.stockQty === 0).length;

  // Format revenue in Rwandan Francs
  const formattedRevenue = new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
  }).format(sales.totalRevenue);

  // Optional: Current date in Kigali locale
  const currentDate = new Intl.DateTimeFormat("rw-RW", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kigali",
  }).format(new Date());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Reports</h1>
      <p className="text-gray-600 mb-6">As of {currentDate}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* SALES */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Sales Summary</h2>
          <p>
            Total Sales: <strong>{formattedRevenue}</strong>
          </p>
          <p>
            Total Transactions: <strong>{sales.totalSalesCount}</strong>
          </p>
        </div>

        {/* INVENTORY */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Inventory Summary</h2>
          <p>
            Total Products: <strong>{inventory.length}</strong>
          </p>
          <p className="text-yellow-600">
            Low Stock: <strong>{lowStock}</strong>
          </p>
          <p className="text-red-600">
            Out of Stock: <strong>{outOfStock}</strong>
          </p>
        </div>
      </div>

      {/* REPAIRS */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-semibold mb-4">Repairs Summary</h2>
        {repairs.length === 0 ? (
          <p>No repairs found</p>
        ) : (
          <ul>
            {repairs.map((r) => (
              <li key={r.status}>
                {r.status}: <strong>{r._count.id}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
