import { useNavigate, useSearchParams } from "react-router-dom";

import { useState } from "react";

export default function ConfirmSignup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("http://localhost:5000/api/auth/signup/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Signup failed");
      setLoading(false);
      return;
    }

    navigate("/login", { replace: true });
  }

  if (!token) {
    return <p className="text-red-600">Invalid signup link</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-80"
      >
        <h1 className="text-xl font-bold mb-4">Complete Signup</h1>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          type="password"
          placeholder="Set password"
          className="border p-2 w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="bg-black text-white w-full py-2 rounded"
        >
          {loading ? "Processing..." : "Confirm Account"}
        </button>
      </form>
    </div>
  );
}
