import { Outlet, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import StoreSidebar from "./StoreSidebar";
import ThemeToggle from "./ThemeToggle";
import { getWorkspaceContext } from "../services/storeApi";

const ME_CACHE_KEY = "storvex_me_cache_v2";

function getStoredCollapsed() {
  try {
    return localStorage.getItem("storvex_sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}

function readCachedMe() {
  try {
    const raw = sessionStorage.getItem(ME_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Banner({ banner }) {
  if (!banner?.visible) return null;

  const toneClass =
    banner.kind === "danger"
      ? "badge-danger"
      : banner.kind === "warning"
      ? "badge-warning"
      : banner.kind === "success"
      ? "badge-success"
      : "badge-info";

  return (
    <div className="app-card mb-4 overflow-hidden sm:mb-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className={toneClass}>{banner.title || "Status"}</div>
          <div className="mt-3 text-sm font-medium text-[rgb(var(--text))] sm:text-[15px]">
            {banner.message}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {banner.daysLeft != null ? (
            <span className="badge-neutral">
              {banner.daysLeft} day{banner.daysLeft === 1 ? "" : "s"} left
            </span>
          ) : null}

          {banner.accessMode ? (
            <span className="badge-neutral">{banner.accessMode}</span>
          ) : null}

          {banner.ctaTo && banner.ctaLabel ? (
            <Link to={banner.ctaTo} className="btn-secondary">
              {banner.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function buildSubscriptionBanner(sub) {
  const mode = String(sub?.accessMode || "").toUpperCase();
  const status = String(sub?.status || "").toUpperCase();
  const canOperate = Boolean(sub?.canOperate);
  const daysLeft = Number.isFinite(Number(sub?.daysLeft)) ? Number(sub.daysLeft) : null;

  const isBlocked = status === "EXPIRED" || canOperate === false;

  if (isBlocked) {
    return {
      visible: true,
      kind: "danger",
      title: "Subscription expired",
      message: "Your account is in read-only mode. Renew to continue operations.",
      accessMode: "READ_ONLY",
      daysLeft: 0,
      ctaTo: "/renew",
      ctaLabel: "Open renewal",
    };
  }

  if (mode === "READ_ONLY") {
    return {
      visible: true,
      kind: "warning",
      title: "Read-only mode",
      message:
        "Your subscription is in grace or restricted mode. You can still view data, but write actions are blocked until renewal.",
      accessMode: "READ_ONLY",
      daysLeft,
      ctaTo: "/app/billing",
      ctaLabel: "Renew now",
    };
  }

  if (mode === "TRIAL") {
    return {
      visible: true,
      kind: "info",
      title: "Trial active",
      message: "Your free trial is active.",
      accessMode: "TRIAL",
      daysLeft,
      ctaTo: "/app/billing",
      ctaLabel: "View billing",
    };
  }

  return null;
}

function WorkspaceSkeleton() {
  return (
    <div className="mb-4 animate-pulse sm:mb-5">
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5 shadow-sm">
        <div className="h-5 w-40 rounded bg-[rgb(var(--bg-muted))]" />
        <div className="mt-3 h-4 w-full max-w-[520px] rounded bg-[rgb(var(--bg-muted))]" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-24 rounded-full bg-[rgb(var(--bg-muted))]" />
          <div className="h-8 w-20 rounded-full bg-[rgb(var(--bg-muted))]" />
        </div>
      </div>
    </div>
  );
}

export default function StoreLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(getStoredCollapsed());
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [cachedMe, setCachedMe] = useState(() => readCachedMe());

  useEffect(() => {
    try {
      localStorage.setItem("storvex_sidebar_collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    let alive = true;

    setWorkspaceLoading(true);

    getWorkspaceContext()
      .then((data) => {
        if (!alive) return;
        setWorkspace(data || null);
      })
      .catch((err) => {
        console.error("workspace context load failed:", err);
        if (!alive) return;
        setWorkspace(null);
      })
      .finally(() => {
        if (alive) setWorkspaceLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function syncMeCache() {
      setCachedMe(readCachedMe());
    }

    syncMeCache();
    window.addEventListener("focus", syncMeCache);

    return () => {
      window.removeEventListener("focus", syncMeCache);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const appTitle = workspace?.tenant?.name || cachedMe?.tenant?.name || "Storvex";

  const subscriptionBanner = useMemo(() => {
    return buildSubscriptionBanner(cachedMe?.subscription || null);
  }, [cachedMe]);

  const primaryBanner = subscriptionBanner || workspace?.trialBanner || null;

  return (
    <div className="app-shell min-h-screen overflow-x-hidden bg-[rgb(var(--bg))]">
      <div className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))]/95 backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--bg-elevated))]/80 lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            className="btn-secondary h-10 w-10 px-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="truncate text-sm font-semibold tracking-wide text-[rgb(var(--text))]">
            {appTitle}
          </div>

          <ThemeToggle />
        </div>
      </div>

      <div className="relative flex min-h-screen">
        <div className="relative hidden shrink-0 lg:block">
          <StoreSidebar
            variant="desktop"
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close menu backdrop"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[88%] max-w-[320px]">
              <StoreSidebar
                variant="mobile"
                collapsed={false}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="hidden items-center justify-end px-6 pt-5 lg:flex">
            <ThemeToggle />
          </div>

          <div className="px-4 pb-6 pt-4 sm:px-6 sm:pb-8 lg:pt-5">
            <div className="mx-auto min-w-0 max-w-7xl">
              {workspaceLoading ? <WorkspaceSkeleton /> : null}
              {!workspaceLoading && primaryBanner ? <Banner banner={primaryBanner} /> : null}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}