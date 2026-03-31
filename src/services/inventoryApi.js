import apiClient, { apiFetch } from "./apiClient";

function buildQueryString(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function downloadBlob(path, params = {}, fallbackName = "download.bin") {
  const res = await apiClient.get(`${path}${buildQueryString(params)}`, {
    responseType: "blob",
  });

  const blob = res?.data instanceof Blob ? res.data : new Blob([res.data]);
  const contentDisposition = String(res?.headers?.["content-disposition"] || "");
  const filenameMatch =
    contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
    contentDisposition.match(/filename="([^"]+)"/i) ||
    contentDisposition.match(/filename=([^;]+)/i);

  const filename = filenameMatch?.[1]
    ? decodeURIComponent(String(filenameMatch[1]).replace(/["']/g, "").trim())
    : fallbackName;

  return { blob, filename };
}

export function listProducts(params = {}) {
  return apiFetch(`/inventory/products${buildQueryString(params)}`);
}

export function searchProducts(q, limit = 20) {
  return apiFetch(`/inventory/products/search${buildQueryString({ q, limit })}`);
}

export function getProductById(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(id)}`);
}

export function createProduct(payload) {
  return apiFetch("/inventory/products", {
    method: "POST",
    body: payload,
  });
}

export function updateProduct(id, payload) {
  return apiFetch(`/inventory/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteProduct(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function activateProduct(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(id)}/activate`, {
    method: "PATCH",
  });
}

export function adjustStock(id, payload) {
  return apiFetch(`/inventory/products/${encodeURIComponent(id)}/stock-adjustments`, {
    method: "POST",
    body: payload,
  });
}

export function getStockAdjustments(id) {
  return apiFetch(`/inventory/products/${encodeURIComponent(id)}/stock-adjustments`);
}

export function listAllStockAdjustments(params = {}) {
  return apiFetch(`/inventory/stock-adjustments${buildQueryString(params)}`);
}

export function getInventorySummary() {
  return apiFetch("/inventory/summary");
}

export async function downloadReorderPdf(params = {}) {
  return downloadBlob("/inventory/reorder.pdf", params, "storvex-reorder-list.pdf");
}

export async function downloadInventoryExcel(params = {}) {
  return downloadBlob("/inventory/export.xlsx", params, "storvex-inventory.xlsx");
}

export async function downloadStockAdjustmentsExcel(params = {}) {
  return downloadBlob(
    "/inventory/stock-adjustments/export.xlsx",
    params,
    "storvex-stock-history.xlsx"
  );
}

const inventoryApi = {
  listProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
  adjustStock,
  getStockAdjustments,
  listAllStockAdjustments,
  getInventorySummary,
  downloadReorderPdf,
  downloadInventoryExcel,
  downloadStockAdjustmentsExcel,
};

export default inventoryApi;