import Button from "./Button";
import { cn } from "../../lib/cn";

export default function AsyncButton({
  loading = false,
  loadingText = "Please wait...",
  children,
  disabled,
  className,
  variant = "primary",
  size = "md",
  ...props
}) {
  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn("relative", className)}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2 transition",
          loading ? "opacity-100" : "opacity-100",
        )}
      >
        {loading ? (
          <>
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            <span>{loadingText}</span>
          </>
        ) : (
          children
        )}
      </span>
    </Button>
  );
}