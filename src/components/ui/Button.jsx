import { cn } from "../../lib/cn";

const variants = {
  primary:
    "bg-[var(--color-primary)] text-white hover:opacity-95 focus-visible:ring-[var(--color-primary-ring)]",
  secondary:
    "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)] focus-visible:ring-[var(--color-primary-ring)]",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:ring-[var(--color-primary-ring)]",
};

const sizes = {
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export default function Button({
  as: Comp = "button",
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}) {
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}