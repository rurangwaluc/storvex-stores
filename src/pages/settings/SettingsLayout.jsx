import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function sectionBadge(tone = "neutral") {
  if (tone === "blue") {
    return "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold bg-[#4ea8ff] text-[#0b1220]";
  }

  if (tone === "orange") {
    return "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold bg-[#ff9f43] text-[#23160a]";
  }

  if (tone === "yellow") {
    return "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold bg-[#f7df4f] text-[#2a2508]";
  }

  if (tone === "mint") {
    return "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold bg-[#83f7db] text-[#0b2a24]";
  }

  return "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-text-muted)]";
}

const NAV_ITEMS = [
  {
    key: "general",
    label: "General",
    subtitle: "Store profile and document defaults",
    to: "/app/settings",
    tone: "blue",
  },
  {
    key: "members",
    label: "Members",
    subtitle: "Staff accounts and access control",
    to: "/app/settings/members",
    tone: "mint",
  },
  {
    key: "roles",
    label: "User roles",
    subtitle: "Policy matrix and permissions",
    to: "/app/settings/roles",
    tone: "yellow",
  },
  {
    key: "billing",
    label: "Billing & subscription",
    subtitle: "Plan, renewals, and invoices",
    to: "/app/billing",
    tone: "orange",
  },
  {
    key: "security",
    label: "Login & security",
    subtitle: "Authentication and session rules",
    to: "/app/settings/security",
    tone: "yellow",
  },
  {
    key: "audit",
    label: "Audit logs",
    subtitle: "Operational history and review",
    to: "/app/settings/audit",
    tone: "mint",
  },
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

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}

      <h1 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.95rem]", strongText())}>
        {title}
      </h1>

      {subtitle ? (
        <p className={cx("mt-3 max-w-3xl text-sm leading-6", mutedText())}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function NavCard({ item, end = false }) {
  return (
    <NavLink to={item.to} end={end}>
      {({ isActive }) => (
        <div
          className={cx(
            "group min-h-[88px] rounded-[24px] p-3 transition",
            isActive
              ? "bg-[var(--color-surface)] ring-1 ring-[var(--color-primary-ring)] shadow-[var(--shadow-soft)]"
              : "bg-transparent hover:bg-[var(--color-surface)]"
          )}
        >
          <div className="flex h-full items-start gap-3">
            <div
              className={cx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition",
                isActive
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
              )}
            >
              <Icon name={item.key} />
            </div>

            <div className="min-w-0 flex-1">
              <div className={cx("truncate text-sm font-black tracking-tight", strongText())}>
                {item.label}
              </div>
              <div className={cx("mt-1 line-clamp-2 text-xs leading-5", mutedText())}>
                {item.subtitle}
              </div>
            </div>

            <span className={sectionBadge(item.tone)}>{isActive ? "Open" : "Go"}</span>
          </div>
        </div>
      )}
    </NavLink>
  );
}

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = currentKeyFromPath(location.pathname);
  const activeItem = NAV_ITEMS.find((x) => x.key === activeKey) || NAV_ITEMS[0];

  return (
    <div className="space-y-6">
      <section className={cx(pageCard(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <SectionHeading
                eyebrow="Control center"
                title="Settings"
                subtitle="Manage store identity, document branding, staff access, billing, security, and operational controls from one locked premium workspace."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={sectionBadge("blue")}>Store configuration</span>
              <span className={sectionBadge("yellow")}>Operational controls</span>
              <span className={sectionBadge("mint")}>Live system settings</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="hidden lg:block">
            <div className={cx(softPanel(), "p-3")}>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
                {NAV_ITEMS.map((item) => (
                  <NavCard key={item.key} item={item} end={item.key === "general"} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <label className={cx("mb-2 block text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
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

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className={sectionBadge("blue")}>Current section: {activeItem.label}</span>
            <span className={sectionBadge()}>6 sections</span>
          </div>
        </div>
      </section>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}