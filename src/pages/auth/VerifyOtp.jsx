import { Link } from "react-router-dom";
import ThemeToggle from "../../components/ui/ThemeToggleIcon";

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl justify-end">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center">
        <div className="w-full rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            Verify OTP
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Confirm your verification code</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            This page comes immediately after owner intent creation. It should feel focused and fast.
          </p>

          <div className="mt-8 grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                maxLength={1}
                className="h-16 w-full rounded-2xl border border-slate-200 bg-white text-center text-lg font-semibold outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button className="inline-flex h-14 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold text-white transition hover:bg-sky-700">
              Verify and continue
            </button>
            <button className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              Resend OTP
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            Need to start over?{" "}
            <Link to="/register" className="font-semibold text-sky-600 dark:text-sky-400">
              Back to register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}