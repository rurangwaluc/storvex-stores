import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { createCustomer } from "../../services/customersApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function panel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

export default function CustomerCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    tinNumber: "",
    idNumber: "",
    notes: "",
    whatsappOptIn: false,
  });

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) return toast.error("Customer name is required");
    if (!form.phone.trim()) return toast.error("Phone number is required");

    try {
      setSaving(true);

      await createCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        tinNumber: form.tinNumber.trim() || null,
        idNumber: form.idNumber.trim() || null,
        notes: form.notes.trim() || null,
        whatsappOptIn: Boolean(form.whatsappOptIn),
      });

      toast.success("Customer created");
      navigate("/app/customers");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", mutedText())}>
                CRM
              </div>
              <h1 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
                New Customer
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Add a customer profile for sales tracking, credit follow-up, and WhatsApp workflows.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/app/customers")}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
            >
              Back to Customers
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={cx(panel(), "p-5 sm:p-6")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    className="app-input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Phone <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    className="app-input"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="07x xxx xxxx"
                    required
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Email</label>
                  <input
                    className="app-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Address</label>
                  <input
                    className="app-input"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Kigali, Gasabo..."
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>TIN Number</label>
                  <input
                    className="app-input"
                    value={form.tinNumber}
                    onChange={(e) => setField("tinNumber", e.target.value)}
                    placeholder="TIN / VAT number"
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>ID Number</label>
                  <input
                    className="app-input"
                    value={form.idNumber}
                    onChange={(e) => setField("idNumber", e.target.value)}
                    placeholder="National ID / Passport"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Notes</label>
                  <textarea
                    className="app-textarea w-full"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Internal notes about this customer..."
                  />
                </div>
              </div>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-3">
                <div
                  className={cx(
                    "relative h-6 w-11 rounded-full transition",
                    form.whatsappOptIn
                      ? "bg-[var(--color-primary)]"
                      : "bg-[var(--color-surface)]"
                  )}
                >
                  <div
                    className={cx(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-card)] shadow transition-transform",
                      form.whatsappOptIn ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.whatsappOptIn}
                  onChange={(e) => setField("whatsappOptIn", e.target.checked)}
                />
                <span className={cx("text-sm font-medium", strongText())}>WhatsApp opt-in</span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/app/customers")}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
                disabled={saving}
              >
                Cancel
              </button>

              <AsyncButton
                type="submit"
                loading={saving}
                loadingText="Creating..."
                variant="primary"
              >
                Create Customer
              </AsyncButton>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}