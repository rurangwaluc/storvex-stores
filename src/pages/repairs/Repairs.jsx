// src/pages/repairs/Repairs.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import {
  archiveRepair,
  assignTechnician,
  deleteRepair,
  getRepairTechnicians,
  getRepairs,
  updateRepairStatus,
} from "../../services/repairsApi";

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

export default function Repairs() {
  const role = useMemo(() => getCurrentRole(), []);
  const canCreate = role === "OWNER" || role === "CASHIER";
  const canChangeStatus = role === "OWNER" || role === "TECHNICIAN";
  const canAssign = role === "OWNER";
  const canArchive = role === "OWNER";
  const canDelete = role === "OWNER";

  const [repairs, setRepairs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadRepairs() {
    try {
      const data = await getRepairs();
      setRepairs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load repairs:", e);
      alert(e.message || "Failed to load repairs");
    }
  }

  async function loadTechnicians() {
    try {
      const data = await getRepairTechnicians();
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading technicians:", err);
      setTechnicians([]);
    }
  }

  async function refreshAll() {
    try {
      setLoading(true);
      await Promise.all([loadRepairs(), loadTechnicians()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Delete repair?")) return;

    try {
      await deleteRepair(id);
      await loadRepairs();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete repair");
    }
  }

  async function handleArchive(id) {
    if (!window.confirm("Archive this repair?")) return;

    try {
      await archiveRepair(id);
      await loadRepairs();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to archive repair");
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateRepairStatus(id, status);
      await loadRepairs();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update status");
    }
  }

  async function handleAssign(repairId, technicianId) {
    try {
      const value = technicianId === "" ? null : technicianId;
      await assignTechnician(repairId, value);
      await loadRepairs();
    } catch (err) {
      console.error("Error assigning/unassigning technician:", err);
      alert(err.message || "Failed to assign/unassign technician");
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repairs</h1>
          <p className="text-sm text-gray-500">
            UI now matches backend permissions exactly.
          </p>
        </div>

        {canCreate ? (
          <Link to="/app/repairs/new" className="rounded bg-black px-4 py-2 text-white">
            New Repair
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded bg-white p-6 shadow">
          <p className="text-gray-500">Loading repairs...</p>
        </div>
      ) : repairs.length === 0 ? (
        <div className="rounded bg-white p-6 shadow">
          <p className="text-gray-500">No repairs found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Device</th>
                <th className="p-2 text-left">Technician</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {repairs.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">
                    {r.customer?.name || "Unknown"}
                    <br />
                    <span className="text-xs text-gray-500">{r.customer?.phone || "N/A"}</span>
                  </td>

                  <td className="p-2">
                    <div className="font-medium">{r.device || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{r.serial || "No serial"}</div>
                  </td>

                  <td className="p-2">
                    {canAssign ? (
                      <select
                        value={r.technicianId || ""}
                        onChange={(e) => handleAssign(r.id, e.target.value)}
                        className="border p-1"
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{r.technician?.name || "Unassigned"}</span>
                    )}
                  </td>

                  <td className="p-2">
                    {canChangeStatus ? (
                      <select
                        value={r.status || ""}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className="border p-1"
                      >
                        <option value="RECEIVED">Received</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    ) : (
                      <span>{r.status}</span>
                    )}
                  </td>

                  <td className="p-2">
                    <div className="flex gap-2">
                      {canArchive ? (
                        <button
                          onClick={() => handleArchive(r.id)}
                          className="rounded bg-orange-600 px-2 py-1 text-white"
                        >
                          Archive
                        </button>
                      ) : null}

                      {canDelete ? (
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="rounded bg-red-600 px-2 py-1 text-white"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}