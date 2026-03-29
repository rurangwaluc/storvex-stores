// src/services/interStoreApi.js
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

export async function markSold(id) {
  const data = await apiFetch(`/interstore/${id}/sell`, {
    method: "POST",
  });

  return data?.deal || data;
}

export async function markReturned(id) {
  const data = await apiFetch(`/interstore/${id}/return`, {
    method: "POST",
  });

  return data?.deal || data;
}

export async function markPaid(id) {
  const data = await apiFetch(`/interstore/${id}/paid`, {
    method: "POST",
  });

  return data?.deal || data;
}

export async function getDealPayments(id) {
  const data = await apiFetch(`/interstore/${id}/payments`);
  return Array.isArray(data?.payments) ? data.payments : [];
}

export async function addDealPayment(id, payload) {
  const data = await apiFetch(`/interstore/${id}/payments`, {
    method: "POST",
    body: payload,
  });

  return data;
}