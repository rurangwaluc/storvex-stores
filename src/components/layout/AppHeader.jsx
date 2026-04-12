import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CollapseLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function routeLabel(pathname) {
  if (pathname === "/app") return "Dashboard";

  if (pathname.startsWith("/app/whatsapp/broadcasts")) return "WhatsApp broadcasts";
  if (pathname.startsWith("/app/whatsapp/activity")) return "WhatsApp activity";
  if (pathname.startsWith("/app/whatsapp/accounts")) return "WhatsApp accounts";
  if (pathname.startsWith("/app/whatsapp/drafts")) return "WhatsApp drafts";
  if (pathname.startsWith("/app/whatsapp/inbox")) return "WhatsApp inbox";

  if (pathname.startsWith("/app/pos/drawer")) return "Cash drawer";
  if (pathname.startsWith("/app/pos/credit")) return "Credit dashboard";
  if (pathname.startsWith("/app/pos/sales")) return "Sales";
  if (pathname.startsWith("/app/pos")) return "POS";

  if (pathname.startsWith("/app/interstore")) return "Inter-Store";

  if (pathname.startsWith("/app/inventory/reorder")) return "Reorder list";
  if (pathname.startsWith("/app/inventory/stock-history")) return "Stock history";
  if (pathname.startsWith("/app/inventory")) return "Inventory";

  if (pathname.startsWith("/app/suppliers")) return "Suppliers";
  if (pathname.startsWith("/app/customers")) return "Customers";
  if (pathname.startsWith("/app/documents")) return "Document Center";
  if (pathname.startsWith("/app/repairs")) return "Repairs";
  if (pathname.startsWith("/app/reports")) return "Reports";
  if (pathname.startsWith("/app/settings")) return "Settings";
  if (pathname.startsWith("/app/billing")) return "Billing";
  if (pathname.startsWith("/app/audit")) return "Audit logs";
  if (pathname.startsWith("/app/employees")) return "Employees";

  return "Workspace";
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

function decodeTokenUser(token) {
  if (!token) return {};

  try {
    const decoded = jwtDecode(token);

    return {
      userName: pickFirstNonEmpty(
        decoded?.name,
        decoded?.fullName,
        decoded?.username,
        decoded?.userName
      ),
      userEmail: pickFirstNonEmpty(decoded?.email),
      workspaceName: pickFirstNonEmpty(
        decoded?.tenantName,
        decoded?.storeName,
        decoded?.businessName,
        decoded?.shopName
      ),
      workspaceLocation: pickFirstNonEmpty(
        decoded?.locationName,
        decoded?.branchName,
        decoded?.workspaceLocation
      ),
    };
  } catch {
    return {};
  }
}

function getSessionSnapshot() {
  if (typeof window === "undefined") {
    return {
      userName: "",
      userEmail: "",
      workspaceName: "",
      workspaceLocation: "",
    };
  }

  const token = localStorage.getItem("tenantToken") || localStorage.getItem("token") || "";

  const decoded = decodeTokenUser(token);

  const userObj =
    safeReadJson("user") ||
    safeReadJson("tenantUser") ||
    safeReadJson("authUser") ||
    safeReadJson("me") ||
    safeReadJson("profile");

  const userName = pickFirstNonEmpty(
    localStorage.getItem("userName"),
    localStorage.getItem("name"),
    userObj?.name,
    userObj?.fullName,
    userObj?.username,
    decoded.userName
  );

  const userEmail = pickFirstNonEmpty(
    localStorage.getItem("userEmail"),
    localStorage.getItem("email"),
    userObj?.email,
    decoded.userEmail
  );

  const workspaceName = pickFirstNonEmpty(
    localStorage.getItem("tenantName"),
    localStorage.getItem("storeName"),
    localStorage.getItem("businessName"),
    userObj?.tenantName,
    userObj?.storeName,
    userObj?.businessName,
    decoded.workspaceName
  );

  const workspaceLocation = pickFirstNonEmpty(
    localStorage.getItem("workspaceLocation"),
    localStorage.getItem("locationName"),
    localStorage.getItem("branchName"),
    userObj?.workspaceLocation,
    userObj?.locationName,
    userObj?.branchName,
    decoded.workspaceLocation
  );

  return {
    userName,
    userEmail,
    workspaceName,
    workspaceLocation,
  };
}

function initials(text) {
  const value = String(text || "").trim();
  if (!value) return "S";

  const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);
  const built = parts.map((part) => part[0]?.toUpperCase() || "").join("");

  return built || value[0].toUpperCase() || "S";
}

export default function AppHeader({
  isDark,
  onToggleTheme,
  onToggleSidebar,
  onToggleMobileSidebar,
  collapsed,
  workspaceName,
  workspaceLocation,
}) {
  const location = useLocation();
  const activeLabel = routeLabel(location.pathname);

  const [session, setSession] = useState(() => getSessionSnapshot());

  useEffect(() => {
    const refresh = () => setSession(getSessionSnapshot());

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const finalUserName = useMemo(() => {
    return pickFirstNonEmpty(session.userName, session.userEmail, "Account");
  }, [session.userName, session.userEmail]);

  const finalWorkspaceName = useMemo(() => {
    return pickFirstNonEmpty(session.workspaceName, workspaceName);
  }, [session.workspaceName, workspaceName]);

  const finalWorkspaceLocation = useMemo(() => {
    return pickFirstNonEmpty(session.workspaceLocation, workspaceLocation);
  }, [session.workspaceLocation, workspaceLocation]);

  const subLine = useMemo(() => {
    const parts = [finalUserName];

    if (finalWorkspaceName) parts.push(finalWorkspaceName);
    if (finalWorkspaceLocation) parts.push(finalWorkspaceLocation);

    return parts.join(" • ");
  }, [finalUserName, finalWorkspaceName, finalWorkspaceLocation]);

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg)]/92 backdrop-blur-md">
      <div className="flex min-h-[68px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90 md:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90 md:inline-flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <CollapseRightIcon /> : <CollapseLeftIcon />}
        </button>

        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold text-[var(--color-text)]">
            {activeLabel}
          </div>

          <div className="truncate text-[12px] text-[var(--color-text-muted)]">
            {subLine}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-10 items-center rounded-full bg-[var(--color-surface-2)] p-1 transition hover:opacity-90"
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
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-2)] text-sm font-bold text-[var(--color-text)] transition hover:opacity-90"
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