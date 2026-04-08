import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/ui/AuthCard";
import AsyncButton from "../components/ui/AsyncButton";
import Input from "../components/ui/Input";
import PublicLayout from "../components/layout/PublicLayout";
import { ROUTES } from "../constants/routes";
import { storage } from "../lib/storage";
import { submitOwnerPayment } from "../services/publicAuthApi";

export default function OwnerPayment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    plan: "starter",
    method: "mobile_money",
    reference: "",
  });
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await submitOwnerPayment(form);
      storage.setPlatformToken("placeholder-platform-token");
      navigate(ROUTES.dashboard);
    } catch (error) {
      console.error(error);
      alert("Payment step failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            title="Owner payment"
            subtitle="Complete this payment step to unlock your store workspace."
          >
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input
                label="Plan"
                value={form.plan}
                onChange={(e) => updateField("plan", e.target.value)}
                placeholder="starter"
                required
              />
              <Input
                label="Payment method"
                value={form.method}
                onChange={(e) => updateField("method", e.target.value)}
                placeholder="mobile_money"
                required
              />
              <Input
                label="Reference"
                value={form.reference}
                onChange={(e) => updateField("reference", e.target.value)}
                placeholder="Optional reference"
              />

              <AsyncButton type="submit" size="lg" loading={loading} loadingText="Submitting payment...">
                Pay and enter dashboard
              </AsyncButton>
            </form>
          </AuthCard>
        </div>
      </section>
    </PublicLayout>
  );
}