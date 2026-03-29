// src/services/suppliersApi.js

import { apiFetch } from "./apiClient";

// Suppliers
export function listSuppliers(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return apiFetch(`/suppliers${s ? `?${s}` : ""}`);
}

export function createSupplier(data) {
  return apiFetch(`/suppliers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSupplierById(id) {
  return apiFetch(`/suppliers/${encodeURIComponent(String(id))}`);
}

export function updateSupplier(id, data) {
  return apiFetch(`/suppliers/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activateSupplier(id) {
  return apiFetch(`/suppliers/${encodeURIComponent(String(id))}/activate`, {
    method: "PATCH",
  });
}

export function deactivateSupplier(id) {
  return apiFetch(`/suppliers/${encodeURIComponent(String(id))}/deactivate`, {
    method: "PATCH",
  });
}

// Supplies (deliveries)
export function listSupplierSupplies(id, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return apiFetch(`/suppliers/${encodeURIComponent(String(id))}/supplies${s ? `?${s}` : ""}`);
}

export function createSupplierSupply(id, data) {
  return apiFetch(`/suppliers/${encodeURIComponent(String(id))}/supplies`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}