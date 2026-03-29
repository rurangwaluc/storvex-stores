import { useEffect, useMemo, useState } from "react";
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

function shell() {
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function strongText() {
  return "text-stone-950 dark:text-[rgb(var(--text))]";
}

function mutedText() {
  return "text-stone-600 dark:text-[rgb(var(--text-muted))]";
}

function softText() {
  return "text-stone-500 dark:text-[rgb(var(--text-soft))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";
}

function subtleBtn() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-red-300 bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60 dark:border-red-900 dark:bg-red-700 dark:hover:bg-red-600";
}

function roleMeta(role) {
  const r = String(role || "").toUpperCase();

  if (r === "OWNER") {
    return {
      label: "Owner",
      className:
        "border-stone-300 bg-stone-100 text-stone-800 dark:border-stone-700 dark:bg-stone-900/30 dark:text-stone-200",
    };
  }

  if (r === "MANAGER") {
    return {
      label: "Manager",
      className:
        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
    };
  }

  if (r === "CASHIER") {
    return {
      label: "Cashier",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
    };
  }

  if (r === "SELLER") {
    return {
      label: "Seller",
      className:
        "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200",
    };
  }

  if (r === "STOREKEEPER") {
    return {
      label: "Storekeeper",
      className:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
    };
  }

  if (r === "TECHNICIAN") {
    return {
      label: "Technician",
      className:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30 dark:text-fuchsia-200",
    };
  }

  return {
    label: r || "Unknown",
    className:
      "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-900/30 dark:text-stone-300",
  };
}

function RoleBadge({ role }) {
  const meta = roleMeta(role);

  return (
<span
  className={cx(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border",
    "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-[rgb(var(--border))]",
    meta.className
  )}
>
  {meta.label}
</span>


  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="badge-success">Active</span>
  ) : (
    <span className="badge-danger">Inactive</span>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "success"
      ? "bg-emerald-500"
      : "bg-stone-900 dark:bg-[rgb(var(--text))]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
        {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
      </div>
    </div>
  );
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

  const confirmClass = confirmTone === "danger" ? dangerBtn() : primaryBtn();

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  background:
                    confirmTone === "danger"
                      ? "rgb(var(--danger-bg))"
                      : "rgb(var(--info-bg))",
                  color:
                    confirmTone === "danger"
                      ? "rgb(var(--danger-text))"
                      : "rgb(var(--info-text))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                <h3 className={cx("text-lg font-semibold", strongText())}>{title}</h3>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>{message}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={secondaryBtn()}
              >
                Cancel
              </button>

              <AsyncButton loading={loading} onClick={onConfirm} className={confirmClass}>
                {confirmLabel}
              </AsyncButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className={cx(shell(), "px-6 py-12 text-center")}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className={cx("mt-4 text-lg font-semibold", strongText())}>No team members found</div>
      <p className={cx("mx-auto mt-2 max-w-md text-sm leading-6", mutedText())}>
        Build a structured staff team with the right roles, clean permissions, and controlled
        access.
      </p>

      <button type="button" onClick={onAdd} className={cx(primaryBtn(), "mt-5")}>
        Add first member
      </button>
    </div>
  );
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
      <div className={cx(shell(), "p-8 text-center")}>
        <div className={cx("text-lg font-semibold", strongText())}>Access restricted</div>
        <p className={cx("mt-2 text-sm", mutedText())}>
          Only the store owner can view and manage staff accounts.
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-5" : "space-y-5"}>
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

      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Team
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Staff access control
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Create staff accounts, assign the right operational role, and control who can
                access Storvex.
              </p>
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cx(shell(), "p-4 animate-pulse")}>
                    <div className="h-3 w-24 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
                    <div className="mt-3 h-8 w-16 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
                    <div className="mt-2 h-3 w-32 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
                  </div>
                ))}
              </div>
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
              />
              <SummaryCard
                label="Cashiers"
                value={cashiersCount}
                note="Primary till operators"
              />
            </>
          )}
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

      <section className={cx(shell(), "p-4")}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <label className={cx("text-sm font-medium", strongText())}>Search</label>
            <input
              className="app-input"
              placeholder="Search by name, email, phone, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <label className={cx("text-sm font-medium", strongText())}>Role</label>
            <select
              className="app-input"
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
              className="app-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All members</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <section className={shell()}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                <tr>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>Member</th>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>Role</th>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>Phone</th>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>Status</th>
                  <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <TableSkeleton rows={6} cols={5} />
              </tbody>
            </table>
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <>
          <section className="hidden lg:block">
            <div className={shell()}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                    <tr>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Member
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Role
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Phone
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Status
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
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

                      console.log("employee row", {
                        id: u.id,
                        name: u.name,
                        role: u.role,
                        isOwnerRow,
                      });

                      return (
                        <tr
                          key={u.id}
                          className="border-b border-stone-200 align-top last:border-b-0 dark:border-[rgb(var(--border))]"
                        >
                          <td className="px-4 py-4">
                            <div className={cx("font-semibold", strongText())}>{u.name}</div>
                            <div className={cx("mt-1 text-sm", mutedText())}>{u.email}</div>
                          </td>

                          <td className="px-4 py-4">
                            <RoleBadge role={u.role} />
                          </td>

                          <td className="px-4 py-4">
                            <div className={cx("text-sm", strongText())}>{u.phone || "—"}</div>
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge active={!inactive} />
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              {canManageRow ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEdit(u)}
                                    disabled={rowBusy}
                                    className={subtleBtn()}
                                  >
                                    Edit
                                  </button>

                                  {inactive ? (
                                    <AsyncButton
                                      loading={rowBusy && busyAction === "reactivate"}
                                      onClick={() => openConfirm("reactivate", u)}
                                      className={primaryBtn()}
                                    >
                                      Reactivate
                                    </AsyncButton>
                                  ) : (
                                    <AsyncButton
                                      loading={rowBusy && busyAction === "deactivate"}
                                      onClick={() => openConfirm("deactivate", u)}
                                      variant="secondary"
                                      className={subtleBtn()}
                                    >
                                      Deactivate
                                    </AsyncButton>
                                  )}

                                  <AsyncButton
                                    loading={rowBusy && busyAction === "delete"}
                                    onClick={() => openConfirm("delete", u)}
                                    className={dangerBtn()}
                                  >
                                    Remove
                                  </AsyncButton>
                                </>
                              ) : (
                                <span className={cx("text-xs font-medium", mutedText())}>
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
                <div key={u.id} className={cx(shell(), "p-4")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={cx("truncate text-base font-semibold", strongText())}>
                        {u.name}
                      </div>
                      <div className={cx("mt-1 text-sm break-all", mutedText())}>{u.email}</div>
                    </div>
                    <StatusBadge active={!inactive} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <RoleBadge role={u.role} />
                  </div>

                  <div className="mt-4">
                    <div className={softText()}>Phone</div>
                    <div className={cx("mt-1 text-sm", strongText())}>{u.phone || "—"}</div>
                  </div>

                  {canManageRow ? (
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        disabled={rowBusy}
                        className={secondaryBtn()}
                      >
                        Edit member
                      </button>

                      {inactive ? (
                        <AsyncButton
                          loading={rowBusy && busyAction === "reactivate"}
                          onClick={() => openConfirm("reactivate", u)}
                          className={primaryBtn()}
                        >
                          Reactivate
                        </AsyncButton>
                      ) : (
                        <AsyncButton
                          loading={rowBusy && busyAction === "deactivate"}
                          onClick={() => openConfirm("deactivate", u)}
                          variant="secondary"
                          className={secondaryBtn()}
                        >
                          Deactivate
                        </AsyncButton>
                      )}

                      <AsyncButton
                        loading={rowBusy && busyAction === "delete"}
                        onClick={() => openConfirm("delete", u)}
                        className={dangerBtn()}
                      >
                        Remove member
                      </AsyncButton>
                    </div>
                  ) : (
                    <div className={cx("mt-4 text-sm font-medium", mutedText())}>
                      Protected account
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}