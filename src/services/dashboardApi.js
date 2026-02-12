// src/services/dashboardApi.js

import { apiFetch } from "./apiClient"; // adjust path if needed

export function getTenantDashboard() {
  return apiFetch("/dashboard/tenant");
}
