import { apiFetch } from "./apiClient";

export function createCustomer(data) {
  return apiFetch("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listCustomers(params = {}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.includeInactive) search.set("includeInactive", "true");

  const qs = search.toString();
  return apiFetch(qs ? `/customers?${qs}` : "/customers");
}

export function getCustomer(id) {
  return apiFetch(`/customers/${id}`);
}

export function updateCustomer(id, data) {
  return apiFetch(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function reactivateCustomer(id) {
  return apiFetch(`/customers/${id}/reactivate`, {
    method: "PUT",
  });
}

export function deactivateCustomer(id) {
  return apiFetch(`/customers/${id}`, {
    method: "DELETE",
  });
}

export function getCustomerLedger(customerId) {
  return apiFetch(`/customers/${customerId}/ledger`);
}

export function getCustomerCreditSummary() {
  return apiFetch("/customers/ledger/summary/outstanding");
}