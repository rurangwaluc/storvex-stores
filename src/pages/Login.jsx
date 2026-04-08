import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/ui/AuthCard";
import AsyncButton from "../components/ui/AsyncButton";
import Input from "../components/ui/Input";
import PublicLayout from "../components/layout/PublicLayout";
import { ROUTES } from "../constants/routes";
import { loginStoreOwner } from "../services/publicAuthApi";
import { storage } from "../lib/storage";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await loginStoreOwner(form);
      storage.setPlatformToken(result.token);
      navigate(ROUTES.dashboard);
    } catch (error) {
      console.error(error);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Welcome back
            </div>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-[var(--color-text)]">
              Sign in and continue into your store system.
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--color-text-muted)]">
              Premium public flow first. Dashboard shell next. No messy detours.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            title="Sign in"
            subtitle="Access your Storvex Stores workspace with a clean, secure entry flow."
            footer={
              <p className="text-sm text-[var(--color-text-muted)]">
                No account yet?{" "}
                <Link
                  to={ROUTES.register}
                  className="font-semibold text-[var(--color-primary)]"
                >
                  Create one
                </Link>
              </p>
            }
          >
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="you@store.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
              />

              <AsyncButton
                type="submit"
                size="lg"
                loading={loading}
                loadingText="Signing in..."
                className="mt-2"
              >
                Sign in
              </AsyncButton>
            </form>
          </AuthCard>
        </div>
      </section>
    </PublicLayout>
  );
}