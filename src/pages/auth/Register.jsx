import { Link } from "react-router-dom";
import ThemeToggle from "../../components/ui/ThemeToggleIcon";

export default function RegisterPage() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl justify-end">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            Owner onboarding
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Create your store account</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            This screen should lead into OTP verification and payment, not stop at a weak fake signup.
          </p>

          <form className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Business name
              </label>
              <input className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Owner first name
              </label>
              <input className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Owner last name
              </label>
              <input className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input type="email" className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Phone
              </label>
              <input type="tel" className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>

            <button
              type="submit"
              className="sm:col-span-2 inline-flex h-14 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Continue to OTP verification
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-sky-600 dark:text-sky-400">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden rounded-[36px] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
          <h2 className="text-2xl font-semibold">Signup journey</h2>
          <div className="mt-8 space-y-4">
            {[
              "Register store owner intent",
              "Verify email and phone OTP",
              "Choose plan and complete owner payment",
              "Confirm signup and enter the stores app",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="pt-2 text-sm text-slate-700 dark:text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}