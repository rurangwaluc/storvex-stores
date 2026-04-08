import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/ui/AuthCard";
import AsyncButton from "../components/ui/AsyncButton";
import Input from "../components/ui/Input";
import PublicLayout from "../components/layout/PublicLayout";
import { ROUTES } from "../constants/routes";
import { registerStoreOwner } from "../services/publicAuthApi";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await registerStoreOwner(form);
      navigate(ROUTES.verifyOtp);
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            title="Create your store account"
            subtitle="Start the setup flow that leads into verification, confirmation, payment, and your dashboard."
            footer={
              <p className="text-sm text-[var(--color-text-muted)]">
                Already have an account?{" "}
                <Link
                  to={ROUTES.login}
                  className="font-semibold text-[var(--color-primary)]"
                >
                  Sign in
                </Link>
              </p>
            }
          >
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input
                label="Business name"
                placeholder="Your store name"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="owner@store.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
              <Input
                label="Phone"
                placeholder="+250..."
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create a secure password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
              />

              <AsyncButton type="submit" size="lg" loading={loading} loadingText="Creating account...">
                Continue
              </AsyncButton>
            </form>
          </AuthCard>
        </div>
      </section>
    </PublicLayout>
  );
}