import { apiFetch } from "./apiClient"; // adjust path if needed

// READ
export function getProducts() {
  return apiFetch("/inventory/products");
}

// CREATE
export function createProduct(data) {
  return apiFetch("/inventory/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// UPDATE
export function updateProduct(id, data) {
  return apiFetch(`/inventory/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE
export function deleteProduct(id) {
  return apiFetch(`/inventory/products/${id}`, {
    method: "DELETE",
  });
}
