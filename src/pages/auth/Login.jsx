import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import apiClient from "../../services/apiClient";
import AuthShell from "../../components/auth/AuthShell";
import PasswordField from "../../components/auth/PasswordField";
import AsyncButton from "../../components/ui/AsyncButton";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function clearOnboardingState() {
  localStorage.removeItem("storvex_onboarding");
  localStorage.removeItem("storvex_intentId");
  localStorage.removeItem("storvex_ownerPhone");
  localStorage.removeItem("storvex_ownerEmail");
  localStorage.removeItem("storvex_storeName");
  localStorage.removeItem("storvex_ownerName");
  localStorage.removeItem("storvex_emailVerified");
  localStorage.removeItem("storvex_phoneVerified");
  localStorage.removeItem("storvex_signupMode");
  localStorage.removeItem("storvex_planKey");
}

function persistAuthSession(token) {
  localStorage.setItem("tenantToken", token);
  localStorage.setItem("token", token);

  const decoded = jwtDecode(token);

  localStorage.setItem("userRole", decoded?.role || "");
  localStorage.setItem("tenantId", decoded?.tenantId || "");
  localStorage.setItem("userId", decoded?.userId || decoded?.id || "");

  return decoded;
}

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("demo@shop.rw");
  const [password, setPassword] = useState("Test@12345");
  const [loading, setLoading] = useState(false);

  const trimmedEmail = useMemo(() => normalizeEmail(email), [email]);

  async function submit(e) {
    e.preventDefault();

    if (!trimmedEmail) {
      toast.error("Enter your email");
      return;
    }

    if (!password) {
      toast.error("Enter your password");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", {
        email: trimmedEmail,
        password,
      });

      const token = res?.data?.token;
      if (!token) throw new Error("Missing token");

      persistAuthSession(token);
      clearOnboardingState();

      toast.success("Welcome back");
      nav("/app", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Store access"
      title="Log in to your store"
      subtitle="Use your owner or staff credentials to continue into the workspace."
      sideTitle="Fast, calm, trustworthy access"
      sideBody="The login step should feel clean and predictable. No noise, no friction, just confident entry into the system."
      sideItems={[
        {
          title: "Owner access",
          body: "Open billing, reports, settings, users, and full operational control.",
        },
        {
          title: "Staff access",
          body: "Cashiers, managers, sellers, storekeepers, and technicians only see what their role allows.",
        },
        {
          title: "After login",
          body: "Your session is stored and you are routed directly into the app workspace.",
        },
      ]}
      footer={
        <div className="text-sm text-[var(--color-text-muted)]">
          New store?{" "}
          <Link
            to="/signup"
            className="font-medium text-[var(--color-text)] underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Email
          </label>
          <input
            type="email"
            className="app-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@store.com"
            required
          />
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        <AsyncButton type="submit" loading={loading} loadingText="Logging in..." className="w-full">
          Log in
        </AsyncButton>
      </form>
    </AuthShell>
  );
}