// src/auth/RequireRole.jsx

import { Navigate, Outlet } from "react-router-dom";

import {jwtDecode} from "jwt-decode";

/**
 * RequireRole: default export
 * Can be used inline or for route protection
 * Supports single or multiple roles, OWNER override, and invalid/expired token handling
 */
export default function RequireRole({ roles, children }) {
  const token = localStorage.getItem("tenantToken");

  if (!token) {
    // No token → redirect to login
    return <Navigate to="/login" replace />;
  }

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch (err) {
    console.error("Invalid token:", err);
    return <Navigate to="/login" replace />;
  }

  // Optional: check token expiration
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    console.warn("Token expired");
    localStorage.removeItem("tenantToken");
    return <Navigate to="/login" replace />;
  }

  // Get roles from JWT
  const userRoles = decoded.role
    ? [decoded.role.toUpperCase()]
    : decoded.roles
    ? decoded.roles.map((r) => r.toUpperCase())
    : [];

  // OWNER has full access
  if (userRoles.includes("OWNER")) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Normalize allowed roles
  const allowedRoles = (roles || []).map((r) => r.toUpperCase());
  const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    // No access → redirect to home
    return <Navigate to="/" replace />;
  }

  // Render children (for inline) or <Outlet /> (for routes)
  return children ? <>{children}</> : <Outlet />;
}
