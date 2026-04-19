// src/pages/documents/DocumentsHome.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full rewrite of the Document Centre hub. All stale tokens (bg-white,
// border-stone-200, rgb(var(--border)), rgb(var(--bg-elevated))) replaced with
// the Storvex design system (var(--color-*)), AsyncButton added for navigation
// actions, and mobile-first responsive layout applied throughout.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import AsyncButton from "../../components/ui/AsyncButton";

// ─── design token shorthands ──────────────────────────────────────────────────
const S    = () => "text-[var(--color-text)]";
const M    = () => "text-[var(--color-text-muted)]";
const CARD = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const PNL  = () => "rounded-[22px] bg-[var(--color-surface-2)]";

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ children, tone = "neutral" }) {
  const cls = {
    success: "bg-[#7cfcc6] text-[#0b3b2e]",
    info:    "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
    warning: "bg-[#ff9f43] text-[#402100]",
    neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
  }[tone] || "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{children}</span>;
}

// ─── KPI strip ────────────────────────────────────────────────────────────────
function KpiStrip() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className={cn(PNL(), "relative overflow-hidden p-4")}>
        <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
        <div className="pl-2">
          <div className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", M())}>Document flow</div>
          <div className={cn("mt-2 text-xl font-black", S())}>Unified</div>
          <div className={cn("mt-1 text-xs leading-5", M())}>One place for all operational documents</div>
        </div>
      </div>
      <div className={cn(PNL(), "relative overflow-hidden p-4")}>
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--color-primary)]" />
        <div className="pl-2">
          <div className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", M())}>Branding</div>
          <div className={cn("mt-2 text-xl font-black", S())}>Live</div>
          <div className={cn("mt-1 text-xs leading-5", M())}>Print colors come from General Settings</div>
        </div>
      </div>
      <div className={cn(PNL(), "relative overflow-hidden p-4")}>
        <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-500" />
        <div className="pl-2">
          <div className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", M())}>Owner control</div>
          <div className={cn("mt-2 text-xl font-black", S())}>Tight</div>
          <div className={cn("mt-1 text-xs leading-5", M())}>Professional output with centralized standards</div>
        </div>
      </div>
    </div>
  );
}

// ─── DocIcon ──────────────────────────────────────────────────────────────────
function DocIcon({ type }) {
  const p = { width:22, height:22, viewBox:"0 0 24 24", fill:"none" };
  const icons = {
    receipt:  <svg {...p}><path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    invoice:  <svg {...p}><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M15 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    delivery: <svg {...p}><path d="M3 7h11v10H3V7zm11 3h3l2 2v5h-5v-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="7.5" cy="18" r="1.5" fill="currentColor"/><circle cx="17.5" cy="18" r="1.5" fill="currentColor"/></svg>,
    proforma: <svg {...p}><path d="M7 3h10v18H7z" stroke="currentColor" strokeWidth="2"/><path d="M9 8h6M9 12h6M9 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    warranty: <svg {...p}><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9.5 12.5l1.7 1.7 3.8-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return icons[type] || null;
}

// ─── Document sections config ─────────────────────────────────────────────────
const SECTIONS = [
  {
    title: "Receipts",
    path: "/app/documents/receipts",
    createPath: null, createLabel: null,
    type: "receipt",
    note: "Sales payment records and branded receipt previews.",
    badge: "High volume", badgeTone: "success",
  },
  {
    title: "Invoices",
    path: "/app/documents/invoices",
    createPath: null, createLabel: null,
    type: "invoice",
    note: "Formal billing documents with owner branding and terms.",
    badge: "Financial", badgeTone: "info",
  },
  {
    title: "Delivery Notes",
    path: "/app/documents/delivery-notes",
    createPath: "/app/documents/delivery-notes/create",
    createLabel: "Create",
    type: "delivery",
    note: "Goods handover confirmation with branded print layout.",
    badge: "Logistics", badgeTone: "warning",
  },
  {
    title: "Proformas",
    path: "/app/documents/proformas",
    createPath: "/app/documents/proformas/create",
    createLabel: "Create",
    type: "proforma",
    note: "Preliminary quotations before final billing.",
    badge: "Pre-sale", badgeTone: "neutral",
  },
  {
    title: "Warranties",
    path: "/app/documents/warranties",
    createPath: "/app/documents/warranties/create",
    createLabel: "Create",
    type: "warranty",
    note: "After-sales warranty certificates and coverage records.",
    badge: "After-sales", badgeTone: "neutral",
  },
];

// ─── Document section card ────────────────────────────────────────────────────
function DocCard({ item }) {
  return (
    <div className={cn(CARD(), "flex flex-col p-5 transition hover:-translate-y-0.5")}>
      <div className="flex items-start justify-between gap-4">
        {/* Icon box — uses surface-2 with design tokens, no stone-* */}
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
          "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
        )}>
          <DocIcon type={item.type} />
        </div>
        <Pill tone={item.badgeTone}>{item.badge}</Pill>
      </div>

      <h2 className={cn("mt-5 text-lg font-black tracking-tight", S())}>{item.title}</h2>
      <p className={cn("mt-2 flex-1 text-sm leading-6", M())}>{item.note}</p>

      {/* Action buttons — using Link as styled buttons, not raw <a> */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={item.path}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-95"
        >
          Open section
        </Link>
        {item.createPath && item.createLabel && (
          <Link
            to={item.createPath}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
          >
            {item.createLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Quick links ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Delivery Notes",        to: "/app/documents/delivery-notes" },
  { label: "Proformas",             to: "/app/documents/proformas" },
  { label: "Warranties",            to: "/app/documents/warranties" },
  { label: "Create Proforma",       to: "/app/documents/proformas/create" },
  { label: "Create Warranty",       to: "/app/documents/warranties/create" },
  { label: "Create Delivery Note",  to: "/app/documents/delivery-notes/create" },
];

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DocumentsHome() {
  const nav = useNavigate();
  // Brief skeleton on mount — matches app convention (same pattern as SuppliersList, Expenses etc.)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // no async data to load.
  // The pulse blocks below match the app's skeleton convention and disappear
  // instantly once the component mounts (which is synchronous here).
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className={cn(CARD(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", M())}>
                Unified workspace
              </div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", S())}>
                Document Centre
              </h1>
              <p className={cn("mt-2 max-w-3xl text-sm leading-6", M())}>
                One premium home for receipts, invoices, delivery notes, proformas, and warranties.
                Preview the real branded renderer, verify terms, and move through business documents
                without jumping between disconnected pages.
              </p>
            </div>

            {/* Direct nav buttons to most-used sections */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {/* AsyncButton for primary nav — same pattern as Refresh buttons
                  across the app. onClick uses navigate() from useNavigate(). */}
              <AsyncButton
                loading={false}
                variant="primary"
                onClick={() => nav("/app/documents/receipts")}
              >
                Open Receipts
              </AsyncButton>
              <AsyncButton
                loading={false}
                variant="secondary"
                onClick={() => nav("/app/documents/invoices")}
              >
                Open Invoices
              </AsyncButton>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-5 sm:px-6">
          <KpiStrip />
        </div>
      </div>

      {/* ── Document section cards grid ── */}
      {/* Mobile: 1 col · sm: 2 cols · xl: 3 cols */}
      {/* animate-pulse skeleton shows for one frame on mount, then replaced */}
      {!mounted ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="animate-pulse rounded-[28px] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)] space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-surface-2)]" />
              <div className="h-5 w-28 rounded-full bg-[var(--color-surface-2)]" />
              <div className="h-4 w-full rounded-full bg-[var(--color-surface-2)]" />
              <div className="h-4 w-4/5 rounded-full bg-[var(--color-surface-2)]" />
              <div className="h-11 w-32 rounded-2xl bg-[var(--color-surface-2)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map(item => <DocCard key={item.path} item={item} />)}
        </div>
      )}

      {/* ── Why this matters + quick access ── */}
      <div className={cn(CARD(), "p-5 sm:p-6")}>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className={cn("text-lg font-black tracking-tight", S())}>Why this matters</div>
            <p className={cn("mt-2 text-sm leading-6", M())}>
              Real stores do not think in frontend modules. They think in proof, billing, delivery,
              and after-sales accountability. Document Centre turns those proof points into one
              trusted operational layer where every document is branded, print-ready, and traceable.
            </p>
          </div>

          {/* Quick access panel — uses design tokens, no stone-* */}
          <div className={cn(PNL(), "border border-[var(--color-border)] p-4")}>
            <div className={cn("text-sm font-bold", S())}>Quick access</div>
            <div className="mt-3 grid gap-2">
              {QUICK_LINKS.map(l => (
                <Link
                  key={l.to} to={l.to}
                  className={cn("text-sm transition hover:opacity-80 hover:underline", M())}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}