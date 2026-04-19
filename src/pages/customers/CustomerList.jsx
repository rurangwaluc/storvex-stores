// src/pages/customers/CustomerList.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "../../lib/cn";
import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";
import {
  createCustomer,
  listCustomers,
  updateCustomer,
  deactivateCustomer,
  reactivateCustomer,
  getCustomerLedger,
} from "../../services/customersApi";

// ─── design helpers ───────────────────────────────────────────────────────────
const strong  = () => "text-[var(--color-text)]";
const muted   = () => "text-[var(--color-text-muted)]";
const card    = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const panel   = () => "rounded-[22px] bg-[var(--color-surface-2)]";
const danger  = () => "text-[var(--color-danger)]";

const fmt = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function PulseBar({ className = "" }) {
  return <div className={cn("animate-pulse rounded-full bg-[var(--color-surface-2)]", className)} />;
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
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

// ─── InfoStat ─────────────────────────────────────────────────────────────────
function InfoStat({ label, value }) {
  return (
    <div className={cn(panel(), "p-3")}>
      <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", muted())}>{label}</div>
      <div className={cn("mt-1.5 text-sm font-bold", strong())}>{value || "—"}</div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ title, text }) {
  return (
    <div className={cn(panel(), "px-5 py-10 text-center")}>
      <div className={cn("text-sm font-semibold", strong())}>{title}</div>
      <div className={cn("mt-1 text-xs leading-5", muted())}>{text}</div>
    </div>
  );
}

// ─── CustomerFormModal ────────────────────────────────────────────────────────
const EMPTY_FORM = { name:"", phone:"", email:"", address:"", tinNumber:"", idNumber:"", notes:"", whatsappOptIn:false };

function CustomerFormModal({ initial, onSave, onClose, busy }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const isEdit = Boolean(initial?.id);

  function set(k, v) { setForm(c => ({ ...c, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())  { toast.error("Name is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone is required"); return; }
    onSave(form);
  }

  const inputCls = "app-input";
  const lbl = cn("mb-1.5 block text-sm font-medium", strong());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(card(), "relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6")}>
        <div className="flex items-center justify-between mb-5">
          <div className={cn("text-lg font-black tracking-tight", strong())}>{isEdit ? "Edit customer" : "New customer"}</div>
          <button type="button" onClick={onClose} className={cn("rounded-xl p-1.5 transition hover:opacity-75", muted())}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Name <span className={danger()}>*</span></label>
              <input className={inputCls} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Full name" required />
            </div>
            <div>
              <label className={lbl}>Phone <span className={danger()}>*</span></label>
              <input className={inputCls} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="07x xxx xxxx" required />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input className={inputCls} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label className={lbl}>TIN number</label>
              <input className={inputCls} value={form.tinNumber} onChange={e=>set("tinNumber",e.target.value)} placeholder="TIN / VAT number" />
            </div>
            <div>
              <label className={lbl}>ID number</label>
              <input className={inputCls} value={form.idNumber} onChange={e=>set("idNumber",e.target.value)} placeholder="National ID / Passport" />
            </div>
            <div>
              <label className={lbl}>Address</label>
              <input className={inputCls} value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Physical address" />
            </div>
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <textarea
              className="app-textarea w-full"
              rows={3}
              value={form.notes}
              onChange={e=>set("notes",e.target.value)}
              placeholder="Internal notes about this customer…"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <div className={cn(
              "relative h-6 w-11 rounded-full transition",
              form.whatsappOptIn ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-2)]"
            )}>
              <div className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-card)] shadow transition-transform",
                form.whatsappOptIn ? "translate-x-5" : "translate-x-0.5"
              )}/>
              <input type="checkbox" className="sr-only" checked={form.whatsappOptIn} onChange={e=>set("whatsappOptIn",e.target.checked)} />
            </div>
            <span className={cn("text-sm font-medium", strong())}>WhatsApp opt-in</span>
          </label>
          <div className="flex gap-2 pt-2">
            <AsyncButton type="submit" loading={busy} loadingText={isEdit?"Saving…":"Creating…"} variant="primary" className="flex-1">
              {isEdit ? "Save changes" : "Create customer"}
            </AsyncButton>
            <AsyncButton type="button" variant="secondary" onClick={onClose} disabled={busy} className="flex-1">
              Cancel
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LedgerDrawer ──────────────────────────────────────────────────────────────
function LedgerDrawer({ customerId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getCustomerLedger(customerId);
        if (!cancelled) setData(r);
      } catch(e) { if (!cancelled) toast.error(e?.message || "Failed to load ledger"); }
      finally    { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(card(), "relative z-10 flex w-full max-w-xl flex-col overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
          <div className={cn("text-lg font-black tracking-tight", strong())}>
            {loading ? "Loading…" : data?.customer?.name || "Ledger"}
          </div>
          <button type="button" onClick={onClose} className={cn("rounded-xl p-1.5 hover:opacity-75", muted())}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            Array.from({length:4}).map((_,i)=>(
              <div key={i} className={cn(panel(),"p-4 space-y-2")}>
                <PulseBar className="h-3 w-32" />
                <PulseBar className="h-3 w-full" />
                <PulseBar className="h-3 w-3/4" />
              </div>
            ))
          ) : !data ? (
            <EmptyState title="No ledger data" text="Could not load customer history." />
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <InfoStat label="Total sales" value={data.summary?.totalSales ?? "—"} />
                <InfoStat label="Total value"      value={fmt(data.summary?.totalAll)} />
                <InfoStat label="Total paid"       value={fmt(data.summary?.totalPaid)} />
                <InfoStat label="Outstanding"      value={fmt(data.summary?.totalOutstanding)} />
              </div>

              {/* Sales list */}
              {data.sales?.length > 0 && (
                <div className="space-y-3">
                  <div className={cn("text-sm font-bold", strong())}>Sales history</div>
                  {data.sales.map(s => (
                    <div key={s.id} className={cn(panel(), "p-3")}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className={cn("text-sm font-bold", strong())}>
                            {s.receiptNumber || s.invoiceNumber || s.id.slice(-8)}
                          </div>
                          <div className={cn("text-xs", muted())}>{fmtDate(s.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pill tone={s.saleType==="CREDIT"?"warning":"success"}>{s.saleType}</Pill>
                          <Pill tone={s.status==="PAID"?"success":s.status==="OVERDUE"?"danger":"warning"}>
                            {s.status}
                          </Pill>
                          <span className={cn("text-sm font-bold", strong())}>{fmt(s.total)}</span>
                        </div>
                      </div>
                      {Number(s.balanceDue||0) > 0 && (
                        <div className={cn("mt-1.5 text-xs font-semibold", danger())}>
                          Balance due: {fmt(s.balanceDue)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose, busy, danger: isDanger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(card(), "relative z-10 w-full max-w-sm p-6 space-y-4")}>
        <div className={cn("text-base font-black tracking-tight", strong())}>{title}</div>
        <div className={cn("text-sm leading-6", muted())}>{message}</div>
        <div className="flex gap-2">
          <AsyncButton
            loading={busy} loadingText="Working…"
            variant={isDanger ? "secondary" : "primary"}
            onClick={onConfirm}
            className={cn("flex-1", isDanger && "!bg-[var(--color-danger)] text-white hover:opacity-95")}
          >{confirmLabel}</AsyncButton>
          <AsyncButton variant="secondary" onClick={onClose} disabled={busy} className="flex-1">Cancel</AsyncButton>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function CustomerList() {
  const [loading, setLoading]   = useState(true);
  const [customers, setCustomers] = useState([]);
  const [q, setQ]               = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);  // null = create, obj = edit
  const [formBusy,   setFormBusy]   = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null); // { customer, action }
  const [confirmBusy,   setConfirmBusy]   = useState(false);

  const [ledgerId, setLedgerId]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const abortRef   = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  async function load(opts = {}) {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    if (!opts.silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await listCustomers();
      if (!mountedRef.current || ctrl.signal.aborted) return;
      setCustomers(Array.isArray(data) ? data : []);
    } catch(e) {
      if (ctrl.signal.aborted) return;
      toast.error(e?.message || "Failed to load customers");
      setCustomers([]);
    } finally {
      if (!mountedRef.current || ctrl.signal.aborted) return;
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line

  // ── local search filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    return customers.filter(c => {
      if (!showInactive && c.isActive === false) return false;
      if (!qLow) return true;
      const hay = [c.name, c.phone, c.email, c.tinNumber, c.idNumber].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(qLow);
    });
  }, [customers, q, showInactive]);

  const stats = useMemo(() => ({
    total:    customers.filter(c => c.isActive !== false).length,
    inactive: customers.filter(c => c.isActive === false).length,
    withDebt: customers.filter(c => Number(c.outstanding||0) > 0).length,
    totalDebt:customers.reduce((s,c) => s + Number(c.outstanding||0), 0),
  }), [customers]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  function openCreate() { setEditTarget(null); setShowForm(true); }
  function openEdit(c)  { setEditTarget(c);    setShowForm(true); }

  async function handleSave(form) {
    setFormBusy(true);
    try {
      if (editTarget?.id) {
        const updated = await updateCustomer(editTarget.id, form);
        setCustomers(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...updated } : c));
        toast.success("Customer updated");
      } else {
        const created = await createCustomer(form);
        setCustomers(prev => [{ ...created, outstanding: 0 }, ...prev]);
        toast.success("Customer created");
      }
      setShowForm(false);
    } catch(e) {
      toast.error(e?.message || "Failed to save customer");
    } finally {
      if (mountedRef.current) setFormBusy(false);
    }
  }

  async function handleDeactivate() {
    if (!confirmTarget?.customer) return;
    setConfirmBusy(true);
    try {
      await deactivateCustomer(confirmTarget.customer.id);
      setCustomers(prev => prev.map(c => c.id === confirmTarget.customer.id ? { ...c, isActive: false } : c));
      toast.success("Customer deactivated");
      setConfirmTarget(null);
    } catch(e) { toast.error(e?.message || "Failed to deactivate"); }
    finally    { if (mountedRef.current) setConfirmBusy(false); }
  }

  async function handleReactivate() {
    if (!confirmTarget?.customer) return;
    setConfirmBusy(true);
    try {
      const updated = await reactivateCustomer(confirmTarget.customer.id);
      setCustomers(prev => prev.map(c => c.id === confirmTarget.customer.id ? { ...c, ...updated, isActive: true } : c));
      toast.success("Customer reactivated");
      setConfirmTarget(null);
    } catch(e) { toast.error(e?.message || "Failed to reactivate"); }
    finally    { if (mountedRef.current) setConfirmBusy(false); }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className={cn(card(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", muted())}>CRM</div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strong())}>Customers</h1>
              <p className={cn("mt-2 text-sm leading-6", muted())}>
                Manage customer profiles, view purchase history, and track outstanding balances.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <AsyncButton loading={refreshing} loadingText="" variant="secondary" onClick={() => load({ silent: true })}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={refreshing?"animate-spin":""}>
                  <path d="M20 12a8 8 0 10-2.34 5.66M20 12V6m0 6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh
              </AsyncButton>
              <AsyncButton loading={false} variant="primary" onClick={openCreate}>+ New customer</AsyncButton>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4 sm:px-6">
          <div className={cn(panel(),"p-3")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>Active</div>
            <div className={cn("mt-2 text-2xl font-black",strong())}>{stats.total}</div>
          </div>
          <div className={cn(panel(),"p-3")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>With debt</div>
            <div className={cn("mt-2 text-2xl font-black",danger())}>{stats.withDebt}</div>
          </div>
          <div className={cn(panel(),"p-3")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>Total debt</div>
            <div className={cn("mt-2 text-xl font-black",danger())}>{fmt(stats.totalDebt)}</div>
          </div>
          <div className={cn(panel(),"p-3")}>
            <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]",muted())}>Inactive</div>
            <div className={cn("mt-2 text-2xl font-black",strong())}>{stats.inactive}</div>
          </div>
        </div>
      </div>

      {/* ── List card ── */}
      <div className={cn(card(), "overflow-hidden")}>
        {/* Toolbar */}
        <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              className="app-input max-w-xs"
              placeholder="Search name · phone · email · TIN · ID…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowInactive(v => !v)}
              className={cn(
                "inline-flex h-11 items-center rounded-2xl border px-4 text-sm font-semibold transition",
                showInactive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
              )}
            >
              {showInactive ? "Showing all" : "Active only"}
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {["Name & contact", "TIN / ID", "WhatsApp", "Outstanding", "Status", ""].map(h => (
                  <th key={h} className={cn("px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", muted())}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <div className={cn("text-sm font-semibold",strong())}>No customers found</div>
                    <div className={cn("mt-1 text-xs",muted())}>Try a different search or create a new customer.</div>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className={cn(
                  "border-b border-[var(--color-border)] transition hover:bg-[var(--color-surface-2)]",
                  c.isActive === false && "opacity-50"
                )}>
                  <td className="px-5 py-3">
                    <div className={cn("text-sm font-bold", strong())}>{c.name}</div>
                    <div className={cn("text-xs", muted())}>{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className={cn("text-xs", muted())}>
                      {c.tinNumber && <div>TIN: {c.tinNumber}</div>}
                      {c.idNumber  && <div>ID: {c.idNumber}</div>}
                      {!c.tinNumber && !c.idNumber && <span>—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={c.whatsappOptIn ? "success" : "neutral"}>
                      {c.whatsappOptIn ? "Opted in" : "No"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    {Number(c.outstanding || 0) > 0
                      ? <span className={cn("text-sm font-bold", danger())}>{fmt(c.outstanding)}</span>
                      : <span className={cn("text-sm", muted())}>—</span>
                    }
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={c.isActive !== false ? "success" : "neutral"}>
                      {c.isActive !== false ? "Active" : "Inactive"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setLedgerId(c.id)} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80", muted())}>
                        Ledger
                      </button>
                      <button onClick={() => openEdit(c)} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold transition", "bg-[var(--color-surface-2)] hover:opacity-90 text-[var(--color-text)]")}>
                        Edit
                      </button>
                      {c.isActive !== false ? (
                        <button onClick={() => setConfirmTarget({ customer: c, action: "deactivate" })} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition hover:opacity-80")}>
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => setConfirmTarget({ customer: c, action: "reactivate" })} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:opacity-80")}>
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            Array.from({length:6}).map((_,i) => (
              <div key={i} className={cn(panel(),"p-4 space-y-2")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-36 animate-pulse rounded-full bg-[var(--color-surface-2)]"/>
                    <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--color-surface-2)]"/>
                  </div>
                  <div className="h-9 w-16 animate-pulse rounded-2xl bg-[var(--color-surface-2)]"/>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <EmptyState title="No customers found" text="Try adjusting your search." />
          ) : filtered.map(c => (
            <div key={c.id} className={cn(panel(), "p-4", c.isActive===false && "opacity-50")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={cn("font-bold text-sm truncate", strong())}>{c.name}</div>
                  <div className={cn("text-xs mt-0.5", muted())}>{c.phone}</div>
                  {c.email && <div className={cn("text-xs", muted())}>{c.email}</div>}
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <Pill tone={c.isActive !== false ? "success" : "neutral"}>
                    {c.isActive !== false ? "Active" : "Inactive"}
                  </Pill>
                  {Number(c.outstanding||0)>0 && <Pill tone="danger">{fmt(c.outstanding)}</Pill>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setLedgerId(c.id)} className={cn("rounded-2xl px-3 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)] text-[var(--color-text)]")}>Ledger</button>
                <button onClick={() => openEdit(c)} className={cn("rounded-2xl px-3 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)] text-[var(--color-text)]")}>Edit</button>
                {c.isActive !== false
                  ? <button onClick={()=>setConfirmTarget({customer:c,action:"deactivate"})} className="rounded-2xl px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)]">Deactivate</button>
                  : <button onClick={()=>setConfirmTarget({customer:c,action:"reactivate"})} className="rounded-2xl px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">Reactivate</button>
                }
              </div>
            </div>
          ))}
        </div>

        {!loading && (
          <div className={cn("border-t border-[var(--color-border)] px-5 py-3 text-xs", muted())}>
            Showing {filtered.length} of {customers.length} customer(s)
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showForm && (
        <CustomerFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          busy={formBusy}
        />
      )}

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.action === "deactivate" ? "Deactivate customer?" : "Reactivate customer?"}
          message={confirmTarget.action === "deactivate"
            ? `This will hide ${confirmTarget.customer.name} from active lists. Their history is preserved.`
            : `This will make ${confirmTarget.customer.name} active again.`
          }
          confirmLabel={confirmTarget.action === "deactivate" ? "Deactivate" : "Reactivate"}
          onConfirm={confirmTarget.action === "deactivate" ? handleDeactivate : handleReactivate}
          onClose={() => setConfirmTarget(null)}
          busy={confirmBusy}
          danger={confirmTarget.action === "deactivate"}
        />
      )}

      {ledgerId && <LedgerDrawer customerId={ledgerId} onClose={() => setLedgerId(null)} />}
    </div>
  );
}