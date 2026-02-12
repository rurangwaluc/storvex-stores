import { useEffect, useState } from "react";

import { updateEmployee } from "../../services/employeesApi";

export default function EmployeeEdit({ employee, onSaved, onCancel }) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
  });

  useEffect(() => {
    if (employee) {
      setForm({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        password: "",
        role: employee.role,
      });
    }
  }, [employee]);

  async function submit(e) {
    e.preventDefault();
    await updateEmployee(form.id, form);
    onSaved();
  }

  if (!employee) return null;

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-2">Edit Employee</h2>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 mb-2 w-full"
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border p-2 mb-2 w-full"
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border p-2 mb-2 w-full"
      />
      <select
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        className="border p-2 mb-2 w-full"
      >
        <option value="CASHIER">Cashier</option>
        <option value="TECHNICIAN">Technician</option>
      </select>
      <button type="submit" className="btn-primary">
        Update
      </button>
      <button
        type="button"
        className="btn-secondary ml-2"
        onClick={onCancel}
      >
        Cancel
      </button>
    </form>
  );
}
