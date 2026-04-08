import { useLocation } from "react-router-dom";

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
  if (pathname.startsWith("/app/pos")) return "POS";
  if (pathname.startsWith("/app/interstore")) return "Inter-Store";
  if (pathname.startsWith("/app/inventory/reorder")) return "Reorder list";
  if (pathname.startsWith("/app/inventory/stock-history")) return "Stock history";
  if (pathname.startsWith("/app/inventory")) return "Inventory";
  if (pathname.startsWith("/app/suppliers")) return "Suppliers";
  if (pathname.startsWith("/app/customers")) return "Customers";
  if (pathname.startsWith("/app/whatsapp/inbox")) return "WhatsApp inbox";
  if (pathname.startsWith("/app/whatsapp/drafts")) return "WhatsApp drafts";
  if (pathname.startsWith("/app/documents")) return "Document Center";
  if (pathname.startsWith("/app/repairs")) return "Repairs";
  if (pathname.startsWith("/app/reports")) return "Reports";
  if (pathname.startsWith("/app/settings")) return "Settings";
  if (pathname.startsWith("/app/billing")) return "Billing";
  if (pathname.startsWith("/app/audit")) return "Audit logs";
  if (pathname.startsWith("/app/employees")) return "Employees";
  return "Workspace";
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
          <div className="text-[15px] font-bold text-[var(--color-text)]">
            {activeLabel}
          </div>
          <div className="truncate text-[12px] text-[var(--color-text-muted)]">
            {workspaceName || "Storvex"}
            {workspaceLocation ? ` • ${workspaceLocation}` : ""}
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
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-2)] text-sm font-bold text-[var(--color-text)] transition hover:opacity-90"            aria-label="Open profile"
          >
            {String(workspaceName || "S").trim().charAt(0).toUpperCase() || "S"}
          </button>
        </div>
      </div>
    </header>
  );
}