import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient, {
  clearActiveBranchId,
  getActiveBranchId,
  setActiveBranchId,
} from "../services/apiClient";

const CACHE_KEY = "storvex_me_cache_v2";
const ACTIVE_BRANCH_KEY = "storvex_active_branch_id";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeJsonParse(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cleanString(value) {
  const s = String(value || "").trim();
  return s || "";
}

function getToken() {
  return localStorage.getItem("tenantToken") || localStorage.getItem("token") || "";
}

function pickBranchIdFromWorkspace(data) {
  return (
    cleanString(data?.user?.activeBranchId) ||
    cleanString(data?.user?.branchId) ||
    cleanString(data?.branchAccess?.activeBranchId) ||
    cleanString(data?.activeBranch?.id) ||
    cleanString(data?.defaultBranch?.id) ||
    cleanString(data?.mainBranch?.id) ||
    ""
  );
}

function branchExistsInWorkspace(data, branchId) {
  const cleanBranchId = cleanString(branchId);
  if (!cleanBranchId) return false;

  const visibleBranchIds = Array.isArray(data?.branchAccess?.visibleBranchIds)
    ? data.branchAccess.visibleBranchIds
    : Array.isArray(data?.user?.visibleBranchIds)
      ? data.user.visibleBranchIds
      : [];

  const allowedBranchIds = Array.isArray(data?.branchAccess?.allowedBranchIds)
    ? data.branchAccess.allowedBranchIds
    : Array.isArray(data?.user?.allowedBranchIds)
      ? data.user.allowedBranchIds
      : [];

  const branches = Array.isArray(data?.branches) ? data.branches : [];

  return (
    visibleBranchIds.includes(cleanBranchId) ||
    allowedBranchIds.includes(cleanBranchId) ||
    branches.some((branch) => branch?.id === cleanBranchId)
  );
}

function resolveActiveBranchId(data) {
  const storedBranchId = getActiveBranchId();

  if (storedBranchId && branchExistsInWorkspace(data, storedBranchId)) {
    return storedBranchId;
  }

  return pickBranchIdFromWorkspace(data);
}

function persistWorkspace(data) {
  if (!data) return;

  const activeBranchId = resolveActiveBranchId(data);

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}

  if (activeBranchId) {
    setActiveBranchId(activeBranchId);
  } else {
    clearActiveBranchId();
  }

  const tenant = data?.tenant || null;
  const user = data?.user || null;
  const activeBranch = data?.activeBranch || data?.defaultBranch || data?.mainBranch || null;

  try {
    if (tenant?.id) localStorage.setItem("tenantId", tenant.id);
    if (tenant?.name) localStorage.setItem("tenantName", tenant.name);

    if (user?.id) localStorage.setItem("userId", user.id);
    if (user?.name) localStorage.setItem("userName", user.name);
    if (user?.email) localStorage.setItem("userEmail", user.email);
    if (user?.role) localStorage.setItem("userRole", user.role);

    if (activeBranch?.name) localStorage.setItem("activeBranchName", activeBranch.name);
    if (activeBranch?.code) localStorage.setItem("activeBranchCode", activeBranch.code);
    if (activeBranchId) localStorage.setItem(ACTIVE_BRANCH_KEY, activeBranchId);

    const district = cleanString(activeBranch?.district || tenant?.district);
    const sector = cleanString(activeBranch?.sector || tenant?.sector);
    const address = cleanString(activeBranch?.address || tenant?.address);
    const location = [district, sector, address].filter(Boolean).join(" • ");

    if (location) localStorage.setItem("workspaceLocation", location);
  } catch {}
}

function clearWorkspaceStorage() {
  localStorage.removeItem("tenantToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("tenantId");
  localStorage.removeItem("userId");
  localStorage.removeItem("tenantName");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("activeBranchName");
  localStorage.removeItem("activeBranchCode");
  localStorage.removeItem("workspaceLocation");
  localStorage.removeItem(CACHE_KEY);

  sessionStorage.removeItem(CACHE_KEY);

  clearActiveBranchId();
}

function readCachedWorkspace() {
  return (
    safeJsonParse(sessionStorage.getItem(CACHE_KEY)) ||
    safeJsonParse(localStorage.getItem(CACHE_KEY))
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-[18px] bg-[var(--color-surface-2)]",
        className,
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
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[var(--color-primary)] border-t-[var(--color-primary)]" />
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
  const [me, setMe] = useState(() => readCachedWorkspace());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getToken();

      if (!token) {
        clearWorkspaceStorage();
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }

      if (me) setLoading(false);
      else setLoading(true);

      try {
        const { data } = await apiClient.get("/auth/me");

        if (cancelled) return;

        setMe(data);
        persistWorkspace(data);

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
          clearWorkspaceStorage();
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