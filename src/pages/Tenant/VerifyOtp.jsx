import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";
import AuthShell from "../../components/auth/AuthShell";
import AsyncButton from "../../components/ui/AsyncButton";

function readOnboardingState() {
  try {
    const raw = localStorage.getItem("storvex_onboarding");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOnboardingState(next) {
  localStorage.setItem("storvex_onboarding", JSON.stringify(next));

  localStorage.setItem("storvex_intentId", next.intentId || "");
  localStorage.setItem("storvex_ownerPhone", next.phone || "");
  localStorage.setItem("storvex_ownerEmail", next.email || "");
  localStorage.setItem("storvex_storeName", next.storeName || "");
  localStorage.setItem("storvex_ownerName", next.ownerName || "");
  localStorage.setItem("storvex_emailVerified", String(!!next.emailVerified));
  localStorage.setItem("storvex_phoneVerified", String(!!next.phoneVerified));
}

function StatusPill({ ok, label }) {
  return <span className={ok ? "badge-success" : "badge-neutral"}>{ok ? "Verified" : label}</span>;
}

function StepHint({ title, body }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4">
      <div className="text-sm font-medium text-[rgb(var(--text))]">{title}</div>
      <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">{body}</div>
    </div>
  );
}

export default function VerifyOtp() {
  const nav = useNavigate();

  const onboarding = useMemo(() => readOnboardingState(), []);
  const intentId = onboarding?.intentId || localStorage.getItem("storvex_intentId") || "";
  const storeName = onboarding?.storeName || localStorage.getItem("storvex_storeName") || "";
  const ownerEmail = onboarding?.email || localStorage.getItem("storvex_ownerEmail") || "";
  const ownerPhone = onboarding?.phone || localStorage.getItem("storvex_ownerPhone") || "";

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingPhone, setSendingPhone] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const [emailVerified, setEmailVerified] = useState(
    onboarding?.emailVerified ?? localStorage.getItem("storvex_emailVerified") === "true"
  );
  const [phoneVerified, setPhoneVerified] = useState(
    onboarding?.phoneVerified ?? localStorage.getItem("storvex_phoneVerified") === "true"
  );

  const [devHint, setDevHint] = useState({ email: null, phone: null });

  useEffect(() => {
    if (!intentId || !storeName || !ownerEmail || !ownerPhone) {
      toast.error("Missing setup info. Please start again.");
      nav("/signup", { replace: true });
    }
  }, [intentId, storeName, ownerEmail, ownerPhone, nav]);

  function persistVerifiedFlags(nextEmailVerified, nextPhoneVerified) {
    const nextState = {
      ...(readOnboardingState() || {}),
      intentId,
      storeName,
      email: ownerEmail,
      phone: ownerPhone,
      emailVerified: !!nextEmailVerified,
      phoneVerified: !!nextPhoneVerified,
    };

    setEmailVerified(!!nextEmailVerified);
    setPhoneVerified(!!nextPhoneVerified);
    saveOnboardingState(nextState);
  }

  async function send(channel) {
    try {
      if (channel === "EMAIL") setSendingEmail(true);
      else setSendingPhone(true);

      const { data } = await apiClient.post("/auth/otp/send", { intentId, channel });

      if (typeof data?.emailVerified === "boolean" || typeof data?.phoneVerified === "boolean") {
        persistVerifiedFlags(data?.emailVerified, data?.phoneVerified);
      }

      if (data?.devOtp) {
        setDevHint((curr) => ({
          ...curr,
          [channel === "EMAIL" ? "email" : "phone"]: data.devOtp,
        }));
      }

      toast.success(channel === "EMAIL" ? "Email code sent" : "Phone code sent");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send code");
    } finally {
      if (channel === "EMAIL") setSendingEmail(false);
      else setSendingPhone(false);
    }
  }

  async function verify(channel) {
    const code = channel === "EMAIL" ? emailCode.trim() : phoneCode.trim();

    if (!code) {
      toast.error("Enter the verification code first");
      return;
    }

    try {
      if (channel === "EMAIL") setVerifyingEmail(true);
      else setVerifyingPhone(true);

      const { data } = await apiClient.post("/auth/otp/verify", { intentId, channel, code });

      persistVerifiedFlags(data?.emailVerified, data?.phoneVerified);

      if (channel === "EMAIL") setEmailCode("");
      else setPhoneCode("");

      toast.success(channel === "EMAIL" ? "Email verified" : "Phone verified");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Verification failed");
    } finally {
      if (channel === "EMAIL") setVerifyingEmail(false);
      else setVerifyingPhone(false);
    }
  }

  function startTrial() {
    if (!emailVerified || !phoneVerified) {
      toast.error("Verify both email and phone first");
      return;
    }

    localStorage.setItem("storvex_signupMode", "TRIAL");
    nav("/confirm-signup?mode=TRIAL");
  }

  function goPaid() {
    if (!emailVerified || !phoneVerified) {
      toast.error("Verify both email and phone first");
      return;
    }

    localStorage.setItem("storvex_signupMode", "PAID");
    nav("/owner-payment");
  }

  const canContinue = emailVerified && phoneVerified;

  return (
    <AuthShell
      eyebrow="Verification"
      title="Verify your email and phone"
      subtitle={`Complete verification for ${storeName} before activation.`}
      sideTitle="Verification must feel calm and trustworthy"
      sideBody="This step proves account ownership, protects trials, and makes the next activation step feel legitimate."
      sideItems={[
        {
          title: "Email verification",
          body: "Confirms the owner can receive account and recovery messages.",
        },
        {
          title: "Phone verification",
          body: "Supports trial protection and payment request communication.",
        },
        {
          title: "Next step",
          body: "After both are verified, continue with either free trial or paid activation.",
        },
      ]}
      footer={
        <div className="text-sm text-[rgb(var(--text-muted))]">
          Need to restart?{" "}
          <Link
            to="/signup"
            className="font-medium text-[rgb(var(--text))] underline-offset-4 hover:underline"
          >
            Back to signup
          </Link>
        </div>
      }
      compact
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4">
          <div className="text-sm font-medium text-[rgb(var(--text))]">Store</div>
          <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">
            {storeName || "Your store"}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <StepHint title="Owner email" body={ownerEmail || "—"} />
            <StepHint title="Owner phone" body={ownerPhone || "—"} />
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[rgb(var(--text))]">Email verification</div>
              <div className="mt-1 break-all text-sm text-[rgb(var(--text-muted))]">
                {ownerEmail || "—"}
              </div>
            </div>
            <StatusPill ok={emailVerified} label="Pending" />
          </div>

          {!!devHint.email && !emailVerified ? (
            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] px-3 py-2 text-xs text-[rgb(var(--text-muted))]">
              DEV OTP:{" "}
              <span className="font-mono text-[rgb(var(--text))]">{devHint.email}</span>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="app-input"
              placeholder="Enter email code"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              disabled={emailVerified}
            />
            <AsyncButton
              type="button"
              variant="secondary"
              loading={sendingEmail}
              disabled={emailVerified || verifyingEmail}
              onClick={() => send("EMAIL")}
            >
              {emailVerified ? "Verified" : "Send code"}
            </AsyncButton>
            <AsyncButton
              type="button"
              loading={verifyingEmail}
              disabled={emailVerified || sendingEmail}
              onClick={() => verify("EMAIL")}
            >
              {emailVerified ? "Done" : "Verify"}
            </AsyncButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[rgb(var(--text))]">Phone verification</div>
              <div className="mt-1 break-all text-sm text-[rgb(var(--text-muted))]">
                {ownerPhone || "—"}
              </div>
            </div>
            <StatusPill ok={phoneVerified} label="Pending" />
          </div>

          {!!devHint.phone && !phoneVerified ? (
            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] px-3 py-2 text-xs text-[rgb(var(--text-muted))]">
              DEV OTP:{" "}
              <span className="font-mono text-[rgb(var(--text))]">{devHint.phone}</span>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              className="app-input"
              placeholder="Enter phone code"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              disabled={phoneVerified}
            />
            <AsyncButton
              type="button"
              variant="secondary"
              loading={sendingPhone}
              disabled={phoneVerified || verifyingPhone}
              onClick={() => send("PHONE")}
            >
              {phoneVerified ? "Verified" : "Send code"}
            </AsyncButton>
            <AsyncButton
              type="button"
              loading={verifyingPhone}
              disabled={phoneVerified || sendingPhone}
              onClick={() => verify("PHONE")}
            >
              {phoneVerified ? "Done" : "Verify"}
            </AsyncButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4">
          <div className="text-sm font-medium text-[rgb(var(--text))]">Activation options</div>
          <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Both email and phone must be verified before continuing.
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AsyncButton type="button" disabled={!canContinue} onClick={startTrial} className="w-full">
              Start free trial
            </AsyncButton>
            <AsyncButton
              type="button"
              variant="secondary"
              disabled={!canContinue}
              onClick={goPaid}
              className="w-full"
            >
              Choose paid plan
            </AsyncButton>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}