// src/pages/repairs/Repairs.jsx

import {
  archiveRepair,
  assignTechnician,
  deleteRepair,
  getRepairs,
  updateRepair,
} from "../../services/repairsApi";
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

export default function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Load repairs
  async function loadRepairs() {
    try {
      const data = await getRepairs();
      setRepairs(data || []);
    } catch (e) {
      console.error("Failed to load repairs:", e);
      alert(e.message || "Failed to load repairs");
    }
  }

  // Load technicians (employees with role TECHNICIAN)
  async function loadTechnicians() {
    try {
      const res = await fetch(
        "http://localhost:5000/api/employees/technicians",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("tenantToken")}`,
          },
        }
      );
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Expected array of technicians, got:", data);
        setTechnicians([]);
        return;
      }
      setTechnicians(data);
    } catch (e) {
      console.error("Failed to load technicians:", e);
      setTechnicians([]);
    }
  }

  useEffect(() => {
    loadRepairs();
    loadTechnicians();
  }, []);

  // Delete repair
  async function handleDelete(id) {
    if (!confirm("Delete this repair?")) return;
    try {
      await deleteRepair(id);
      loadRepairs();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete repair");
    }
  }

  // Assign technician by name
  async function handleAssign(repairId) {
    const techName = prompt("Enter technician name:");
    if (!techName) return;

    // Find technician ID by name
    const tech = technicians.find((t) => t.name === techName);
    if (!tech) {
      alert("Technician not found");
      return;
    }

    try {
      await assignTechnician(repairId, tech.name); // backend expects name
      loadRepairs();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to assign technician");
    }
  }

  // Update status
  async function handleStatusChange(repairId, status) {
    try {
      await updateRepair(repairId, { status });
      loadRepairs();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to update status");
    }
  }

  // Archive repair
  async function handleArchive(repairId) {
    if (!confirm("Archive this repair?")) return;
    try {
      await archiveRepair(repairId);
      loadRepairs();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to archive repair");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Repairs</h1>
        <Link
          to="/repairs/new"
          className="px-4 py-2 bg-black text-white rounded"
        >
          New Repair
        </Link>
      </div>

      {repairs.length === 0 ? (
        <p className="text-gray-500">No repairs found.</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Customer</th>
              <th className="p-2">Device</th>
              <th className="p-2">Technician</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {repairs.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">
                  {r.customer?.name || "Unknown"} <br />
                  <span className="text-xs text-gray-500">
                    {r.customer?.phone || "N/A"}
                  </span>
                </td>

                <td className="p-2">{r.device || "Unknown"}</td>

                <td className="p-2">
                  {r.technician?.name || "Unassigned"}{" "}
                  <button
                    onClick={() => handleAssign(r.id)}
                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded"
                  >
                    Assign
                  </button>
                </td>

                <td className="p-2">
                  <select
                    value={r.status || ""}
                    onChange={(e) =>
                      handleStatusChange(r.id, e.target.value)
                    }
                    className="border p-1"
                  >
                    <option value="RECEIVED">Received</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </td>

                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleArchive(r.id)}
                    className="px-2 py-1 bg-orange-600 text-white rounded"
                  >
                    Archive
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>

                  <Link
                    to={`/repairs/${r.id}/edit`}
                    className="px-2 py-1 bg-green-600 text-white rounded"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
