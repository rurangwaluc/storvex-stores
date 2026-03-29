import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../services/apiClient";

const CACHE_KEY = "storvex_me_cache_v2";

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

        // World-class rule for Storvex:
        // expired/read-only users can still enter the workspace and read data,
        // but backend blocks writes and UI shows renewal CTAs.
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
    return (
      <div className="min-h-screen app-shell flex items-center justify-center px-4">
        <div className="app-card w-full max-w-md">
          <div className="text-lg font-semibold text-[rgb(var(--text))]">Loading workspace…</div>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Checking access and store status.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}