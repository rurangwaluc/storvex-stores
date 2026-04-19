import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useMemo, useState } from "react";
import LogoMark from "../ui/LogoMark";

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
    if (Array.isArray(decoded?.roles)) return decoded.roles.map(normalizeRole).filter(Boolean);

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

    case "chat":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M6 18l-2 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
        </svg>
      );

    case "chat-plus":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M6 18l-2 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
          <path d="M12 8v6M9 11h6" strokeLinecap="round" />
        </svg>
      );

    case "chat-activity":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M6 18l-2 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
          <path d="M8 14l2-2 2 1 4-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "chat-broadcast":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M6 18l-2 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
          <path d="M8 10h8M8 13h8M8 16h5" strokeLinecap="round" />
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
        <svg
          viewBox="0 0 24 24"
          className={common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        >
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
        to: "/app/whatsapp/inbox",
        label: "WhatsApp inbox",
        icon: "chat",
        roles: ["OWNER", "MANAGER", "CASHIER"],
      },
      {
        to: "/app/whatsapp/drafts",
        label: "WhatsApp drafts",
        icon: "chat",
        roles: ["OWNER", "MANAGER", "CASHIER"],
      },
      {
        to: "/app/whatsapp/accounts",
        label: "WhatsApp accounts",
        icon: "chat-plus",
        roles: ["OWNER", "MANAGER"],
      },
      {
        to: "/app/whatsapp/activity",
        label: "WhatsApp activity",
        icon: "chat-activity",
        roles: ["OWNER", "MANAGER"],
      },
      {
        to: "/app/whatsapp/broadcasts",
        label: "WhatsApp broadcasts",
        icon: "chat-broadcast",
        roles: ["OWNER", "MANAGER"],
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        to: "/app/documents",
        label: "Document Center",
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
  if (to === "/app") return pathname === "/app";
  if (end) return pathname === to;
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

function NavItemButton({ item, active, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[22px] text-left transition",
        collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
        active
          ? "bg-[var(--color-surface-2)] text-[var(--color-primary)]"
          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      )}
      title={collapsed ? item.label : undefined}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
        <Icon type={item.icon} />
      </span>
      {!collapsed ? <span className="truncate text-[15px] font-medium">{item.label}</span> : null}
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
    try {
      localStorage.removeItem("tenantToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("tenantId");
      localStorage.removeItem("userId");
    } catch {}

    onLogout?.();
    onClose?.();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-all duration-300",
          effectiveCollapsed ? "w-[88px]" : "w-[272px]",
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
        <div className="flex h-[68px] items-center justify-between px-4">
          <Link to="/app" className="min-w-0" onClick={onClose}>
            <LogoMark compact={effectiveCollapsed} />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90 md:inline-flex"
              aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon type={effectiveCollapsed ? "collapse-right" : "collapse-left"} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90 md:hidden"
              aria-label="Close sidebar"
            >
              <Icon type="close" />
            </button>
          </div>
        </div>

        <div className={cn("px-3", effectiveCollapsed ? "pb-3" : "pb-4")}>
          <div
            className={cn(
              "rounded-[18px] bg-[var(--color-surface-2)] px-3 py-2.5",
              effectiveCollapsed && "flex justify-center px-2"
            )}
          >
            {effectiveCollapsed ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-3 py-1.5 text-xs text-[var(--color-text)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                OK
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    Workspace
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">
                    {roleLabel(primaryRole)}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-3 py-1.5 text-xs text-[var(--color-text)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {filteredNav.map((group) => (
            <div key={group.section} className="mb-3.5">
              <div
                className={cn(
                  "px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]",
                  effectiveCollapsed && "text-center"
                )}
              >
                {effectiveCollapsed ? "•" : group.section}
              </div>

              <ul className="space-y-1">
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
        </div>

        <div className="p-3 md:p-4">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-[22px] bg-[var(--color-surface-2)] text-[var(--color-danger)] transition hover:opacity-90",
              effectiveCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl">
              <Icon type="logout" />
            </span>
            {!effectiveCollapsed ? <span className="text-[15px] font-medium">Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}