const BASE_URL = "http://localhost:5000/api/repairs";

const getToken = () => localStorage.getItem("tenantToken");

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      throw new Error(data.message || "Request failed");
    } catch {
      throw new Error(text || "Request failed");
    }
  }

  if (res.status === 204) return null;

  return res.json();
}

// Get all repairs
export async function getRepairs() {
  return apiFetch(BASE_URL);
}

// Get single repair
export async function getRepair(id) {
  return apiFetch(`${BASE_URL}/${id}`);
}

// Create repair
export async function createRepair(data) {
  return apiFetch(BASE_URL, { method: "POST", body: JSON.stringify(data) });
}

// Update repair
export async function updateRepair(id, data) {
  return apiFetch(`${BASE_URL}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// Archive repair
export async function archiveRepair(repairId) {
  return apiFetch(`${BASE_URL}/${repairId}/archive`, { method: "PUT" });
}

// Delete repair
export async function deleteRepair(repairId) {
  return apiFetch(`${BASE_URL}/${repairId}`, { method: "DELETE" });
}

// Assign technician
export async function assignTechnician(repairId, technicianId) {
  // Only throw an error if technicianId is an empty string
  if (technicianId === "") {
    throw new Error("Technician ID required");
  }

  return apiFetch(`${BASE_URL}/${repairId}/assign`, {
    method: "PUT",
    body: JSON.stringify({ technicianId }),
  });
}

