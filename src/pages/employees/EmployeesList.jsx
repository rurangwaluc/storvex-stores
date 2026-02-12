import {
  deleteEmployee,
  getEmployees,
} from "../../services/employeesApi";
import { useEffect, useState } from "react";

import EmployeeCreate from "./EmployeeCreate";
import EmployeeEdit from "./EmployeeEdit";

export default function EmployeesList() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const employees = await getEmployees();
    setList(employees);
  }

  useEffect(() => {
    load();
  }, []);

  function edit(emp) {
    setEditing(emp);
    setShowForm(true);
  }

  async function remove(id) {
    if (confirm("Are you sure?")) {
      await deleteEmployee(id);
      load();
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Employees</h1>

      <button
        onClick={() => {
          setEditing(null);
          setShowForm(!showForm);
        }}
        className="btn-primary mb-4"
      >
        {showForm ? "Hide Form" : "Add Employee"}
      </button>

      {/* ADD FORM */}
      {showForm && !editing && (
        <EmployeeCreate
          onSaved={() => {
            load();          // reload the table
            setShowForm(false); // collapse the form after adding
          }}
        />
      )}

      {/* EDIT FORM */}
      {showForm && editing && (
        <EmployeeEdit
          employee={editing}
          onSaved={() => {
            setEditing(null);
            setShowForm(false);
            load();
          }}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td className="text-right space-x-2">
                <button onClick={() => edit(u)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => remove(u.id)} className="btn-delete">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
