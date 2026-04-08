import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../services/apiClient";

const CACHE_KEY = "storvex_me_cache_v2";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-[18px] bg-[var(--color-surface-2)]",
        className
      )}
    />
  );
}

function WorkspaceGateSkeleton() {
  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[32px] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[rgba(74,163,255,0.12)] shadow-[var(--shadow-soft)]">
            <div className="relative h-8 w-8">
              <span className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)]/25" />
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-primary)] border-r-[var(--color-primary)]" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-9 w-52 rounded-[16px]" />
            <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="h-3.5 w-20 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-24 rounded-full" />
          </div>

          <div className="rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="h-3.5 w-16 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-20 rounded-full" />
          </div>

          <div className="rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="h-3.5 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-28 rounded-full" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-full" />
          </div>

          <div className="rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-3/4 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionGate({ children }) {
  const nav = useNavigate();
  const loc = useLocation();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");

      if (!token) {
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }

      if (me) setLoading(false);
      else setLoading(true);

      try {
        const { data } = await apiClient.get("/auth/me");
        if (cancelled) return;

        setMe(data);

        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {}

        const sub = data?.subscription;
        if (!sub) {
          nav("/renew", { replace: true });
          return;
        }

        const accessMode = String(sub?.accessMode || "").toUpperCase();
        const status = String(sub?.status || "").toUpperCase();

        if (accessMode === "SUSPENDED") {
          toast.error("Account suspended. Contact support.");
          nav("/renew", { replace: true });
          return;
        }

        if (status === "EXPIRED") {
          if (loc.pathname !== "/renew" && loc.pathname !== "/app/billing") {
            toast("Subscription expired. You are in read-only mode. Renew to continue operations.");
          }
          return;
        }

        if (accessMode === "READ_ONLY") {
          if (loc.pathname !== "/renew" && loc.pathname !== "/app/billing") {
            toast("Subscription is in read-only mode. Renew to restore full access.");
          }
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load workspace status";

        if (!me) toast.error(msg);

        if (err?.response?.status === 401) {
          localStorage.removeItem("tenantToken");
          localStorage.removeItem("token");
          sessionStorage.removeItem(CACHE_KEY);
          nav("/login", { replace: true, state: { from: loc.pathname } });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [nav, loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !me) {
    return <WorkspaceGateSkeleton />;
  }

  return <>{children}</>;
}