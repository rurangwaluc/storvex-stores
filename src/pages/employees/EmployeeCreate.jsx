import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { createEmployee } from "../../services/employeesApi";

const ROLE_OPTIONS = [
  {
    value: "MANAGER",
    label: "Manager",
    short: "Supervises operations",
  },
  {
    value: "CASHIER",
    label: "Cashier",
    short: "Handles checkout and payments",
  },
  {
    value: "SELLER",
    label: "Seller",
    short: "Focuses on selling",
  },
  {
    value: "STOREKEEPER",
    label: "Storekeeper",
    short: "Manages stock flow",
  },
  {
    value: "TECHNICIAN",
    label: "Technician",
    short: "Handles repairs and service",
  },
];

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function strongText() {
  return "text-stone-950 dark:text-[rgb(var(--text))]";
}

function mutedText() {
  return "text-stone-600 dark:text-[rgb(var(--text-muted))]";
}

function softText() {
  return "text-stone-500 dark:text-[rgb(var(--text-soft))]";
}

function fieldLabel() {
  return "text-sm font-medium text-stone-800 dark:text-[rgb(var(--text))]";
}

function sectionEyebrow() {
  return "text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-[rgb(var(--text-soft))]";
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "TM";
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

function passwordStrengthLabel(password) {
  const p = String(password || "");
  if (!p) return { label: "Not set", cls: "badge-neutral" };
  if (p.length < 6) return { label: "Too short", cls: "badge-danger" };
  if (p.length < 8) return { label: "Basic", cls: "badge-warning" };
  if (/[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)) {
    return { label: "Strong", cls: "badge-success" };
  }
  return { label: "Good", cls: "badge-info" };
}

function roleTone(role) {
  const r = String(role || "").toUpperCase();

  if (r === "MANAGER") return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200";
  if (r === "CASHIER") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (r === "SELLER") return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200";
  if (r === "STOREKEEPER") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
  if (r === "TECHNICIAN") return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30 dark:text-fuchsia-200";

  return "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-900/30 dark:text-stone-300";
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.41-.59M9.88 5.09A9.77 9.77 0 0112 4c5.23 0 8.56 3.66 9.62 5.04a1.5 1.5 0 010 1.92 16.13 16.13 0 01-4.04 3.72M6.1 6.1A16.2 16.2 0 002.38 9.04a1.5 1.5 0 000 1.92C3.44 12.34 6.77 16 12 16c1.67 0 3.16-.37 4.49-.95"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.38 10.96a1.5 1.5 0 010-1.92C3.44 7.66 6.77 4 12 4s8.56 3.66 9.62 5.04a1.5 1.5 0 010 1.92C20.56 12.34 17.23 16 12 16S3.44 12.34 2.38 10.96z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 14a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EmployeeCreate({ onSaved, onCancel, canCreate = true }) {
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "CASHIER",
  });

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((r) => r.value === form.role) || ROLE_OPTIONS[1],
    [form.role]
  );

  const passwordState = useMemo(
    () => passwordStrengthLabel(form.password),
    [form.password]
  );

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (saving || !canCreate) return;

    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.role) {
      toast.error("Please fill name, email, password, and role");
      return;
    }

    if (form.password.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await createEmployee({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || "",
        role: form.role,
      });

      toast.success("Team member added");

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "CASHIER",
      });

      setShowPassword(false);
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to add team member");
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <div className={cx(shell(), "p-6")}>
        <div className={cx("text-lg font-semibold", strongText())}>Create access restricted</div>
        <p className={cx("mt-2 text-sm", mutedText())}>
          You do not have permission to create staff accounts.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cx(shell(), "overflow-hidden")}>
      <div className="border-b border-stone-200 px-4 py-4 dark:border-[rgb(var(--border))] sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className={sectionEyebrow()}>New team member</div>
            <h2 className={cx("mt-1 text-2xl font-semibold tracking-tight sm:text-3xl", strongText())}>
              Create a staff account
            </h2>
            <p className={cx("mt-2 max-w-2xl text-sm leading-6", mutedText())}>
              Add a secure employee profile with the right role and a temporary password.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {onCancel ? (
              <button type="button" onClick={onCancel} disabled={saving} className="btn-secondary">
                Close
              </button>
            ) : null}

            <AsyncButton type="submit" loading={saving} className="btn-primary">
              Create member
            </AsyncButton>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-stone-200 p-4 dark:border-[rgb(var(--border))]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]">
                {initialsFromName(form.name)}
              </div>

              <div className="min-w-0">
                <div className={cx("truncate text-sm font-semibold", strongText())}>
                  {form.name.trim() || "New team member"}
                </div>
                <div className={cx("truncate text-xs", mutedText())}>
                  {form.email.trim() || "employee@example.com"}
                </div>
              </div>

              <span
                className={cx(
                  "ml-auto inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                  roleTone(form.role)
                )}
              >
                {selectedRole.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={fieldLabel()}>Full name</label>
              <input
                className="app-input mt-2"
                placeholder="Example: Jules Uwase"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={fieldLabel()}>Email address</label>
              <input
                className="app-input mt-2"
                placeholder="employee@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div>
              <label className={fieldLabel()}>Temporary password</label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="app-input pr-12"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-stone-500 transition hover:text-stone-800 dark:text-[rgb(var(--text-soft))] dark:hover:text-[rgb(var(--text))]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className={passwordState.cls}>{passwordState.label}</span>
              </div>
            </div>

            <div>
              <label className={fieldLabel()}>Phone number</label>
              <input
                className="app-input mt-2"
                placeholder="Optional"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={fieldLabel()}>Role</label>
              <select
                className="app-input mt-2"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <p className={cx("mt-2 text-xs", softText())}>{selectedRole.short}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
            <div className={sectionEyebrow()}>Quick note</div>
            <p className={cx("mt-2 text-sm leading-6", mutedText())}>
              Give only the access needed for the employee’s daily work. Use a temporary password they can change later.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200 px-4 py-4 dark:border-[rgb(var(--border))] sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <button type="button" onClick={onCancel} disabled={saving} className="btn-secondary">
              Cancel
            </button>
          ) : null}

          <AsyncButton type="submit" loading={saving} className="btn-primary">
            Create member
          </AsyncButton>
        </div>
      </div>
    </form>
  );
}