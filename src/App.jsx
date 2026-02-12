import { BrowserRouter, Route, Routes } from "react-router-dom";

import AuditLogs from "./pages/audit/AuditLogs";
import ConfirmSignup from "./pages/auth/ConfirmSignup";
import CustomerCreate from "./pages/customers/CustomerCreate";
import CustomerEdit from "./pages/customers/CustomerEdit";
import CustomerList from "./pages/customers/CustomerList";
// Protected pages
import Dashboard from "./pages/dashboard/Dashboard";
import Employees from "./pages/employees/EmployeesList";
import InterStoreDeals from "./pages/interstore/InterStoreDeals";
import InventoryCreate from "./pages/inventory/InventoryCreate";
import InventoryEdit from "./pages/inventory/InventoryEdit";
import InventoryList from "./pages/inventory/InventoryList";
import Login from "./pages/auth/Login";
import PosReceipt from "./pages/pos/PosReceipt";
import PosSale from "./pages/pos/PosSale";
import RepairCreate from "./pages/repairs/RepairCreate";
import RepairEdit from "./pages/repairs/RepairEdit";
import Repairs from "./pages/repairs/Repairs";
import Reports from "./pages/reports/Reports";
import RequireRole from "./auth/RequireRole";
import RequireTenantAuth from "./auth/requireTenantAuth"
import StoreLayout from "./components/StoreLayout";
import TenantIntent from "./pages/Tenant/TenantIntent";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌍 Public routes */}
        <Route path="/" element={<TenantIntent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/confirm-signup" element={<ConfirmSignup />} />

        {/* 🔒 Protected tenant app */}
        <Route path="/app" element={<RequireTenantAuth />}>
          <Route element={<StoreLayout />}>
            {/* Dashboard (ALL ROLES) */}
            <Route index element={<Dashboard />} />

            {/* OWNER only */}
            <Route element={<RequireRole roles={["OWNER"]} />}>
              <Route path="inventory" element={<InventoryList />} />
              <Route path="inventory/create" element={<InventoryCreate />} />
              <Route path="inventory/:id/edit" element={<InventoryEdit />} />
              <Route path="employees" element={<Employees />} />
              <Route path="audit" element={<AuditLogs />} />
            </Route>

            {/* OWNER + CASHIER */}
            <Route element={<RequireRole roles={["OWNER", "CASHIER"]} />}>
              <Route path="pos" element={<PosSale />} />
              <Route path="pos/sales/:id" element={<PosReceipt />} />
              <Route path="interstore" element={<InterStoreDeals />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<CustomerCreate />} />
              <Route path="customers/:id" element={<CustomerEdit />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* OWNER + TECHNICIAN */}
            <Route element={<RequireRole roles={["OWNER", "TECHNICIAN"]} />}>
              <Route path="repairs" element={<Repairs />} />
              <Route path="repairs/new" element={<RepairCreate />} />
              <Route path="repairs/:id/edit" element={<RepairEdit />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
