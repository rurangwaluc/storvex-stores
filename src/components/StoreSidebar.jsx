import { NavLink, useNavigate } from "react-router-dom";

import { jwtDecode } from "jwt-decode";

export default function StoreSidebar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("tenantToken");

  let role = null;
  if (token) {
    try {
      role = jwtDecode(token).role;
    } catch {}
  }

  function logout() {
    localStorage.removeItem("tenantToken");
    navigate("/login", { replace: true });
  }

  const link = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"
    }`;

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 font-bold border-b border-gray-700">Storvex Store</div>

      <nav className="p-4 space-y-2 flex-1">
        <NavLink to="." end className={link}>Dashboard</NavLink>

        {role === "OWNER" && (
          <>
          <NavLink to="inventory" className={link}>Inventory</NavLink>
          <NavLink to="reports" className={link}>Reports</NavLink>
          <NavLink to="employees" className={link}>Employees</NavLink>
           <NavLink to="audit" className={link}>Audit Logs</NavLink>
          </>
        )}

        {(role === "OWNER" || role === "CASHIER") && (
          <>
            <NavLink to="pos" className={link}>POS</NavLink>
            <NavLink to="interstore" className={link}>Inter-Store</NavLink>
            
          </>
        )}

        {(role === "OWNER" || role === "TECHNICIAN") && (
          <NavLink to="repairs" className={link}>Repairs</NavLink>
        )}

        {(role === "OWNER" || role === "CASHIER" || role === "TECHNICIAN") && (
          <NavLink to="customers" className={link}>Customers</NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button onClick={logout} className="w-full bg-red-600 py-2 rounded">
          Logout
        </button>
      </div>
    </aside>
  );
}
