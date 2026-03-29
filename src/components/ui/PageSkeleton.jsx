function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Block({ className = "" }) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-[rgb(var(--bg-muted))] animate-pulse",
        className
      )}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
      <Block className="h-3 w-24" />
      <Block className="mt-3 h-8 w-20" />
      <Block className="mt-2 h-3 w-32" />
    </div>
  );
}

function TableCardSkeleton({ rows = 6 }) {
  return (
    <div className="app-card overflow-hidden p-0">
      <div className="border-b border-[rgb(var(--border))] px-5 py-4">
        <Block className="h-4 w-40" />
      </div>

      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4"
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <Block className="h-5 w-44" />
                <Block className="mt-3 h-3 w-56" />
                <Block className="mt-2 h-3 w-36" />
              </div>

              <div className="flex gap-2">
                <Block className="h-10 w-24" />
                <Block className="h-10 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <section className="app-card">
        <Block className="h-3 w-28" />
        <Block className="mt-3 h-9 w-72" />
        <Block className="mt-3 h-4 w-full max-w-[620px]" />

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>

      <section className="app-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Block className="h-6 w-44" />
            <Block className="mt-3 h-4 w-full max-w-[520px]" />
          </div>
          <Block className="h-8 w-24" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5">
            <Block className="h-4 w-28" />
            <Block className="mt-4 h-7 w-40" />
            <Block className="mt-3 h-3 w-48" />
          </div>

          <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5">
            <Block className="h-4 w-32" />
            <Block className="mt-4 h-7 w-32" />
            <Block className="mt-3 h-3 w-44" />
          </div>

          <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5">
            <Block className="h-4 w-24" />
            <Block className="mt-4 h-7 w-28" />
            <Block className="mt-3 h-3 w-40" />
          </div>
        </div>
      </section>

      <section className="app-card">
        <Block className="h-6 w-36" />
        <Block className="mt-3 h-4 w-full max-w-[520px]" />

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>
    </div>
  );
}

export default function PageSkeleton({
  titleWidth = "w-48",
  lines = 3,
  showTable = false,
  rows = 6,
  variant = "default",
}) {
  if (variant === "dashboard") {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="app-card">
        <Block className={cx("h-7", titleWidth)} />

        <div className="mt-4 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Block
              key={i}
              className={cx("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <Block className="h-10 w-28" />
          <Block className="h-10 w-24" />
        </div>
      </div>

      {showTable ? <TableCardSkeleton rows={rows} /> : null}
    </div>
  );
}