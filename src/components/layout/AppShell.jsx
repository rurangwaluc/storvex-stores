import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import apiClient from "../../services/apiClient";

export default function AppShell({ children }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceLocation, setWorkspaceLocation] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadWorkspaceIdentity() {
      try {
        const res = await apiClient.get("/auth/me");
        const payload = res?.data || null;
        const tenant = payload?.tenant || payload?.user?.tenant || null;

        if (!alive) return;

        setWorkspaceName(tenant?.name || "");
        setWorkspaceLocation([tenant?.district, tenant?.sector].filter(Boolean).join(" • "));
      } catch {
        if (!alive) return;
        setWorkspaceName("");
        setWorkspaceLocation("");
      }
    }

    loadWorkspaceIdentity();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    localStorage.removeItem("tenantToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className={collapsed ? "md:pl-[92px]" : "md:pl-[280px]"}>
        <AppHeader
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onToggleMobileSidebar={() => setMobileOpen(true)}
          collapsed={collapsed}
          workspaceName={workspaceName}
          workspaceLocation={workspaceLocation}
        />

        <main className="px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5">
          {children}
        </main>
      </div>
    </div>
  );
}