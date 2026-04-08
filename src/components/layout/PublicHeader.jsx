import { Link } from "react-router-dom";
import Button from "../ui/Button";
import LogoMark from "../ui/LogoMark";
import ThemeToggle from "../ui/ThemeToggle";

export default function PublicHeader({ isDark, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/">
          <LogoMark />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <Button as={Link} to="/login" variant="ghost">
            Sign in
          </Button>
          <Button as={Link} to="/signup" className="hidden sm:inline-flex">
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}