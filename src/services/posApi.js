import { apiFetch } from "./apiClient";

export function getQuickPicks(periodDays = 7, limit = 10) {
  return apiFetch("/pos/quick-picks", {
    query: { periodDays, limit },
  });
}

export function createSale(payload) {
  return apiFetch("/pos/sales", {
    method: "POST",
    body: payload,
  });
}

export function listSales() {
  return apiFetch("/pos/sales");
}

export function getSale(saleId) {
  return apiFetch(`/pos/sales/${encodeURIComponent(saleId)}`);
}

export async function getReceipt(id) {
  const res = await apiFetch(`/receipts/${encodeURIComponent(id)}`);
  return res?.receipt || null;
}

export function addSalePayment(id, payload) {
  return apiFetch(`/pos/sales/${encodeURIComponent(id)}/payments`, {
    method: "POST",
    body: payload,
  });
}

export function cancelSale(id, payload) {
  return apiFetch(`/pos/sales/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: payload,
  });
}

export function createRefund(id, payload) {
  return apiFetch(`/pos/sales/${encodeURIComponent(id)}/refunds`, {
    method: "POST",
    body: payload,
  });
}

export function createWarranty(id, payload) {
  return apiFetch(`/pos/sales/${encodeURIComponent(id)}/warranty`, {
    method: "POST",
    body: payload,
  });
}

export function listOutstandingCredit() {
  return apiFetch("/pos/credit/outstanding");
}

export function listOverdueCredit() {
  return apiFetch("/pos/credit/overdue");
}

const posApi = {
  getQuickPicks,
  createSale,
  listSales,
  getSale,
  getReceipt,
  addSalePayment,
  cancelSale,
  createRefund,
  createWarranty,
  listOutstandingCredit,
  listOverdueCredit,
};

export default posApi;