import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import Button from "../components/ui/Button";
import { ROUTES } from "../constants/routes";

const highlights = [
  {
    title: "Fast store onboarding",
    text: "Launch your store workspace with a clean, guided setup flow built for speed.",
  },
  {
    title: "Premium dark and light mode",
    text: "Every visible surface is designed to feel consistent, polished, and mobile-ready.",
  },
  {
    title: "Built to scale later",
    text: "This public flow leads cleanly into the protected dashboard shell without rework.",
  },
];

export default function Landing() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Modern operating system for stores
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
              Run your store with a cleaner, faster, premium workflow.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
              Storvex Stores gives you a professional first impression before
              users even reach the dashboard. Clean onboarding. Better theme
              consistency. Better mobile behavior. Better trust.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to={ROUTES.register} size="lg">
                Start setup
              </Button>
              <Button as={Link} to={ROUTES.login} variant="secondary" size="lg">
                Sign in
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]"
                >
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]">
              <div className="rounded-[28px] bg-[var(--color-surface-2)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                      Preview
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-[var(--color-text)]">
                      Stores dashboard experience
                    </div>
                  </div>
                  <div className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                    Coming next
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {["Sales", "Inventory", "Customers"].map((item, index) => (
                    <div
                      key={item}
                      className="rounded-[22px] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary-soft)]" />
                      <div className="mt-4 h-3 w-20 rounded-full bg-[var(--color-surface-3)]" />
                      <div className="mt-3 h-7 w-16 rounded-full bg-[var(--color-surface-2)]" />
                      <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                        {item} #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-extrabold text-[var(--color-text)]">
                      Onboarding flow
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                      Public pages first
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      "Landing",
                      "Register",
                      "Verify OTP",
                      "Confirm sign-up",
                      "Owner payment",
                      "Dashboard",
                    ].map((step, i) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                          {i + 1}
                        </div>
                        <div className="text-sm font-semibold text-[var(--color-text)]">
                          {step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}