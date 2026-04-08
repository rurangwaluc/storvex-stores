export default function LogoMark({ compact = false }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]">
        <span className="text-lg font-black">S</span>
      </div>

      {!compact ? (
        <div className="leading-tight">
          <div className="text-base font-extrabold text-[var(--color-text)]">
            Storvex
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
            Stores
          </div>
        </div>
      ) : null}
    </div>
  );
}