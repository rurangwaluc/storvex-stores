// src/services/receiptsApi.js
import { apiFetch } from "./apiClient";
import { buildDocumentPrintUrl } from "./documentPrint";

export function listReceipts(query = "") {
  return apiFetch("/receipts", {
    query: query ? { q: query } : undefined,
  });
}

export function getReceiptDetail(id) {
  return apiFetch(`/receipts/${encodeURIComponent(id)}`);
}

export function getReceiptPrintUrl(id, token) {
  return buildDocumentPrintUrl("receipts", id, token);
}

const receiptsApi = {
  listReceipts,
  getReceiptDetail,
  getReceiptPrintUrl,
};

export default receiptsApi;