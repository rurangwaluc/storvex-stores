import {
  deleteDeal,
  getDeals,
  markPaid,
  markReceived,
  markReturned,
  markSold,
} from "../../services/interStoreApi";
import { useEffect, useState } from "react";

import CreateDealModal from "./InterStoreCreateModal";
import { useNavigate } from "react-router-dom";

export default function InterStoreDeals() {
  const navigate = useNavigate();

  const token = localStorage.getItem("tenantToken");

  const [deals, setDeals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");

  // ✅ Force all buttons visible (OWNER, CASHIER, TECHNICIAN)
  const canManage = true;

  /** ================================
   * LOAD DEALS + TOKEN GUARD
   * ================================ */
  async function loadDeals() {
    try {
      const data = await getDeals();
      setDeals(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      if (err.message?.includes("token")) {
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    }
  }

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
    loadDeals();
  }, []);

  /** ================================
   * FILTER LOGIC
   * ================================ */
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

  /** ================================
   * EXPORT CSV
   * ================================ */
  function exportCSV() {
    const rows = [
      ["Product", "Supplier", "Price", "Status", "Created"],
      ...filtered.map((d) => [
        d.productName,
        d.supplierTenantId ? "Internal Store" : d.externalSupplierName,
        d.agreedPrice,
        d.status,
        new Date(d.createdAt).toLocaleDateString(),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "interstore-deals.csv";
    a.click();
  }

  /** ================================
   * BADGE UI
   * ================================ */
  function badge(status) {
    const map = {
      BORROWED: "bg-yellow-100 text-yellow-700",
      RECEIVED: "bg-blue-100 text-blue-700",
      SOLD: "bg-green-100 text-green-700",
      PAID: "bg-purple-100 text-purple-700",
      RETURNED: "bg-gray-200 text-gray-700",
    };

    return <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>{status}</span>;
  }

  /** ================================
   * ACTION HANDLERS
   * ================================ */
  async function handleDelete(id) {
    if (!window.confirm("Delete this deal?")) return;
    await deleteDeal(id);
    loadDeals();
  }

  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inter-Store Deals</h1>

        <div className="space-x-2">
          <button
            onClick={() => { setEditDeal(null); setModalOpen(true); }}
            className="btn-primary"
          >
            New Deal
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 mb-4">
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

      {/* TABLE */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b">
            <th>Product</th>
            <th>Supplier</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((d) => (
            <tr key={d.id} className="border-b text-center">
              <td>{d.productName}</td>
              <td>{d.supplierTenantId ? "Internal Store" : d.externalSupplierName}</td>
              <td>{d.agreedPrice}</td>
              <td>{badge(d.status)}</td>

              <td className="space-x-2">
                {/* STATUS ACTIONS */}
                {d.status === "BORROWED" && (
                  <>
                    <button onClick={() => markReceived(d.id).then(loadDeals)} className="btn-sm">Receive</button>
                    <button onClick={() => markReturned(d.id).then(loadDeals)} className="btn-sm">Return</button>
                  </>
                )}
                {d.status === "RECEIVED" && (
                  <button onClick={() => markSold(d.id).then(loadDeals)} className="btn-sm">Mark Sold</button>
                )}
                {d.status === "SOLD" && (
                  <button onClick={() => markPaid(d.id).then(loadDeals)} className="btn-sm">Mark Paid</button>
                )}

                {/* ALWAYS SHOW EDIT/DELETE */}
                <button onClick={() => { setEditDeal(d); setModalOpen(true); }} className="btn-sm">Edit</button>
                <button onClick={() => handleDelete(d.id)} className="btn-sm bg-red-500 text-white">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {modalOpen && (
        <CreateDealModal
          onClose={() => setModalOpen(false)}
          onSaved={loadDeals}
          deal={editDeal}
        />
      )}
    </>
  );
}
