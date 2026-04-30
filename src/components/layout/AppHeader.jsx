import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getActiveBranchId, setActiveBranchId } from "../../services/apiClient";

const WORKSPACE_CACHE_KEY = "storvex_me_cache_v2";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CollapseLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <path
        d="M6.5 20V8.2c0-.7.4-1.3 1-1.6l4-2a2 2 0 0 1 1.8 0l4 2c.7.3 1.1 1 1.1 1.7V20"
        strokeLinejoin="round"
      />
      <path d="M4 20h16M10 20v-5h4v5M9.5 10h.01M14.5 10h.01" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7 11V8a5 5 0 0 1 10 0v3" strokeLinecap="round" />
      <rect x="5" y="11" width="14" height="10" rx="2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function routeLabel(pathname) {
  const path = String(pathname || "");

  if (path === "/dashboard") return "Dashboard";

  if (path === "/dashboard/reports") return "Reports";
  if (path.startsWith("/dashboard/reports/cash-flow")) return "Cash flow report";
  if (path.startsWith("/dashboard/reports/income-statement")) return "Income statement";
  if (path.startsWith("/dashboard/reports/trial-balance")) return "Trial balance";
  if (path.startsWith("/dashboard/reports/profit-table")) return "Profit table";

  if (path.startsWith("/dashboard/whatsapp/broadcasts")) return "WhatsApp broadcasts";
  if (path.startsWith("/dashboard/whatsapp/activity")) return "WhatsApp activity";
  if (path.startsWith("/dashboard/whatsapp/accounts")) return "WhatsApp accounts";
  if (path.startsWith("/dashboard/whatsapp/drafts")) return "WhatsApp drafts";
  if (path.startsWith("/dashboard/whatsapp/inbox")) return "WhatsApp inbox";

  if (path.startsWith("/dashboard/pos/drawer")) return "Cash drawer";
  if (path.startsWith("/dashboard/pos/credit")) return "Customer credit";
  if (path.startsWith("/dashboard/pos/sales")) return "Sales";
  if (path.startsWith("/dashboard/pos")) return "Point of sale";

  if (path.startsWith("/dashboard/interstore")) return "Inter-store deals";

  if (path.startsWith("/dashboard/inventory/reorder")) return "Reorder list";
  if (path.startsWith("/dashboard/inventory/stock-history")) return "Stock history";
  if (path.startsWith("/dashboard/inventory")) return "Inventory";

  if (path.startsWith("/dashboard/suppliers")) return "Suppliers";
  if (path.startsWith("/dashboard/customers")) return "Customers";

  if (path.startsWith("/dashboard/documents/warranties")) return "Warranties";
  if (path.startsWith("/dashboard/documents/receipts")) return "Receipts";
  if (path.startsWith("/dashboard/documents/invoices")) return "Invoices";
  if (path.startsWith("/dashboard/documents/proformas")) return "Proformas";
  if (path.startsWith("/dashboard/documents/delivery-notes")) return "Delivery notes";
  if (path.startsWith("/dashboard/documents")) return "Document center";

  if (path.startsWith("/dashboard/repairs")) return "Repairs";
  if (path.startsWith("/dashboard/settings")) return "Settings";
  if (path.startsWith("/dashboard/billing")) return "Billing";
  if (path.startsWith("/dashboard/audit")) return "Audit logs";
  if (path.startsWith("/dashboard/employees")) return "Employees";
  if (path.startsWith("/dashboard/expenses")) return "Expenses";

  return "Dashboard";
}

function safeReadJsonFromStorage(key) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeReadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const v = String(value || "").trim();
    if (v) return v;
  }
  return "";
}

function cleanLocationPart(value) {
  return String(value || "").trim();
}

function uniqueLocationParts(...values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const clean = cleanLocationPart(value);
    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(clean);
  }

  return result;
}

function formatBranchLocation(branch, fallbackLocation = "") {
  const parts = uniqueLocationParts(branch?.sector, branch?.district, branch?.address);

  if (parts.length > 0) {
    return parts.join(" • ");
  }

  return cleanLocationPart(fallbackLocation);
}

function formatBranchDisplay(branch, fallbackLocation = "") {
  const branchName = cleanLocationPart(branch?.name) || "Active branch";
  const branchCode = cleanLocationPart(branch?.code);
  const branchLocation = formatBranchLocation(branch, fallbackLocation);

  const metaLine = [branchCode, branchLocation].filter(Boolean).join(" • ");

  return {
    nameLine: branchName,
    metaLine,
  };
}

function decodeTokenUser(token) {
  if (!token) return {};

  try {
    const decoded = jwtDecode(token);

    return {
      userName: pickFirstNonEmpty(
        decoded?.name,
        decoded?.fullName,
        decoded?.username,
        decoded?.userName,
      ),
      userEmail: pickFirstNonEmpty(decoded?.email),
      workspaceName: pickFirstNonEmpty(
        decoded?.tenantName,
        decoded?.storeName,
        decoded?.businessName,
        decoded?.shopName,
      ),
      workspaceLocation: pickFirstNonEmpty(
        decoded?.locationName,
        decoded?.branchName,
        decoded?.workspaceLocation,
      ),
    };
  } catch {
    return {};
  }
}

function normalizeBranch(branch) {
  if (!branch?.id) return null;

  return {
    id: branch.id,
    name: branch.name || "Unnamed branch",
    code: branch.code || "",
    status: branch.status || "ACTIVE",
    isMain: Boolean(branch.isMain),
    district: branch.district || "",
    sector: branch.sector || "",
    address: branch.address || "",
    canOperate: branch.canOperate !== false,
    canViewReports: branch.canViewReports !== false,
  };
}

function resolveActiveBranch(workspace, branches) {
  const activeBranchId = pickFirstNonEmpty(
    getActiveBranchId(),
    workspace?.user?.activeBranchId,
    workspace?.user?.branchId,
    workspace?.branchAccess?.activeBranchId,
    workspace?.activeBranch?.id,
    workspace?.defaultBranch?.id,
    workspace?.mainBranch?.id,
    localStorage.getItem("storvex_active_branch_id"),
    localStorage.getItem("activeBranchId"),
    localStorage.getItem("branchId"),
  );

  const fromBranches = branches.find((branch) => branch.id === activeBranchId);
  if (fromBranches) return fromBranches;

  return (
    normalizeBranch(workspace?.activeBranch) ||
    normalizeBranch(workspace?.defaultBranch) ||
    normalizeBranch(workspace?.mainBranch) ||
    branches[0] ||
    null
  );
}

function getSessionSnapshot() {
  if (typeof window === "undefined") {
    return {
      userName: "",
      userEmail: "",
      userRole: "",
      workspaceName: "",
      workspaceLocation: "",
      branches: [],
      activeBranch: null,
      canViewAllBranches: false,
    };
  }

  const token = localStorage.getItem("tenantToken") || localStorage.getItem("token") || "";
  const decoded = decodeTokenUser(token);
  const workspace = safeReadJsonFromStorage(WORKSPACE_CACHE_KEY);

  const userObj =
    workspace?.user ||
    safeReadJson("user") ||
    safeReadJson("tenantUser") ||
    safeReadJson("authUser") ||
    safeReadJson("me") ||
    safeReadJson("profile");

  const tenant = workspace?.tenant || userObj?.tenant || null;

  const rawBranches = Array.isArray(workspace?.branches) ? workspace.branches : [];
  const branches = rawBranches.map(normalizeBranch).filter(Boolean);
  const activeBranch = resolveActiveBranch(workspace, branches);

  const userName = pickFirstNonEmpty(
    localStorage.getItem("userName"),
    localStorage.getItem("name"),
    userObj?.name,
    userObj?.fullName,
    userObj?.username,
    decoded.userName,
  );

  const userEmail = pickFirstNonEmpty(
    localStorage.getItem("userEmail"),
    localStorage.getItem("email"),
    userObj?.email,
    decoded.userEmail,
  );

  const userRole = pickFirstNonEmpty(
    localStorage.getItem("userRole"),
    userObj?.role,
    decoded?.role,
  );

  const workspaceName = pickFirstNonEmpty(
    localStorage.getItem("tenantName"),
    localStorage.getItem("storeName"),
    localStorage.getItem("businessName"),
    tenant?.name,
    userObj?.tenantName,
    userObj?.storeName,
    userObj?.businessName,
    decoded.workspaceName,
  );

  const branchLocation = formatBranchLocation(activeBranch, "");

  const tenantLocation = uniqueLocationParts(
    tenant?.sector,
    tenant?.district,
    tenant?.address,
  ).join(" • ");

  const workspaceLocation = pickFirstNonEmpty(
    branchLocation,
    tenantLocation,
    localStorage.getItem("workspaceLocation"),
    localStorage.getItem("locationName"),
    localStorage.getItem("branchName"),
    userObj?.workspaceLocation,
    userObj?.locationName,
    userObj?.branchName,
    decoded.workspaceLocation,
  );

  const canViewAllBranches = Boolean(
    workspace?.branchAccess?.canViewAllBranches ||
      workspace?.user?.canViewAllBranches ||
      String(userRole || "").toUpperCase() === "OWNER",
  );

  return {
    userName,
    userEmail,
    userRole,
    workspaceName,
    workspaceLocation,
    branches,
    activeBranch,
    canViewAllBranches,
  };
}

function initials(text) {
  const value = String(text || "").trim();
  if (!value) return "S";

  const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);
  const built = parts.map((part) => part[0]?.toUpperCase() || "").join("");

  return built || value[0].toUpperCase() || "S";
}

function branchLabel(branch) {
  if (!branch) return "No branch";
  return [branch.name, branch.code ? `#${branch.code}` : ""].filter(Boolean).join(" ");
}

function persistSelectedBranch(branch) {
  if (!branch?.id) return;

  setActiveBranchId(branch.id);

  localStorage.setItem("storvex_active_branch_id", branch.id);
  localStorage.setItem("activeBranchId", branch.id);
  localStorage.setItem("branchId", branch.id);

  if (branch.name) localStorage.setItem("activeBranchName", branch.name);
  if (branch.code) localStorage.setItem("activeBranchCode", branch.code);

  const location = formatBranchLocation(branch, "");
  if (location) localStorage.setItem("workspaceLocation", location);

  window.dispatchEvent(
    new CustomEvent("storvex:branch-changed", {
      detail: {
        branchId: branch.id,
        branch,
      },
    }),
  );
}

export default function AppHeader({
  isDark,
  onToggleTheme,
  onToggleSidebar,
  onToggleMobileSidebar,
  collapsed,
  workspaceName,
}) {
  const location = useLocation();
  const activeLabel = routeLabel(location.pathname);

  const branchMenuRef = useRef(null);

  const [session, setSession] = useState(() => getSessionSnapshot());
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setSession(getSessionSnapshot());

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storvex:branch-changed", refresh);
    window.addEventListener("storvex:workspace-refreshed", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storvex:branch-changed", refresh);
      window.removeEventListener("storvex:workspace-refreshed", refresh);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event) {
      if (!branchMenuRef.current) return;
      if (!branchMenuRef.current.contains(event.target)) {
        setBranchMenuOpen(false);
      }
    }

    function onEscape(event) {
      if (event.key === "Escape") setBranchMenuOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  const finalUserName = useMemo(() => {
    return pickFirstNonEmpty(session.userName, session.userEmail, "Account");
  }, [session.userName, session.userEmail]);

  const finalWorkspaceName = useMemo(() => {
    return pickFirstNonEmpty(session.workspaceName, workspaceName, "Storvex workspace");
  }, [session.workspaceName, workspaceName]);

  const activeBranch = session.activeBranch;
  const branches = Array.isArray(session.branches) ? session.branches : [];
  const canSwitchBranches = Boolean(session.canViewAllBranches && branches.length > 1);

  const activeBranchDisplay = useMemo(() => {
    return formatBranchDisplay(activeBranch, session.workspaceLocation);
  }, [activeBranch, session.workspaceLocation]);

  function handleBranchSelect(branch) {
    if (!branch?.id) return;

    persistSelectedBranch(branch);
    setSession(getSessionSnapshot());
    setBranchMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)]/70 bg-[var(--color-bg)]/92 backdrop-blur-xl">
      <div className="flex min-h-[78px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95 md:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95 md:inline-flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <CollapseRightIcon /> : <CollapseLeftIcon />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-[15px] font-black tracking-[-0.01em] text-[var(--color-text)] sm:text-[16px]">
              {activeLabel}
            </div>

            {activeBranch?.status && activeBranch.status !== "ACTIVE" ? (
              <span className="hidden rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 sm:inline-flex">
                {activeBranch.status}
              </span>
            ) : null}
          </div>

          <div className="mt-1 hidden truncate text-[12px] font-semibold text-[var(--color-text-muted)] sm:block">
            {finalWorkspaceName}
          </div>

          <div className="mt-1.5 flex items-center gap-2 sm:hidden">
            <span className="inline-flex max-w-[230px] items-center gap-1.5 truncate rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text)] shadow-[var(--shadow-soft)]">
              <BranchIcon />
              <span className="truncate">{activeBranchDisplay.nameLine}</span>
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block" ref={branchMenuRef}>
            <button
              type="button"
              onClick={() => {
                if (canSwitchBranches) setBranchMenuOpen((prev) => !prev);
              }}
              className={[
                "group relative inline-flex min-h-[56px] max-w-[390px] items-center gap-3 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2.5 text-left shadow-[var(--shadow-soft)] transition",
                "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-[var(--color-primary)]",
                canSwitchBranches
                  ? "hover:-translate-y-0.5 hover:border-[var(--color-primary)]/45 hover:shadow-[0_18px_48px_rgba(15,23,42,0.14)]"
                  : "cursor-default",
              ].join(" ")}
              aria-label={canSwitchBranches ? "Switch branch" : "Active branch"}
              title={branchLabel(activeBranch)}
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-[rgba(74,163,255,0.12)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/15">
                <BranchIcon />
              </span>

              <span className="relative min-w-0">
                <span className="flex items-center gap-2">
                  <span className="block truncate text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Active branch
                  </span>

                  {activeBranch?.isMain ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                      Main
                    </span>
                  ) : null}
                </span>

                <span className="mt-0.5 block max-w-[210px] truncate text-[13px] font-black leading-tight text-[var(--color-text)] lg:max-w-[250px]">
                  {activeBranchDisplay.nameLine}
                </span>

                {activeBranchDisplay.metaLine ? (
                  <span className="mt-1 block max-w-[210px] truncate text-[11px] font-semibold leading-tight text-[var(--color-text-muted)] lg:max-w-[250px]">
                    {activeBranchDisplay.metaLine}
                  </span>
                ) : null}
              </span>

              {canSwitchBranches ? (
                <span className="relative ml-1 text-[var(--color-text-muted)] transition group-hover:text-[var(--color-primary)]">
                  <ChevronDownIcon />
                </span>
              ) : (
                <span className="relative ml-1 text-[var(--color-text-muted)]">
                  <LockIcon />
                </span>
              )}
            </button>

            {branchMenuOpen && canSwitchBranches ? (
              <div className="absolute right-0 mt-2 w-[380px] overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className="px-3 pb-2 pt-2">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    Switch branch
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                    Choose where sales, drawer, and inventory actions should operate.
                  </div>
                </div>

                <div className="max-h-[330px] overflow-y-auto p-1">
                  {branches.map((branch) => {
                    const active = branch.id === activeBranch?.id;
                    const branchDisplay = formatBranchDisplay(branch, "");

                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => handleBranchSelect(branch)}
                        className={[
                          "flex w-full items-start gap-3 rounded-[22px] px-3 py-3 text-left transition",
                          active
                            ? "bg-[rgba(74,163,255,0.12)] text-[var(--color-text)]"
                            : "hover:bg-[var(--color-surface-2)]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                            active
                              ? "bg-[var(--color-primary)] text-white"
                              : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
                          ].join(" ")}
                        >
                          {active ? <CheckIcon /> : <BranchIcon />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-[13px] font-black text-[var(--color-text)]">
                              {branchDisplay.nameLine}
                            </span>
                            {branch.isMain ? (
                              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                                MAIN
                              </span>
                            ) : null}
                          </span>

                          <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-muted)]">
                            {branchDisplay.metaLine || "Branch workspace"}
                          </span>
                        </span>

                        <span
                          className={[
                            "mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
                            branch.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600",
                          ].join(" ")}
                        >
                          {branch.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-10 items-center rounded-full bg-[var(--color-surface-2)] p-1 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                !isDark
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              <SunIcon />
            </span>

            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                isDark
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              <MoonIcon />
            </span>
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95"
            aria-label="Open profile"
            title={finalUserName}
          >
            {initials(finalUserName)}
          </button>
        </div>
      </div>
    </header>
  );
}