import {
  archiveRepair,
  assignTechnician,
  deleteRepair,
  getRepairs,
  updateRepair,
} from "../../services/repairsApi";
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { getUsersByRole } from "../../services/employeesApi";

export default function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Load all repairs
  async function loadRepairs() {
    try {
      const data = await getRepairs();
      setRepairs(data || []);
    } catch (e) {
      console.error("Failed to load repairs:", e);
      alert(e.message || "Failed to load repairs");
    }
  }

  // Load all technicians
  async function loadTechnicians() {
    try {
      const data = await getUsersByRole("TECHNICIAN");
      if (!Array.isArray(data)) {
        console.error("Expected array of technicians, got:", data);
        setTechnicians([]);
      } else {
        setTechnicians(data);
      }
    } catch (err) {
      console.error("Error loading technicians:", err);
      setTechnicians([]);
    }
  }

  useEffect(() => {
    loadRepairs();
    loadTechnicians();
  }, []);

  // Delete repair
  async function handleDelete(id) {
    if (!confirm("Delete repair?")) return;
    try {
      await deleteRepair(id);
      loadRepairs();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete repair");
    }
  }

  // Archive repair
  async function handleArchive(id) {
    if (!confirm("Archive this repair?")) return;
    try {
      await archiveRepair(id);
      loadRepairs();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to archive repair");
    }
  }

  // Update status
  async function handleStatusChange(id, status) {
    try {
      await updateRepair(id, { status });
      loadRepairs();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update status");
    }
  }


  async function handleAssign(repairId, technicianId) {
  try {
    // If technicianId is empty (unassigned), set it to null
    const validTechnicianId = technicianId === "" ? null : technicianId;

    console.log("Valid Technician ID after conversion:", validTechnicianId);

    // If validTechnicianId is null, log it and proceed with unassignment
    if (validTechnicianId === null) {
      console.log("Unassigning technician (null passed)");
    }

    // Call the backend API to assign/unassign technician
    await assignTechnician(repairId, validTechnicianId);

    // Reload repairs after the update
    loadRepairs();
  } catch (err) {
    console.error("Error in assigning/unassigning technician:", err);
    alert(err.message || "Failed to assign/unassign technician");
  }
}


  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Repairs</h1>
        <Link to="/repairs/new" className="px-4 py-2 bg-black text-white rounded">
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
              <th className="p-2">Status</th>
              <th className="p-2">Technician</th>
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
                  <select
                    value={r.status || "RECEIVED"}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="border p-1"
                  >
                    <option value="RECEIVED">Received</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </td>

               <td className="p-2">
                <select
                  value={r.technicianId || ""}  // If no technician, show "Unassigned"
                  onChange={(e) => handleAssign(r.id, e.target.value)}
                  className="border p-1"
                >
                  <option value="">Unassigned</option>  {/* Option for Unassigned */}
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
