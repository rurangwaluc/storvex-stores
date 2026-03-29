// src/services/documentPrint.js
import apiClient from "./apiClient";

export function getApiBaseUrl() {
  return (
    apiClient.defaults.baseURL ||
    import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:5000/api"
  );
}

export function getAuthToken() {
  return localStorage.getItem("tenantToken") || localStorage.getItem("token") || "";
}

export function buildDocumentPrintUrl(resource, id, token) {
  const authToken = token || getAuthToken();
  const base = getApiBaseUrl();
  const safeResource = String(resource || "").replace(/^\/+|\/+$/g, "");
  const safeId = encodeURIComponent(String(id || ""));

  return `${base}/${safeResource}/${safeId}/print?token=${encodeURIComponent(authToken)}`;
}

export function openDocumentPrint(resource, id, token) {
  const url = buildDocumentPrintUrl(resource, id, token);
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}