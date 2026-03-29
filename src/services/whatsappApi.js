import { apiFetch } from "./apiClient";

export function listWhatsAppSaleDrafts() {
  return apiFetch("/whatsapp/inbox/sale-drafts");
}

export function getWhatsAppSaleDraft(saleId) {
  return apiFetch(`/whatsapp/inbox/sale-drafts/${saleId}`);
}

export function createWhatsAppSaleDraft(conversationId, data) {
  return apiFetch(`/whatsapp/inbox/conversations/${conversationId}/create-sale-draft`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateWhatsAppSaleDraft(saleId, data) {
  return apiFetch(`/whatsapp/inbox/sale-drafts/${saleId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteWhatsAppSaleDraft(saleId) {
  return apiFetch(`/whatsapp/inbox/sale-drafts/${saleId}`, {
    method: "DELETE",
  });
}

export function finalizeWhatsAppSaleDraft(saleId, data) {
  return apiFetch(`/whatsapp/inbox/sale-drafts/${saleId}/finalize`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}