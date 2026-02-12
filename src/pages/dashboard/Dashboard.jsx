import { useEffect, useState } from "react";

import { getTenantDashboard } from "../../services/dashboardApi";
import { useAuthRole } from "../../auth/useAuthRole";

const formatMoney = (amount) =>
  `RWF ${Number(amount || 0).toLocaleString()}`;

export default function Dashboard() {
  const role = useAuthRole();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenantDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p>Failed to load dashboard</p>;

  /* ===================== CASHIER ===================== */
  if (role === "CASHIER") {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Cashier Dashboard</h1>
        <ul className="space-y-2 mb-6">
          <li>• Today Sales: {formatMoney(stats.todaySales)}</li>
          <li>• Pending Inter-Store Deals: {stats.pendingDeals}</li>
          <li>• Quick POS Access</li>
        </ul>
      </div>
    );
  }

  /* ===================== TECHNICIAN ===================== */
  if (role === "TECHNICIAN") {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Technician Dashboard</h1>
        <ul className="space-y-2 mb-6">
          <li>• Active Repairs: {stats.activeRepairs}</li>
          <li>• Repairs In Progress</li>
        </ul>
      </div>
    );
  }

  /* ===================== OWNER ===================== */
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Today Sales" value={formatMoney(stats.todaySales)} />
        <Card title="Monthly Revenue" value={formatMoney(stats.monthlyRevenue)} />
        <Card title="Inventory Items" value={stats.productCount} />
        <Card title="Low Stock Items" value={stats.lowStockCount} />
        <Card title="Active Repairs" value={stats.activeRepairs} />
        <Card title="Pending Deals" value={stats.pendingDeals} />
      </div>

      <Section title="Low Stock Products">
        {stats.lowStockProducts.length === 0 ? (
          <p className="text-gray-500">No low stock items 🎉</p>
        ) : (
          <ul className="space-y-2">
            {stats.lowStockProducts.map((p) => (
              <li key={p.id} className="text-sm">
                {p.name} —{" "}
                <span className="font-semibold">{p.stockQty}</span> left
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent Activity">
        <ul className="space-y-2">
          {stats.recentAudit.map((a) => (
            <li key={a.id} className="text-sm text-gray-600">
              {a.action} •{" "}
              {new Date(a.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/* ===================== UI COMPONENTS ===================== */

function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <p className="text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
