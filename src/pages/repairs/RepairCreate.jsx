// src/pages/repairs/RepairCreate.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listCustomers } from "../../services/customersApi";
import { createRepair } from "../../services/repairsApi";

export default function RepairCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    device: "",
    serial: "",
    issue: "",
    warrantyEnd: "",
  });

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        const data = await listCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customers:", err);
        alert(err.message || "Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      await createRepair({
        customerId: form.customerId,
        device: form.device,
        serial: form.serial || null,
        issue: form.issue,
        warrantyEnd: form.warrantyEnd || null,
      });

      navigate("/app/repairs");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create repair");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">New Repair</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded bg-white p-5 shadow">
        <div>
          <label className="mb-1 block text-sm font-medium">Customer</label>
          <select
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            required
            className="w-full border p-2"
            disabled={loadingCustomers}
          >
            <option value="">{loadingCustomers ? "Loading customers..." : "Select customer"}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Device</label>
          <input
            name="device"
            placeholder="Device"
            value={form.device}
            onChange={handleChange}
            required
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Serial</label>
          <input
            name="serial"
            placeholder="Serial (optional)"
            value={form.serial}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Issue description</label>
          <textarea
            name="issue"
            placeholder="Issue description"
            value={form.issue}
            onChange={handleChange}
            required
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Warranty end</label>
          <input
            type="date"
            name="warrantyEnd"
            value={form.warrantyEnd}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <button disabled={saving} className="rounded bg-black px-4 py-2 text-white">
          {saving ? "Saving..." : "Save Repair"}
        </button>
      </form>
    </div>
  );
}