// src/services/reportsApi.js
import apiClient, { apiFetch } from "./apiClient";

function qsFromRange(range) {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export function getReportsDashboard(range) {
  return apiFetch(`/reports/dashboard${qsFromRange(range)}`);
}

export function getDailyClose(dateISO) {
  const qs = new URLSearchParams();
  if (dateISO) qs.set("date", dateISO);
  const q = qs.toString();
  return apiFetch(`/reports/daily-close${q ? `?${q}` : ""}`);
}

export function getTopSellers(range, limit = 10) {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  qs.set("limit", String(limit));
  return apiFetch(`/reports/top-sellers?${qs.toString()}`);
}

// ✅ NEW: A + B + C in one call
export function getInsights(range, limit = 10, threshold = 5) {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  qs.set("limit", String(limit));
  qs.set("threshold", String(threshold));
  return apiFetch(`/reports/insights?${qs.toString()}`);
}

// PDF downloads (blob)
export async function downloadDailyClosePdf(dateISO) {
  const qs = new URLSearchParams();
  if (dateISO) qs.set("date", dateISO);
  const res = await apiClient.get(`/reports/daily-close.pdf?${qs.toString()}`, {
    responseType: "blob",
  });
  return res.data;
}

export async function downloadPeriodPdf(range, limit = 10) {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  qs.set("limit", String(limit));
  const res = await apiClient.get(`/reports/period.pdf?${qs.toString()}`, {
    responseType: "blob",
  });
  return res.data;
}