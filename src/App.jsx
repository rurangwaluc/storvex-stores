import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AuditLogs from "./pages/audit/AuditLogs";
import ConfirmSignup from "./pages/auth/ConfirmSignup";
import Login from "./pages/auth/Login";
import LandingPage from "./pages/public/LandingPage";

import Dashboard from "./pages/dashboard/Dashboard";
import Employees from "./pages/employees/EmployeesList";
import InterStoreDeals from "./pages/interstore/InterStoreDeals";

import InventoryCreate from "./pages/inventory/InventoryCreate";
import InventoryEdit from "./pages/inventory/InventoryEdit";
import InventoryList from "./pages/inventory/InventoryList";
import StockAdjustments from "./pages/inventory/StockAdjustments";
import Reorder from "./pages/inventory/Reorder";

import PosReceipt from "./pages/pos/PosReceipt";
import PosSale from "./pages/pos/PosSale";
import SalesList from "./pages/pos/SalesList";
import CreditDashboard from "./pages/pos/CreditDashboard";
import CashDrawer from "./pages/pos/CashDrawer";

import RepairCreate from "./pages/repairs/RepairCreate";
import Repairs from "./pages/repairs/Repairs";

import Reports from "./pages/reports/Reports";

import CustomerCreate from "./pages/customers/CustomerCreate";
import CustomerEdit from "./pages/customers/CustomerEdit";
import CustomerList from "./pages/customers/CustomerList";

import RequireRole from "./auth/RequireRole";
import RequireTenantAuth from "./auth/requireTenantAuth";
import StoreLayout from "./components/StoreLayout";

import TenantIntent from "./pages/Tenant/TenantIntent";
import OwnerPayment from "./pages/Tenant/OwnerPayment";
import VerifyOtp from "./pages/Tenant/VerifyOtp";

import SubscriptionGate from "./components/SubscriptionGate";
import Renew from "./pages/Billing/Renew";
import Billing from "./pages/Billing/Billing";

import SuppliersList from "./pages/suppliers/SuppliersList";
import SupplierCreate from "./pages/suppliers/SupplierCreate";
import SupplierEdit from "./pages/suppliers/SupplierEdit";
import SupplierView from "./pages/suppliers/SupplierView";
import SupplierSupplyCreate from "./pages/suppliers/SupplierSupplyCreate";

import DeliveryNoteCreate from "./pages/deliveryNotes/DeliveryNoteCreate";
// Add these when you have them:
import DeliveryNoteEdit from "./pages/deliveryNotes/DeliveryNoteEdit";

import SettingsLayout from "./pages/settings/SettingsLayout";
import SettingsGeneral from "./pages/settings/SettingsGeneral";
import SettingsRoles from "./pages/settings/SettingsRoles";
import SettingsStub from "./pages/settings/SettingsStub";
import SettingsMembers from "./pages/settings/SettingsMembers";

import WhatsAppDrafts from "./pages/whatsapp/WhatsAppDrafts";
import WhatsAppInbox from "./pages/whatsapp/WhatsAppInbox";
import WhatsAppConversation from "./pages/whatsapp/WhatsAppConversation";

import DocumentsHome from "./pages/documents/DocumentsHome";
import DocumentListPage from "./pages/documents/DocumentListPage";
import DocumentPreviewRoute from "./pages/documents/DocumentPreviewRoute";

import { listReceipts } from "./services/receiptsApi";
import { listInvoices } from "./services/invoicesApi";
import { listProformas } from "./services/proformasApi";
import ProformaCreate from "./pages/proformas/ProformaCreate";
import ProformaEdit from "./pages/proformas/ProformaEdit";

import { listWarranties } from "./services/warrantiesApi";
import WarrantyCreate from "./pages/warranties/WarrantyCreate";
import WarrantyEdit from "./pages/warranties/WarrantyEdit";

import { listDeliveryNotes } from "./services/deliveryNotesApi";

function GuardedStoreLayout() {
  return (
    <SubscriptionGate>
      <StoreLayout />
    </SubscriptionGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<TenantIntent />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/owner-payment" element={<OwnerPayment />} />
        <Route path="/confirm-signup" element={<ConfirmSignup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/renew" element={<Renew />} />

        <Route path="/app" element={<RequireTenantAuth />}>
          <Route element={<GuardedStoreLayout />}>
            <Route
              index
              element={
                <RequireRole
                  roles={["OWNER", "MANAGER", "CASHIER", "SELLER", "STOREKEEPER", "TECHNICIAN"]}
                >
                  <Dashboard />
                </RequireRole>
              }
            />

            <Route element={<RequireRole roles={["OWNER", "MANAGER"]} />}>
              <Route path="employees" element={<Employees />} />

              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<SettingsGeneral />} />
                <Route path="members" element={<SettingsMembers />} />
                <Route path="roles" element={<SettingsRoles />} />
                <Route path="security" element={<SettingsStub title="Login & security" />} />
                <Route path="audit" element={<SettingsStub title="Audit logs" />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={["OWNER"]} />}>
              <Route path="audit" element={<AuditLogs />} />
              <Route path="billing" element={<Billing />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "MANAGER", "STOREKEEPER"]} />}>
              <Route path="inventory" element={<InventoryList />} />
              <Route path="inventory/reorder" element={<Reorder />} />
              <Route path="inventory/stock-history" element={<StockAdjustments />} />

              <Route path="suppliers" element={<SuppliersList />} />
              <Route path="suppliers/:id" element={<SupplierView />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "MANAGER"]} />}>
              <Route path="inventory/create" element={<InventoryCreate />} />
              <Route path="inventory/:id/edit" element={<InventoryEdit />} />

              <Route path="suppliers/new" element={<SupplierCreate />} />
              <Route path="suppliers/:id/edit" element={<SupplierEdit />} />
              <Route path="suppliers/:id/supplies/new" element={<SupplierSupplyCreate />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "MANAGER", "CASHIER", "SELLER"]} />}>
              <Route path="pos" element={<PosSale />} />
              <Route path="pos/sales" element={<SalesList />} />
              <Route path="pos/sales/:id" element={<PosReceipt />} />
              <Route path="pos/sales/:id/receipt" element={<Navigate to=".." replace />} />
              <Route path="pos/credit" element={<CreditDashboard />} />

              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<CustomerCreate />} />
              <Route path="customers/:id" element={<CustomerEdit />} />
            </Route>

            <Route
              element={
                <RequireRole
                  roles={["OWNER", "MANAGER", "STOREKEEPER", "SELLER", "CASHIER", "TECHNICIAN"]}
                />
              }
            >
              <Route path="documents" element={<DocumentsHome />} />

              <Route
                path="documents/receipts"
                element={
                  <DocumentListPage
                    type="receipts"
                    title="Receipts"
                    subtitle="Sales payment records and branded receipt previews."
                    listFn={listReceipts}
                  />
                }
              />

              <Route
                path="documents/invoices"
                element={
                  <DocumentListPage
                    type="invoices"
                    title="Invoices"
                    subtitle="Formal billing documents with owner branding and terms."
                    listFn={listInvoices}
                  />
                }
              />

              <Route
                path="documents/delivery-notes"
                element={
                  <DocumentListPage
                    type="delivery-notes"
                    title="Delivery Notes"
                    subtitle="Goods handover confirmation with branded print layout."
                    listFn={listDeliveryNotes}
                  />
                }
              />

              <Route
                path="documents/proformas"
                element={
                  <DocumentListPage
                    type="proformas"
                    title="Proformas"
                    subtitle="Preliminary quotations before final billing."
                    listFn={listProformas}
                  />
                }
              />

              <Route
                path="documents/warranties"
                element={
                  <DocumentListPage
                    type="warranties"
                    title="Warranties"
                    subtitle="After-sales warranty certificates and coverage records."
                    listFn={listWarranties}
                  />
                }
              />

              <Route path="documents/:resource/:id/preview" element={<DocumentPreviewRoute />} />

              <Route path="receipts" element={<Navigate to="/app/documents/receipts" replace />} />
              <Route path="invoices" element={<Navigate to="/app/documents/invoices" replace />} />
              <Route
                path="delivery-notes"
                element={<Navigate to="/app/documents/delivery-notes" replace />}
              />
              <Route path="proformas" element={<Navigate to="/app/documents/proformas" replace />} />
              <Route path="warranties" element={<Navigate to="/app/documents/warranties" replace />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "MANAGER", "CASHIER", "SELLER"]} />}>
              <Route path="documents/proformas/create" element={<ProformaCreate />} />
              <Route path="documents/proformas/:id/edit" element={<ProformaEdit />} />

              <Route path="documents/delivery-notes/create" element={<DeliveryNoteCreate />} />
              <Route path="documents/delivery-notes/:id/edit" element={<DeliveryNoteEdit />} />

              <Route path="documents/warranties/create" element={<WarrantyCreate />} />
              <Route path="documents/warranties/:id/edit" element={<WarrantyEdit />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "MANAGER", "CASHIER"]} />}>
              <Route path="whatsapp/inbox" element={<WhatsAppInbox />} />
              <Route path="whatsapp/inbox/:conversationId" element={<WhatsAppConversation />} />
              <Route path="whatsapp/drafts" element={<WhatsAppDrafts />} />
              <Route path="pos/drawer" element={<CashDrawer />} />
              <Route path="interstore" element={<InterStoreDeals />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "MANAGER"]} />}>
              <Route path="reports" element={<Reports />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "CASHIER", "TECHNICIAN"]} />}>
              <Route path="repairs" element={<Repairs />} />
            </Route>

            <Route element={<RequireRole roles={["OWNER", "CASHIER"]} />}>
              <Route path="repairs/new" element={<RepairCreate />} />
            </Route>

            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}