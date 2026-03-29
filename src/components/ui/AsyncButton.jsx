import React from "react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        className="opacity-20"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AsyncButton({
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const isDisabled = loading || disabled;

  const base =
    "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

  const primary =
    "bg-stone-950 text-white hover:bg-stone-800 focus:ring-stone-300 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg))] dark:hover:opacity-90 dark:focus:ring-[rgb(var(--border-strong))]";

  const secondary =
    "border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-muted))] focus:ring-[rgb(var(--border-strong))]";

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cx(base, variant === "secondary" ? secondary : primary, className)}
      {...props}
    >
      {loading ? <Spinner /> : null}
      <span>{loading ? "Please wait..." : children}</span>
    </button>
  );
}