// src/services/reportsApi.js

import { apiFetch } from "./apiClient"; // adjust path if needed

export function getSalesSummary() {
  return apiFetch("/reports/sales");
}

export function getInventorySummary() {
  return apiFetch("/reports/inventory");
}

export function getRepairsReport() {
  return apiFetch("/reports/repairs");
}
