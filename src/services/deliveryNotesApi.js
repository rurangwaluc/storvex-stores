import { apiFetch } from "./apiClient";
import { buildDocumentPrintUrl, openDocumentPrint } from "./documentPrint";

function normalizeQueryInput(query) {
  if (!query) return {};
  if (typeof query === "string") {
    const q = query.trim();
    return q ? { q } : {};
  }
  if (typeof query === "object") {
    return query;
  }
  return {};
}

export function listDeliveryNotes(query = "", options = {}) {
  const params = normalizeQueryInput(query);

  return apiFetch("/delivery-notes", {
    method: "GET",
    query: params,
    ...(options || {}),
  });
}

export function getDeliveryNoteById(id) {
  return apiFetch(`/delivery-notes/${encodeURIComponent(id)}`);
}

export function getDeliveryNoteDetail(id) {
  return getDeliveryNoteById(id);
}

export function createDeliveryNote(payload) {
  return apiFetch("/delivery-notes", {
    method: "POST",
    body: payload,
  });
}

export function updateDeliveryNote(id, payload) {
  return apiFetch(`/delivery-notes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteDeliveryNote(id) {
  return apiFetch(`/delivery-notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getDeliveryNotePrintUrl(id, token) {
  return buildDocumentPrintUrl("delivery-notes", id, token);
}

export function openDeliveryNotePrint(id, token) {
  return openDocumentPrint("delivery-notes", id, token);
}

export default {
  listDeliveryNotes,
  getDeliveryNoteById,
  getDeliveryNoteDetail,
  createDeliveryNote,
  updateDeliveryNote,
  deleteDeliveryNote,
  getDeliveryNotePrintUrl,
  openDeliveryNotePrint,
};