import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { createEmployee } from "../../services/employeesApi";

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "Manager", short: "Supervises operations" },
  { value: "CASHIER", label: "Cashier", short: "Handles checkout and payments" },
  { value: "SELLER", label: "Seller", short: "Focuses on selling" },
  { value: "STOREKEEPER", label: "Storekeeper", short: "Manages stock flow" },
  { value: "TECHNICIAN", label: "Technician", short: "Handles repairs and service" },
];

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function sectionBadge(color = "blue") {
  const map = {
    blue: "bg-[#57b5ff] text-[#06263d]",
    orange: "bg-[#ff9f43] text-[#402100]",
    yellow: "bg-[#ffe45e] text-[#4a4300]",
    green: "bg-[#7cfcc6] text-[#0b3b2e]",
    neutral: "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
  };

  return cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", map[color]);
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>
      {subtitle ? <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
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
  if (!p) return { label: "Not set", color: "neutral" };
  if (p.length < 6) return { label: "Too short", color: "orange" };
  if (p.length < 8) return { label: "Basic", color: "yellow" };
  if (/[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)) {
    return { label: "Strong", color: "green" };
  }
  return { label: "Good", color: "blue" };
}

function roleColor(role) {
  const r = String(role || "").toUpperCase();
  if (r === "MANAGER") return "blue";
  if (r === "CASHIER") return "green";
  if (r === "SELLER") return "orange";
  if (r === "STOREKEEPER") return "yellow";
  if (r === "TECHNICIAN") return "green";
  return "neutral";
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

  const passwordState = useMemo(() => passwordStrengthLabel(form.password), [form.password]);

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
      <div className={cx(pageCard(), "p-6")}>
        <div className={cx("text-lg font-semibold", strongText())}>Create access restricted</div>
        <p className={cx("mt-2 text-sm", mutedText())}>
          You do not have permission to create staff accounts.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cx(pageCard(), "overflow-hidden")}>
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="New team member"
              title="Create a staff account"
              subtitle="Add a secure employee profile with the right role and a temporary password."
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onCancel ? (
              <button type="button" onClick={onCancel} disabled={saving} className={secondaryBtn()}>
                Close
              </button>
            ) : null}

            <button type="submit" disabled={saving} className={primaryBtn()}>
              {saving ? "Creating..." : "Create member"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className={cx(softPanel(), "p-4")}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-sm font-bold text-white">
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

            <span className={cx("ml-auto", sectionBadge(roleColor(form.role)))}>{selectedRole.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Full name</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="Example: Jules Uwase"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Email address</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="employee@example.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>

          <div>
            <label className={cx("text-sm font-medium", strongText())}>Temporary password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                className={cx(inputClass(), "pr-12")}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            <div className="mt-2">
              <span className={sectionBadge(passwordState.color)}>{passwordState.label}</span>
            </div>
          </div>

          <div>
            <label className={cx("text-sm font-medium", strongText())}>Phone number</label>
            <input
              className={cx(inputClass(), "mt-2")}
              placeholder="Optional"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Role</label>
            <select
              className={cx(inputClass(), "mt-2")}
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <p className={cx("mt-2 text-xs", mutedText())}>{selectedRole.short}</p>
          </div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Quick note
          </div>
          <p className={cx("mt-2 text-sm leading-6", mutedText())}>
            Give only the access needed for the employee’s daily work. Use a temporary password they can change later.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4 sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <button type="button" onClick={onCancel} disabled={saving} className={secondaryBtn()}>
              Cancel
            </button>
          ) : null}

          <button type="submit" disabled={saving} className={primaryBtn()}>
            {saving ? "Creating..." : "Create member"}
          </button>
        </div>
      </div>
    </form>
  );
}