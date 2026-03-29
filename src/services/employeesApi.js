// src/services/employeesApi.js
import { apiFetch } from "./apiClient";

export async function getEmployees() {
  return apiFetch("/employees");
}

export async function createEmployee(data) {
  return apiFetch("/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(id, data) {
  return apiFetch(`/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id) {
  return apiFetch(`/employees/${id}`, {
    method: "DELETE",
  });
}

/**
 * Requires backend endpoint:
 * PATCH /api/employees/:id/status  { isActive: boolean }
 */
export async function setEmployeeActiveStatus(id, isActive) {
  return apiFetch(`/employees/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: Boolean(isActive) }),
  });
}

// Fetch users by role (supports backend returning either array or { employees: [] })
export async function getUsersByRole(role) {
  try {
    const data = await apiFetch(`/employees?role=${encodeURIComponent(role)}`);
    if (Array.isArray(data)) return data;
    return data?.employees || [];
  } catch (err) {
    console.error("Error fetching users by role:", err);
    return [];
  }
}