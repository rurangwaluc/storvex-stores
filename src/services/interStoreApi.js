import { apiFetch } from "./apiClient"; // adjust path if needed

// LIST DEALS
export function getDeals() {
  return apiFetch("/inter-store");
}

// CREATE DEAL
export function createDeal(data) {
  return apiFetch("/inter-store", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// UPDATE
export function updateDeal(id, data) {
  return apiFetch(`/inter-store/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// MARK RECEIVED
export function markReceived(id) {
  return apiFetch(`/inter-store/${id}/received`, {
    method: "PATCH",
  });
}

// MARK SOLD
export function markSold(id) {
  return apiFetch(`/inter-store/${id}/sold`, {
    method: "PATCH",
  });
}

// MARK RETURNED
export function markReturned(id) {
  return apiFetch(`/inter-store/${id}/returned`, {
    method: "PATCH",
  });
}

// MARK PAID
export function markPaid(id) {
  return apiFetch(`/inter-store/${id}/paid`, {
    method: "PATCH",
  });
}

// DELETE DEAL (optional)
export function deleteDeal(id) {
  return apiFetch(`/inter-store/${id}`, {
    method: "DELETE",
  });
}
