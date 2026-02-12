const API_BASE = "http://localhost:5000/api";


export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("tenantToken");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("tenantToken");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const text = await res.text();
    try {
      throw JSON.parse(text);
    } catch {
      throw new Error(text || "Request failed");
    }
  }

  if (res.status === 204) return null;

  return res.json();
}


// export async function apiFetch(path, options = {}) {
//   const token = localStorage.getItem("tenantToken");

//   const res = await fetch(`${API_BASE}${path}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: token ? `Bearer ${token}` : "",
//       ...(options.headers || {}),
//     },
//   });

//   if (res.status === 401) {
//     // 🔥 AUTO LOGOUT
//     localStorage.removeItem("tenantToken");
//     window.location.href = "/login";
//     return;
//   }

//   if (!res.ok) {
//     const err = await res.json();
//     throw err;
//   }

//   return res.json();
// }
