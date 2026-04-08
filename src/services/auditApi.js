import { apiFetch } from "./apiClient";

function toQuery(params = {}) {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (String(value).trim() === "") return;
    q.set(key, String(value));
  });

  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export function getAuditLogs(params = {}) {
  return apiFetch(`/audit${toQuery(params)}`);
}

export function getAuditStats() {
  return apiFetch("/audit/stats");
}

export function getAuditLogById(id) {
  if (!id) throw new Error("Missing audit log id");
  return apiFetch(`/audit/${id}`);
}