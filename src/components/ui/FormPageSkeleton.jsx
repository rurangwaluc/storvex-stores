function Block({ className = "" }) {
  return <div className={`rounded-xl bg-stone-200 dark:bg-stone-800 ${className}`} />;
}

export default function FormPageSkeleton({
  titleWidth = "w-40",
  fieldPairs = 5,
  showSideCard = false,
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Block className={`h-7 ${titleWidth}`} />
          <Block className="h-4 w-72 max-w-full" />
        </div>

        <Block className="h-10 w-36" />
      </div>

      <div
        className={`grid grid-cols-1 gap-5 ${
          showSideCard ? "lg:grid-cols-[minmax(0,1fr)_280px]" : ""
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-sm">
          <div className="border-b border-[rgb(var(--border))] px-5 py-4">
            <Block className="h-5 w-40" />
          </div>

          <div className="space-y-6 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Block className="h-4 w-28" />
                <Block className="h-11 w-full" />
              </div>

              {Array.from({ length: fieldPairs }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Block className="h-4 w-24" />
                  <Block className="h-11 w-full" />
                </div>
              ))}

              <div className="space-y-2 md:col-span-2">
                <Block className="h-4 w-36" />
                <Block className="h-20 w-full" />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[rgb(var(--border))] px-5 py-4 sm:flex-row sm:justify-end">
            <Block className="h-10 w-24" />
            <Block className="h-10 w-36" />
          </div>
        </div>

        {showSideCard ? (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5 shadow-sm">
            <div className="space-y-3">
              <Block className="h-5 w-28" />
              <Block className="h-20 w-full" />
              <Block className="h-20 w-full" />
              <Block className="h-10 w-full" />
              <Block className="h-10 w-full" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}