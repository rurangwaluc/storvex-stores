import { useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

import EmployeeCreate from "./EmployeeCreate";
import EmployeeEdit from "./EmployeeEdit";

import {
  deleteEmployee,
  getEmployees,
  setEmployeeActiveStatus,
} from "../../services/employeesApi";

import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";

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

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function menuBtn() {
  return "inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function menuItemClass(tone = "neutral") {
  return cx(
    "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
    tone === "danger"
      ? "text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.08)]"
      : "text-[var(--color-text)] hover:bg-[var(--color-surface)]"
  );
}

function infoBadge() {
  return "bg-[#57b5ff] text-[#06263d]";
}

function warningBadge() {
  return "bg-[#ff9f43] text-[#402100]";
}

function processBadge() {
  return "bg-[#ffe45e] text-[#4a4300]";
}

function successBadge() {
  return "bg-[#7cfcc6] text-[#0b3b2e]";
}

function neutralBadge() {
  return "bg-[var(--color-surface)] text-[var(--color-text-muted)]";
}

function badgeClass(kind = "neutral") {
  if (kind === "info") return infoBadge();
  if (kind === "warning") return warningBadge();
  if (kind === "process") return processBadge();
  if (kind === "success") return successBadge();
  return neutralBadge();
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

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "danger"
      ? "text-[var(--color-danger)]"
      : strongText();

  const accentClass =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-[var(--color-danger)]"
      : "bg-[var(--color-primary)]";

  return (
    <article className={cx(pageCard(), "relative overflow-hidden p-5 sm:p-6")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accentClass)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-[1.7rem] font-black tracking-tight", toneClass)}>
          {value}
        </div>
        {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
      </div>
    </article>
  );
}

function InfoStat({ label, value, sub }) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>{value || "—"}</div>
      {sub ? <div className={cx("mt-1 text-xs leading-5", mutedText())}>{sub}</div> : null}
    </div>
  );
}

function roleMeta(role) {
  const r = String(role || "").toUpperCase();

  if (r === "OWNER") return { label: "Owner", cls: neutralBadge() };
  if (r === "MANAGER") return { label: "Manager", cls: infoBadge() };
  if (r === "CASHIER") return { label: "Cashier", cls: successBadge() };
  if (r === "SELLER") return { label: "Seller", cls: warningBadge() };
  if (r === "STOREKEEPER") return { label: "Storekeeper", cls: processBadge() };
  if (r === "TECHNICIAN") return { label: "Technician", cls: successBadge() };

  return { label: r || "Unknown", cls: neutralBadge() };
}

function RoleBadge({ role }) {
  const meta = roleMeta(role);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        meta.cls
      )}
    >
      {meta.label}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? successBadge() : warningBadge()
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition",
        active
          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      {children}
    </button>
  );
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "TM";
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

function resolveViewer() {
  const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
  if (!token) return { role: "", isOwner: false };

  try {
    const decoded = jwtDecode(token);
    const role = String(decoded?.role || "").toUpperCase();
    return {
      role,
      isOwner: role === "OWNER" || role === "PLATFORM_ADMIN",
    };
  } catch {
    return { role: "", isOwner: false };
  }
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmTone = "danger",
  loading,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cx(pageCard(), "w-full max-w-md p-6")}>
          <div className="flex items-start gap-4">
            <div
              className={cx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                confirmTone === "danger" ? "bg-[rgba(239,68,68,0.12)] text-[var(--color-danger)]" : infoBadge()
              )}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5m0 4h.01M10.29 3.86l-8 14A1 1 0 003.16 19h17.68a1 1 0 00.87-1.5l-8-14a1 1 0 00-1.74 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <h3 className={cx("text-lg font-black tracking-tight", strongText())}>{title}</h3>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>{message}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} disabled={loading} className={secondaryBtn()}>
              Cancel
            </button>

            <AsyncButton
              loading={loading}
              onClick={onConfirm}
              className={confirmTone === "danger" ? dangerBtn() : primaryBtn()}
            >
              {confirmLabel}
            </AsyncButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className={cx(pageCard(), "px-6 py-12 text-center")}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--color-surface-2)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className={cx("mt-4 text-lg font-black tracking-tight", strongText())}>
        No team members found
      </div>

      <p className={cx("mx-auto mt-3 max-w-md text-sm leading-6", mutedText())}>
        Build a structured staff team with the right roles, clean permissions, and controlled access.
      </p>

      <button type="button" onClick={onAdd} className={cx(primaryBtn(), "mt-5")}>
        Add first member
      </button>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function EmployeesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cx(pageCard(), "p-5")}>
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-3 h-8 w-16" />
            <SkeletonBlock className="mt-3 h-4 w-32" />
          </div>
        ))}
      </div>

      <div className={cx(pageCard(), "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <tr>
                <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>Member</th>
                <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>Role</th>
                <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>Phone</th>
                <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>Status</th>
                <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]", softText())}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <TableSkeleton rows={6} cols={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RowActionsMenu({
  employee,
  inactive,
  rowBusy,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative flex justify-end">
      <button
        type="button"
        className={menuBtn()}
        onClick={() => setOpen((v) => !v)}
        disabled={rowBusy}
        aria-label={`Open actions for ${employee.name}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[220px] rounded-[22px] bg-[var(--color-card)] p-2 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-border)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(employee);
            }}
            className={menuItemClass()}
          >
            <span>Edit member</span>
          </button>

          {inactive ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReactivate(employee);
              }}
              className={menuItemClass()}
            >
              <span>Reactivate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDeactivate(employee);
              }}
              className={menuItemClass()}
            >
              <span>Deactivate</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(employee);
            }}
            className={menuItemClass("danger")}
          >
            <span>Remove member</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function EmployeesList({ embedded = false }) {
  const viewer = useMemo(() => resolveViewer(), []);
  const isOwnerViewer = viewer.isOwner;

  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [busyId, setBusyId] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: null,
    employee: null,
    loading: false,
  });

  async function load({ initial = false } = {}) {
    if (!isOwnerViewer) {
      setLoading(false);
      setRefreshing(false);
      setList([]);
      return;
    }

    try {
      if (initial) setLoading(true);
      else setRefreshing(true);

      const data = await getEmployees();
      const employees = Array.isArray(data) ? data : data?.employees || [];
      setList(employees);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load team members");
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerViewer]);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();

    return list.filter((emp) => {
      const matchesSearch =
        !q ||
        String(emp.name || "").toLowerCase().includes(q) ||
        String(emp.email || "").toLowerCase().includes(q) ||
        String(emp.phone || "").toLowerCase().includes(q) ||
        String(emp.role || "").toLowerCase().includes(q);

      const matchesRole =
        roleFilter === "ALL" ? true : String(emp.role || "").toUpperCase() === roleFilter;

      const active = emp.isActive !== false;
      const matchesStatus =
        statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? active : !active;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [list, search, roleFilter, statusFilter]);

  const activeCount = useMemo(() => list.filter((x) => x.isActive !== false).length, [list]);
  const inactiveCount = useMemo(() => list.filter((x) => x.isActive === false).length, [list]);
  const managersCount = useMemo(
    () => list.filter((x) => String(x.role || "").toUpperCase() === "MANAGER").length,
    [list]
  );
  const cashiersCount = useMemo(
    () => list.filter((x) => String(x.role || "").toUpperCase() === "CASHIER").length,
    [list]
  );

  function openCreate() {
    if (!isOwnerViewer) return;
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(emp) {
    if (!isOwnerViewer) return;

    if (String(emp.role || "").toUpperCase() === "OWNER") {
      toast.error("Cannot modify OWNER account");
      return;
    }

    setEditing(emp);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  function openConfirm(mode, employee) {
    if (!isOwnerViewer) return;

    if (String(employee?.role || "").toUpperCase() === "OWNER") {
      toast.error("Cannot modify OWNER account");
      return;
    }

    setConfirmState({
      open: true,
      mode,
      employee,
      loading: false,
    });
  }

  function closeConfirm() {
    if (confirmState.loading) return;

    setConfirmState({
      open: false,
      mode: null,
      employee: null,
      loading: false,
    });
  }

  async function handleConfirmedAction() {
    const employee = confirmState.employee;
    const mode = confirmState.mode;

    if (!employee || !mode) return;

    setConfirmState((prev) => ({ ...prev, loading: true }));
    setBusyId(employee.id);
    setBusyAction(mode);

    try {
      if (mode === "delete") {
        await deleteEmployee(employee.id);
        toast.success("Member removed");
      } else if (mode === "deactivate") {
        await setEmployeeActiveStatus(employee.id, false);
        toast.success("Member deactivated");
      } else if (mode === "reactivate") {
        await setEmployeeActiveStatus(employee.id, true);
        toast.success("Member reactivated");
      }

      setConfirmState({
        open: false,
        mode: null,
        employee: null,
        loading: false,
      });

      await load();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to update member");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  }

  const confirmTitle =
    confirmState.mode === "delete"
      ? "Remove member"
      : confirmState.mode === "reactivate"
      ? "Reactivate member"
      : "Deactivate member";

  const confirmLabel =
    confirmState.mode === "delete"
      ? "Remove member"
      : confirmState.mode === "reactivate"
      ? "Reactivate"
      : "Deactivate";

  const confirmTone = confirmState.mode === "reactivate" ? "primary" : "danger";

  const confirmMessage = confirmState.employee
    ? confirmState.mode === "delete"
      ? `"${confirmState.employee.name}" will be permanently removed from this tenant.`
      : confirmState.mode === "reactivate"
      ? `"${confirmState.employee.name}" will regain access with the current assigned role.`
      : `"${confirmState.employee.name}" will immediately lose access until reactivated again.`
    : "";

  if (!isOwnerViewer) {
    return (
      <div className={cx(pageCard(), "p-8 text-center")}>
        <div className={cx("text-lg font-black tracking-tight", strongText())}>Access restricted</div>
        <p className={cx("mt-3 text-sm leading-6", mutedText())}>
          Only the store owner can view and manage staff accounts.
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "space-y-6"}>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        confirmTone={confirmTone}
        loading={confirmState.loading}
        onCancel={closeConfirm}
        onConfirm={handleConfirmedAction}
      />

      <section className="space-y-5">
        <div className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <SectionHeading
                  eyebrow="Team"
                  title="Staff access control"
                  subtitle="Create staff accounts, assign the right operational role, and control who can access Storvex from one locked screen."
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => load()}
                  disabled={loading || refreshing}
                  className={secondaryBtn()}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={showForm ? closeForm : openCreate}
                  disabled={loading || refreshing}
                  className={primaryBtn()}
                >
                  {showForm ? "Close form" : "Add member"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              <div className="col-span-full">
                <EmployeesSkeleton />
              </div>
            ) : (
              <>
                <SummaryCard
                  label="Active members"
                  value={activeCount}
                  note="Users who can currently sign in"
                  tone="success"
                />
                <SummaryCard
                  label="Inactive members"
                  value={inactiveCount}
                  note="Accounts currently blocked"
                  tone={inactiveCount > 0 ? "warning" : "neutral"}
                />
                <SummaryCard
                  label="Managers"
                  value={managersCount}
                  note="Operational supervisors"
                  tone="info"
                />
                <SummaryCard
                  label="Cashiers"
                  value={cashiersCount}
                  note="Primary till operators"
                  tone="success"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {showForm ? (
        editing ? (
          <EmployeeEdit
            employee={editing}
            canEdit={isOwnerViewer}
            onSaved={async () => {
              closeForm();
              await load();
            }}
            onCancel={closeForm}
          />
        ) : (
          <EmployeeCreate
            canCreate={isOwnerViewer}
            onSaved={async () => {
              closeForm();
              await load();
            }}
            onCancel={closeForm}
          />
        )
      ) : null}

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <label className={cx("text-sm font-medium", strongText())}>Search</label>
              <input
                className="app-input mt-2"
                placeholder="Search by name, email, phone, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <label className={cx("text-sm font-medium", strongText())}>Role</label>
              <select
                className="app-input mt-2"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All roles</option>
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier</option>
                <option value="SELLER">Seller</option>
                <option value="STOREKEEPER">Storekeeper</option>
                <option value="TECHNICIAN">Technician</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className={cx("text-sm font-medium", strongText())}>Status</label>
              <select
                className="app-input mt-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All members</option>
                <option value="ACTIVE">Active only</option>
                <option value="INACTIVE">Inactive only</option>
              </select>
            </div>
          </div>

          <div className={cx(softPanel(), "p-4")}>
            <div className={cx("text-sm font-semibold", strongText())}>Visible results</div>
            <div className={cx("mt-2 text-2xl font-black tracking-tight", strongText())}>
              {filtered.length}
            </div>
            <div className={cx("mt-1 text-sm leading-6", mutedText())}>
              Matching members ready for action.
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            All
          </FilterChip>
          <FilterChip active={statusFilter === "ACTIVE"} onClick={() => setStatusFilter("ACTIVE")}>
            Active
          </FilterChip>
          <FilterChip active={statusFilter === "INACTIVE"} onClick={() => setStatusFilter("INACTIVE")}>
            Inactive
          </FilterChip>
        </div>
      </section>

      {loading ? (
        <EmployeesSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <>
          <section className="hidden lg:block">
            <div className={cx(pageCard(), "overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    <tr>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
                        Member
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
                        Role
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
                        Phone
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
                        Status
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((u) => {
                      const rowBusy = busyId === u.id;
                      const inactive = u.isActive === false;
                      const isOwnerRow = String(u.role || "").toUpperCase() === "OWNER";
                      const canManageRow = !isOwnerRow;

                      return (
                        <tr
                          key={u.id}
                          className="border-b border-[var(--color-border)] align-top last:border-b-0"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-sm font-black text-[var(--color-text)]">
                                {initialsFromName(u.name)}
                              </div>

                              <div className="min-w-0">
                                <div className={cx("font-bold", strongText())}>{u.name}</div>
                                <div className={cx("mt-1 text-sm", mutedText())}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <RoleBadge role={u.role} />
                          </td>

                          <td className="px-4 py-4">
                            <div className={cx("text-sm font-medium", strongText())}>{u.phone || "—"}</div>
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge active={!inactive} />
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end">
                              {canManageRow ? (
                                <RowActionsMenu
                                  employee={u}
                                  inactive={inactive}
                                  rowBusy={rowBusy}
                                  onEdit={openEdit}
                                  onDeactivate={(emp) => openConfirm("deactivate", emp)}
                                  onReactivate={(emp) => openConfirm("reactivate", emp)}
                                  onDelete={(emp) => openConfirm("delete", emp)}
                                />
                              ) : (
                                <span className={cx("text-xs font-semibold", mutedText())}>
                                  Protected account
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 lg:hidden">
            {filtered.map((u) => {
              const rowBusy = busyId === u.id;
              const inactive = u.isActive === false;
              const isOwnerRow = String(u.role || "").toUpperCase() === "OWNER";
              const canManageRow = !isOwnerRow;

              return (
                <article key={u.id} className={cx(pageCard(), "p-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-sm font-black text-[var(--color-text)]">
                        {initialsFromName(u.name)}
                      </div>

                      <div className="min-w-0">
                        <div className={cx("truncate text-base font-black tracking-tight", strongText())}>
                          {u.name}
                        </div>
                        <div className={cx("mt-1 break-all text-sm", mutedText())}>{u.email}</div>
                      </div>
                    </div>

                    <StatusBadge active={!inactive} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <RoleBadge role={u.role} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <InfoStat label="Phone" value={u.phone || "—"} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className={cx("text-sm font-semibold", strongText())}>Actions</div>

                    {canManageRow ? (
                      <RowActionsMenu
                        employee={u}
                        inactive={inactive}
                        rowBusy={rowBusy}
                        onEdit={openEdit}
                        onDeactivate={(emp) => openConfirm("deactivate", emp)}
                        onReactivate={(emp) => openConfirm("reactivate", emp)}
                        onDelete={(emp) => openConfirm("delete", emp)}
                      />
                    ) : (
                      <span className={cx("text-xs font-semibold", mutedText())}>Protected account</span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}