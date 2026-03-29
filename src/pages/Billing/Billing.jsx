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

function badgeClass(sub) {
  const status = String(sub?.status || "").toUpperCase();
  const mode = String(sub?.accessMode || "").toUpperCase();
  const canOperate = Boolean(sub?.canOperate);

  if (status === "EXPIRED" || canOperate === false) return "badge-danger";
  if (mode === "READ_ONLY") return "badge-warning";
  if (mode === "TRIAL") return "badge-info";
  return "badge-success";
}

function badgeLabel(sub) {
  const status = String(sub?.status || "").toUpperCase();
  const mode = String(sub?.accessMode || "").toUpperCase();
  const canOperate = Boolean(sub?.canOperate);

  if (status === "EXPIRED" || canOperate === false) return "Expired";
  if (mode === "READ_ONLY") return "Read-only";
  if (mode === "TRIAL") return "Trial";
  return "Active";
}

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.14em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 text-lg font-semibold", strongText())}>{value}</div>
      {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
    </div>
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

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "relative overflow-hidden p-5 md:p-6")}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 opacity-[0.03] dark:from-white dark:via-white dark:to-white dark:opacity-[0.04]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Billing control
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Billing & subscription
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              Monitor access status, choose a renewal plan, and restore or extend operations without leaving the workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={badgeClass(sub)}>{badgeLabel(sub)}</span>
            <Link to="/renew" className="btn-secondary">
              Open recovery page
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatCard label="Store" value={tenantName} note="Current workspace store" />
          <StatCard label="Plan key" value={sub?.planKey || "—"} note="Current subscription plan" />
          <StatCard label="Ends" value={formatDate(sub?.endDate)} note="Subscription end date" />
          <StatCard label="Grace ends" value={formatDate(sub?.graceEndDate)} note="Read-only fallback window" />
        </div>
      </section>

      <section className="app-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="section-title">Renew or extend access</div>
            <div className="section-subtitle mt-1">
              Choose the business size and cycle that fits your store.
            </div>
          </div>

          <AsyncButton
            type="button"
            variant="secondary"
            loading={refreshing}
            onClick={refreshStatus}
          >
            Refresh billing status
          </AsyncButton>
        </div>

        <form onSubmit={startRenewal} className="mt-6 space-y-5">
          <div>
            <div className="text-sm font-medium text-[rgb(var(--text))]">1. Choose business size</div>
            <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              Match the renewal plan family to your current store size.
            </div>

            <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3">
              {grouped.segments.map((segment) => {
                const active = selectedSegment === segment;
                return (
                  <button
                    key={segment}
                    type="button"
                    onClick={() => chooseSegment(segment)}
                    className={cx(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                      active
                        ? "border-stone-950 bg-stone-950 text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg))]"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] hover:bg-[rgb(var(--bg-muted))]"
                    )}
                  >
                    {segmentLabel(segment)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-[rgb(var(--text))]">2. Choose billing cycle</div>
            <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              Pick the duration that matches your commitment.
            </div>

            <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-4">
              {grouped.cycles.map((cycle) => {
                const active = selectedCycle === cycle;
                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => chooseCycle(cycle)}
                    className={cx(
                      "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                      active
                        ? "border-stone-950 bg-stone-950 text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg))]"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] hover:bg-[rgb(var(--bg-muted))]"
                    )}
                  >
                    {cycleLabel(cycle)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Selected plan
            </label>
            <select
              className="app-input"
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

            {selectedPlan ? (
              <div className="mt-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] px-4 py-3 text-sm text-[rgb(var(--text-muted))]">
                You will pay{" "}
                <span className="font-semibold text-[rgb(var(--text))]">
                  {formatMoney(selectedPlan.price, selectedPlan.currency)}
                </span>{" "}
                for{" "}
                <span className="font-semibold text-[rgb(var(--text))]">
                  {selectedPlan.days} days
                </span>
                .
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              MoMo phone
            </label>
            <input
              className="app-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 2507XXXXXXXX"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AsyncButton
              type="submit"
              loading={submitting}
              disabled={!selectedPlan}
              className="w-full"
            >
              Send MoMo request
            </AsyncButton>

            <Link to="/renew" className="btn-secondary flex h-12 items-center justify-center rounded-2xl">
              Open full recovery page
            </Link>
          </div>

          {paymentRef ? (
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm">
              <div className="font-medium text-[rgb(var(--text))]">Payment request created</div>
              <div className="mt-2 text-[rgb(var(--text-muted))]">
                Reference: <span className="font-mono text-[rgb(var(--text))]">{paymentRef}</span>
              </div>
              <div className="mt-3 text-[rgb(var(--text-muted))]">
                Confirm on your phone, then refresh billing status.
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}