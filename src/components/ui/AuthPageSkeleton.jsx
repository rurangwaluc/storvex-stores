import React from "react";

function Pulse({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-[rgb(var(--bg-muted))] ${className}`} />;
}

export default function AuthPageSkeleton({
  titleWidth = "w-56",
  lines = 3,
  showSide = true,
}) {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {showSide ? (
          <aside className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] lg:w-[46%] lg:border-b-0 lg:border-r">
            <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <Pulse className="h-8 w-28 rounded-full" />
              <Pulse className="mt-6 h-10 w-72" />
              <Pulse className="mt-4 h-4 w-full max-w-xl" />
              <Pulse className="mt-3 h-4 w-[88%] max-w-lg" />

              <div className="mt-8 grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Pulse className="h-9 w-9 rounded-2xl" />
                      <div className="flex-1">
                        <Pulse className="h-4 w-36" />
                        <Pulse className="mt-3 h-4 w-full" />
                        <Pulse className="mt-2 h-4 w-[85%]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : null}

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <div className="w-full max-w-2xl rounded-[32px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <div className="border-b border-[rgb(var(--border))] px-5 py-5 sm:px-8 sm:py-7">
              <Pulse className="h-3 w-28 rounded-full" />
              <Pulse className={`mt-3 h-10 ${titleWidth}`} />
              <Pulse className="mt-4 h-4 w-[92%]" />
              <Pulse className="mt-2 h-4 w-[80%]" />
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-8 sm:py-7">
              {Array.from({ length: lines }).map((_, i) => (
                <div key={i}>
                  <Pulse className="mb-2 h-4 w-28" />
                  <Pulse className="h-12 w-full" />
                </div>
              ))}

              <Pulse className="mt-2 h-12 w-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}