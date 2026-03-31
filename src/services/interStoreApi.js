import { apiFetch } from "./apiClient";

function normalizeDealsResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.deals)) return data.deals;
  return [];
}

export async function getDeals() {
  const data = await apiFetch("/interstore");
  return normalizeDealsResponse(data);
}

export async function getDeal(id) {
  const data = await apiFetch(`/interstore/${id}`);
  return data?.deal || data;
}

export async function createDeal(payload) {
  const data = await apiFetch("/interstore", {
    method: "POST",
    body: payload,
  });

  return data?.deal || data;
}

export async function markReceived(id) {
  const data = await apiFetch(`/interstore/${id}/receive`, {
    method: "POST",
  });

  return data?.deal || data;
}

export async function markSold(id, payload = {}) {
  const data = await apiFetch(`/interstore/${id}/sell`, {
    method: "POST",
    body: payload,
  });

  return data?.deal || data;
}

export async function markReturned(id, payload = {}) {
  const data = await apiFetch(`/interstore/${id}/return`, {
    method: "POST",
    body: payload,
  });

  return data?.deal || data;
}

export async function markPaid(id, payload = {}) {
  const data = await apiFetch(`/interstore/${id}/paid`, {
    method: "POST",
    body: payload,
  });

  return data?.deal || data;
}

export async function getDealPayments(id) {
  const data = await apiFetch(`/interstore/${id}/payments`);
  return {
    payments: Array.isArray(data?.payments) ? data.payments : [],
    summary: data?.summary || {
      owed: data?.owed || 0,
      totalPaid: data?.totalPaid || 0,
      balanceDue: data?.balanceDue || 0,
      count: data?.count || 0,
    },
  };
}

export async function addDealPayment(id, payload) {
  const data = await apiFetch(`/interstore/${id}/payments`, {
    method: "POST",
    body: payload,
  });

  return data;
}

export async function listInternalSuppliers(params = {}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", String(params.q));
  if (params.take) qs.set("take", String(params.take));

  const query = qs.toString();
  const data = await apiFetch(`/interstore/internal-suppliers${query ? `?${query}` : ""}`);

  return Array.isArray(data?.suppliers) ? data.suppliers : [];
}

export async function searchInternalSupplierProducts(supplierTenantId, params = {}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", String(params.q));
  if (params.take) qs.set("take", String(params.take));

  const query = qs.toString();
  const data = await apiFetch(
    `/interstore/internal-suppliers/${supplierTenantId}/products${query ? `?${query}` : ""}`
  );

  return Array.isArray(data?.products) ? data.products : [];
}