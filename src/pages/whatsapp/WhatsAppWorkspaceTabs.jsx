import { NavLink } from "react-router-dom";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function surfaceCard() {
  return "rounded-[24px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function tabBase() {
  return "group inline-flex min-h-[42px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap";
}

function tabsConfig() {
  return [
    {
      key: "inbox",
      to: "/app/whatsapp/inbox",
      label: "Inbox",
      roles: ["OWNER", "MANAGER", "CASHIER"],
    },
    {
      key: "drafts",
      to: "/app/whatsapp/drafts",
      label: "Drafts",
      roles: ["OWNER", "MANAGER", "CASHIER"],
    },
    {
      key: "accounts",
      to: "/app/whatsapp/accounts",
      label: "Accounts",
      roles: ["OWNER", "MANAGER"],
    },
    {
      key: "activity",
      to: "/app/whatsapp/activity",
      label: "Activity",
      roles: ["OWNER", "MANAGER"],
    },
    {
      key: "broadcasts",
      to: "/app/whatsapp/broadcasts",
      label: "Broadcasts",
      roles: ["OWNER", "MANAGER"],
    },
  ];
}

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function getRolesFromStorage() {
  if (typeof window === "undefined") return [];

  try {
    const explicitRole = localStorage.getItem("userRole");
    if (explicitRole) return [normalizeRole(explicitRole)].filter(Boolean);
  } catch {}

  try {
    const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
    if (!token) return [];

    const [, payload] = token.split(".");
    if (!payload) return [];

    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    if (json?.role) return [normalizeRole(json.role)].filter(Boolean);
    if (Array.isArray(json?.roles)) return json.roles.map(normalizeRole).filter(Boolean);

    return [];
  } catch {
    return [];
  }
}

function isAllowed(tabRoles, userRoles) {
  return tabRoles.some((role) => userRoles.includes(role));
}

export default function WhatsAppWorkspaceTabs({
  className = "",
  compact = false,
}) {
  const userRoles = getRolesFromStorage();
  const tabs = tabsConfig().filter((tab) => isAllowed(tab.roles, userRoles));

  if (!tabs.length) return null;

  return (
    <section className={cx(surfaceCard(), "overflow-hidden", className)}>
      <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={cx("text-sm font-bold", strongText())}>WhatsApp workspace</div>
            {!compact ? (
              <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                Move quickly between inbox, drafts, channel setup, activity, and campaigns.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              end={tab.to === "/app/whatsapp/inbox" || tab.to === "/app/whatsapp/drafts" || tab.to === "/app/whatsapp/accounts" || tab.to === "/app/whatsapp/activity" || tab.to === "/app/whatsapp/broadcasts"}
              className={({ isActive }) =>
                cx(
                  tabBase(),
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  );
}