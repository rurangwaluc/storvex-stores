import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import apiClient from "../../services/apiClient";
import AsyncButton from "../../components/ui/AsyncButton";
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

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function infoBadge() {
  return "bg-[#57b5ff] text-[#06263d]";
}

function warningBadge() {
  return "bg-[#ff9f43] text-[#402100]";
}

function processBadge() {
  return "bg-[#ffe45e] text-[#4a4300]";
}

function successBadge() {
  return "bg-[#7cfcc6] text-[#0b3b2e]";
}

function neutralBadge() {
  return "bg-[var(--color-surface)] text-[var(--color-text-muted)]";
}

function formatMoney(n, currency) {
  const x = Number(n);
  const c = currency || "RWF";
  if (!Number.isFinite(x)) return String(n);
  return `${Math.round(x).toLocaleString("en-US")} ${c}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function inferSegment(label = "") {
  const text = String(label).toLowerCase();
  if (text.includes("enterprise")) return "ENTERPRISE";
  if (text.includes("solo")) return "SOLO";
  if (text.includes("duo")) return "DUO";
  if (text.includes("team 3")) return "TEAM_3";
  if (text.includes("team 4")) return "TEAM_4";
  if (text.includes("team 5")) return "TEAM_5";
  if (text.includes("team 10")) return "TEAM_10";
  return "OTHER";
}

function inferCycle(label = "", days = 0) {
  const text = String(label).toLowerCase();
  const d = Number(days || 0);

  if (text.includes("1 year") || text.includes("year") || d >= 360) return "YEARLY";
  if (text.includes("6 months") || text.includes("6 month") || d >= 175) return "HALF_YEAR";
  if (text.includes("3 months") || text.includes("3 month") || d >= 85) return "QUARTERLY";
  return "MONTHLY";
}

function cycleLabel(cycle) {
  if (cycle === "MONTHLY") return "Monthly";
  if (cycle === "QUARTERLY") return "3 Months";
  if (cycle === "HALF_YEAR") return "6 Months";
  if (cycle === "YEARLY") return "1 Year";
  return "Other";
}

function segmentLabel(segment) {
  if (segment === "SOLO") return "Solo";
  if (segment === "DUO") return "Duo";
  if (segment === "TEAM_3") return "Team 3";
  if (segment === "TEAM_4") return "Team 4";
  if (segment === "TEAM_5") return "Team 5";
  if (segment === "TEAM_10") return "Team 10";
  return "Other";
}

function groupPlans(plans) {
  const standard = plans
    .map((p) => ({
      ...p,
      segment: inferSegment(p.label),
      cycle: inferCycle(p.label, p.days),
      isEnterprise: inferSegment(p.label) === "ENTERPRISE",
    }))
    .filter((p) => !p.isEnterprise);

  const segments = Array.from(new Set(standard.map((p) => p.segment)));
  const cycles = ["MONTHLY", "QUARTERLY", "HALF_YEAR", "YEARLY"].filter((cycle) =>
    standard.some((p) => p.cycle === cycle)
  );

  return { standard, segments, cycles };
}

function subscriptionTone(sub) {
  const status = String(sub?.status || "").toUpperCase();
  const mode = String(sub?.accessMode || "").toUpperCase();
  const canOperate = Boolean(sub?.canOperate);

  if (status === "EXPIRED" || canOperate === false) {
    return { label: "Expired", cls: warningBadge() };
  }

  if (mode === "READ_ONLY") {
    return { label: "Read-only", cls: processBadge() };
  }

  if (mode === "TRIAL") {
    return { label: "Trial", cls: infoBadge() };
  }

  return { label: "Active", cls: successBadge() };
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}

      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>

      {subtitle ? (
        <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "danger"
      ? "text-[var(--color-danger)]"
      : strongText();

  const accentClass =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-[var(--color-danger)]"
      : "bg-[var(--color-primary)]";

  return (
    <article className={cx(pageCard(), "relative overflow-hidden p-5 sm:p-6")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accentClass)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-[1.7rem] font-black tracking-tight", toneClass)}>{value}</div>
        {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
      </div>
    </article>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition",
        active
          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      {children}
    </button>
  );
}

function InfoStat({ label, value, sub }) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>{value || "—"}</div>
      {sub ? <div className={cx("mt-1 text-xs leading-5", mutedText())}>{sub}</div> : null}
    </div>
  );
}

function PlanCard({ plan, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.key)}
      className={cx(
        "w-full rounded-[24px] p-4 text-left transition",
        active
          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black tracking-tight">{plan.label}</div>
          <div className={cx("mt-1 text-xs leading-5", active ? "text-white/80" : mutedText())}>
            {segmentLabel(plan.segment)} • {cycleLabel(plan.cycle)}
          </div>
        </div>

        <div
          className={cx(
            "rounded-full px-3 py-1 text-[11px] font-semibold",
            active ? "bg-white/16 text-white" : infoBadge()
          )}
        >
          {plan.days} days
        </div>
      </div>

      <div className="mt-4 text-lg font-black tracking-tight">
        {formatMoney(plan.price, plan.currency)}
      </div>
    </button>
  );
}

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [me, setMe] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [phone, setPhone] = useState(localStorage.getItem("storvex_ownerPhone") || "");
  const [paymentRef, setPaymentRef] = useState("");

  const grouped = useMemo(() => groupPlans(plans), [plans]);

  const visiblePlans = useMemo(() => {
    return grouped.standard.filter(
      (p) =>
        (!selectedSegment || p.segment === selectedSegment) &&
        (!selectedCycle || p.cycle === selectedCycle)
    );
  }, [grouped.standard, selectedSegment, selectedCycle]);

  const selectedPlan = useMemo(
    () =>
      visiblePlans.find((p) => p.key === planKey) ||
      grouped.standard.find((p) => p.key === planKey) ||
      visiblePlans[0] ||
      null,
    [visiblePlans, grouped.standard, planKey]
  );

  async function load() {
    setLoading(true);
    try {
      const [{ data: meData }, { data: planData }] = await Promise.all([
        apiClient.get("/auth/me"),
        apiClient.get("/auth/plans"),
      ]);

      setMe(meData || null);

      if (!phone && meData?.tenant?.phone) {
        setPhone(meData.tenant.phone);
      }

      const list = Array.isArray(planData?.plans) ? planData.plans : [];
      const filtered = list.filter((p) => inferSegment(p.label) !== "ENTERPRISE");
      setPlans(filtered);

      if (filtered.length) {
        const currentPlanKey = meData?.subscription?.nextPlanKey || meData?.subscription?.planKey;
        const matched = filtered.find((p) => p.key === currentPlanKey) || filtered[0];

        setSelectedSegment(inferSegment(matched.label));
        setSelectedCycle(inferCycle(matched.label, matched.days));
        setPlanKey(matched.key);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function chooseSegment(segment) {
    setSelectedSegment(segment);

    const firstPlan =
      grouped.standard.find((p) => p.segment === segment && p.cycle === selectedCycle) ||
      grouped.standard.find((p) => p.segment === segment && p.cycle === "HALF_YEAR") ||
      grouped.standard.find((p) => p.segment === segment);

    if (firstPlan) {
      setSelectedCycle(firstPlan.cycle);
      setPlanKey(firstPlan.key);
    }
  }

  function chooseCycle(cycle) {
    setSelectedCycle(cycle);

    const match =
      grouped.standard.find((p) => p.segment === selectedSegment && p.cycle === cycle) || null;

    if (match) setPlanKey(match.key);
  }

  async function startRenewal(e) {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error("Select a plan.");
      return;
    }

    const p = String(phone || "").trim();
    if (!p) {
      toast.error("Enter MoMo phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/billing/renew", {
        planKey: selectedPlan.key,
        phone: p,
      });

      setPaymentRef(data?.paymentReference || "");
      localStorage.setItem("storvex_ownerPhone", p);
      toast.success("MoMo request sent. Confirm on your phone.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Renewal request failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshStatus() {
    setRefreshing(true);
    try {
      const { data } = await apiClient.get("/auth/me");
      setMe(data || null);

      const sub = data?.subscription;
      const mode = String(sub?.accessMode || "").toUpperCase();
      const status = String(sub?.status || "").toUpperCase();
      const canOperate = Boolean(sub?.canOperate);

      if (mode === "ACTIVE" && canOperate && status !== "EXPIRED") {
        toast.success("Billing status refreshed.");
        return;
      }

      if (status === "EXPIRED" || canOperate === false) {
        toast("Still expired/read-only. If you already paid, wait a moment and refresh again.");
        return;
      }

      if (mode === "READ_ONLY") {
        toast("Still read-only. If you already paid, wait a moment and refresh again.");
        return;
      }

      toast("Billing status refreshed.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to refresh billing");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return <PageSkeleton titleWidth="w-40" lines={3} variant="default" />;
  }

  const sub = me?.subscription || null;
  const tenantName = me?.tenant?.name || "Your store";
  const subMeta = subscriptionTone(sub);

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <SectionHeading
                  eyebrow="Billing control"
                  title="Billing & subscription"
                  subtitle="Monitor access status, choose a renewal plan, and restore or extend operations from one locked screen."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", subMeta.cls)}>
                  {subMeta.label}
                </span>

                <Link to="/renew" className={secondaryBtn()}>
                  Open recovery page
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Store" value={tenantName} note="Current workspace store" />
            <SummaryCard label="Plan key" value={sub?.planKey || "—"} note="Current subscription plan" />
            <SummaryCard label="Ends" value={formatDate(sub?.endDate)} note="Subscription end date" />
            <SummaryCard label="Grace ends" value={formatDate(sub?.graceEndDate)} note="Read-only fallback window" tone="warning" />
          </div>
        </div>
      </section>

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="Renewal"
              title="Renew or extend access"
              subtitle="Choose the business size and cycle that fit your current store setup."
            />
          </div>

          <AsyncButton
            type="button"
            loading={refreshing}
            onClick={refreshStatus}
            className={secondaryBtn()}
          >
            Refresh billing status
          </AsyncButton>
        </div>

        <form onSubmit={startRenewal} className="mt-6 space-y-6">
          <div>
            <div className={cx("text-sm font-medium", strongText())}>1. Choose business size</div>
            <div className={cx("mt-1 text-sm leading-6", mutedText())}>
              Match the renewal family to your current store team size.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {grouped.segments.map((segment) => (
                <FilterChip
                  key={segment}
                  active={selectedSegment === segment}
                  onClick={() => chooseSegment(segment)}
                >
                  {segmentLabel(segment)}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <div className={cx("text-sm font-medium", strongText())}>2. Choose billing cycle</div>
            <div className={cx("mt-1 text-sm leading-6", mutedText())}>
              Pick the duration that matches your commitment.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {grouped.cycles.map((cycle) => (
                <FilterChip
                  key={cycle}
                  active={selectedCycle === cycle}
                  onClick={() => chooseCycle(cycle)}
                >
                  {cycleLabel(cycle)}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                active={plan.key === selectedPlan?.key}
                onSelect={setPlanKey}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <label className={cx("text-sm font-medium", strongText())}>Selected plan</label>
                <select
                  className="app-input mt-2"
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                  disabled={!visiblePlans.length}
                >
                  {visiblePlans.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label} — {formatMoney(p.price, p.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-5">
                <label className={cx("text-sm font-medium", strongText())}>MoMo phone</label>
                <input
                  className="app-input mt-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX or 2507XXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-sm font-semibold", strongText())}>Selected summary</div>
              {selectedPlan ? (
                <>
                  <div className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>
                    {formatMoney(selectedPlan.price, selectedPlan.currency)}
                  </div>
                  <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                    {selectedPlan.label}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoStat label="Cycle" value={cycleLabel(selectedPlan.cycle)} />
                    <InfoStat label="Duration" value={`${selectedPlan.days} days`} />
                  </div>
                </>
              ) : (
                <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                  No matching plan available for the current filters.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AsyncButton
              type="submit"
              loading={submitting}
              disabled={!selectedPlan}
              className={primaryBtn()}
            >
              Send MoMo request
            </AsyncButton>

            <Link to="/renew" className={secondaryBtn()}>
              Open full recovery page
            </Link>
          </div>

          {paymentRef ? (
            <div className="rounded-[24px] bg-[var(--color-surface-2)] p-4">
              <div className={cx("text-sm font-bold", strongText())}>Payment request created</div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Reference: <span className={strongText()}>{paymentRef}</span>
              </div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Confirm on your phone, then refresh billing status.
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}