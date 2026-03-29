import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import PageSkeleton from "../../components/ui/PageSkeleton";
import { getMyPermissions, getPermissionPolicy } from "../../services/permissionsApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function CheckIcon({ on }) {
  return on ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-stone-400 border border-stone-200 dark:border-stone-700 dark:bg-stone-900/30 dark:text-stone-500">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "danger"
      ? "badge-danger"
      : tone === "success"
      ? "badge-success"
      : tone === "info"
      ? "badge-info"
      : "badge-neutral";

  return <span className={cls}>{children}</span>;
}

function prettyPermission(p) {
  const s = String(p || "").replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function groupForPermission(p) {
  if (p.startsWith("SETTINGS_")) return "Settings";
  if (p.startsWith("MEMBERS_")) return "Members";
  if (p.startsWith("AUDIT_")) return "Audit";
  if (p.startsWith("BILLING_")) return "Billing";
  if (p.startsWith("SECURITY_")) return "Security";
  return "Other";
}

export default function SettingsRoles() {
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(null);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    document.title = "User roles • Storvex";
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [me, pol] = await Promise.all([getMyPermissions(), getPermissionPolicy()]);
      setMyRole(me?.role || null);
      setPolicy(pol?.roles || null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load roles policy");
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const [me, pol] = await Promise.all([getMyPermissions(), getPermissionPolicy()]);
        if (!alive) return;
        setMyRole(me?.role || null);
        setPolicy(pol?.roles || null);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        toast.error(e?.message || "Failed to load roles policy");
        setPolicy(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const roleNames = useMemo(() => {
    if (!policy) return [];
    return Object.keys(policy);
  }, [policy]);

  const matrix = useMemo(() => {
    if (!policy) return [];

    const allPerms = new Set();
    Object.values(policy).forEach((arr) => (arr || []).forEach((p) => allPerms.add(p)));

    const perms = Array.from(allPerms).sort((a, b) => a.localeCompare(b));
    const groups = new Map();

    for (const p of perms) {
      const g = groupForPermission(p);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(p);
    }

    return Array.from(groups.entries()).map(([group, rows]) => ({
      group,
      rows: rows.map((perm) => ({
        perm,
        label: prettyPermission(perm),
        availability: roleNames.map((role) => ({
          role,
          on: (policy[role] || []).includes(perm),
        })),
      })),
    }));
  }, [policy, roleNames]);

  if (loading) {
    return <PageSkeleton titleWidth="w-56" lines={2} showTable={true} />;
  }

  if (!policy) {
    return (
      <div className="app-card">
        <div className="text-lg font-semibold text-[rgb(var(--text))]">Roles & permissions</div>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Roles policy is not available. Check backend route{" "}
          <span className="font-mono">/auth/permissions/policy</span>.
        </p>
        <button type="button" onClick={load} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="app-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-[rgb(var(--text))]">Roles & permissions</div>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              This page is rendered from backend permission policy, which remains the single source of truth.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Pill tone="success">Policy based</Pill>
              {myRole ? <Pill tone="info">My role: {myRole}</Pill> : <Pill tone="danger">Role unknown</Pill>}
              <Pill>{roleNames.length} roles</Pill>
            </div>
          </div>

          <Link to="/app/settings/members" className="btn-primary">
            Manage members
          </Link>
        </div>
      </section>

      <section className="app-card overflow-hidden p-0">
        <div className="border-b border-[rgb(var(--border))] px-5 py-5">
          <div className="text-base font-semibold text-[rgb(var(--text))]">Access matrix</div>
          <div className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            A live role-by-role permission matrix from the backend.
          </div>
        </div>

        <div className="space-y-6 p-5">
          {matrix.map((section) => (
            <div key={section.group} className="space-y-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">
                {section.group}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--border))]">
                <table className="min-w-[760px] w-full">
                  <thead className="bg-[rgb(var(--bg-muted))]">
                    <tr className="border-b border-[rgb(var(--border))]">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">
                        Permission
                      </th>
                      {roleNames.map((role) => (
                        <th
                          key={role}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]"
                        >
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {section.rows.map((r) => (
                      <tr key={r.perm} className="border-b border-[rgb(var(--border))] last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-[rgb(var(--text))]">{r.label}</div>
                          <div className="mt-0.5 text-xs font-mono text-[rgb(var(--text-soft))]">{r.perm}</div>
                        </td>

                        {r.availability.map((entry) => (
                          <td key={`${r.perm}-${entry.role}`} className="px-4 py-3">
                            <CheckIcon on={entry.on} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4">
            <div className="text-sm font-medium text-[rgb(var(--text))]">Implementation note</div>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              Today, permissions are computed from code-based policy. The next upgrade can add tenant-specific overrides and audit history for permission changes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}