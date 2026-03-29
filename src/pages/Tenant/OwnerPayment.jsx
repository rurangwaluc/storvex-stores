import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";
import AuthShell from "../../components/auth/AuthShell";
import AsyncButton from "../../components/ui/AsyncButton";
import AuthPageSkeleton from "../../components/ui/AuthPageSkeleton";

function readOnboardingState() {
  try {
    const raw = localStorage.getItem("storvex_onboarding");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOnboardingPatch(patch) {
  const current = readOnboardingState() || {};
  const next = { ...current, ...patch };

  localStorage.setItem("storvex_onboarding", JSON.stringify(next));
  if (typeof next.intentId === "string") localStorage.setItem("storvex_intentId", next.intentId || "");
  if (typeof next.storeName === "string") localStorage.setItem("storvex_storeName", next.storeName || "");
  if (typeof next.ownerName === "string") localStorage.setItem("storvex_ownerName", next.ownerName || "");
  if (typeof next.phone === "string") localStorage.setItem("storvex_ownerPhone", next.phone || "");
  if (typeof next.planKey === "string") localStorage.setItem("storvex_planKey", next.planKey || "");
  if (typeof next.signupMode === "string") localStorage.setItem("storvex_signupMode", next.signupMode || "");
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("07") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.startsWith("2507") && digits.length === 12) return digits;
  return digits;
}

function formatMoney(n, currency) {
  const x = Number(n);
  const c = currency || "RWF";
  if (!Number.isFinite(x)) return String(n);
  return `${Math.round(x).toLocaleString("en-US")} ${c}`;
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

function getSegmentDescription(segment) {
  if (segment === "SOLO") return "Best for one operator starting small.";
  if (segment === "DUO") return "Good for two active users sharing daily operations.";
  if (segment === "TEAM_3") return "Best for a small but structured retail team.";
  if (segment === "TEAM_4") return "Good for a growing shop with clearer separation of roles.";
  if (segment === "TEAM_5") return "Built for more active operations and broader staff coverage.";
  if (segment === "TEAM_10") return "Best for busier stores with multiple daily operators.";
  return "Choose the plan that matches your current store operations.";
}

function getCycleRecommendation(cycle) {
  if (cycle === "HALF_YEAR") return "Best value for most growing stores.";
  if (cycle === "YEARLY") return "Strong long-term value if you are fully committed.";
  if (cycle === "QUARTERLY") return "A balanced option with lower upfront commitment.";
  return "Lowest upfront commitment to start quickly.";
}

function groupPlans(plans) {
  const standard = [];
  let enterprise = null;

  for (const plan of plans) {
    const segment = inferSegment(plan.label);
    const cycle = inferCycle(plan.label, plan.days);

    const enriched = {
      ...plan,
      segment,
      cycle,
      isEnterprise: segment === "ENTERPRISE",
    };

    if (enriched.isEnterprise) enterprise = enriched;
    else standard.push(enriched);
  }

  const segments = Array.from(new Set(standard.map((p) => p.segment)));
  const cycles = ["MONTHLY", "QUARTERLY", "HALF_YEAR", "YEARLY"].filter((cycle) =>
    standard.some((p) => p.cycle === cycle)
  );

  return { standard, enterprise, segments, cycles };
}

function findRecommendedPlan(plans) {
  if (!plans.length) return null;

  const preferred = plans.find((p) => p.segment === "DUO" && p.cycle === "HALF_YEAR");
  if (preferred) return preferred;

  const fallback = plans.find((p) => p.segment === "DUO" && p.cycle === "QUARTERLY");
  return fallback || plans[0];
}

function cardBase() {
  return "rounded-2xl border transition";
}

function selectCardClass(active) {
  return active
    ? "border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-950/10 dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg))]"
    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--text))] hover:border-[rgb(var(--border-strong))] hover:bg-[rgb(var(--bg-muted))]";
}

function chipClass(active) {
  return active
    ? "border-stone-900 bg-stone-900 text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg))]"
    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--text-muted))] hover:border-[rgb(var(--border-strong))] hover:bg-[rgb(var(--bg-muted))]";
}

function softPanel() {
  return "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4";
}

function labelClass() {
  return "mb-1.5 block text-sm font-medium text-[rgb(var(--text))]";
}

export default function OwnerPayment() {
  const nav = useNavigate();
  const onboarding = useMemo(() => readOnboardingState(), []);

  const intentId = onboarding?.intentId || localStorage.getItem("storvex_intentId") || "";
  const storeName = onboarding?.storeName || localStorage.getItem("storvex_storeName") || "";
  const ownerName = onboarding?.ownerName || localStorage.getItem("storvex_ownerName") || "";
  const ownerPhone = onboarding?.phone || localStorage.getItem("storvex_ownerPhone") || "";
  const emailVerified =
    onboarding?.emailVerified ?? localStorage.getItem("storvex_emailVerified") === "true";
  const phoneVerified =
    onboarding?.phoneVerified ?? localStorage.getItem("storvex_phoneVerified") === "true";

  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState([]);
  const [phone, setPhone] = useState(ownerPhone || "");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState(localStorage.getItem("storvex_planKey") || "");

  useEffect(() => {
    if (!intentId || !storeName) {
      toast.error("Missing setup info. Please start again.");
      nav("/signup", { replace: true });
      return;
    }

    if (!emailVerified || !phoneVerified) {
      toast.error("Verify email and phone first.");
      nav("/verify-otp", { replace: true });
    }
  }, [intentId, storeName, emailVerified, phoneVerified, nav]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoadingPlans(true);
      try {
        const { data } = await apiClient.get("/auth/plans");
        if (cancelled) return;

        const list = Array.isArray(data?.plans) ? data.plans : [];
        if (!list.length) {
          toast.error("No plans available. Contact support.");
          setPlans([]);
          return;
        }

        setPlans(list);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load plans");
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => groupPlans(plans), [plans]);
  const recommendedPlan = useMemo(() => findRecommendedPlan(grouped.standard), [grouped.standard]);

  useEffect(() => {
    if (!grouped.standard.length) return;

    const stored = localStorage.getItem("storvex_planKey");
    const storedPlan = grouped.standard.find((p) => p.key === stored);
    const basePlan = storedPlan || recommendedPlan || grouped.standard[0] || null;
    if (!basePlan) return;

    setSelectedPlanKey(basePlan.key);
    setSelectedSegment(basePlan.segment);
    setSelectedCycle(basePlan.cycle);

    saveOnboardingPatch({
      planKey: basePlan.key,
      signupMode: "PAID",
      enterpriseInterest: false,
    });
  }, [grouped.standard, recommendedPlan]);

  const visiblePlans = useMemo(() => {
    return grouped.standard.filter(
      (p) =>
        (!selectedSegment || p.segment === selectedSegment) &&
        (!selectedCycle || p.cycle === selectedCycle)
    );
  }, [grouped.standard, selectedSegment, selectedCycle]);

  const selectedPlan = useMemo(() => {
    return (
      visiblePlans.find((p) => p.key === selectedPlanKey) ||
      grouped.standard.find((p) => p.key === selectedPlanKey) ||
      visiblePlans[0] ||
      null
    );
  }, [visiblePlans, grouped.standard, selectedPlanKey]);

  useEffect(() => {
    if (!selectedPlan) return;

    saveOnboardingPatch({
      planKey: selectedPlan.key,
      signupMode: "PAID",
      enterpriseInterest: false,
      phone: normalizePhone(phone),
    });
  }, [selectedPlan, phone]);

  function chooseSegment(segment) {
    setSelectedSegment(segment);

    const firstPlan =
      grouped.standard.find((p) => p.segment === segment && p.cycle === selectedCycle) ||
      grouped.standard.find((p) => p.segment === segment && p.cycle === "HALF_YEAR") ||
      grouped.standard.find((p) => p.segment === segment);

    if (firstPlan) {
      setSelectedCycle(firstPlan.cycle);
      setSelectedPlanKey(firstPlan.key);
    }
  }

  function chooseCycle(cycle) {
    setSelectedCycle(cycle);
    const matched =
      grouped.standard.find((p) => p.segment === selectedSegment && p.cycle === cycle) || null;
    if (matched) setSelectedPlanKey(matched.key);
  }

  function choosePlan(plan) {
    setSelectedPlanKey(plan.key);
  }

  async function pay(e) {
    e.preventDefault();

    if (!selectedPlan?.key) {
      toast.error("Select a plan first.");
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      toast.error("Enter a valid MoMo phone number.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/owner-payment", {
        intentId,
        planKey: selectedPlan.key,
        phone: normalizedPhone,
      });

      saveOnboardingPatch({
        planKey: selectedPlan.key,
        signupMode: "PAID",
        enterpriseInterest: false,
        phone: normalizedPhone,
      });

      toast.success("Payment request sent");
      nav("/confirm-signup");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  function requestEnterpriseSetup() {
    if (!grouped.enterprise) {
      toast.error("Enterprise plan is not available.");
      return;
    }

    saveOnboardingPatch({
      planKey: grouped.enterprise.key,
      signupMode: "ENTERPRISE",
      enterpriseInterest: true,
      phone: normalizePhone(phone),
    });

    toast.success("Enterprise interest saved. Enterprise checkout will be connected later.");
  }

  if (loadingPlans) {
    return <AuthPageSkeleton titleWidth="w-64" lines={3} showSide />;
  }

  return (
    <AuthShell
      eyebrow="Paid activation"
      title="Choose your plan with confidence"
      subtitle="Select the business size first, then the billing cycle. Keep the decision simple, clear, and commercial."
      sideTitle="This should feel like serious software"
      sideBody="A store owner paying for Storvex should immediately understand what plan fits the business, what it costs, and what happens next."
      sideItems={[
        {
          title: "Choose by business size",
          body: "Start with the team size that reflects your real operations.",
        },
        {
          title: "Then choose billing cycle",
          body: "Compare only the relevant cycle options instead of scanning a giant pricing wall.",
        },
        {
          title: "Enterprise is separate",
          body: "Custom rollout is kept out of self-serve checkout until the real enterprise payment flow is built.",
        },
      ]}
      footer={
        <div className="text-sm text-[rgb(var(--text-muted))]">
          Prefer the trial path?{" "}
          <Link
            to="/verify-otp"
            className="font-medium text-[rgb(var(--text))] underline-offset-4 hover:underline"
          >
            Go back to verification
          </Link>
        </div>
      }
      compact
    >
      <div className="space-y-5">
        <div className={softPanel()}>
          <div className="text-sm font-medium text-[rgb(var(--text))]">Store</div>
          <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">
            {storeName || "Your store"}
          </div>
          {ownerName ? (
            <div className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              Owner: <span className="font-medium text-[rgb(var(--text))]">{ownerName}</span>
            </div>
          ) : null}
        </div>

        <form onSubmit={pay} className="space-y-5">
          <section className="space-y-3">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--text))]">1. Choose business size</div>
              <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                Pick the package that matches your current team size.
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {grouped.segments.map((segment) => {
                const active = selectedSegment === segment;
                return (
                  <button
                    key={segment}
                    type="button"
                    onClick={() => chooseSegment(segment)}
                    className={`${cardBase()} p-4 text-left ${selectCardClass(active)}`}
                  >
                    <div className="text-sm font-semibold">{segmentLabel(segment)}</div>
                    <div
                      className={`mt-1 text-xs ${
                        active
                          ? "text-white/80 dark:text-[rgb(var(--bg))]/80"
                          : "text-[rgb(var(--text-soft))]"
                      }`}
                    >
                      {getSegmentDescription(segment)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--text))]">2. Choose billing cycle</div>
              <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                Compare only the cycle options for your selected business size.
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {grouped.cycles.map((cycle) => {
                const active = selectedCycle === cycle;
                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => chooseCycle(cycle)}
                    className={`${cardBase()} px-4 py-3 text-sm font-medium ${chipClass(active)}`}
                  >
                    {cycleLabel(cycle)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--text))]">3. Confirm plan</div>
              <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                Review the exact option you are about to activate.
              </div>
            </div>

            <div className="grid gap-3">
              {visiblePlans.map((plan) => {
                const active = selectedPlan?.key === plan.key;
                const recommended = recommendedPlan?.key === plan.key;

                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => choosePlan(plan)}
                    className={`${cardBase()} p-4 text-left ${selectCardClass(active)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{plan.label}</div>
                        <div
                          className={`mt-1 text-xs ${
                            active
                              ? "text-white/80 dark:text-[rgb(var(--bg))]/80"
                              : "text-[rgb(var(--text-soft))]"
                          }`}
                        >
                          {Number(plan.days || 0)} days • {getCycleRecommendation(plan.cycle)}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {recommended ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                              active
                                ? "bg-white/15 text-white dark:text-[rgb(var(--bg))]"
                                : "border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))]"
                            }`}
                          >
                            Recommended
                          </span>
                        ) : null}

                        {active ? <span className="badge-success">Selected</span> : null}
                      </div>
                    </div>

                    <div className="mt-4 text-lg font-semibold">
                      {formatMoney(plan.price, plan.currency)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {grouped.enterprise ? (
            <section className={softPanel()}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--text))]">Enterprise setup</div>
                  <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Enterprise is intentionally separated from self-serve activation until the final custom payment flow is built.
                  </div>
                </div>
                <span className="badge-info">Custom path</span>
              </div>

              <div className="mt-4 text-sm text-[rgb(var(--text-muted))]">
                For now, requesting enterprise setup saves the owner’s enterprise interest and keeps them out of the normal MoMo checkout path.
              </div>

              <div className="mt-4">
                <AsyncButton
                  type="button"
                  variant="secondary"
                  onClick={requestEnterpriseSetup}
                  className="w-full sm:w-auto"
                >
                  Request enterprise setup
                </AsyncButton>
              </div>
            </section>
          ) : null}

          <section className={softPanel()}>
            <div className="text-sm font-medium text-[rgb(var(--text))]">Selected summary</div>

            {selectedPlan ? (
              <>
                <div className="mt-2 text-base font-semibold text-[rgb(var(--text))]">
                  {selectedPlan.label} — {formatMoney(selectedPlan.price, selectedPlan.currency)}
                </div>
                <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                  Access period: {selectedPlan.days} days
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-[rgb(var(--text-muted))]">No plan selected yet.</div>
            )}
          </section>

          <div>
            <label className={labelClass()}>Phone number for MoMo request</label>
            <input
              className="app-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="078xxxxxxx or 25078xxxxxxx"
              required
            />
            <div className="mt-1 text-xs text-[rgb(var(--text-soft))]">
              This phone should be able to receive and approve the payment request now.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AsyncButton type="submit" loading={loading} className="w-full">
              Send payment request
            </AsyncButton>

            <AsyncButton
              type="button"
              variant="secondary"
              onClick={() => nav("/confirm-signup")}
              className="w-full"
            >
              I already paid
            </AsyncButton>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}