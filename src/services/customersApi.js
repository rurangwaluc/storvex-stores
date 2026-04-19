// src/services/customersApi.js

import { apiFetch } from "./apiClient"; // adjust relative path if needed

// Create customer
export function createCustomer(data) {
  return apiFetch("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// List customers
export function listCustomers() {
  return apiFetch("/customers");
}

// Get customer by ID
export function getCustomer(id) {
  return apiFetch(`/customers/${id}`);
}

// Update customer
export function updateCustomer(id, data) {
  return apiFetch(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Reactivate customer (undo soft delete)
export function reactivateCustomer(id) {
  return apiFetch(`/customers/${id}/reactivate`, {
    method: "PUT",
  });
}


// Deactivate customer (soft delete)
export function deactivateCustomer(id) {
  return apiFetch(`/customers/${id}`, {
    method: "DELETE",
  });
}

// Get customer ledger
export function getCustomerLedger(customerId) {
  return apiFetch(`/customers/${customerId}/ledger`);
}
