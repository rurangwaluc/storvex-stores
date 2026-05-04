import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useMemo, useState } from "react";
import { clearActiveBranchId } from "../../services/apiClient";

const LOGO_SRC = "/logo.webp";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function getDecodedRoles(token) {
  if (!token) return [];

  try {
    const decoded = jwtDecode(token);

    if (decoded?.role) return [normalizeRole(decoded.role)];

    if (Array.isArray(decoded?.roles)) {
      return decoded.roles.map(normalizeRole).filter(Boolean);
    }

    return [];
  } catch {
    return [];
  }
}

function roleLabel(role) {
  const r = normalizeRole(role);

  if (r === "OWNER") return "Owner";
  if (r === "MANAGER") return "Manager";
  if (r === "CASHIER") return "Cashier";
  if (r === "SELLER") return "Seller";
  if (r === "STOREKEEPER") return "Storekeeper";
  if (r === "TECHNICIAN") return "Technician";

  return "Staff";
}

function Icon({ type }) {
  const common = "h-[18px] w-[18px]";

  switch (type) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z" />
        </svg>
      );

    case "pos":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );

    case "inventory":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M21 8l-9-5-9 5 9 5 9-5zm-18 3v8l9 5 9-5v-8" />
        </svg>
      );

    case "customers":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="9" cy="8" r="3" />
          <path d="M4 18a5 5 0 0 1 10 0" />
          <path d="M17 11a2.5 2.5 0 1 0 0-5M19.5 18a4 4 0 0 0-3.5-3.96" />
        </svg>
      );

    case "suppliers":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 10h16v9H4z" />
          <path d="M7 10V7h10v3" />
        </svg>
      );

    case "repairs":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M14 7l3-3 3 3-3 3zM3 21l7-7" />
          <path d="m11 13-4-4 2-2 4 4" />
        </svg>
      );

    case "documents":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
        </svg>
      );

    case "transfer":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "reports":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M5 19V9M12 19V5M19 19v-8" strokeLinecap="round" />
        </svg>
      );

    case "expenses":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M7 12h4M15 12h2M12 9v6" strokeLinecap="round" />
        </svg>
      );

    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4H2.9a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.8a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-.6 1Z" />
        </svg>
      );

    case "billing":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18M7 15h4" strokeLinecap="round" />
        </svg>
      );

    case "audit":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M7 3h10a2 2 0 0 1 2 2v16l-4-2-3 2-3-2-4 2V5a2 2 0 0 1 2-2Z" />
          <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
        </svg>
      );

    case "employees":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="8" cy="8" r="3" />
          <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M14.5 19a3.7 3.7 0 0 1 6.8-2" />
        </svg>
      );

    case "collapse-left":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "collapse-right":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "close":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      );

    case "logout":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    default:
      return null;
  }
}

const WHATSAPP_ROLES = ["OWNER", "MANAGER", "CASHIER", "SELLER", "STOREKEEPER", "TECHNICIAN"];

const NAV_ITEMS = [
  {
    section: "Core",
    items: [
      {
        to: "/app",
        label: "Dashboard",
        icon: "dashboard",
        roles: ["OWNER", "MANAGER", "CASHIER", "SELLER", "STOREKEEPER", "TECHNICIAN"],
        end: true,
      },
      {
        to: "/app/pos",
        label: "POS",
        icon: "pos",
        roles: ["OWNER", "MANAGER", "CASHIER", "SELLER"],
      },
      {
        to: "/app/interstore",
        label: "Inter-Store",
        icon: "transfer",
        roles: ["OWNER", "MANAGER", "CASHIER"],
      },
    ],
  },
  {
    section: "Stock",
    items: [
      {
        to: "/app/inventory",
        label: "Inventory",
        icon: "inventory",
        roles: ["OWNER", "MANAGER", "STOREKEEPER"],
      },
      {
        to: "/app/inventory/reorder",
        label: "Reorder list",
        icon: "inventory",
        roles: ["OWNER", "MANAGER", "STOREKEEPER"],
      },
      {
        to: "/app/inventory/stock-history",
        label: "Stock history",
        icon: "inventory",
        roles: ["OWNER", "MANAGER", "STOREKEEPER"],
      },
      {
        to: "/app/suppliers",
        label: "Suppliers",
        icon: "suppliers",
        roles: ["OWNER", "MANAGER", "STOREKEEPER"],
      },
    ],
  },
  {
    section: "Customers",
    items: [
      {
        to: "/app/customers",
        label: "Customers",
        icon: "customers",
        roles: ["OWNER", "MANAGER", "CASHIER", "SELLER", "TECHNICIAN"],
      },
      {
        to: "/app/whatsapp",
        label: "WhatsApp",
        icon: "whatsapp",
        roles: WHATSAPP_ROLES,
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        to: "/app/documents",
        label: "Documents",
        icon: "documents",
        roles: ["OWNER", "MANAGER", "STOREKEEPER", "SELLER", "CASHIER", "TECHNICIAN"],
      },
      {
        to: "/app/repairs",
        label: "Repairs",
        icon: "repairs",
        roles: ["OWNER", "CASHIER", "TECHNICIAN"],
      },
      {
        to: "/app/reports",
        label: "Reports",
        icon: "reports",
        roles: ["OWNER", "MANAGER"],
      },
      {
        to: "/app/expenses",
        label: "Expenses",
        icon: "expenses",
        roles: ["OWNER"],
      },
    ],
  },
  {
    section: "Control",
    items: [
      {
        to: "/app/employees",
        label: "Employees",
        icon: "employees",
        roles: ["OWNER", "MANAGER"],
      },
      {
        to: "/app/billing",
        label: "Billing",
        icon: "billing",
        roles: ["OWNER"],
      },
      {
        to: "/app/audit",
        label: "Audit logs",
        icon: "audit",
        roles: ["OWNER", "MANAGER"],
      },
      {
        to: "/app/settings",
        label: "Settings",
        icon: "settings",
        roles: ["OWNER", "MANAGER"],
      },
    ],
  },
];

function isItemActive(pathname, to, end) {
  if (end) return pathname === to;

  if (to === "/app/whatsapp") {
    return pathname === to || pathname.startsWith("/app/whatsapp/");
  }

  if (to === "/app/inventory") {
    return pathname === to;
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

function filterNavByRoles(groups, roles) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.some((role) => roles.includes(role))),
    }))
    .filter((group) => group.items.length > 0);
}

function readWorkspaceCache() {
  try {
    const raw =
      sessionStorage.getItem("storvex_me_cache_v2") ||
      localStorage.getItem("storvex_me_cache_v2");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cleanString(value) {
  return String(value || "").trim();
}

function getWorkspaceName() {
  const workspace = readWorkspaceCache();

  return (
    cleanString(workspace?.tenant?.name) ||
    cleanString(localStorage.getItem("tenantName")) ||
    "Storvex"
  );
}

function getActiveBranchLabel() {
  const workspace = readWorkspaceCache();

  const activeBranch =
    workspace?.activeBranch ||
    workspace?.defaultBranch ||
    workspace?.mainBranch ||
    null;

  const name =
    cleanString(activeBranch?.name) ||
    cleanString(localStorage.getItem("activeBranchName")) ||
    "Active branch";

  const code =
    cleanString(activeBranch?.code) ||
    cleanString(localStorage.getItem("activeBranchCode"));

  return code ? `${code} • ${name}` : name;
}

function clearAuthStorage() {
  try {
    [
      "tenantToken",
      "token",
      "userRole",
      "tenantId",
      "userId",
      "tenantName",
      "userName",
      "userEmail",
      "activeBranchName",
      "activeBranchCode",
      "workspaceLocation",
      "storvex_me_cache_v2",
    ].forEach((key) => localStorage.removeItem(key));

    sessionStorage.removeItem("storvex_me_cache_v2");
    clearActiveBranchId();
  } catch {}
}

function LogoBlock({ collapsed, onClose }) {
  if (collapsed) {
    return (
      <Link
        to="/app"
        onClick={onClose}
        className="group mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(15,23,42,0.16)]"
        aria-label="Go to dashboard"
      >
        <img
          src={LOGO_SRC}
          alt="Storvex"
          className="h-9 w-9 object-contain transition duration-300 group-hover:scale-105"
          draggable="false"
        />
      </Link>
    );
  }

  return (
    <Link
      to="/app"
      onClick={onClose}
      className="group flex min-w-0 items-center rounded-[26px] border border-transparent p-1.5 transition hover:border-[var(--color-border)] hover:bg-[var(--color-card)]"
      aria-label="Go to dashboard"
    >
      <span className="flex h-[52px] w-[164px] shrink-0 items-center justify-start overflow-hidden rounded-[22px] px-2">
        <img
          src={LOGO_SRC}
          alt="Storvex"
          className="h-11 max-w-full object-contain transition duration-300 group-hover:scale-[1.02]"
          draggable="false"
        />
      </span>
    </Link>
  );
}

function WorkspaceCard({ collapsed, primaryRole }) {
  const workspaceName = getWorkspaceName();
  const branchLabel = getActiveBranchLabel();

  if (collapsed) {
    return (
      <div className="px-3 pb-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-[var(--shadow-soft)]">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-4">
      <div className="relative overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[rgba(74,163,255,0.12)] blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Workspace
            </div>

            <div className="mt-1 truncate text-[14px] font-black tracking-[-0.01em] text-[var(--color-text)]">
              {workspaceName}
            </div>

            <div className="mt-1 truncate text-[11px] font-semibold text-[var(--color-text-muted)]">
              {branchLabel}
            </div>
          </div>

          <div className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
            Active
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-surface-2)] px-3 py-2">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
            Signed in as
          </span>
          <span className="truncate text-[12px] font-black text-[var(--color-text)]">
            {roleLabel(primaryRole)}
          </span>
        </div>
      </div>
    </div>
  );
}

function NavItemButton({ item, active, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-[22px] text-left transition duration-200",
        collapsed ? "justify-center px-0 py-3" : "px-3.5 py-3",
        active
          ? "bg-[rgba(74,163,255,0.12)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_rgba(74,163,255,0.16)]"
          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      )}
      title={collapsed ? item.label : undefined}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-primary)]" />
      ) : null}

      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition",
          active
            ? "bg-[var(--color-primary)] text-white shadow-sm"
            : "bg-transparent text-current group-hover:bg-[var(--color-card)]"
        )}
      >
        <Icon type={item.icon} />
      </span>

      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

export default function AppSidebar({
  collapsed = false,
  mobileOpen = false,
  onClose,
  onLogout,
  onToggleCollapse,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoverOpen, setHoverOpen] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("tenantToken") || localStorage.getItem("token")
      : null;

  const roles = useMemo(() => getDecodedRoles(token), [token]);
  const primaryRole = roles[0] || null;
  const filteredNav = useMemo(() => filterNavByRoles(NAV_ITEMS, roles), [roles]);

  const effectiveCollapsed = collapsed && !hoverOpen;

  function handleNavigate(to) {
    navigate(to);
    onClose?.();
  }

  function handleLogout() {
    clearAuthStorage();
    onLogout?.();
    onClose?.();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-all duration-300",
          effectiveCollapsed ? "w-[92px]" : "w-[292px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
        onMouseEnter={() => {
          if (collapsed) setHoverOpen(true);
        }}
        onMouseLeave={() => {
          if (collapsed) setHoverOpen(false);
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-[-120px] h-[260px] w-[260px] rounded-full bg-[rgba(74,163,255,0.08)] blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-160px] h-[300px] w-[300px] rounded-full bg-[rgba(34,197,94,0.06)] blur-3xl" />
        </div>

        <div className="relative flex min-h-[84px] items-center justify-between gap-3 px-4 py-4">
          <LogoBlock collapsed={effectiveCollapsed} onClose={onClose} />

          {!effectiveCollapsed ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95 md:inline-flex"
                aria-label="Collapse sidebar"
              >
                <Icon type="collapse-left" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95 md:hidden"
                aria-label="Close sidebar"
              >
                <Icon type="close" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="absolute -right-4 top-7 hidden h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95 md:inline-flex"
              aria-label="Expand sidebar"
            >
              <Icon type="collapse-right" />
            </button>
          )}
        </div>

        <div className="relative">
          <WorkspaceCard collapsed={effectiveCollapsed} primaryRole={primaryRole} />
        </div>

        <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">
          {filteredNav.map((group) => (
            <div key={group.section} className="mb-4">
              <div
                className={cn(
                  "px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]",
                  effectiveCollapsed && "text-center"
                )}
              >
                {effectiveCollapsed ? "•" : group.section}
              </div>

              <ul className="space-y-1.5">
                {group.items.map((item) => {
                  const active = isItemActive(location.pathname, item.to, item.end);

                  return (
                    <li key={item.to}>
                      <NavItemButton
                        item={item}
                        active={active}
                        collapsed={effectiveCollapsed}
                        onClick={() => handleNavigate(item.to)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-[var(--color-border)]/70 p-3 md:p-4">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "group flex w-full items-center gap-3 rounded-[24px] border border-transparent bg-[var(--color-surface-2)] text-[var(--color-danger)] transition hover:-translate-y-0.5 hover:border-red-500/20 hover:bg-red-500/10",
              effectiveCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
            )}
            title={effectiveCollapsed ? "Sign out" : undefined}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl transition group-hover:bg-red-500/10">
              <Icon type="logout" />
            </span>

            {!effectiveCollapsed ? (
              <span className="text-[14px] font-black">
                Sign out
              </span>
            ) : null}
          </button>
        </div>
      </aside>
    </>
  );
}