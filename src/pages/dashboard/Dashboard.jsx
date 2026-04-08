import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkspaceContext } from "../../services/storeApi";
import { getTenantDashboard } from "../../services/dashboardApi";
import PageSkeleton from "../../components/ui/PageSkeleton";

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

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90";
}

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "badge-success"
      : tone === "warning"
      ? "badge-warning"
      : tone === "danger"
      ? "badge-danger"
      : tone === "info"
      ? "badge-info"
      : "badge-neutral";

  return <span className={cls}>{children}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `Rwf ${n.toLocaleString("en-US")}`;
}

function categoryLabel(value) {
  const map = {
    ELECTRONICS_RETAIL: "Electronics Retail",
    PHONE_SHOP: "Phone Shop",
    LAPTOP_SHOP: "Laptop Shop",
    ACCESSORIES_SHOP: "Accessories Shop",
    REPAIR_SHOP: "Repair Shop",
    MIXED_ELECTRONICS: "Mixed Electronics Store",
  };
  return map[value] || "Not set";
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2M12 6.5v11" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8l-9-5-9 5 9 5 9-5zm-18 3v8l9 5 9-5v-8" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M15 3v5h5" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

function LargeStatCard({ label, value, note, tone = "blue", icon }) {
  const toneStyles = {
    blue: { box: "bg-[#dff1ff] text-[#4aa8ff]" },
    orange: { box: "bg-[#ffe3d4] text-[#ff8b4a]" },
    yellow: { box: "bg-[#fff1c9] text-[#e7bb18]" },
  };

  const style = toneStyles[tone] || toneStyles.blue;

  return (
    <article className={cx(pageCard(), "p-5 sm:p-6")}>
      <div className="flex items-center gap-4 sm:gap-5">
        <div
          className={cx(
            "flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] sm:h-24 sm:w-24 sm:rounded-[22px]",
            style.box
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className={cx("text-[1.75rem] font-black leading-none tracking-tight sm:text-[2rem]", strongText())}>
            {value}
          </div>
          <div className={cx("mt-2 text-[1.15rem] font-semibold leading-none sm:text-[1.3rem]", strongText())}>
            {label}
          </div>
          {note ? <div className={cx("mt-2 text-sm", mutedText())}>{note}</div> : null}
        </div>
      </div>
    </article>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <div className={cx("text-[1.55rem] font-black leading-none sm:text-[1.8rem]", strongText())}>
          {title}
        </div>
        {subtitle ? <div className={cx("mt-2 text-sm", mutedText())}>{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function TinyKpi({ label, value, tone = "neutral" }) {
  const line =
    tone === "success"
      ? "bg-emerald-400"
      : tone === "warning"
      ? "bg-orange-400"
      : tone === "danger"
      ? "bg-yellow-300"
      : tone === "info"
      ? "bg-sky-400"
      : "bg-[var(--color-primary)]";

  return (
    <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4">
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className={cx("h-10 w-1.5 rounded-full", line)} />
        <div className={cx("text-2xl font-black tracking-tight", strongText())}>{value}</div>
      </div>
    </div>
  );
}

function TopSummary({ dashboard }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section>
        <h1 className={cx("text-4xl font-black tracking-tight sm:text-5xl", strongText())}>
          Dashboard
        </h1>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <LargeStatCard
          label="Subscription"
          value={dashboard?.subscriptionSummary?.label || "—"}
          note={dashboard?.subscriptionSummary?.detail || "Commercial access state"}
          tone="blue"
          icon={<CalendarIcon />}
        />
        <LargeStatCard
          label="Today sales"
          value={formatMoney(dashboard?.todaySales)}
          note="Sales made today"
          tone="orange"
          icon={<MoneyIcon />}
        />
        <LargeStatCard
          label="Monthly revenue"
          value={formatMoney(dashboard?.monthlyRevenue)}
          note={`${dashboard?.productCount ?? 0} active products`}
          tone="yellow"
          icon={<BoxIcon />}
        />
      </section>
    </div>
  );
}

function SubscriptionPanel({ subscriptionSummary }) {
  if (!subscriptionSummary) return null;

  return (
    <section className={cx(pageCard(), "p-5 sm:p-6")}>
      <SectionHeader
        title="Subscription"
        subtitle="Commercial access state and renewal pressure."
        right={<Pill tone={subscriptionSummary.tone}>{subscriptionSummary.label}</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4 sm:p-5">
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Plan
          </div>
          <div className={cx("mt-3 text-lg font-black", strongText())}>
            {subscriptionSummary.planKey || "—"}
          </div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            {subscriptionSummary.detail}
          </div>
        </div>

        <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4 sm:p-5">
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Access
          </div>
          <div className={cx("mt-3 text-lg font-black", strongText())}>
            {subscriptionSummary.canOperate ? "Operational" : "Restricted"}
          </div>
          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            {subscriptionSummary.endDate
              ? formatDate(subscriptionSummary.endDate)
              : "Workspace access state"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/app/billing" className={primaryBtn()}>
          Open billing
        </Link>
        <Link to="/renew" className={secondaryBtn()}>
          Recovery page
        </Link>
      </div>
    </section>
  );
}

function StoreIdentityPanel({ tenant, dashboard }) {
  if (!tenant) return null;

  const location = [tenant.district, tenant.sector].filter(Boolean).join(" • ") || "Location not set";

  return (
    <section className={cx(pageCard(), "p-5 sm:p-6")}>
      <SectionHeader
        title="Store identity"
        subtitle="Brand, category, and location completeness."
        right={
          <Link to="/app/settings" className={secondaryBtn()}>
            Open settings
          </Link>
        }
      />

      <div className="space-y-4">
        <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4 sm:p-5">
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Store
          </div>
          <div className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>
            {tenant.name || "—"}
          </div>
          <div className={cx("mt-2 text-sm", mutedText())}>{location}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4 sm:p-5">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              Category
            </div>
            <div className={cx("mt-3 text-lg font-black", strongText())}>
              {categoryLabel(tenant.shopType)}
            </div>
            <div className={cx("mt-2 text-sm", mutedText())}>Business type</div>
          </div>

          <div className="rounded-[20px] bg-[var(--color-surface-2)] p-4 sm:p-5">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
              Branding
            </div>
            <div className={cx("mt-3 text-lg font-black", strongText())}>
              {tenant.logoUrl ? "Configured" : "Missing"}
            </div>
            <div className={cx("mt-2 text-sm", mutedText())}>
              {dashboard?.productCount ?? 0} active products
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReadinessPanel({ workspace, dashboard }) {
  const summary = workspace?.setupChecklistSummary;
  if (!summary) return null;

  const missing = Array.isArray(summary?.summary?.missingRequiredKeys)
    ? summary.summary.missingRequiredKeys
    : [];

  return (
    <section className={cx(pageCard(), "p-5 sm:p-6")}>
      <SectionHeader
        title="Operational readiness"
        subtitle="Setup completion before the store runs at full quality."
        right={
          <Pill tone={summary.isOperationallyReady ? "success" : "warning"}>
            {summary.readinessPercent}% ready
          </Pill>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <TinyKpi
          label="Low stock"
          value={dashboard?.lowStockCount ?? 0}
          tone={(dashboard?.lowStockCount ?? 0) > 0 ? "warning" : "success"}
        />
        <TinyKpi
          label="Out of stock"
          value={dashboard?.outOfStockCount ?? 0}
          tone={(dashboard?.outOfStockCount ?? 0) > 0 ? "danger" : "success"}
        />
        <TinyKpi label="Repairs" value={dashboard?.activeRepairs ?? 0} tone="info" />
      </div>

      {!summary.isOperationallyReady && missing.length ? (
        <div className="mt-5 rounded-[20px] bg-[var(--color-surface-2)] p-4">
          <div className={cx("text-sm font-bold", strongText())}>Still missing</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.map((item) => (
              <span key={item} className="badge-warning">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LowStockPanel({ dashboard }) {
  const items = Array.isArray(dashboard?.lowStockProducts) ? dashboard.lowStockProducts : [];

  return (
    <section className={cx(pageCard(), "p-5 sm:p-6")}>
      <SectionHeader
        title="Low stock products"
        subtitle="Products that need immediate attention."
      />

      {!items.length ? (
        <div className="rounded-[20px] bg-[var(--color-surface-2)] p-5 text-sm text-[var(--color-text-muted)]">
          No low stock alerts right now.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[20px] bg-[var(--color-surface-2)] px-4 py-4"
            >
              <div className="min-w-0">
                <div className={cx("truncate text-sm font-semibold", strongText())}>{item.name}</div>
                <div className={cx("mt-1 text-xs", mutedText())}>
                  {[item.category, item.subcategory, item.subcategoryOther]
                    .filter(Boolean)
                    .join(" • ") || "Uncategorized"}
                </div>
              </div>

              <span className="badge-warning shrink-0">{item.stockQty} left</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AuditPanel({ dashboard }) {
  const items = Array.isArray(dashboard?.recentAudit) ? dashboard.recentAudit : [];

  return (
    <section className={cx(pageCard(), "p-5 sm:p-6")}>
      <SectionHeader title="Recent audit" subtitle="Latest operational activity." />

      {!items.length ? (
        <div className="rounded-[20px] bg-[var(--color-surface-2)] p-5 text-sm text-[var(--color-text-muted)]">
          No recent audit activity.
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-[20px] bg-[var(--color-surface-2)] px-4 py-4"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card)] text-[var(--color-primary)]">
                <AuditIcon />
              </div>

              <div className="min-w-0">
                <div className={cx("text-sm font-semibold", strongText())}>
                  {item.action || "Activity"}
                </div>
                <div className={cx("mt-1 text-xs", mutedText())}>
                  {item.entity || "Record"} • {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ActionPanel({ dashboard }) {
  const actions = [
    { label: "New sale", to: "/app/pos", tone: "primary" },
    { label: "Inventory", to: "/app/inventory", tone: "secondary" },
    { label: "Customers", to: "/app/customers", tone: "secondary" },
    { label: "Documents", to: "/app/documents", tone: "secondary" },
  ];

  return (
    <section className={cx(pageCard(), "p-5 sm:p-6")}>
      <SectionHeader
        title="Quick actions"
        subtitle={`Pending deals: ${dashboard?.pendingDeals ?? 0} • Recent audit items: ${dashboard?.recentAudit?.length ?? 0}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={action.tone === "primary" ? primaryBtn() : secondaryBtn()}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [workspace, setWorkspace] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [workspacePayload, dashboardPayload] = await Promise.all([
          getWorkspaceContext(),
          getTenantDashboard(),
        ]);

        if (!alive) return;

        setWorkspace(workspacePayload || null);
        setDashboard(dashboardPayload || null);
      } catch (err) {
        console.error("dashboard load failed:", err);
        if (!alive) return;
        setWorkspace(null);
        setDashboard(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <TopSummary dashboard={dashboard} />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <SubscriptionPanel subscriptionSummary={dashboard?.subscriptionSummary} />
        <StoreIdentityPanel tenant={dashboard?.tenant} dashboard={dashboard} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ReadinessPanel workspace={workspace} dashboard={dashboard} />
        <LowStockPanel dashboard={dashboard} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ActionPanel dashboard={dashboard} />
        <AuditPanel dashboard={dashboard} />
      </div>
    </div>
  );
}