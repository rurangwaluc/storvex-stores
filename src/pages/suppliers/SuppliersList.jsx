// src/pages/suppliers/SuppliersList.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { cn } from "../../lib/cn";
import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";
import { activateSupplier, deactivateSupplier, listSuppliers } from "../../services/suppliersApi";

// ─── design helpers ───────────────────────────────────────────────────────────
const strong = () => "text-[var(--color-text)]";
const muted  = () => "text-[var(--color-text-muted)]";
const card   = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const panel  = () => "rounded-[22px] bg-[var(--color-surface-2)]";

function Pill({ children, tone = "neutral" }) {
  const cls = {
    success: "bg-[#7cfcc6] text-[#0b3b2e]",
    warning: "bg-[#ff9f43] text-[#402100]",
    danger:  "bg-[rgba(219,80,74,0.14)] text-[var(--color-danger)]",
    neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
    info:    "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  }[tone] || "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{children}</span>;
}

function idTypeLabel(t) {
  if (t === "NATIONAL_ID") return "National ID";
  if (t === "PASSPORT")    return "Passport";
  return t || "—";
}

function EmptyState({ query }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className={cn("text-sm font-semibold", strong())}>No suppliers found</div>
      <div className={cn("mt-1 text-xs leading-5", muted())}>
        {query ? `No results for "${query}". Try different search terms.` : "Add your first supplier to get started."}
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose, busy, isDanger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(card(), "relative z-10 w-full max-w-sm p-6 space-y-4")}>
        <div className={cn("text-base font-black tracking-tight", strong())}>{title}</div>
        <div className={cn("text-sm leading-6", muted())}>{message}</div>
        <div className="flex gap-2">
          <AsyncButton
            loading={busy}
            loadingText="Working…"
            onClick={onConfirm}
            variant={isDanger ? "secondary" : "primary"}
            className={cn("flex-1", isDanger && "!bg-[var(--color-danger)] text-white hover:opacity-95")}
          >{confirmLabel}</AsyncButton>
          <AsyncButton variant="secondary" onClick={onClose} disabled={busy} className="flex-1">Cancel</AsyncButton>
        </div>
      </div>
    </div>
  );
}

export default function SuppliersList() {
  const nav = useNavigate();

  const [q, setQ]         = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows]     = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { supplier, action }
  const [confirmBusy, setConfirmBusy] = useState(false);

  const abortRef   = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; abortRef.current?.abort(); };
  }, []);

  const query = useMemo(() => q.trim(), [q]);

  async function load({ silent = false } = {}) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await listSuppliers({ q: query || undefined, active }, { signal: ctrl.signal });
      if (!mountedRef.current || ctrl.signal.aborted) return;
      setRows(Array.isArray(data?.suppliers) ? data.suppliers : []);
    } catch(e) {
      if (ctrl.signal.aborted) return;
      toast.error(e?.message || "Failed to load suppliers");
      setRows([]);
    } finally {
      if (!mountedRef.current || ctrl.signal.aborted) return;
      setLoading(false); setRefreshing(false);
    }
  }

  // Debounced load on filter change
  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [query, active]); // eslint-disable-line

  async function handleToggle() {
    if (!confirm?.supplier) return;
    setConfirmBusy(true);
    setBusyId(confirm.supplier.id);
    try {
      if (confirm.action === "deactivate") {
        await deactivateSupplier(confirm.supplier.id);
        toast.success("Supplier hidden");
      } else {
        await activateSupplier(confirm.supplier.id);
        toast.success("Supplier shown");
      }
      setConfirm(null);
      await load({ silent: true });
    } catch(e) {
      toast.error(e?.message || "Failed");
    } finally {
      if (mountedRef.current) { setConfirmBusy(false); setBusyId(null); }
    }
  }

  const stats = useMemo(() => ({
    total:    rows.length,
    verified: rows.filter(s => s.verifiedAt).length,
  }), [rows]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className={cn(card(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", muted())}>Procurement</div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strong())}>Suppliers</h1>
              <p className={cn("mt-2 text-sm leading-6", muted())}>
                Track every source you buy from. Always keep the supplier ID — it protects you from receiving stolen goods.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <AsyncButton loading={refreshing} loadingText="" variant="secondary" onClick={() => load({ silent: true })}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={refreshing ? "animate-spin" : ""}>
                  <path d="M20 12a8 8 0 10-2.34 5.66M20 12V6m0 6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh
              </AsyncButton>
              <AsyncButton loading={false} variant="primary" onClick={() => nav("/app/suppliers/new")}>
                + Add supplier
              </AsyncButton>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
          <div className={cn(panel(),"p-3")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>Showing</div>
            <div className={cn("mt-2 text-2xl font-black",strong())}>{stats.total}</div>
          </div>
          <div className={cn(panel(),"p-3")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>Verified</div>
            <div className={cn("mt-2 text-2xl font-black text-[var(--color-primary)]")}>{stats.verified}</div>
          </div>
          <div className={cn(panel(),"p-3 col-span-2 sm:col-span-1")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>Mode</div>
            <div className={cn("mt-2 text-base font-bold",strong())}>{active ? "Active suppliers" : "Hidden suppliers"}</div>
          </div>
        </div>
      </div>

      {/* ── List card ── */}
      <div className={cn(card(), "overflow-hidden")}>
        {/* Toolbar */}
        <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              className="app-input max-w-sm"
              placeholder="Search name · phone · company · ID number…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setActive(v => !v)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                active
                  ? "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
                  : "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", active ? "bg-emerald-500" : "bg-amber-500")} />
              {active ? "Active" : "Hidden"}
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {["Supplier", "ID / Company", "Phone", "Source", "Verified", ""].map(h => (
                  <th key={h} className={cn("px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", muted())}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}><EmptyState query={query} /></td>
                </tr>
              ) : rows.map(s => (
                <tr key={s.id} className="border-b border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]">
                  <td className="px-5 py-3">
                    <div className={cn("text-sm font-bold", strong())}>{s.name}</div>
                    {s.companyName && <div className={cn("text-xs", muted())}>{s.companyName}</div>}
                  </td>
                  <td className="px-5 py-3">
                    <div className={cn("text-xs", muted())}>{idTypeLabel(s.idType)}</div>
                    <div className={cn("text-sm font-semibold", strong())}>{s.idNumber || "—"}</div>
                  </td>
                  <td className={cn("px-5 py-3 text-sm", muted())}>{s.phone || "—"}</td>
                  <td className="px-5 py-3">
                    {s.sourceType && s.sourceType !== "OTHER" && (
                      <Pill tone="neutral">{s.sourceType}</Pill>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={s.verifiedAt ? "success" : "neutral"}>
                      {s.verifiedAt ? "Verified" : "Unverified"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/app/suppliers/${s.id}`} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)] transition hover:opacity-90", strong())}>
                        View
                      </Link>
                      <Link to={`/app/suppliers/${s.id}/edit`} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)] transition hover:opacity-90", strong())}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => setConfirm({ supplier: s, action: active ? "deactivate" : "activate" })}
                        className={cn(
                          "rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60",
                          active ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"
                        )}
                      >
                        {busyId === s.id ? "…" : active ? "Hide" : "Show"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden p-4 space-y-3">
          {loading ? (
            Array.from({length:6}).map((_,i) => (
              <div key={i} className={cn(panel(),"p-4 space-y-2 animate-pulse")}>
                <div className="h-4 w-40 rounded-full bg-[var(--color-surface-2)]"/>
                <div className="h-3 w-24 rounded-full bg-[var(--color-surface-2)]"/>
                <div className="h-3 w-32 rounded-full bg-[var(--color-surface-2)]"/>
              </div>
            ))
          ) : rows.length === 0 ? (
            <EmptyState query={query} />
          ) : rows.map(s => (
            <div key={s.id} className={cn(panel(), "p-4")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={cn("font-bold text-sm truncate", strong())}>{s.name}</div>
                  {s.companyName && <div className={cn("text-xs", muted())}>{s.companyName}</div>}
                  <div className={cn("mt-1 text-xs", muted())}>
                    {idTypeLabel(s.idType)}: {s.idNumber || "—"}
                    {s.phone && ` · ${s.phone}`}
                  </div>
                </div>
                <Pill tone={s.verifiedAt ? "success" : "neutral"}>
                  {s.verifiedAt ? "Verified" : "—"}
                </Pill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/app/suppliers/${s.id}`} className={cn("rounded-2xl px-3 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)]", strong())}>View</Link>
                <Link to={`/app/suppliers/${s.id}/edit`} className={cn("rounded-2xl px-3 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)]", strong())}>Edit</Link>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => setConfirm({ supplier: s, action: active ? "deactivate" : "activate" })}
                  className={cn("rounded-2xl px-3 py-1.5 text-xs font-semibold disabled:opacity-60",
                    active ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]")}
                >
                  {busyId === s.id ? "…" : active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && (
          <div className={cn("border-t border-[var(--color-border)] px-5 py-3 text-xs", muted())}>
            {rows.length} supplier(s) · Tip: Always verify supplier ID to avoid receiving stolen goods.
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.action === "deactivate" ? "Hide supplier?" : "Show supplier?"}
          message={confirm.action === "deactivate"
            ? `${confirm.supplier.name} will be hidden from the active list. Their history is preserved.`
            : `${confirm.supplier.name} will be restored to the active list.`
          }
          confirmLabel={confirm.action === "deactivate" ? "Hide" : "Show"}
          onConfirm={handleToggle}
          onClose={() => setConfirm(null)}
          busy={confirmBusy}
          isDanger={confirm.action === "deactivate"}
        />
      )}
    </div>
  );
}