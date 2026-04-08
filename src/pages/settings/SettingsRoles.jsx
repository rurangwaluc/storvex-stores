import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import PageSkeleton from "../../components/ui/PageSkeleton";
import { getMyPermissions, getPermissionPolicy } from "../../services/permissionsApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function sectionBadge(color = "blue") {
  const map = {
    blue: "bg-[#57b5ff] text-[#06263d]",
    orange: "bg-[#ff9f43] text-[#402100]",
    yellow: "bg-[#ffe45e] text-[#4a4300]",
    green: "bg-[#7cfcc6] text-[#0b3b2e]",
    neutral: "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
  };

  return cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", map[color]);
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>
      {subtitle ? <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function CheckIcon({ on }) {
  return on ? (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7cfcc6] text-[#0b3b2e]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  ) : (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
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
      <div className={cx(pageCard(), "p-6")}>
        <div className={cx("text-lg font-semibold", strongText())}>Roles & permissions</div>
        <p className={cx("mt-2 text-sm leading-6", mutedText())}>
          Roles policy is not available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={cx(pageCard(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <SectionHeading
                eyebrow="Roles"
                title="Roles & permissions"
                subtitle="This page is rendered from backend permission policy, which remains the single source of truth."
              />
            </div>

            <Link to="/app/settings/members" className={primaryBtn()}>
              Manage members
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-5 sm:px-6">
          <span className={sectionBadge("green")}>Policy based</span>
          {myRole ? <span className={sectionBadge("blue")}>My role: {myRole}</span> : <span className={sectionBadge("orange")}>Role unknown</span>}
          <span className={sectionBadge("neutral")}>{roleNames.length} roles</span>
        </div>
      </section>

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <div className="max-w-3xl">
          <SectionHeading
            eyebrow="Access matrix"
            title="Live permissions matrix"
            subtitle="A role-by-role permissions matrix coming directly from the backend policy."
          />
        </div>

        <div className="mt-6 space-y-6">
          {matrix.map((section) => (
            <div key={section.group} className="space-y-3">
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                {section.group}
              </div>

              <div className={cx(softPanel(), "overflow-x-auto p-2")}>
                <table className="min-w-[760px] w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Permission
                      </th>
                      {roleNames.map((role) => (
                        <th
                          key={role}
                          className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}
                        >
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {section.rows.map((r) => (
                      <tr key={r.perm} className="border-b border-[var(--color-border)] last:border-b-0">
                        <td className="px-4 py-4">
                          <div className={cx("text-sm font-semibold", strongText())}>{r.label}</div>
                          <div className={cx("mt-1 text-xs font-mono", mutedText())}>{r.perm}</div>
                        </td>

                        {r.availability.map((entry) => (
                          <td key={`${r.perm}-${entry.role}`} className="px-4 py-4">
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

          <div className={cx(softPanel(), "p-4")}>
            <div className={cx("text-sm font-semibold", strongText())}>Implementation note</div>
            <p className={cx("mt-2 text-sm leading-6", mutedText())}>
              Today, permissions are computed from code-based policy. The next upgrade can add tenant-specific overrides and audit history for permission changes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}