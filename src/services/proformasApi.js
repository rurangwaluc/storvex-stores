// src/services/proformasApi.js
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

export function listProformas(query = "", options = {}) {
  const params = normalizeQueryInput(query);

  return apiFetch("/proformas", {
    method: "GET",
    query: params,
    ...(options || {}),
  });
}

export function getProformaById(id) {
  return apiFetch(`/proformas/${encodeURIComponent(id)}`);
}

export function getProformaDetail(id) {
  return getProformaById(id);
}

export function createProforma(payload) {
  return apiFetch("/proformas", {
    method: "POST",
    body: payload,
  });
}

export function updateProforma(id, payload) {
  return apiFetch(`/proformas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProforma(id) {
  return apiFetch(`/proformas/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getProformaPrintUrl(id, token) {
  return buildDocumentPrintUrl("proformas", id, token);
}

export default {
  listProformas,
  getProformaById,
  getProformaDetail,
  createProforma,
  updateProforma,
  deleteProforma,
  getProformaPrintUrl,
};