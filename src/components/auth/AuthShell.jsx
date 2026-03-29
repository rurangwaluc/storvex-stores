import React from "react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  sideTitle,
  sideBody,
  sideItems = [],
  footer = null,
  children,
  compact = false,
}) {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="relative overflow-hidden border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] lg:w-[46%] lg:border-b-0 lg:border-r">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-stone-950/8 via-transparent to-transparent dark:from-white/5" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-stone-950/6 blur-3xl dark:bg-white/5" />
            <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-stone-950/6 blur-3xl dark:bg-white/5" />
          </div>

          <div className="relative flex h-full flex-col justify-between px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-soft))] shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Storvex
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                {sideTitle || "Premium store operations"}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[rgb(var(--text-muted))] sm:text-[15px]">
                {sideBody ||
                  "Calm, professional onboarding that makes the system feel valuable before the owner even enters the dashboard."}
              </p>

              {sideItems?.length ? (
                <div className="mt-8 grid gap-4">
                  {sideItems.map((item, index) => (
                    <div
                      key={`${item?.title || "item"}-${index}`}
                      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg))]">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[rgb(var(--text))]">
                            {item?.title}
                          </div>
                          <div className="mt-1 text-sm leading-6 text-[rgb(var(--text-muted))]">
                            {item?.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-10 hidden text-xs text-[rgb(var(--text-soft))] lg:block">
              Built for real stores, real staff, and real accountability.
            </div>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <div
            className={cx(
              "w-full rounded-[32px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-[0_20px_80px_rgba(15,23,42,0.08)]",
              compact ? "max-w-2xl" : "max-w-3xl"
            )}
          >
            <div className="border-b border-[rgb(var(--border))] px-5 py-5 sm:px-8 sm:py-7">
              {eyebrow ? (
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-soft))]">
                  {eyebrow}
                </div>
              ) : null}

              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>

              {subtitle ? (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--text-muted))] sm:text-[15px]">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="px-5 py-5 sm:px-8 sm:py-7">{children}</div>

            {footer ? (
              <div className="border-t border-[rgb(var(--border))] px-5 py-4 sm:px-8">
                {footer}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}