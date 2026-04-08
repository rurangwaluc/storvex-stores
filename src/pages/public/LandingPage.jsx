import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import Button from "../../components/ui/Button";

const highlights = [
  {
    title: "Fast onboarding flow",
    text: "From signup to payment to workspace entry, the journey feels structured and premium.",
  },
  {
    title: "Dark and light mode everywhere",
    text: "A proper theme system makes the interface feel serious on desktop, tablet, and mobile.",
  },
  {
    title: "Built for real store operations",
    text: "Inventory, POS, customers, suppliers, documents, billing, and team workflows live under one system.",
  },
];

const steps = [
  "Create account",
  "Verify OTP",
  "Confirm sign-up",
  "Complete owner payment",
  "Enter workspace",
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Modern operating system for stores
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
              Run your store with a world-class experience from the first click.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
              Storvex Stores gives shop owners and teams a premium workspace for
              sales, inventory, customers, suppliers, documents, and daily
              operations — starting with a clean onboarding journey before they
              even reach the app.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/signup" size="lg">
                Start onboarding
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                      Preview
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-[var(--color-text)]">
                      Stores onboarding and workspace
                    </div>
                  </div>

                  <div className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                    UI refresh
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
                      <div className="mt-3 h-7 w-16 rounded-full bg-[var(--color-surface)]" />
                      <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                        {item} #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-extrabold text-[var(--color-text)]">
                      Public journey
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                      Before /app
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {steps.map((step, i) => (
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

                <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                  <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                    Why this order matters
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
                    The first impression is not the dashboard. It is the landing
                    and onboarding flow. So that is where the premium visual
                    system gets locked first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}