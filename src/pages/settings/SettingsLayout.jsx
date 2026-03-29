import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const NAV_ITEMS = [
  { key: "general", label: "General", to: "/app/settings" },
  { key: "members", label: "Members", to: "/app/settings/members" },
  { key: "roles", label: "User roles", to: "/app/settings/roles" },
  { key: "billing", label: "Billing & subscription", to: "/app/billing" },
  { key: "security", label: "Login & security", to: "/app/settings/security" },
  { key: "audit", label: "Audit logs", to: "/app/settings/audit" },
];

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };

  switch (name) {
    case "general":
      return (
        <svg {...common}>
          <path
            d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M19.4 15a7.9 7.9 0 000-6l-2.1.7a6.4 6.4 0 00-1.2-1.2l.7-2.1a7.9 7.9 0 00-6 0l.7 2.1a6.4 6.4 0 00-1.2 1.2L6.6 9a7.9 7.9 0 000 6l2.1-.7a6.4 6.4 0 001.2 1.2l-.7 2.1a7.9 7.9 0 006 0l-.7-2.1a6.4 6.4 0 001.2-1.2l2.1.7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "members":
      return (
        <svg {...common}>
          <path
            d="M16 11a4 4 0 10-8 0 4 4 0 008 0M4 20a8 8 0 0116 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "roles":
      return (
        <svg {...common}>
          <path
            d="M12 2l8 4v6c0 5-3.2 9.4-8 10-4.8-.6-8-5-8-10V6l8-4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "billing":
      return (
        <svg {...common}>
          <path
            d="M4 7h16v10H4V7zm2 2h6m-6 4h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path
            d="M12 2l8 4v6c0 5-3.2 9.4-8 10-4.8-.6-8-5-8-10V6l8-4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12 11v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common}>
          <path
            d="M9 5h10v14H9V5zM5 7h2m-2 4h2m-2 4h2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return <span className="inline-block w-[18px]" />;
  }
}

function currentKeyFromPath(pathname) {
  if (pathname === "/app/settings") return "general";
  if (pathname.includes("/app/settings/members")) return "members";
  if (pathname.includes("/app/settings/roles")) return "roles";
  if (pathname.includes("/app/billing")) return "billing";
  if (pathname.includes("/app/settings/security")) return "security";
  if (pathname.includes("/app/settings/audit")) return "audit";
  return "general";
}

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = currentKeyFromPath(location.pathname);
  const activeItem = NAV_ITEMS.find((x) => x.key === activeKey) || NAV_ITEMS[0];

  const navItemClass = ({ isActive }) =>
    cx(
      "group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap",
      isActive
        ? "bg-[rgb(var(--text))] text-[rgb(var(--bg-elevated))]"
        : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text))]"
    );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="app-card overflow-hidden p-0">
        <div className="border-b border-[rgb(var(--border))] px-5 py-5">
          <div className="flex flex-col gap-5">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-soft))]">
                Control center
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--text))]">
                Settings
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--text-muted))]">
                Manage store identity, staff access, billing, security, and operational rules from one place.
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-2">
                <div className="flex flex-wrap items-center gap-2">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      end={item.key === "general"}
                      className={navItemClass}
                    >
                      <Icon name={item.key} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">
                Section
              </label>
              <select
                className="app-input"
                value={activeItem.to}
                onChange={(e) => navigate(e.target.value)}
              >
                {NAV_ITEMS.map((item) => (
                  <option key={item.key} value={item.to}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="badge-info">Store configuration</span>
            <span className="badge-neutral">Operational controls</span>
            <span className="badge-neutral">Live system settings</span>
          </div>
        </div>
      </section>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}