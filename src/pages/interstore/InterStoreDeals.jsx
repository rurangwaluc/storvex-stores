// src/pages/interstore/InterStoreDeals.jsx
import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

import CreateDealModal from "./InterStoreCreateModal";
import {
  getDeals,
  markPaid,
  markReceived,
  markReturned,
  markSold,
} from "../../services/interStoreApi";

function getCurrentRole() {
  const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded?.role ? String(decoded.role).toUpperCase() : null;
  } catch {
    return null;
  }
}

export default function InterStoreDeals() {
  const role = useMemo(() => getCurrentRole(), []);
  const canMarkPaid = role === "OWNER" || role === "MANAGER";

  const [deals, setDeals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function loadDeals() {
    try {
      setLoading(true);
      const data = await getDeals();
      setDeals(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load inter-store deals:", err);
      alert(err.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    let data = [...deals];

    if (statusFilter !== "ALL") {
      data = data.filter((d) => d.status === statusFilter);
    }

    if (supplierFilter === "INTERNAL") {
      data = data.filter((d) => d.supplierTenantId);
    }

    if (supplierFilter === "EXTERNAL") {
      data = data.filter((d) => d.externalSupplierName);
    }

    setFiltered(data);
  }, [statusFilter, supplierFilter, deals]);

  function exportCSV() {
    const rows = [
      ["Product", "Supplier", "Reseller", "Phone", "Price", "Status", "Created"],
      ...filtered.map((d) => [
        d.productName || "",
        d.supplierTenantId ? "Internal Store" : d.externalSupplierName || "",
        d.resellerName || "",
        d.resellerPhone || "",
        d.agreedPrice ?? "",
        d.status || "",
        d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "interstore-deals.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  function badge(status) {
    const map = {
      BORROWED: "bg-yellow-100 text-yellow-700",
      RECEIVED: "bg-blue-100 text-blue-700",
      SOLD: "bg-green-100 text-green-700",
      PAID: "bg-purple-100 text-purple-700",
      RETURNED: "bg-gray-200 text-gray-700",
    };

    return (
      <span className={`rounded px-2 py-1 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  }

  async function runAction(action) {
    try {
      await action();
      await loadDeals();
    } catch (err) {
      console.error(err);
      alert(err.message || "Action failed");
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inter-Store Deals</h1>
          <p className="text-sm text-gray-500">
            Contract-aligned view. Unsupported edit/delete actions removed until backend supports them.
          </p>
        </div>

        <div className="space-x-2">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            New Deal
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="BORROWED">Borrowed</option>
          <option value="RECEIVED">Received</option>
          <option value="SOLD">Sold</option>
          <option value="PAID">Paid</option>
          <option value="RETURNED">Returned</option>
        </select>

        <select className="input" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
          <option value="ALL">All Suppliers</option>
          <option value="INTERNAL">Internal Store</option>
          <option value="EXTERNAL">External Supplier</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded border bg-white p-6 text-sm text-gray-500">Loading deals...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded border bg-white p-6 text-sm text-gray-500">No deals found.</div>
      ) : (
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Product</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Reseller</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b align-top">
                  <td className="p-3">{d.productName}</td>
                  <td className="p-3">{d.supplierTenantId ? "Internal Store" : d.externalSupplierName}</td>
                  <td className="p-3">{d.resellerName || "—"}</td>
                  <td className="p-3">{d.resellerPhone || "—"}</td>
                  <td className="p-3">{d.agreedPrice}</td>
                  <td className="p-3">{badge(d.status)}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {d.status === "BORROWED" && (
                        <>
                          <button onClick={() => runAction(() => markReceived(d.id))} className="btn-sm">
                            Receive
                          </button>
                          <button onClick={() => runAction(() => markReturned(d.id))} className="btn-sm">
                            Return
                          </button>
                        </>
                      )}

                      {d.status === "RECEIVED" && (
                        <button onClick={() => runAction(() => markSold(d.id))} className="btn-sm">
                          Mark Sold
                        </button>
                      )}

                      {d.status === "SOLD" && canMarkPaid && (
                        <button onClick={() => runAction(() => markPaid(d.id))} className="btn-sm">
                          Mark Paid
                        </button>
                      )}

                      {d.status === "SOLD" && !canMarkPaid ? (
                        <span className="text-xs text-gray-500">Paid action requires owner or manager</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CreateDealModal
          onClose={() => setModalOpen(false)}
          onSaved={loadDeals}
        />
      )}
    </>
  );
}