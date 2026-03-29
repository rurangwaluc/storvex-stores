import { useTheme } from "../theme/ThemeProvider";

function IconSun() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.657 5.657l1.414 1.414M4.929 4.929l1.414 1.414m11.314-1.414l-1.414 1.414M6.343 17.657l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 14.2A8.5 8.5 0 119.8 3 6.8 6.8 0 0021 14.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        className="btn-secondary h-10 w-10 px-0"
        aria-label="Toggle theme"
        title={`Current theme: ${resolvedTheme}`}
      >
        {resolvedTheme === "dark" ? <IconSun /> : <IconMoon />}
      </button>

      <select
        className="app-input h-10 w-[116px] pr-8"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        aria-label="Theme mode"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}