// src/services/warrantiesApi.js
import { apiFetch } from "./apiClient";
import { buildDocumentPrintUrl } from "./documentPrint";

function cleanString(value) {
  const s = String(value || "").trim();
  return s || "";
}

function normalizeQueryInput(query) {
  if (!query) return {};

  if (typeof query === "string") {
    const q = query.trim();
    return q ? { q } : {};
  }

  if (typeof query === "object" && !Array.isArray(query)) {
    return Object.entries(query).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;

      const cleaned =
        typeof value === "string" ? value.trim() : value;

      if (cleaned === "") return acc;

      acc[key] = cleaned;
      return acc;
    }, {});
  }

  return {};
}

function normalizeId(id) {
  const cleaned = cleanString(id);

  if (!cleaned) {
    throw new Error("Warranty was not selected");
  }

  return encodeURIComponent(cleaned);
}

/**
 * GET /api/warranties
 *
 * Supported examples:
 * listWarranties()
 * listWarranties("iphone")
 * listWarranties({ q: "iphone", branchId })
 * listWarranties({ allBranches: true })
 */
export function listWarranties(query = "", options = {}) {
  const params = normalizeQueryInput(query);

  return apiFetch("/warranties", {
    method: "GET",
    query: params,
    ...(options || {}),
  });
}

/**
 * GET /api/warranties/:id
 */
export function getWarranty(id, options = {}) {
  return apiFetch(`/warranties/${normalizeId(id)}`, {
    method: "GET",
    ...(options || {}),
  });
}

/**
 * Backward-compatible aliases used by older pages.
 */
export function getWarrantyById(id, options = {}) {
  return getWarranty(id, options);
}

export function getWarrantyDetail(id, options = {}) {
  return getWarranty(id, options);
}

/**
 * POST /api/warranties
 */
export function createWarranty(payload, options = {}) {
  return apiFetch("/warranties", {
    method: "POST",
    body: payload || {},
    ...(options || {}),
  });
}

/**
 * PATCH /api/warranties/:id
 */
export function updateWarranty(id, payload, options = {}) {
  return apiFetch(`/warranties/${normalizeId(id)}`, {
    method: "PATCH",
    body: payload || {},
    ...(options || {}),
  });
}

/**
 * DELETE /api/warranties/:id
 */
export function deleteWarranty(id, options = {}) {
  return apiFetch(`/warranties/${normalizeId(id)}`, {
    method: "DELETE",
    ...(options || {}),
  });
}

/**
 * GET /api/warranties/:id/print
 *
 * This returns a printable URL, not fetched JSON.
 * The backend route accepts Authorization header or ?token=.
 */
export function getWarrantyPrintUrl(id, token) {
  return buildDocumentPrintUrl("warranties", normalizeId(id), token);
}

/**
 * Small helper for pages that want the exact printable route path.
 */
export function getWarrantyPrintPath(id) {
  return `/warranties/${normalizeId(id)}/print`;
}

export default {
  listWarranties,
  getWarranty,
  getWarrantyById,
  getWarrantyDetail,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  getWarrantyPrintUrl,
  getWarrantyPrintPath,
};