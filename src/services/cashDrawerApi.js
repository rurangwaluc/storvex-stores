// src/services/cashDrawerApi.js
import apiClient from "./apiClient";

export async function getCashDrawerStatus() {
  const res = await apiClient.get("/cash-drawer/status");
  return res.data;
}

export async function listCashMovements(limit = 100) {
  const res = await apiClient.get(
    `/cash-drawer/movements?limit=${encodeURIComponent(String(limit))}`
  );
  return res.data;
}

export async function openCashDrawer(openingBalance = 0, note = "") {
  const res = await apiClient.post("/cash-drawer/open", { openingBalance, note });
  return res.data;
}

export async function closeCashDrawer(closingBalance, note = "") {
  const res = await apiClient.post("/cash-drawer/close", { closingBalance, note });
  return res.data;
}

export async function createCashMovement(type, amount, note = "", reason) {
  const res = await apiClient.post("/cash-drawer/movements", {
    type,
    amount,
    note,
    reason,
  });
  return res.data;
}