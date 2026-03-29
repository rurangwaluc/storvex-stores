// src/services/invoicesApi.js
import { apiFetch } from "./apiClient";
import { buildDocumentPrintUrl } from "./documentPrint";

export function listInvoices(query = "") {
  return apiFetch("/invoices", {
    query: query ? { q: query } : undefined,
  });
}

export function getInvoiceDetail(id) {
  return apiFetch(`/invoices/${encodeURIComponent(id)}`);
}

export function getInvoicePrintUrl(id, token) {
  return buildDocumentPrintUrl("invoices", id, token);
}

export default {
  listInvoices,
  getInvoiceDetail,
  getInvoicePrintUrl,
};