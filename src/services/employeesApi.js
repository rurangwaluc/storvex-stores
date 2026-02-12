// apiEmployees.js

import { apiFetch } from "./apiClient"; // your centralized apiFetch wrapper

export function getEmployees() {
  return apiFetch("/employees");
}

export function createEmployee(data) {
  return apiFetch("/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEmployee(id, data) {
  return apiFetch(`/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteEmployee(id) {
  return apiFetch(`/employees/${id}`, {
    method: "DELETE",
  });
}

// Fetch users by their role (for example, "TECHNICIAN")
export async function getUsersByRole(role) {
  try {
    return await apiFetch(`/employees?role=${role}`);
  } catch (err) {
    console.error("Error fetching users by role:", err);
    return [];
  }
}