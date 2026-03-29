// src/services/inventoryApi.js

import { apiFetch } from "./apiClient";
import apiClient from "./apiClient";

function buildQuery(params = {}) {
  const sp = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }

  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function listProducts({
  q,
  limit = 50,
  cursor,
  sort = "newest",
  active = true,
  lowStock,
  outOfStock,
  threshold,
  category,
  subcategory,
  brand,
} = {}) {
  return apiFetch(
    `/inventory/products${buildQuery({
      q,
      limit,
      cursor,
      sort,
      active: active ? "true" : "false",
      lowStock: lowStock ? "true" : undefined,
      outOfStock: outOfStock ? "true" : undefined,
      threshold,
      category,
      subcategory,
      brand,
    })}`
  );
}

export function searchProducts(q, limit = 20) {
  const qq = String(q || "").trim();
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) && lim > 0 && lim <= 50 ? lim : 20;

  if (!qq) return Promise.resolve({ products: [], count: 0 });

  return apiFetch(
    `/inventory/products/search${buildQuery({
      q: qq,
      limit: safeLimit,
    })}`
  );
}

export function getInventorySummary() {
  return apiFetch("/inventory/summary");
}

export function getProductById(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(String(id))}`);
}

export function createProduct(data) {
  return apiFetch("/inventory/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id, data) {
  return apiFetch(`/inventory/products/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

export function activateProduct(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(String(id))}/activate`, {
    method: "PATCH",
  });
}

export function adjustStock(productId, payload) {
  return apiFetch(`/inventory/products/${encodeURIComponent(String(productId))}/stock-adjustments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getStockAdjustments(productId) {
  return apiFetch(`/inventory/products/${encodeURIComponent(String(productId))}/stock-adjustments`);
}

export function listAllStockAdjustments({ from, to, type, q, limit = 50 } = {}) {
  return apiFetch(
    `/inventory/stock-adjustments${buildQuery({
      from,
      to,
      type,
      q,
      limit,
    })}`
  );
}

export async function downloadReorderPdf({ threshold = 5 } = {}) {
  const safeThreshold = Number.isFinite(Number(threshold))
    ? Math.max(0, Math.floor(Number(threshold)))
    : 5;

  const res = await apiClient.get(
    `/inventory/reorder.pdf${buildQuery({ threshold: safeThreshold })}`,
    { responseType: "blob" }
  );

  return res.data;
}