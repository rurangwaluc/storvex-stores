import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { cn } from "../../lib/cn";
import AsyncButton from "../../components/ui/AsyncButton";

import { listReceipts } from "../../services/receiptsApi";
import { listInvoices } from "../../services/invoicesApi";
import {
  listDeliveryNotes,
  deleteDeliveryNote,
} from "../../services/deliveryNotesApi";
import { listWarranties, deleteWarranty } from "../../services/warrantiesApi";
import { listProformas, deleteProforma } from "../../services/proformasApi";
import {
  buildDocumentPrintUrl,
  openDocumentPrint,
} from "../../services/documentPrint";

const S = () => "text-[var(--color-text)]";
const M = () => "text-[var(--color-text-muted)]";
const card = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const panel = () => "rounded-[22px] bg-[var(--color-surface-2)]";

const TYPE_CFG = {
  receipts: {
    label: "Receipts",
    abbr: "RC",
    tabLabel: "Receipts",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
    resource: "receipts",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    singular: "receipt",
    createTo: null,
    editTo: () => null,
    fetch: (q) => listReceipts(q),
    normalize: (rows) =>
      (Array.isArray(rows?.receipts) ? rows.receipts : []).map((r) => ({
        id: r.id,
        type: "receipts",
        num: r.receiptNumber || r.number || r.id?.slice(-8),
        cust: r.customer?.name || r.customerName || "Walk-in",
        phone: r.customer?.phone || r.customerPhone || "",
        status: r.status || r.saleType || "PAID",
        amount: Number(r.total || 0),
        date: r.createdAt || r.date || null,
        hint:
          Number(r.balanceDue || 0) > 0
            ? `Balance: ${fmtAmt(r.balanceDue)} RWF`
            : null,
      })),
  },
  invoices: {
    label: "Invoices",
    abbr: "IN",
    tabLabel: "Invoices",
    iconBg: "bg-[var(--color-primary-soft)]",
    iconText: "text-[var(--color-primary)]",
    resource: "invoices",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    singular: "invoice",
    createTo: null,
    editTo: () => null,
    fetch: (q) => listInvoices(q),
    normalize: (rows) =>
      (Array.isArray(rows?.invoices) ? rows.invoices : []).map((r) => ({
        id: r.id,
        type: "invoices",
        num: r.invoiceNumber || r.number || r.id?.slice(-8),
        cust: r.customer?.name || r.customerName || "Walk-in",
        phone: r.customer?.phone || r.customerPhone || "",
        status: r.status || "INVOICE",
        amount: Number(r.total || 0),
        date: r.createdAt || r.date || null,
        hint:
          Number(r.balanceDue || 0) > 0
            ? `Balance: ${fmtAmt(r.balanceDue)} RWF`
            : null,
      })),
  },
  "delivery-notes": {
    label: "Delivery Notes",
    abbr: "DN",
    tabLabel: "Delivery",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    resource: "delivery-notes",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    singular: "delivery note",
    createTo: "/app/documents/delivery-notes/create",
    editTo: (id) => `/app/documents/delivery-notes/${encodeURIComponent(id)}/edit`,
    fetch: (q) => listDeliveryNotes(q),
    normalize: (rows) =>
      (Array.isArray(rows?.deliveryNotes) ? rows.deliveryNotes : []).map((r) => ({
        id: r.id,
        type: "delivery-notes",
        num: r.number || r.id?.slice(-8),
        cust: r.customerName || r.customer?.name || "Customer",
        phone: r.customerPhone || r.customer?.phone || "",
        status: r.status || "DELIVERED",
        amount: null,
        date: r.createdAt || r.date || null,
        hint: r.itemsCount ? `${r.itemsCount} item(s)` : null,
      })),
  },
  proformas: {
    label: "Proformas",
    abbr: "PF",
    tabLabel: "Proformas",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-600 dark:text-purple-400",
    resource: "proformas",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    singular: "proforma",
    createTo: "/app/documents/proformas/create",
    editTo: (id) => `/app/documents/proformas/${encodeURIComponent(id)}/edit`,
    fetch: (q) => listProformas(q),
    normalize: (rows) =>
      (Array.isArray(rows?.proformas) ? rows.proformas : []).map((r) => ({
        id: r.id,
        type: "proformas",
        num: r.number || r.id?.slice(-8),
        cust: r.customerName || r.customer?.name || "Customer",
        phone: r.customerPhone || r.customer?.phone || "",
        status: r.status || "DRAFT",
        amount: Number(r.total || 0),
        date: r.createdAt || null,
        hint: r.validUntil ? `Valid until ${fmtDate(r.validUntil)}` : null,
      })),
  },
  warranties: {
    label: "Warranties",
    abbr: "WR",
    tabLabel: "Warranty",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600 dark:text-teal-400",
    resource: "warranties",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    singular: "warranty",
    createTo: "/app/documents/warranties/create",
    editTo: (id) => `/app/documents/warranties/${encodeURIComponent(id)}/edit`,
    fetch: (q) => listWarranties(q),
    normalize: (rows) =>
      (Array.isArray(rows?.warranties) ? rows.warranties : []).map((r) => ({
        id: r.id,
        type: "warranties",
        num: r.number || r.id?.slice(-8),
        cust: r.customerName || r.customer?.name || "Customer",
        phone: r.customerPhone || r.customer?.phone || "",
        status: r.status || "ACTIVE",
        amount: null,
        date: r.createdAt || null,
        hint: r.endsAt ? `Ends ${fmtDate(r.endsAt)}` : null,
      })),
  },
};

const TYPE_KEYS = ["receipts", "invoices", "delivery-notes", "proformas", "warranties"];

function fmtAmt(n) {
  return Number(n || 0).toLocaleString();
}

function fmtMoney(n) {
  return n == null ? null : `${fmtAmt(n)} RWF`;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function fmtDateShort(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function statusCls(s) {
  const v = String(s || "").toUpperCase();
  if (["PAID", "DELIVERED", "ACTIVE", "COMPLETED", "CONVERTED", "SENT"].includes(v)) {
    return "badge-success";
  }
  if (
    ["PARTIAL", "DRAFT", "PENDING", "EXPIRING", "EXPIRING SOON", "PROFORMA", "INVOICE"].includes(
      v
    )
  ) {
    return "badge-warning";
  }
  if (["OVERDUE", "EXPIRED", "CANCELLED", "RETURNED"].includes(v)) {
    return "badge-danger";
  }
  return "badge-neutral";
}

async function deleteDoc(type, id) {
  if (type === "delivery-notes") return deleteDeliveryNote(id);
  if (type === "proformas") return deleteProforma(id);
  if (type === "warranties") return deleteWarranty(id);
  throw new Error("Delete not supported for this document type");
}

function RowSkeleton({ count = 8 }) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-4 animate-pulse sm:px-5"
        >
          <div className="h-[38px] w-[38px] shrink-0 rounded-[10px] bg-[var(--color-surface)]" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 w-32 rounded-full bg-[var(--color-surface)]" />
            <div className="h-3 w-44 max-w-full rounded-full bg-[var(--color-surface)]" />
            <div className="h-5 w-16 rounded-full bg-[var(--color-surface)]" />
          </div>
          <div className="w-20 shrink-0 space-y-2 pt-0.5 text-right">
            <div className="ml-auto h-3.5 w-20 rounded-full bg-[var(--color-surface)]" />
            <div className="ml-auto h-3 w-14 rounded-full bg-[var(--color-surface)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DocRow({ doc, selected, onClick }) {
  const cfg = TYPE_CFG[doc.type];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full min-w-0 items-start gap-3 border-b border-[var(--color-border)] px-4 py-4 text-left transition-colors sm:px-5",
        selected ? "bg-[var(--color-primary-soft)]" : "hover:bg-[var(--color-surface-2)]"
      )}
    >
      {selected ? (
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-[var(--color-primary)]" />
      ) : null}

      <div
        className={cn(
          "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[11px] font-black",
          cfg.iconBg,
          cfg.iconText
        )}
      >
        {cfg.abbr}
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[13.5px] font-bold leading-snug", S())}>{doc.num}</div>
        <div className={cn("mt-0.5 truncate text-xs leading-snug", M())}>
          {doc.cust}
          {doc.phone ? ` · ${doc.phone}` : ""}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={statusCls(doc.status)}>{doc.status}</span>
          {doc.hint ? <span className={cn("text-[11px] font-medium", M())}>{doc.hint}</span> : null}
        </div>
      </div>

      <div className="w-[92px] shrink-0 text-right">
        {doc.amount != null && doc.amount > 0 ? (
          <div className={cn("truncate text-sm font-bold tabular-nums", S())}>{fmtMoney(doc.amount)}</div>
        ) : doc.hint && doc.amount == null ? (
          <div className={cn("truncate text-[12px] font-semibold", M())}>{doc.hint}</div>
        ) : null}
        <div className={cn("mt-0.5 text-[11px]", M())}>{fmtDateShort(doc.date)}</div>
      </div>
    </button>
  );
}

function EmptyList({ query }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-2xl">
        📄
      </div>
      <div className={cn("text-sm font-bold", S())}>
        {query ? `No results for "${query}"` : "No documents yet"}
      </div>
      <div className={cn("mt-1 text-xs leading-5", M())}>
        {query ? "Try a different search term." : "Documents will appear here once created."}
      </div>
    </div>
  );
}

function PreviewPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-3xl">
          📄
        </div>
        <div className={cn("text-base font-black tracking-tight", S())}>
          Select a document to preview
        </div>
        <div className={cn("mx-auto mt-2 max-w-[260px] text-sm leading-6", M())}>
          Open any row from the left to view the live A4 renderer with your store branding.
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, body, loading, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />
      <div className={cn(card(), "relative z-10 w-full max-w-md p-6 space-y-4")}>
        <div className={cn("text-base font-black tracking-tight", S())}>{title}</div>
        <div className={cn("text-sm leading-6", M())}>{body}</div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AsyncButton variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </AsyncButton>

          <AsyncButton
            loading={loading}
            loadingText="Deleting…"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            Delete
          </AsyncButton>
        </div>
      </div>
    </div>
  );
}

function PreviewBar({ doc, onBack, onDelete, deleting }) {
  const cfg = TYPE_CFG[doc.type];
  const editUrl = cfg.editTo?.(doc.id);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 sm:px-5">
      <div className="mr-auto min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={cn("truncate text-sm font-bold", S())}>{doc.num}</span>
          <span className={cn("hidden text-xs md:inline", M())}>
            {cfg.label} Preview · Live A4 Renderer
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs font-semibold transition hover:opacity-90",
          M()
        )}
      >
        ← Back to list
      </button>

      {editUrl ? (
        <Link
          to={editUrl}
          className={cn(
            "inline-flex h-9 items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs font-semibold transition hover:opacity-90",
            S()
          )}
        >
          Edit
        </Link>
      ) : null}

      {cfg.canDelete ? (
        <AsyncButton
          loading={deleting}
          loadingText=""
          onClick={() => onDelete(doc)}
          className="h-9 rounded-2xl bg-[rgba(219,80,74,0.1)] px-3 text-xs font-semibold text-[var(--color-danger)] transition hover:opacity-90 disabled:opacity-60"
        >
          Delete
        </AsyncButton>
      ) : null}

      <AsyncButton
        loading={false}
        variant="primary"
        onClick={() => openDocumentPrint(cfg.resource, doc.id)}
        className="h-9 gap-1.5 rounded-2xl px-4 text-xs font-semibold"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        Print A4
      </AsyncButton>
    </div>
  );
}

function PreviewPanel({ selected, onBack, onDelete, deleting }) {
  if (!selected) return <PreviewPlaceholder />;

  const cfg = TYPE_CFG[selected.type];
  const printUrl = buildDocumentPrintUrl(cfg.resource, selected.id);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <PreviewBar doc={selected} onBack={onBack} onDelete={onDelete} deleting={deleting} />

      <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        <iframe
          key={printUrl}
          title={`${cfg.label} ${selected.id}`}
          src={printUrl}
          className="h-full w-full rounded-[18px] border border-[var(--color-border)] bg-white"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export default function DocumentCenterPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [allDocs, setAllDocs] = useState({});
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    document.title = "Document Centre • Storvex";
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const results = await Promise.allSettled(TYPE_KEYS.map((k) => TYPE_CFG[k].fetch(q)));

        if (!mountedRef.current) return;

        const next = {};
        TYPE_KEYS.forEach((k, i) => {
          const result = results[i];
          next[k] = result.status === "fulfilled" ? TYPE_CFG[k].normalize(result.value) : [];
        });

        setAllDocs(next);
        setCounts(Object.fromEntries(TYPE_KEYS.map((k) => [k, next[k].length])));

        if (selected) {
          const freshSelected = TYPE_KEYS.flatMap((k) => next[k]).find(
            (d) => d.id === selected.id && d.type === selected.type
          );
          setSelected(freshSelected || null);
        }
      } catch {
        if (!mountedRef.current) return;
        toast.error("Failed to load documents");
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [q, selected]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setQ(draftQ.trim()), 350);
    return () => clearTimeout(t);
  }, [draftQ]);

  const visibleDocs = useMemo(() => {
    const src =
      activeTab === "all"
        ? TYPE_KEYS.flatMap((k) => allDocs[k] || [])
        : allDocs[activeTab] || [];

    return [...src].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [allDocs, activeTab]);

  const totalCount = useMemo(
    () => TYPE_KEYS.reduce((sum, k) => sum + (counts[k] || 0), 0),
    [counts]
  );

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteDoc(deleteTarget.type, deleteTarget.id);
      toast.success(`${TYPE_CFG[deleteTarget.type].singular} deleted`);

      if (selected?.id === deleteTarget.id && selected?.type === deleteTarget.type) {
        setSelected(null);
      }

      setDeleteTarget(null);
      await load({ silent: true });
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    } finally {
      if (mountedRef.current) setDeleting(false);
    }
  }

  const tabs = [
    { key: "all", label: "All", count: totalCount },
    { key: "receipts", label: "Receipts", count: counts.receipts || 0 },
    { key: "invoices", label: "Invoices", count: counts.invoices || 0 },
    { key: "delivery-notes", label: "Delivery", count: counts["delivery-notes"] || 0 },
    { key: "proformas", label: "Proformas", count: counts.proformas || 0 },
    { key: "warranties", label: "Warranty", count: counts.warranties || 0 },
  ];

  const activeCfg = activeTab !== "all" ? TYPE_CFG[activeTab] : null;
  const showCreate = Boolean(activeCfg?.canCreate && activeCfg?.createTo);

  const monthChip = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn(card(), "h-[calc(100vh-84px)] overflow-hidden")}>
      <div className="flex h-full min-w-0 overflow-hidden">
        <div
          className={cn(
            "min-w-0 flex-col border-r border-[var(--color-border)]",
            selected ? "hidden md:flex md:w-[380px] xl:w-[420px]" : "flex w-full md:w-[380px] xl:w-[420px]"
          )}
        >
          <div className="border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className={cn("text-xl font-black tracking-tight", S())}>Document Centre</h1>
                <p className={cn("mt-0.5 text-xs", M())}>
                  All receipts, invoices, delivery notes and warranties
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <AsyncButton
                  loading={refreshing}
                  loadingText=""
                  variant="secondary"
                  onClick={() => load({ silent: true })}
                  className="h-8 w-8 justify-center rounded-[10px] px-0 text-xs"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={refreshing ? "animate-spin" : ""}
                  >
                    <path
                      d="M20 12a8 8 0 10-2.34 5.66M20 12V6m0 6h-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </AsyncButton>

                {showCreate ? (
                  <Link
                    to={activeCfg.createTo}
                    className="inline-flex h-8 items-center rounded-[10px] bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition hover:opacity-95"
                  >
                    + New
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--color-border)] px-3 py-2 sm:px-4">
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex min-w-0 items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[12px] font-semibold transition",
                    activeTab === tab.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      activeTab === tab.key
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-card)] text-[var(--color-text-muted)]"
                    )}
                  >
                    {loading ? "…" : tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-[var(--color-border)] px-4 py-2.5 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <svg
                  className={cn(
                    "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2",
                    M()
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  className={cn(
                    "h-10 w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-2)] pl-9 pr-3 text-xs",
                    "text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition",
                    "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                  )}
                  placeholder="Search by customer or document number..."
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                />
              </div>

              <div
                className={cn(
                  "flex shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[11px] font-medium",
                  M()
                )}
              >
                📅 {monthChip}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {loading ? (
              <RowSkeleton count={9} />
            ) : visibleDocs.length === 0 ? (
              <EmptyList query={q} />
            ) : (
              visibleDocs.map((doc) => (
                <DocRow
                  key={`${doc.type}-${doc.id}`}
                  doc={doc}
                  selected={selected?.id === doc.id && selected?.type === doc.type}
                  onClick={() => setSelected(doc)}
                />
              ))
            )}
          </div>

          {!loading && visibleDocs.length > 0 ? (
            <div className={cn("border-t border-[var(--color-border)] px-4 py-2 text-[11px] sm:px-5", M())}>
              {visibleDocs.length} document(s) · Select any row to preview
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden",
            !selected ? "hidden md:flex md:flex-col" : "flex flex-col"
          )}
        >
          <PreviewPanel
            selected={selected}
            onBack={() => setSelected(null)}
            onDelete={setDeleteTarget}
            deleting={deleting && deleteTarget?.id === selected?.id}
          />
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget ? TYPE_CFG[deleteTarget.type]?.singular : "document"}?`}
        body={`"${deleteTarget?.num || "This document"}" will be permanently removed. This cannot be undone.`}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}