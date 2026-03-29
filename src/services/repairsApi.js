// src/services/repairsApi.js
import { apiFetch } from "./apiClient";

export async function getRepairs() {
  return apiFetch("/repairs");
}

export async function getRepair(id) {
  return apiFetch(`/repairs/${id}`);
}

export async function createRepair(payload) {
  return apiFetch("/repairs", {
    method: "POST",
    body: payload,
  });
}

export async function updateRepair(id, payload) {
  return apiFetch(`/repairs/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function updateRepairStatus(id, status) {
  return apiFetch(`/repairs/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}

export async function archiveRepair(id) {
  return apiFetch(`/repairs/${id}/archive`, {
    method: "DELETE",
  });
}

export async function deleteRepair(id) {
  return apiFetch(`/repairs/${id}`, {
    method: "DELETE",
  });
}

export async function assignTechnician(repairId, technicianId) {
  return apiFetch(`/repairs/${repairId}/assign`, {
    method: "PUT",
    body: { technicianId: technicianId ?? null },
  });
}

export async function getRepairTechnicians() {
  return apiFetch("/repairs/technicians");
}