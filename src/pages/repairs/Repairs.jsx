// src/pages/repairs/Repairs.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  archiveRepair,
  assignTechnician,
  deleteRepair,
  getRepairTechnicians,
  getRepairs,
  updateRepairStatus,
} from "../../services/repairsApi";

// ─── role ─────────────────────────────────────────────────────────────────────

function getCurrentRole() {
  const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded?.role ? String(decoded.role).toUpperCase() : null;
  } catch {
    return null;
  }
}

// ─── constants ─────────────────────────────────────────────────────────────────

const REPAIR_STATUSES = [
  { value: "RECEIVED",    label: "Received"    },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED",   label: "Completed"   },
  { value: "DELIVERED",   label: "Delivered"   },
];

const PAGE_SIZE = 12;

// ─── style helpers ─────────────────────────────────────────────────────────────

function cx(...xs) { return xs.filter(Boolean).join(" "); }
const strong  = () => "text-[var(--color-text)]";
const muted   = () => "text-[var(--color-text-muted)]";
const soft    = () => "text-[var(--color-text-muted)]";
const card    = () => "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const raised  = () => "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]";
const panel   = () => "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-2)]";
const input   = () => "app-input";

const primaryBtn  = (d=false) => cx("inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95", d && "cursor-not-allowed opacity-60");
const secondaryBtn= (d=false) => cx("inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90", d && "cursor-not-allowed opacity-60");
const dangerBtn   = (d=false) => cx("inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition", d ? "cursor-not-allowed bg-[rgba(219,80,74,0.08)] text-[var(--color-danger)] opacity-50" : "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)] hover:opacity-90");
const warnBtn     = (d=false) => cx("inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition", d ? "cursor-not-allowed bg-[rgba(217,119,6,0.08)] text-[#b45309] opacity-50" : "bg-[#fff1c9] text-[#92400e] hover:opacity-90");

// ─── atoms ─────────────────────────────────────────────────────────────────────

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[18px] bg-[var(--color-surface-2)]", className)} />;
}

function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "DELIVERED"   ? "bg-[#dcfce7] text-[#15803d]"
    : s === "COMPLETED" ? "bg-[#dff1ff] text-[#4aa8ff]"
    : s === "IN_PROGRESS"? "bg-[#fff1c9] text-[#b88900]"
    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";

  const label =
    s === "RECEIVED"    ? "Received"
    : s === "IN_PROGRESS" ? "In Progress"
    : s === "COMPLETED"   ? "Completed"
    : s === "DELIVERED"   ? "Delivered"
    : s;

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
      {label}
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow && (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", soft())}>{eyebrow}</div>
      )}
      <h1 className={cx("mt-3 text-[1.7rem] font-black tracking-tight sm:text-[2rem]", strong())}>{title}</h1>
      {subtitle && <p className={cx("mt-3 text-sm leading-6", muted())}>{subtitle}</p>}
    </div>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const iconTone =
    tone === "success" ? "bg-[#dcfce7] text-[#15803d]"
    : tone === "warning" ? "bg-[#fff1c9] text-[#b88900]"
    : tone === "danger"  ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
    : "bg-[#dff1ff] text-[#4aa8ff]";

  return (
    <article className={cx(card(), "p-5 sm:p-6")}>
      <div className="flex items-start gap-4">
        <div className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] shadow-[var(--shadow-soft)]", iconTone)}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M14 7l3-3 3 3-3 3zM3 21l7-7" />
            <path d="m11 13-4-4 2-2 4 4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className={cx("text-sm font-semibold", strong())}>{label}</div>
          <div className={cx("mt-1.5 text-[1.6rem] font-black leading-tight tracking-tight", strong())}>{value}</div>
          {note && <div className={cx("mt-1.5 text-sm", muted())}>{note}</div>}
        </div>
      </div>
    </article>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cx(card(), "p-4 sm:p-5")}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-7 w-24 rounded-full" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SkeletonBlock className="h-14" />
              <SkeletonBlock className="h-14" />
              <SkeletonBlock className="h-14" />
              <SkeletonBlock className="h-14" />
            </div>
            <div className="flex justify-end gap-2">
              <SkeletonBlock className="h-11 w-24 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd, canAdd }) {
  return (
    <div className={cx(panel(), "px-4 py-16 text-center")}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M14 7l3-3 3 3-3 3zM3 21l7-7" />
          <path d="m11 13-4-4 2-2 4 4" />
        </svg>
      </div>
      <div className={cx("text-base font-bold", strong())}>No repairs yet</div>
      <div className={cx("mt-2 text-sm leading-6", muted())}>Repairs logged here track device intake, technician assignment, and status.</div>
      {canAdd && (
        <Link to="/app/repairs/new" className={cx(primaryBtn(), "mt-5")}>Log first repair</Link>
      )}
    </div>
  );
}

// ─── confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ open, title, body, busy, confirmLabel, confirmClass, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className={cx(card(), "w-full max-w-md p-5 sm:p-6")}>
        <div className={cx("text-lg font-bold", strong())}>{title}</div>
        <p className={cx("mt-3 text-sm leading-6", muted())}>{body}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className={secondaryBtn(busy)}>Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className={confirmClass || dangerBtn(busy)}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── repair card ───────────────────────────────────────────────────────────────

function RepairCard({ repair, technicians, canChangeStatus, canAssign, canArchive, canDelete, onStatusChange, onAssign, onOpenArchive, onOpenDelete, statusBusy, assignBusy, index }) {
  return (
    <div className={cx(
      card(),
      "relative overflow-hidden p-4 sm:p-5",
      index % 2 === 0 ? "bg-[var(--color-card)]" : "bg-[var(--color-surface)]"
    )}>
      {/* left accent */}
      <div className={cx(
        "absolute left-0 top-0 h-full w-1.5 opacity-80",
        String(repair.status).toUpperCase() === "DELIVERED"    ? "bg-[#15803d]"
        : String(repair.status).toUpperCase() === "COMPLETED"  ? "bg-[#4aa8ff]"
        : String(repair.status).toUpperCase() === "IN_PROGRESS"? "bg-[#b88900]"
        : "bg-[var(--color-border)]"
      )} />
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--color-border)]" />

      <div className="pl-2">
        <div className="flex flex-col gap-4">
          {/* header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx("text-base font-black tracking-tight", strong())}>{repair.device || "Unknown device"}</span>
                <StatusBadge status={repair.status} />
              </div>
              {repair.serial && (
                <div className={cx("mt-0.5 text-xs", muted())}>Serial: {repair.serial}</div>
              )}
              {repair.issue && (
                <div className={cx("mt-1 text-sm leading-5", muted())}>{repair.issue}</div>
              )}
            </div>

            {/* actions row */}
            <div className="flex shrink-0 flex-wrap gap-2">
              {canArchive && (
                <button type="button" onClick={() => onOpenArchive(repair)} className={warnBtn()}>Archive</button>
              )}
              {canDelete && (
                <button type="button" onClick={() => onOpenDelete(repair)} className={dangerBtn()}>Delete</button>
              )}
            </div>
          </div>

          {/* detail tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={cx(raised(), "p-3")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", soft())}>Customer</div>
              <div className={cx("mt-2 text-sm font-bold leading-snug", strong())}>{repair.customer?.name || "—"}</div>
              <div className={cx("text-xs", muted())}>{repair.customer?.phone || ""}</div>
            </div>

            <div className={cx(raised(), "p-3")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", soft())}>Received</div>
              <div className={cx("mt-2 text-sm font-bold", strong())}>
                {repair.createdAt ? new Date(repair.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
              </div>
              {repair.warrantyEnd && (
                <div className={cx("text-xs", muted())}>
                  Warranty: {new Date(repair.warrantyEnd).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className={cx(raised(), "p-3")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", soft())}>Technician</div>
              {canAssign ? (
                <select
                  className={cx("mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-xs font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]")}
                  value={repair.technicianId || ""}
                  onChange={(e) => onAssign(repair.id, e.target.value)}
                  disabled={assignBusy === repair.id}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <div className={cx("mt-2 text-sm font-bold", strong())}>{repair.technician?.name || "Unassigned"}</div>
              )}
            </div>

            <div className={cx(raised(), "p-3")}>
              <div className={cx("text-[10px] font-semibold uppercase tracking-[0.18em]", soft())}>Status</div>
              {canChangeStatus ? (
                <select
                  className={cx("mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-xs font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]")}
                  value={repair.status || ""}
                  onChange={(e) => onStatusChange(repair.id, e.target.value)}
                  disabled={statusBusy === repair.id}
                >
                  {REPAIR_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={repair.status} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export default function Repairs() {
  const role = useMemo(() => getCurrentRole(), []);
  const canCreate      = role === "OWNER" || role === "CASHIER";
  const canChangeStatus= role === "OWNER" || role === "TECHNICIAN";
  const canAssign      = role === "OWNER";
  const canArchive     = role === "OWNER";
  const canDelete      = role === "OWNER";

  const [repairs,     setRepairs]     = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [q,           setQ]           = useState("");
  const [filterStatus,setFilterStatus]= useState("ALL");
  const [visibleCount,setVisibleCount]= useState(PAGE_SIZE);

  const [statusBusy, setStatusBusy] = useState("");
  const [assignBusy, setAssignBusy] = useState("");

  // Archive confirm
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveBusy,   setArchiveBusy]   = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy,   setDeleteBusy]   = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function loadRepairs() {
    try {
      const data = await getRepairs();
      if (!mountedRef.current) return;
      setRepairs(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.message || "Failed to load repairs");
    }
  }

  async function loadTechnicians() {
    try {
      const data = await getRepairTechnicians();
      if (!mountedRef.current) return;
      setTechnicians(Array.isArray(data) ? data : []);
    } catch {
      if (!mountedRef.current) return;
      setTechnicians([]);
    }
  }

  async function refreshAll() {
    setLoading(true);
    try {
      await Promise.all([loadRepairs(), loadTechnicians()]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => { void refreshAll(); }, []); // eslint-disable-line

  // ── filter ──────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = repairs;
    if (filterStatus !== "ALL") list = list.filter((r) => r.status === filterStatus);
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((r) =>
        String(r.device || "").toLowerCase().includes(s) ||
        String(r.customer?.name || "").toLowerCase().includes(s) ||
        String(r.customer?.phone || "").toLowerCase().includes(s) ||
        String(r.serial || "").toLowerCase().includes(s) ||
        String(r.issue || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [repairs, q, filterStatus]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [q, filterStatus]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // ── summary ──────────────────────────────────────────────────────────────────

  const summary = useMemo(() => ({
    total:      repairs.length,
    received:   repairs.filter((r) => r.status === "RECEIVED").length,
    inProgress: repairs.filter((r) => r.status === "IN_PROGRESS").length,
    completed:  repairs.filter((r) => r.status === "COMPLETED").length,
    delivered:  repairs.filter((r) => r.status === "DELIVERED").length,
  }), [repairs]);

  // ── actions ──────────────────────────────────────────────────────────────────

  async function handleStatusChange(id, status) {
    setStatusBusy(id);
    try {
      await updateRepairStatus(id, status);
      setRepairs((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setStatusBusy("");
    }
  }

  async function handleAssign(repairId, technicianId) {
    setAssignBusy(repairId);
    const value = technicianId === "" ? null : technicianId;
    try {
      await assignTechnician(repairId, value);
      const tech = technicians.find((t) => t.id === value) || null;
      setRepairs((prev) => prev.map((r) =>
        r.id === repairId
          ? { ...r, technicianId: value, technician: tech ? { name: tech.name } : null }
          : r
      ));
    } catch (err) {
      toast.error(err?.message || "Failed to assign technician");
    } finally {
      setAssignBusy("");
    }
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setArchiveBusy(true);
    try {
      await archiveRepair(archiveTarget.id);
      setRepairs((prev) => prev.filter((r) => r.id !== archiveTarget.id));
      toast.success("Repair archived");
      setArchiveTarget(null);
    } catch (err) {
      toast.error(err?.message || "Failed to archive repair");
    } finally {
      setArchiveBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteRepair(deleteTarget.id);
      setRepairs((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Repair deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete repair");
    } finally {
      setDeleteBusy(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* header */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionHeading
            eyebrow="Operations"
            title="Repairs"
            subtitle="Track every device intake, technician assignment, and repair status from intake to customer handover."
          />
          <div className="flex flex-wrap gap-2">
            <AsyncButton loading={loading} onClick={refreshAll} className={secondaryBtn()}>
              Refresh
            </AsyncButton>
            {canCreate && (
              <Link to="/app/repairs/new" className={primaryBtn()}>New repair</Link>
            )}
          </div>
        </div>

        {/* summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total repairs" value={summary.total}      note="All repair records"       />
          <SummaryCard label="Received"      value={summary.received}   note="Awaiting technician"      tone="neutral" />
          <SummaryCard label="In progress"   value={summary.inProgress} note="Under active service"    tone="warning" />
          <SummaryCard label="Delivered"     value={summary.delivered}  note="Completed handovers"     tone="success" />
        </div>
      </section>

      {/* list layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* sidebar filters */}
        <aside className={cx(card(), "h-fit p-5 sm:p-6")}>
          <div className={cx("text-base font-bold", strong())}>Filter repairs</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className={cx("mb-1.5 block text-sm font-medium", strong())}>Search</label>
              <input className={input()} placeholder="Device, customer, serial, issue…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <label className={cx("mb-1.5 block text-sm font-medium", strong())}>Status</label>
              <div className="flex flex-col gap-2">
                {[{ value: "ALL", label: "All repairs" }, ...REPAIR_STATUSES].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterStatus(opt.value)}
                    className={cx(
                      "rounded-2xl border px-4 py-2.5 text-left text-sm font-semibold transition",
                      filterStatus === opt.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={cx(panel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", soft())}>Showing</div>
              <div className={cx("mt-2.5 text-lg font-bold", strong())}>{filtered.length} repair{filtered.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </aside>

        {/* repair list */}
        <section className={cx(card(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={cx("text-xl font-bold", strong())}>Repair log</div>
                <div className={cx("mt-1.5 text-sm leading-6", muted())}>
                  Update statuses, assign technicians, and manage repair lifecycle.
                </div>
              </div>
              {!loading && (
                <span className="inline-flex items-center self-start rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  {visible.length} of {filtered.length}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <ListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState canAdd={canCreate} />
            ) : (
              <>
                <div className="space-y-3">
                  {visible.map((repair, idx) => (
                    <RepairCard
                      key={repair.id}
                      repair={repair}
                      technicians={technicians}
                      canChangeStatus={canChangeStatus}
                      canAssign={canAssign}
                      canArchive={canArchive}
                      canDelete={canDelete}
                      onStatusChange={handleStatusChange}
                      onAssign={handleAssign}
                      onOpenArchive={setArchiveTarget}
                      onOpenDelete={setDeleteTarget}
                      statusBusy={statusBusy}
                      assignBusy={assignBusy}
                      index={idx}
                    />
                  ))}
                </div>
                <div className="mt-5 flex justify-center">
                  {hasMore ? (
                    <button type="button" onClick={() => setVisibleCount((p) => p + PAGE_SIZE)} className={secondaryBtn()}>
                      Load more
                    </button>
                  ) : (
                    <div className={cx("text-sm", muted())}>All {filtered.length} repairs shown</div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive repair?"
        body={`Archive the repair for "${archiveTarget?.device || "this device"}"? Archived repairs are removed from the active list and cannot be restored through the app.`}
        busy={archiveBusy}
        confirmLabel="Archive repair"
        confirmClass={warnBtn(archiveBusy)}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete repair?"
        body={`Permanently delete the repair for "${deleteTarget?.device || "this device"}"? This cannot be undone.`}
        busy={deleteBusy}
        confirmLabel="Delete repair"
        confirmClass={dangerBtn(deleteBusy)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}      