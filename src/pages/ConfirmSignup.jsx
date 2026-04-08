import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/ui/AuthCard";
import AsyncButton from "../components/ui/AsyncButton";
import PublicLayout from "../components/layout/PublicLayout";
import { ROUTES } from "../constants/routes";
import { confirmStoreSignup } from "../services/publicAuthApi";

export default function ConfirmSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);

    try {
      await confirmStoreSignup();
      navigate(ROUTES.ownerPayment);
    } catch (error) {
      console.error(error);
      alert("Confirmation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            title="Confirm sign-up"
            subtitle="Review and confirm your store registration before moving to payment."
          >
            <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="text-sm leading-7 text-[var(--color-text-muted)]">
                Your details have been captured. The next step is to confirm the signup
                and proceed to the owner payment screen.
              </p>
            </div>

            <div className="mt-5">
              <AsyncButton
                type="button"
                size="lg"
                loading={loading}
                loadingText="Confirming..."
                onClick={handleContinue}
              >
                Confirm and continue
              </AsyncButton>
            </div>
          </AuthCard>
        </div>
      </section>
    </PublicLayout>
  );
}