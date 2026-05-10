import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../../hooks/useTheme";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import apiClient, {
  clearActiveBranchId,
  getActiveBranchId,
  setActiveBranchId,
} from "../../services/apiClient";

const WORKSPACE_CACHE_KEY = "storvex_me_cache_v2";

function cleanString(value) {
  const s = String(value || "").trim();
  return s || "";
}

function safeJsonParse(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readCachedWorkspace() {
  return (
    safeJsonParse(sessionStorage.getItem(WORKSPACE_CACHE_KEY)) ||
    safeJsonParse(localStorage.getItem(WORKSPACE_CACHE_KEY))
  );
}

function pickWorkspaceName(workspace) {
  return (
    cleanString(workspace?.tenant?.name) ||
    cleanString(workspace?.user?.tenant?.name) ||
    cleanString(localStorage.getItem("tenantName")) ||
    cleanString(localStorage.getItem("storeName")) ||
    cleanString(localStorage.getItem("businessName")) ||
    ""
  );
}

function pickActiveBranch(workspace) {
  const activeBranchId =
    cleanString(getActiveBranchId()) ||
    cleanString(workspace?.user?.activeBranchId) ||
    cleanString(workspace?.user?.branchId) ||
    cleanString(workspace?.branchAccess?.activeBranchId) ||
    cleanString(workspace?.activeBranch?.id) ||
    cleanString(workspace?.defaultBranch?.id) ||
    cleanString(workspace?.mainBranch?.id);

  const branches = Array.isArray(workspace?.branches) ? workspace.branches : [];
  const matched = branches.find((branch) => branch?.id === activeBranchId);

  return (
    matched ||
    workspace?.activeBranch ||
    workspace?.defaultBranch ||
    workspace?.mainBranch ||
    branches[0] ||
    null
  );
}

function uniqueLocationParts(...values) {
  const seen = new Set();
  const parts = [];

  for (const value of values) {
    const clean = cleanString(value);
    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    parts.push(clean);
  }

  return parts;
}

function pickWorkspaceLocation(workspace) {
  const activeBranch = pickActiveBranch(workspace);
  const tenant = workspace?.tenant || workspace?.user?.tenant || null;

  const branchLocation = uniqueLocationParts(
    activeBranch?.sector,
    activeBranch?.district,
    activeBranch?.address
  ).join(" • ");

  const tenantLocation = uniqueLocationParts(
    tenant?.sector,
    tenant?.district,
    tenant?.address
  ).join(" • ");

  return (
    branchLocation ||
    tenantLocation ||
    cleanString(localStorage.getItem("workspaceLocation")) ||
    ""
  );
}

function pickBranchIdFromWorkspace(workspace) {
  const activeBranch = pickActiveBranch(workspace);

  return (
    cleanString(activeBranch?.id) ||
    cleanString(workspace?.user?.activeBranchId) ||
    cleanString(workspace?.user?.branchId) ||
    cleanString(workspace?.branchAccess?.activeBranchId) ||
    ""
  );
}

function persistWorkspace(workspace) {
  if (!workspace) return;

  try {
    sessionStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(workspace));
  } catch {}

  try {
    localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(workspace));
  } catch {}

  const tenant = workspace?.tenant || workspace?.user?.tenant || null;
  const user = workspace?.user || null;
  const activeBranch = pickActiveBranch(workspace);
  const activeBranchId = pickBranchIdFromWorkspace(workspace);
  const workspaceLocation = pickWorkspaceLocation(workspace);

  if (activeBranchId) {
    setActiveBranchId(activeBranchId);
    localStorage.setItem("branchId", activeBranchId);
    localStorage.setItem("activeBranchId", activeBranchId);
    localStorage.setItem("storvex_active_branch_id", activeBranchId);
  }

  if (tenant?.id) localStorage.setItem("tenantId", tenant.id);
  if (tenant?.name) localStorage.setItem("tenantName", tenant.name);

  if (user?.id) localStorage.setItem("userId", user.id);
  if (user?.name) localStorage.setItem("userName", user.name);
  if (user?.email) localStorage.setItem("userEmail", user.email);
  if (user?.role) localStorage.setItem("userRole", user.role);

  if (activeBranch?.name) localStorage.setItem("activeBranchName", activeBranch.name);
  if (activeBranch?.code) localStorage.setItem("activeBranchCode", activeBranch.code);
  if (workspaceLocation) localStorage.setItem("workspaceLocation", workspaceLocation);
}

function clearWorkspaceStorage() {
  localStorage.removeItem("tenantToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("tenantId");
  localStorage.removeItem("userId");
  localStorage.removeItem("tenantName");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("activeBranchName");
  localStorage.removeItem("activeBranchCode");
  localStorage.removeItem("workspaceLocation");
  localStorage.removeItem(WORKSPACE_CACHE_KEY);

  sessionStorage.removeItem(WORKSPACE_CACHE_KEY);

  clearActiveBranchId();
}

function pickPageTitle(pathname) {
  const path = String(pathname || "");

  if (path === "/app") return "Dashboard";

  if (path === "/app/reports") return "Reports";
  if (path.startsWith("/app/reports/cash-flow")) return "Cash flow report";
  if (path.startsWith("/app/reports/income-statement")) return "Income statement";
  if (path.startsWith("/app/reports/trial-balance")) return "Trial balance";
  if (path.startsWith("/app/reports/profit-table")) return "Profit table";

  if (path.startsWith("/app/whatsapp")) return "WhatsApp";

  if (path.startsWith("/app/pos/drawer")) return "Cash drawer";
  if (path.startsWith("/app/pos/credit")) return "Customer credit";
  if (path.startsWith("/app/pos/sales")) return "Sales";
  if (path.startsWith("/app/pos")) return "Point of sale";

  if (path.startsWith("/app/interstore")) return "Inter-store deals";

  if (path.startsWith("/app/inventory/reorder")) return "Reorder list";
  if (path.startsWith("/app/inventory/stock-history")) return "Stock history";
  if (path.startsWith("/app/inventory")) return "Inventory";

  if (path.startsWith("/app/suppliers")) return "Suppliers";
  if (path.startsWith("/app/customers")) return "Customers";

  if (path.startsWith("/app/documents/warranties")) return "Warranties";
  if (path.startsWith("/app/documents/receipts")) return "Receipts";
  if (path.startsWith("/app/documents/invoices")) return "Invoices";
  if (path.startsWith("/app/documents/proformas")) return "Proformas";
  if (path.startsWith("/app/documents/delivery-notes")) return "Delivery notes";
  if (path.startsWith("/app/documents")) return "Document center";

  if (path.startsWith("/app/repairs")) return "Repairs";
  if (path.startsWith("/app/settings")) return "Settings";
  if (path.startsWith("/app/billing")) return "Billing";
  if (path.startsWith("/app/audit")) return "Audit logs";
  if (path.startsWith("/app/employees")) return "Employees";
  if (path.startsWith("/app/expenses")) return "Expenses";

  return "";
}

export default function AppShell({ children }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const cachedWorkspace = useMemo(() => readCachedWorkspace(), []);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspace, setWorkspace] = useState(cachedWorkspace);

  const workspaceName = useMemo(() => pickWorkspaceName(workspace), [workspace]);

  const pageTitle = useMemo(
    () => pickPageTitle(location.pathname),
    [location.pathname]
  );

  const headerTitle = pageTitle || workspaceName || "Workspace";

  const refreshWorkspace = useCallback(async () => {
    try {
      const res = await apiClient.get("/auth/me");
      const payload = res?.data || null;

      if (!payload) return null;

      persistWorkspace(payload);
      setWorkspace(payload);

      window.dispatchEvent(
        new CustomEvent("storvex:workspace-refreshed", {
          detail: {
            workspace: payload,
            branchId: pickBranchIdFromWorkspace(payload),
          },
        })
      );

      return payload;
    } catch (err) {
      if (err?.response?.status === 401) {
        clearWorkspaceStorage();
        navigate("/login", { replace: true });
      }

      return null;
    }
  }, [navigate]);

  useEffect(() => {
    let alive = true;

    async function bootWorkspace() {
      const payload = await refreshWorkspace();
      if (!alive || !payload) return;

      setWorkspace(payload);
    }

    bootWorkspace();

    return () => {
      alive = false;
    };
  }, [refreshWorkspace]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let timer = null;

    function handleBranchChanged() {
      window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        refreshWorkspace();
      }, 120);
    }

    window.addEventListener("storvex:branch-changed", handleBranchChanged);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storvex:branch-changed", handleBranchChanged);
    };
  }, [refreshWorkspace]);

  useEffect(() => {
    function handleStorage(event) {
      if (
        event.key === "storvex_active_branch_id" ||
        event.key === "activeBranchId" ||
        event.key === "branchId" ||
        event.key === WORKSPACE_CACHE_KEY
      ) {
        const latest = readCachedWorkspace();
        if (latest) setWorkspace(latest);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function handleLogout() {
    clearWorkspaceStorage();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className={collapsed ? "md:pl-[92px]" : "md:pl-[280px]"}>
        <AppHeader
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onToggleMobileSidebar={() => setMobileOpen(true)}
          collapsed={collapsed}
          workspaceName={headerTitle}
        />

        <main
          className="min-h-[calc(100vh-78px)] bg-[var(--color-bg)] px-4 pb-6 pt-4 text-[var(--color-text)] sm:px-6 sm:pb-8 sm:pt-5"
          style={{
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}