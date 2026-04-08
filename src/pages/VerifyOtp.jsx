import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/ui/AuthCard";
import AsyncButton from "../components/ui/AsyncButton";
import Input from "../components/ui/Input";
import PublicLayout from "../components/layout/PublicLayout";
import { ROUTES } from "../constants/routes";
import { verifyStoreOtp } from "../services/publicAuthApi";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await verifyStoreOtp({ otp });
      navigate(ROUTES.confirmSignup);
    } catch (error) {
      console.error(error);
      alert("OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            title="Verify OTP"
            subtitle="Enter the one-time code sent to your email or phone to continue your setup."
          >
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input
                label="Verification code"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <AsyncButton type="submit" size="lg" loading={loading} loadingText="Verifying...">
                Verify and continue
              </AsyncButton>
            </form>
          </AuthCard>
        </div>
      </section>
    </PublicLayout>
  );
}