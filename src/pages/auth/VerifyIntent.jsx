import { useState } from "react";
import { apiFetch } from "../../services/apiClient";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function VerifyIntent() {
  const nav = useNavigate();
  const intentId = localStorage.getItem("storvex_intentId");

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(channel) {
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ intentId, channel }),
      });

      toast.success(`${channel} OTP sent`);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    }
  }

  async function verifyOtp(channel, code) {
    try {
      await apiFetch("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ intentId, channel, code }),
      });

      toast.success(`${channel} verified`);
    } catch (err) {
      toast.error(err.message || "Verification failed");
    }
  }

  function goToSignup() {
    nav("/confirm-signup?mode=TRIAL");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Verify Email & Phone for Free Trial
        </h2>

        {/* EMAIL */}
        <div className="mb-4">
          <button
            onClick={() => sendOtp("EMAIL")}
            className="mb-2 text-sm text-emerald-600 underline"
          >
            Send Email OTP
          </button>

          <input
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value)}
            placeholder="Enter Email OTP"
            className="w-full border px-3 py-2 rounded"
          />

          <button
            onClick={() => verifyOtp("EMAIL", emailCode)}
            className="mt-2 bg-emerald-600 text-white px-3 py-1 rounded"
          >
            Verify Email
          </button>
        </div>

        {/* PHONE */}
        <div className="mb-4">
          <button
            onClick={() => sendOtp("PHONE")}
            className="mb-2 text-sm text-emerald-600 underline"
          >
            Send Phone OTP
          </button>

          <input
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value)}
            placeholder="Enter Phone OTP"
            className="w-full border px-3 py-2 rounded"
          />

          <button
            onClick={() => verifyOtp("PHONE", phoneCode)}
            className="mt-2 bg-emerald-600 text-white px-3 py-1 rounded"
          >
            Verify Phone
          </button>
        </div>

        <button
          onClick={goToSignup}
          className="w-full mt-4 bg-black text-white py-2 rounded"
        >
          Continue to Create Password
        </button>
      </div>
    </div>
  );
}