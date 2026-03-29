// src/services/warrantiesApi.js
import { apiFetch } from "./apiClient";
import { buildDocumentPrintUrl } from "./documentPrint";

function normalizeQueryInput(query) {
  if (!query) return {};
  if (typeof query === "string") {
    const q = query.trim();
    return q ? { q } : {};
  }
  if (typeof query === "object") {
    return query;
  }
  return {};
}

export function listWarranties(query = "", options = {}) {
  const params = normalizeQueryInput(query);

  return apiFetch("/warranties", {
    method: "GET",
    query: params,
    ...(options || {}),
  });
}

export function getWarrantyById(id) {
  return apiFetch(`/warranties/${encodeURIComponent(id)}`);
}

export function getWarrantyDetail(id) {
  return getWarrantyById(id);
}

export function createWarranty(payload) {
  return apiFetch("/warranties", {
    method: "POST",
    body: payload,
  });
}

export function updateWarranty(id, payload) {
  return apiFetch(`/warranties/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteWarranty(id) {
  return apiFetch(`/warranties/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getWarrantyPrintUrl(id, token) {
  return buildDocumentPrintUrl("warranties", id, token);
}

export function getWarranty(id) {
  return apiFetch(`/warranties/${encodeURIComponent(id)}`);
}

export default {
  listWarranties,
  getWarrantyById,
  getWarrantyDetail,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  getWarrantyPrintUrl,
  getWarranty,
};