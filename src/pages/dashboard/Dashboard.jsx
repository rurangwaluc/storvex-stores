import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkspaceContext } from "../../services/storeApi";
import apiClient from "../../services/apiClient";
import PageSkeleton from "../../components/ui/PageSkeleton";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[rgb(var(--text))]";
}

function mutedText() {
  return "text-[rgb(var(--text-muted))]";
}

function softText() {
  return "text-[rgb(var(--text-soft))]";
}

function shell() {
  return "rounded-[32px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-sm";
}

function card() {
  return "rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-sm";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]";
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

function StatCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-rose-500"
      : tone === "info"
      ? "bg-sky-500"
      : "bg-[rgb(var(--text))]";

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-2xl font-semibold tracking-tight", strongText())}>{value}</div>
        {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
      </div>
    </div>
  );
}

function SubscriptionPanel({ me }) {
  if (!me?.subscription) return null;

  const sub = me.subscription;
  const status = String(sub.status || "").toUpperCase();
  const mode = String(sub.accessMode || "").toUpperCase();
  const canOperate = Boolean(sub.canOperate);

  const tone =
    status === "EXPIRED" || canOperate === false
      ? "danger"
      : mode === "READ_ONLY"
      ? "warning"
      : mode === "TRIAL"
      ? "info"
      : "success";

  const label =
    status === "EXPIRED" || canOperate === false
      ? "Expired"
      : mode === "READ_ONLY"
      ? "Read-only"
      : mode === "TRIAL"
      ? "Trial"
      : "Active";

  const detail =
    status === "EXPIRED" || canOperate === false
      ? "Renew to continue operations."
      : mode === "READ_ONLY"
      ? `Grace ends ${formatDate(sub.graceEndDate || sub.endDate)}`
      : mode === "TRIAL"
      ? `${sub.daysLeft ?? 0} day${Number(sub.daysLeft || 0) === 1 ? "" : "s"} left`
      : `Ends ${formatDate(sub.endDate)}`;

  return (
    <div className={cx(card(), "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cx("text-base font-semibold", strongText())}>Subscription</div>
          <div className={cx("mt-1 text-sm", mutedText())}>
            Commercial access state and renewal pressure.
          </div>
        </div>

        <Pill tone={tone}>{label}</Pill>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>Plan</div>
          <div className={cx("mt-2 text-base font-semibold", strongText())}>{sub.planKey || "—"}</div>
          <div className={cx("mt-1 text-sm", mutedText())}>{detail}</div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>Access</div>
          <div className={cx("mt-2 text-base font-semibold", strongText())}>
            {canOperate ? "Operational" : "Read-only only"}
          </div>
          <div className={cx("mt-1 text-sm", mutedText())}>{sub.reason || "—"}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/billing" className={primaryBtn()}>
          Open billing
        </Link>
        <Link to="/renew" className={secondaryBtn()}>
          Recovery page
        </Link>
      </div>
    </div>
  );
}

function StoreIdentityPanel({ me }) {
  const tenant = me?.tenant;
  if (!tenant) return null;

  const location = [tenant.district, tenant.sector].filter(Boolean).join(" • ") || "Location not set";

  return (
    <div className={cx(card(), "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cx("text-base font-semibold", strongText())}>Store identity</div>
          <div className={cx("mt-1 text-sm", mutedText())}>
            Brand, category, and location completeness.
          </div>
        </div>

        <Link to="/app/settings" className={secondaryBtn()}>
          Open settings
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Store" value={tenant.name || "—"} note="Current workspace owner store" tone="neutral" />
        <StatCard label="Category" value={categoryLabel(tenant.shopType)} note={location} tone="info" />
        <StatCard
          label="Branding"
          value={tenant.logoUrl ? "Configured" : "Missing"}
          note="Logo, header, footer"
          tone={tenant.logoUrl ? "success" : "warning"}
        />
      </div>
    </div>
  );
}

function ReadinessPanel({ workspace }) {
  const summary = workspace?.setupChecklistSummary;
  if (!summary) return null;

  const missing = Array.isArray(summary?.summary?.missingRequiredKeys)
    ? summary.summary.missingRequiredKeys
    : [];

  return (
    <div className={cx(card(), "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cx("text-base font-semibold", strongText())}>Operational readiness</div>
          <div className={cx("mt-1 text-sm", mutedText())}>
            Setup completion before the store runs at full quality.
          </div>
        </div>

        <Pill tone={summary.isOperationallyReady ? "success" : "warning"}>
          {summary.readinessPercent}% ready
        </Pill>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatCard
          label="Active staff"
          value={summary?.counts?.activeKnownStoreUsers ?? 0}
          note="Known active store users"
          tone="neutral"
        />
        <StatCard
          label="Products"
          value={summary?.counts?.activeProducts ?? 0}
          note="Active inventory items"
          tone={(summary?.counts?.activeProducts ?? 0) > 0 ? "success" : "warning"}
        />
        <StatCard
          label="Stock units"
          value={summary?.counts?.totalStockUnits ?? 0}
          note="Units currently available"
          tone={(summary?.counts?.totalStockUnits ?? 0) > 0 ? "success" : "warning"}
        />
      </div>

      {!summary.isOperationallyReady && missing.length ? (
        <div className="mt-5 rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <div className={cx("text-sm font-semibold", strongText())}>Still missing</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.map((item) => (
              <span key={item} className="badge-warning">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionPanel() {
  const actions = [
    { label: "New sale", to: "/app/pos", tone: "primary" },
    { label: "Inventory", to: "/app/inventory", tone: "secondary" },
    { label: "Customers", to: "/app/customers", tone: "secondary" },
    { label: "Documents", to: "/app/documents", tone: "secondary" },
  ];

  return (
    <div className={cx(card(), "p-5")}>
      <div className={cx("text-base font-semibold", strongText())}>Quick actions</div>
      <div className={cx("mt-1 text-sm", mutedText())}>
        Jump into the core store flows without hunting through the sidebar.
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  );
}

export default function Dashboard() {
  const [workspace, setWorkspace] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [{ data: workspaceData }, { data: meData }] = await Promise.all([
          getWorkspaceContext(),
          apiClient.get("/auth/me"),
        ]);

        if (!alive) return;
        setWorkspace(workspaceData || null);
        setMe(meData || null);
      } catch (err) {
        console.error("dashboard load failed:", err);
        if (!alive) return;
        setWorkspace(null);
        setMe(null);
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
    <div className="space-y-5">
      <section className={cx(shell(), "relative overflow-hidden p-5 md:p-6")}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 opacity-[0.03] dark:from-white dark:via-white dark:to-white dark:opacity-[0.04]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Operations cockpit
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Dashboard
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              Clear daily control for subscription pressure, store readiness, and the core operating system.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/billing" className={secondaryBtn()}>
              Billing
            </Link>
            <Link to="/app/documents" className={secondaryBtn()}>
              Documents
            </Link>
            <Link to="/app/pos" className={primaryBtn()}>
              Open POS
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SubscriptionPanel me={me} />
        <StoreIdentityPanel me={me} />
      </div>

      <ReadinessPanel workspace={workspace} />
      <ActionPanel />
    </div>
  );
}