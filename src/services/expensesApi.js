import { apiFetch } from "./apiClient";

export async function getExpenses() {
  return apiFetch("/expenses");
}

export async function createExpense(data) {
  return apiFetch("/expenses", {
    method: "POST",
    body: data,
  });
}

export async function approveExpense(id) {
  return apiFetch(`/expenses/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
  });
}

export async function deleteExpense(id) {
  return apiFetch(`/expenses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}