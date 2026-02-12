// src/pages/repairs/RepairCreate.jsx

import { useEffect, useState } from "react";

import { createRepair } from "../../services/repairsApi";
import { useNavigate } from "react-router-dom";

export default function RepairCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: "",
    device: "",
    serial: "",
    issue: "",
    warrantyEnd: "",
  });

  // Fetch customers
  useEffect(() => {
    fetch("http://localhost:5000/api/customers", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("tenantToken")}`,
      },
    })
      .then((res) => res.json())
      .then(setCustomers);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createRepair(form);
      navigate("/repairs");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create repair");
    }
  }

  return (
    <div>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">New Repair</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            required
            className="w-full border p-2"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>

          <input
            name="device"
            placeholder="Device"
            value={form.device}
            onChange={handleChange}
            required
            className="w-full border p-2"
          />

          <input
            name="serial"
            placeholder="Serial (optional)"
            value={form.serial}
            onChange={handleChange}
            className="w-full border p-2"
          />

          <textarea
            name="issue"
            placeholder="Issue description"
            value={form.issue}
            onChange={handleChange}
            required
            className="w-full border p-2"
          />

          <input
            type="date"
            name="warrantyEnd"
            value={form.warrantyEnd}
            onChange={handleChange}
            className="w-full border p-2"
          />

          <button className="px-4 py-2 bg-black text-white rounded">
            Save Repair
          </button>
        </form>
      </div>
    </div>
  );
}
