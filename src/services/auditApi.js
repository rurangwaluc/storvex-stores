const API = "http://localhost:5000/api/audit";

function authHeader() {
  return {
    Authorization: `Bearer ${localStorage.getItem("tenantToken")}`,
    "Content-Type": "application/json",
  };
}

export async function getAuditLogs() {
  const res = await fetch(API, {
    headers: authHeader(),
  });

  if (res.status === 401) {
    localStorage.removeItem("tenantToken");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    throw new Error("Failed to load audit logs");
  }

  return res.json();
}
