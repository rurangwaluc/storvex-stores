// src/services/posApi.js

import { apiFetch } from "./apiClient"; // adjust path if needed

export function createSale(data) {
  return apiFetch("/pos/sales", {
    method: "POST",
    body: JSON.stringify(data),
  });
  // MUST return saleId (handled by backend response)
}

export function getReceipt(id) {
  return apiFetch(`/pos/sales/${id}`);
}
