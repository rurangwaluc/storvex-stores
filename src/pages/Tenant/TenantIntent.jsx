import { createTenantIntent } from "../../services/tenantIntentApi";
import { useState } from "react";

export default function TenantIntent() {
  const [form, setForm] = useState({
    storeName: "",
    email: "",
    phone: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      await createTenantIntent(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit");
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Request Received</h2>
        <p>We’ve received your request. You’ll be guided to payment shortly.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow"
    >
      <h1 className="text-2xl font-bold mb-4">Start Your Store on Storvex</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <input
        className="input mb-3"
        placeholder="Store name"
        required
        onChange={(e) => setForm({ ...form, storeName: e.target.value })}
      />

      <input
        className="input mb-3"
        placeholder="Email"
        type="email"
        required
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        className="input mb-4"
        placeholder="Phone"
        required
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <button className="btn-primary w-full">Continue</button>
    </form>
  );
}
