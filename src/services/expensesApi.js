const API = "http://localhost:5000/api/expenses";

function authHeader() {
  return {
    Authorization: `Bearer ${localStorage.getItem("tenantToken")}`,
    "Content-Type": "application/json",
  };
}

export async function getExpenses() {
  const res = await fetch(API, { headers: authHeader() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createExpense(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
