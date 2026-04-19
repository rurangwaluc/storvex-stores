// src/pages/documents/DocumentListPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full rewrite. All stale tokens (bg-white, border-stone-*, rgb(var(--border)),
// rgb(var(--bg-elevated)), bg-stone-950, etc.) replaced with var(--color-*)
// design tokens. Raw primaryBtn()/secondaryBtn()/dangerBtn() helper functions
// replaced with AsyncButton. Internal TableSkeletonRows rebuilt with clean
// var(--color-surface-2) tokens. Mobile-first responsive card layout added.
//
// Props (unchanged API):
//   type     — "receipts" | "invoices" | "delivery-notes" | "proformas" | "warranties"
//   title    — "Receipts", "Invoices", etc.
//   subtitle — section description string
//   listFn   — async function(query: string) → API response
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { cn } from "../../lib/cn";
import AsyncButton from "../../components/ui/AsyncButton";
import { deleteDeliveryNote } from "../../services/deliveryNotesApi";
import { deleteProforma }     from "../../services/proformasApi";
import { deleteWarranty }     from "../../services/warrantiesApi";
import { openDocumentPrint }  from "../../services/documentPrint";

// ─── design token shorthands ──────────────────────────────────────────────────
const S    = () => "text-[var(--color-text)]";
const M    = () => "text-[var(--color-text-muted)]";
const CARD = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const PNL  = () => "rounded-[22px] bg-[var(--color-surface-2)]";

// ─── Status badge (uses index.css badge-* classes) ────────────────────────────
function statusKind(status) {
  const s = String(status || "").toUpperCase();
  if (["PAID","COMPLETED","CONVERTED","ACTIVE","SENT","DELIVERED"].includes(s)) return "success";
  if (["PARTIAL","DRAFT","PENDING","UNPAID","EXPIRING"].includes(s))           return "warning";
  if (["CANCELLED","EXPIRED","OVERDUE","RETURNED"].includes(s))                return "danger";
  return "neutral";
}
function BadgePill({ status }) {
  const k = statusKind(status);
  const cls = { success:"badge-success", warning:"badge-warning", danger:"badge-danger", info:"badge-info", neutral:"badge-neutral" }[k] || "badge-neutral";
  return <span className={cls}>{status || "—"}</span>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeDate(v) { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d : null; }
function fmtDate(v) { const d = safeDate(v); return d ? d.toLocaleDateString() : "—"; }
function fmtMoney(n, currency = "RWF") { return `${currency} ${Number(n || 0).toLocaleString()}`; }

// ─── Loading skeleton ─────────────────────────────────────────────────────────
// Uses var(--color-surface-2) — fully dark/light mode safe (no stone-* tokens)
function DocCardSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(PNL(), "animate-pulse p-4")}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 rounded-full bg-[var(--color-surface-3)]" />
                <div className="h-5 w-16 rounded-full bg-[var(--color-surface-3)]" />
              </div>
              <div className="h-4 w-48 rounded-full bg-[var(--color-surface-3)]" />
              <div className="h-4 w-64 rounded-full bg-[var(--color-surface-3)]" />
            </div>
            <div className="flex shrink-0 items-center gap-2 xl:justify-end">
              <div className="h-11 w-24 rounded-2xl bg-[var(--color-surface-3)]" />
              <div className="h-11 w-24 rounded-2xl bg-[var(--color-surface-3)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KPI summary strip ────────────────────────────────────────────────────────
function KpiStrip({ total, active, flagged, label, loading }) {
  const StatBlock = ({ l, v, tone }) => (
    <div className={cn(PNL(), "relative overflow-hidden p-3")}>
      <div className={cn(
        "absolute left-0 top-0 h-full w-1.5",
        tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : tone === "danger" ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]"
      )} />
      <div className="pl-2">
        <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", M())}>{l}</div>
        {loading
          ? <div className="mt-2 h-7 w-16 animate-pulse rounded bg-[var(--color-surface-3)]" />
          : <div className={cn("mt-2 text-2xl font-black", S())}>{v}</div>
        }
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatBlock l={label}          v={total}   tone="info" />
      <StatBlock l="Active / valid" v={active}  tone="success" />
      <StatBlock l="Needs attention" v={flagged} tone={flagged > 0 ? "warning" : "neutral"} />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ title, note, linkTo, linkLabel }) {
  return (
    <div className={cn(CARD(), "px-5 py-12 text-center")}>
      <div className={cn("text-base font-black tracking-tight", S())}>{title}</div>
      <div className={cn("mt-2 text-sm leading-6", M())}>{note}</div>
      {linkTo && linkLabel && (
        <div className="mt-5">
          <Link to={linkTo}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90">
            {linkLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ open, title, body, deleting, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className={cn(CARD(), "relative z-10 w-full max-w-md p-6 space-y-4")}>
        <div className={cn("text-base font-black tracking-tight", S())}>{title}</div>
        <div className={cn("text-sm leading-6", M())}>{body}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {/* AsyncButton cancel */}
          <AsyncButton variant="secondary" onClick={onCancel} disabled={deleting} className="sm:w-auto">Cancel</AsyncButton>
          {/* AsyncButton delete — shows spinner while deleting */}
          <AsyncButton
            loading={deleting} loadingText="Deleting…"
            onClick={onConfirm}
            className="sm:w-auto inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >Delete</AsyncButton>
        </div>
      </div>
    </div>
  );
}

// ─── Data normalization (preserved exactly) ───────────────────────────────────
function normalizeListResponse(type, data) {
  if (type === "receipts")       return Array.isArray(data?.receipts)       ? data.receipts       : [];
  if (type === "invoices")       return Array.isArray(data?.invoices)       ? data.invoices       : [];
  if (type === "proformas")      return Array.isArray(data?.proformas)      ? data.proformas      : [];
  if (type === "warranties")     return Array.isArray(data?.warranties)     ? data.warranties     : [];
  if (type === "delivery-notes") return Array.isArray(data?.deliveryNotes)  ? data.deliveryNotes  : [];
  return [];
}

function getTypeMeta(type) {
  if (type === "receipts")       return { actionLabel:"Open POS sales",     actionTo:"/app/pos/sales",                            statLabel:"Payment records",   canCreate:false, canEdit:false, canDelete:false, singularLabel:"receipt"       };
  if (type === "invoices")       return { actionLabel:"Open POS sales",     actionTo:"/app/pos/sales",                            statLabel:"Formal billing",    canCreate:false, canEdit:false, canDelete:false, singularLabel:"invoice"       };
  if (type === "delivery-notes") return { actionLabel:"Create delivery note",actionTo:"/app/documents/delivery-notes/create",     statLabel:"Goods handover",    canCreate:true,  canEdit:true,  canDelete:true,  singularLabel:"delivery note" };
  if (type === "proformas")      return { actionLabel:"Create proforma",     actionTo:"/app/documents/proformas/create",          statLabel:"Quotations",        canCreate:true,  canEdit:true,  canDelete:true,  singularLabel:"proforma"      };
  if (type === "warranties")     return { actionLabel:"Create warranty",     actionTo:"/app/documents/warranties/create",         statLabel:"After-sales proof", canCreate:true,  canEdit:true,  canDelete:true,  singularLabel:"warranty"      };
  return { actionLabel:null, actionTo:null, statLabel:"Documents", canCreate:false, canEdit:false, canDelete:false, singularLabel:"document" };
}

function buildCards(type, rows) {
  if (type === "warranties") {
    return rows.map(r => ({ id:r.id, title:r.number||"Warranty", subtitle:r.customerName||r.customer?.name||"Walk-in Customer", metaLeft:r.customerPhone||r.customer?.phone||"—", metaRight:r.cashierName||r.issuedBy||"—", status:r.policy||r.status||"Warranty", amount:r.endsAt?`Ends ${fmtDate(r.endsAt)}`:"No end date", createdAt:r.createdAt, rightHint:r.unitsCount?`${r.unitsCount} covered unit(s)`:"Coverage record" }));
  }
  if (type === "proformas") {
    return rows.map(r => ({ id:r.id, title:r.number||"Proforma", subtitle:r.customerName||r.customer?.name||"Customer", metaLeft:r.customerPhone||r.customer?.phone||r.customerEmail||"—", metaRight:r.preparedBy||r.cashierName||"—", status:r.status||"DRAFT", amount:fmtMoney(r.total,r.currency||"RWF"), createdAt:r.createdAt, rightHint:r.validUntil?`Valid until ${fmtDate(r.validUntil)}`:"No validity date" }));
  }
  if (type === "delivery-notes") {
    return rows.map(r => ({ id:r.id, title:r.number||"Delivery Note", subtitle:r.customerName||r.customer?.name||"Customer", metaLeft:r.customerPhone||r.customer?.phone||"—", metaRight:r.deliveredBy||r.cashierName||"—", status:r.status||"DELIVERED", amount:r.itemsCount?`${r.itemsCount} item(s)`:"Document", createdAt:r.createdAt||r.date, rightHint:r.receivedBy?`Received by ${r.receivedBy}`:"Delivery proof" }));
  }
  return rows.map(r => ({ id:r.id, title:r.number||`${type.slice(0,-1)} document`, subtitle:r.customerName||r.customer?.name||"Walk-in Customer", metaLeft:r.customerPhone||r.customer?.phone||"—", metaRight:r.cashierName||r.preparedBy||"—", status:r.status||r.saleType||"—", amount:fmtMoney(r.total,r.currency||"RWF"), createdAt:r.date||r.createdAt, rightHint:r.receiptNumber?`Ref ${r.receiptNumber}`:"Branded print-ready document" }));
}

async function deleteByType(type, id) {
  if (type === "delivery-notes") return deleteDeliveryNote(id);
  if (type === "proformas")      return deleteProforma(id);
  if (type === "warranties")     return deleteWarranty(id);
  throw new Error("Delete is not supported for this document type");
}

// ─── Document row card ────────────────────────────────────────────────────────
function DocRow({ row, typeMeta, type, onDelete, deleting }) {
  const previewPath = `/app/documents/${type}/${encodeURIComponent(row.id)}/preview`;
  const editPath    = `/app/documents/${type}/${encodeURIComponent(row.id)}/edit`;

  return (
    <div className={cn(PNL(), "p-4 transition hover:ring-1 hover:ring-[var(--color-primary-ring)]")}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Left — title, subtitle, meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("truncate text-base font-bold", S())}>{row.title}</h3>
            <BadgePill status={row.status} />
          </div>
          <div className={cn("mt-1 text-sm", M())}>{row.subtitle}</div>
          <div className={cn("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs", M())}>
            <span>Contact: {row.metaLeft}</span>
            <span>Staff: {row.metaRight}</span>
            <span>Date: {fmtDate(row.createdAt)}</span>
          </div>
        </div>

        {/* Right — amount + actions */}
        <div className="flex flex-col gap-3 xl:w-auto xl:items-end">
          <div className="text-left xl:text-right">
            <div className={cn("text-lg font-bold", S())}>{row.amount}</div>
            <div className={cn("mt-1 text-xs", M())}>{row.rightHint}</div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {/* Preview — Link styled as button */}
            <Link to={previewPath}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-95">
              Preview
            </Link>
            {/* Print button — opens A4 print URL */}
            <button
              type="button"
              onClick={() => openDocumentPrint(type, row.id)}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
            >
              Print
            </button>
            {typeMeta.canEdit && (
              <Link to={editPath}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90">
                Edit
              </Link>
            )}
            {typeMeta.canDelete && (
              /* AsyncButton for delete — shows spinner while this row is being deleted */
              <AsyncButton
                loading={deleting} loadingText=""
                onClick={() => onDelete(row)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[rgba(219,80,74,0.12)] px-4 text-sm font-semibold text-[var(--color-danger)] transition hover:opacity-90 disabled:opacity-60"
              >
                Delete
              </AsyncButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function DocumentListPage({ type, title, subtitle, listFn }) {
  const [query,       setQuery]       = useState("");
  const [draftQuery,  setDraftQuery]  = useState("");
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId,   setDeletingId]   = useState("");

  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const typeMeta = useMemo(() => getTypeMeta(type), [type]);

  // Load data — AsyncButton spinner handled by `loading`/`refreshing` state
  async function load(search = "", { silent = false } = {}) {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await listFn(search);
      if (!mountedRef.current) return;
      setRows(normalizeListResponse(type, data));
    } catch(err) {
      if (!mountedRef.current) return;
      console.error(err); toast.error(err?.message || `Failed to load ${title.toLowerCase()}`);
      setRows([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { void load(""); }, []); // eslint-disable-line

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { if (draftQuery !== query) { setQuery(draftQuery); void load(draftQuery); } }, 350);
    return () => clearTimeout(t);
  }, [draftQuery]); // eslint-disable-line

  const cards       = useMemo(() => buildCards(type, rows), [type, rows]);
  const totalCount  = cards.length;
  const activeCount = cards.filter(x => ["PAID","SENT","CONVERTED","ACTIVE","COMPLETED","DELIVERED"].includes(String(x.status||"").toUpperCase())).length;
  const flaggedCount= cards.filter(x => ["PARTIAL","UNPAID","PENDING","EXPIRED","OVERDUE"].includes(String(x.status||"").toUpperCase())).length;

  async function handleConfirmDelete() {
    if (!deleteTarget?.id) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteByType(type, deleteTarget.id);
      toast.success(`${deleteTarget.title || typeMeta.singularLabel} deleted`);
      setDeleteTarget(null);
      await load(query, { silent: true });
    } catch(err) {
      console.error(err); toast.error(err?.message || `Failed to delete ${typeMeta.singularLabel}`);
    } finally {
      if (mountedRef.current) setDeletingId("");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className={cn(CARD(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", M())}>Document Centre</div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", S())}>{title}</h1>
              <p className={cn("mt-2 text-sm leading-6", M())}>{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Refresh — AsyncButton shows spinner while re-fetching */}
              <AsyncButton
                loading={refreshing} loadingText=""
                variant="secondary"
                onClick={() => load(query, { silent: true })}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={refreshing ? "animate-spin" : ""}>
                  <path d="M20 12a8 8 0 10-2.34 5.66M20 12V6m0 6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh
              </AsyncButton>
              {typeMeta.canCreate && typeMeta.actionTo && (
                <Link to={typeMeta.actionTo}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-95">
                  + {typeMeta.actionLabel}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-5 sm:px-6">
          <KpiStrip total={totalCount} active={activeCount} flagged={flaggedCount} label={typeMeta.statLabel} loading={loading} />
        </div>
      </div>

      {/* ── Search toolbar ── */}
      <div className={cn(CARD(), "px-5 py-4 sm:px-6")}>
        <form
          onSubmit={e => { e.preventDefault(); setQuery(draftQuery); void load(draftQuery); }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* app-input class for consistent dark/light mode */}
          <input
            className="app-input max-w-sm"
            placeholder={`Search ${title.toLowerCase()} by name, number, or phone…`}
            value={draftQuery}
            onChange={e => setDraftQuery(e.target.value)}
          />
          <div className="flex gap-2">
            {/* AsyncButton for search submit */}
            <AsyncButton type="submit" loading={loading && !!draftQuery} loadingText="Searching…" variant="primary">
              Search
            </AsyncButton>
            {draftQuery && (
              <AsyncButton type="button" variant="secondary"
                onClick={() => { setDraftQuery(""); setQuery(""); void load(""); }}>
                Clear
              </AsyncButton>
            )}
          </div>
        </form>
      </div>

      {/* ── Document list ── */}
      {/* DocCardSkeleton shows pulse blocks while loading */}
      {loading ? (
        <DocCardSkeleton rows={6} />
      ) : cards.length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} found`}
          note={query ? `No results for "${query}". Try a different search.` : "When documents exist, they will appear here for preview, printing, and editing."}
          linkTo="/app/documents"
          linkLabel="Back to Document Centre"
        />
      ) : (
        <div className="space-y-3">
          {cards.map(row => (
            <DocRow
              key={row.id}
              row={row}
              typeMeta={typeMeta}
              type={type}
              onDelete={setDeleteTarget}
              deleting={deletingId === row.id}
            />
          ))}
        </div>
      )}

      {/* Footer count */}
      {!loading && cards.length > 0 && (
        <div className={cn("px-1 text-xs", M())}>
          {cards.length} {title.toLowerCase()} · Click Preview to see the full branded document · Click Print for A4 layout
        </div>
      )}

      {/* ── Confirm delete modal ── */}
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete ${typeMeta.singularLabel}?`}
        body={`"${deleteTarget?.title || "This document"}" will be permanently removed. This cannot be undone.`}
        deleting={Boolean(deletingId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}