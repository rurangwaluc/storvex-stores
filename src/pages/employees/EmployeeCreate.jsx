import { createEmployee } from "../../services/employeesApi";
import { useState } from "react";

export default function EmployeeCreate({ onSaved }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
  });

  async function submit(e) {
    e.preventDefault();
    await createEmployee(form);
    setForm({ name: "", email: "", password: "", role: "CASHIER" });
    onSaved(); // reload list
  }

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-2">Add Employee</h2>
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
        Add
      </button>
    </form>
  );
}
