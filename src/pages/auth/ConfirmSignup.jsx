import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";
import AuthShell from "../../components/auth/AuthShell";
import PasswordField from "../../components/auth/PasswordField";
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
  if (typeof next.email === "string") localStorage.setItem("storvex_ownerEmail", next.email || "");
  if (typeof next.phone === "string") localStorage.setItem("storvex_ownerPhone", next.phone || "");
  if (typeof next.planKey === "string") localStorage.setItem("storvex_planKey", next.planKey || "");
  if (typeof next.signupMode === "string") localStorage.setItem("storvex_signupMode", next.signupMode || "");
  if (typeof next.emailVerified === "boolean") {
    localStorage.setItem("storvex_emailVerified", String(next.emailVerified));
  }
  if (typeof next.phoneVerified === "boolean") {
    localStorage.setItem("storvex_phoneVerified", String(next.phoneVerified));
  }
}

function clearOnboardingState() {
  localStorage.removeItem("storvex_onboarding");
  localStorage.removeItem("storvex_intentId");
  localStorage.removeItem("storvex_ownerPhone");
  localStorage.removeItem("storvex_ownerEmail");
  localStorage.removeItem("storvex_storeName");
  localStorage.removeItem("storvex_ownerName");
  localStorage.removeItem("storvex_shopType");
  localStorage.removeItem("storvex_district");
  localStorage.removeItem("storvex_sector");
  localStorage.removeItem("storvex_address");
  localStorage.removeItem("storvex_emailVerified");
  localStorage.removeItem("storvex_phoneVerified");
  localStorage.removeItem("storvex_signupMode");
  localStorage.removeItem("storvex_planKey");
}

function formatMoney(n, currency) {
  const x = Number(n);
  const c = currency || "RWF";
  if (!Number.isFinite(x)) return String(n);
  return `${Math.round(x).toLocaleString("en-US")} ${c}`;
}

function normalizeMode(raw) {
  const v = String(raw || "").trim().toUpperCase();
  if (v === "TRIAL") return "TRIAL";
  if (v === "PAID") return "PAID";
  if (v === "ENTERPRISE") return "ENTERPRISE";
  return "";
}

function getBackRoute(mode) {
  if (mode === "TRIAL") return "/verify-otp";
  if (mode === "PAID") return "/owner-payment";
  if (mode === "ENTERPRISE") return "/owner-payment";
  return "/signup";
}

export default function ConfirmSignup() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const onboarding = useMemo(() => readOnboardingState(), []);
  const intentId = onboarding?.intentId || localStorage.getItem("storvex_intentId") || "";
  const storeName = onboarding?.storeName || localStorage.getItem("storvex_storeName") || "";
  const ownerName = onboarding?.ownerName || localStorage.getItem("storvex_ownerName") || "";
  const planKeyStored = onboarding?.planKey || localStorage.getItem("storvex_planKey") || "";
  const emailVerified =
    onboarding?.emailVerified ?? localStorage.getItem("storvex_emailVerified") === "true";
  const phoneVerified =
    onboarding?.phoneVerified ?? localStorage.getItem("storvex_phoneVerified") === "true";
  const enterpriseInterest = Boolean(onboarding?.enterpriseInterest);

  const queryMode = normalizeMode(searchParams.get("mode"));
  const storedMode = normalizeMode(onboarding?.signupMode || localStorage.getItem("storvex_signupMode"));
  const resolvedMode = queryMode || storedMode || "PAID";

  const [storeNameState, setStoreNameState] = useState(storeName || "");
  const [plans, setPlans] = useState([]);
  const [trialDays, setTrialDays] = useState(30);

  const paidPlan = useMemo(
    () => plans.find((p) => p.key === planKeyStored) || null,
    [plans, planKeyStored]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStoreNameState(storeName || "");

    if (!intentId || !storeName) {
      toast.error("Missing setup info. Please start again.");
      nav("/signup", { replace: true });
      return;
    }

    if (!emailVerified || !phoneVerified) {
      toast.error("Verify email and phone first.");
      nav("/verify-otp", { replace: true });
      return;
    }

    if (resolvedMode === "ENTERPRISE" || enterpriseInterest) {
      toast.error("Enterprise setup is not completed through self-serve signup yet.");
      nav("/owner-payment", { replace: true });
    }
  }, [
    intentId,
    storeName,
    emailVerified,
    phoneVerified,
    resolvedMode,
    enterpriseInterest,
    nav,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoadingPlans(true);
      try {
        const { data } = await apiClient.get("/auth/plans");
        if (cancelled) return;

        setPlans(Array.isArray(data?.plans) ? data.plans : []);
        setTrialDays(Number(data?.trialDays || 30));
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

  useEffect(() => {
    saveOnboardingPatch({
      signupMode: resolvedMode,
    });
  }, [resolvedMode]);

  const hasConfirm = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

  function validate() {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    if (resolvedMode === "PAID" && !planKeyStored) {
      toast.error("Missing plan selection. Please choose a paid plan first.");
      nav("/owner-payment", { replace: true });
      return false;
    }

    if (resolvedMode === "ENTERPRISE" || enterpriseInterest) {
      toast.error("Enterprise self-serve signup is not enabled yet.");
      nav("/owner-payment", { replace: true });
      return false;
    }

    return true;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        intentId: String(intentId || "").trim(),
        password,
        mode: resolvedMode,
      };

      if (resolvedMode === "PAID") {
        payload.planKey = planKeyStored;
      }

      const { data } = await apiClient.post("/auth/confirm-signup", payload);
      const token = data?.token;

      if (token) {
        localStorage.setItem("tenantToken", token);
        localStorage.setItem("token", token);
      }

      clearOnboardingState();

      toast.success(resolvedMode === "TRIAL" ? "Trial started" : "Store activated");
      nav("/app", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to finish signup");
    } finally {
      setLoading(false);
    }
  }

  const eyebrow =
    resolvedMode === "TRIAL"
      ? "Start trial"
      : resolvedMode === "PAID"
      ? "Finish activation"
      : "Complete setup";

  const title =
    resolvedMode === "TRIAL"
      ? "Create your password and start trial"
      : "Create your password";

  const subtitle =
    resolvedMode === "TRIAL"
      ? `Your store will start with ${trialDays} days of full access.`
      : "Finish account setup after plan selection or payment.";

  const sideItems = [
    {
      title: "Trial mode",
      body: `Full access for ${trialDays} days with no payment needed first.`,
    },
    {
      title: "Paid mode",
      body: paidPlan
        ? `Selected plan: ${paidPlan.label} — ${formatMoney(paidPlan.price, paidPlan.currency)}`
        : "Use paid activation after plan selection.",
    },
  ];

  if (loadingPlans) {
    return <AuthPageSkeleton titleWidth="w-64" lines={3} showSide />;
  }

  return (
    <AuthShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      sideTitle="Final step before opening the store"
      sideBody="After this, the owner can log in, complete setup, load products, and begin daily operations."
      sideItems={sideItems}
      footer={
        <div className="text-sm text-[var(--color-text-muted)]">
          Need to go back?{" "}
          <Link
            to={getBackRoute(resolvedMode)}
            className="font-medium text-[var(--color-text)] underline-offset-4 hover:underline"
          >
            Return to previous step
          </Link>
        </div>
      }
    >
      <div className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        <div className="text-sm font-medium text-[var(--color-text)]">Store</div>
        <div className="mt-1 text-lg font-semibold text-[var(--color-text)]">
          {storeNameState || "Your store"}
        </div>

        {ownerName ? (
          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            Owner: <span className="font-medium text-[var(--color-text)]">{ownerName}</span>
          </div>
        ) : null}

        <div className="mt-2 text-sm text-[var(--color-text-muted)]">
          {resolvedMode === "TRIAL"
            ? `Free trial: ${trialDays} days`
            : paidPlan
            ? `${paidPlan.label} — ${formatMoney(paidPlan.price, paidPlan.currency)}`
            : "Paid activation"}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <PasswordField
          id="signup-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Create a strong password"
          helperText="Use at least 6 characters."
        />

        <PasswordField
          id="signup-confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={hasConfirm && !passwordsMatch ? "Passwords do not match." : ""}
        />

        <AsyncButton
          type="submit"
          loading={loading}
          loadingText={resolvedMode === "TRIAL" ? "Starting trial..." : "Finishing setup..."}
          className="w-full"
          disabled={loadingPlans}
        >
          {resolvedMode === "TRIAL" ? "Start trial and open store" : "Finish setup"}
        </AsyncButton>
      </form>
    </AuthShell>
  );
}