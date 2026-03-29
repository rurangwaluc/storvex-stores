// src/services/dashboardApi.js
import { apiFetch } from "./apiClient";

export function getTenantDashboard() {
  // ✅ backend route is GET /api/dashboard
  return apiFetch("/dashboard");
}