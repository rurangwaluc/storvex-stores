import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteDeliveryNote } from "../../services/deliveryNotesApi";
import { deleteProforma } from "../../services/proformasApi";
import { deleteWarranty } from "../../services/warrantiesApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function panel() {
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
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

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-rose-300 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800/50 dark:bg-[rgb(var(--bg))] dark:text-rose-300 dark:hover:bg-rose-950/20";
}

function badgeClass(kind = "neutral") {
  if (kind === "success") return "badge-success";
  if (kind === "warning") return "badge-warning";
  if (kind === "danger") return "badge-danger";
  if (kind === "info") return "badge-info";
  return "badge-neutral";
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDate(value) {
  const d = safeDate(value);
  return d ? d.toLocaleDateString() : "—";
}

function formatMoney(n, currency = "RWF") {
  return `${currency} ${Number(n || 0).toLocaleString()}`;
}

function statusKind(status) {
  const s = String(status || "").toUpperCase();
  if (["PAID", "COMPLETED", "CONVERTED", "ACTIVE", "SENT", "DELIVERED"].includes(s)) return "success";
  if (["PARTIAL", "DRAFT", "PENDING", "UNPAID", "EXPIRING"].includes(s)) return "warning";
  if (["CANCELLED", "EXPIRED", "OVERDUE", "RETURNED"].includes(s)) return "danger";
  return "neutral";
}

function accentBar(tone = "neutral") {
  if (tone === "success") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  if (tone === "danger") return "bg-rose-500";
  if (tone === "info") return "bg-sky-500";
  return "bg-stone-950 dark:bg-[rgb(var(--text))]";
}

function SummaryCard({ label, value, note, tone = "neutral", loading = false }) {
  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accentBar(tone))} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>

        {loading ? (
          <>
            <div className="mt-3 h-8 w-24 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
            <div className="mt-2 h-4 w-40 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          </>
        ) : (
          <>
            <div className={cx("mt-2 text-2xl font-semibold tracking-tight", strongText())}>
              {value}
            </div>
            {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}

function TableSkeletonRows({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 animate-pulse dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-5 w-40 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
              <div className="mt-3 h-4 w-52 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
              <div className="mt-3 h-4 w-64 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 rounded-2xl bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
              <div className="h-10 w-24 rounded-2xl bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, note, linkTo, linkLabel }) {
  return (
    <div className={cx(shell(), "p-10 text-center")}>
      <h3 className={cx("text-lg font-semibold", strongText())}>{title}</h3>
      <p className={cx("mt-2 text-sm", mutedText())}>{note}</p>
      {linkTo && linkLabel ? (
        <div className="mt-5">
          <Link to={linkTo} className={secondaryBtn()}>
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ConfirmDeleteModal({
  open,
  title,
  body,
  deleting,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className={cx(shell(), "w-full max-w-md p-5")}>
        <h3 className={cx("text-lg font-semibold", strongText())}>{title}</h3>
        <p className={cx("mt-2 text-sm leading-6", mutedText())}>{body}</p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={secondaryBtn()} disabled={deleting}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={dangerBtn()} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeListResponse(type, data) {
  if (type === "receipts") return Array.isArray(data?.receipts) ? data.receipts : [];
  if (type === "invoices") return Array.isArray(data?.invoices) ? data.invoices : [];
  if (type === "proformas") return Array.isArray(data?.proformas) ? data.proformas : [];
  if (type === "warranties") return Array.isArray(data?.warranties) ? data.warranties : [];
  if (type === "delivery-notes") return Array.isArray(data?.deliveryNotes) ? data.deliveryNotes : [];
  return [];
}

function getTypeMeta(type) {
  if (type === "receipts") {
    return {
      icon: "Receipt",
      actionLabel: "Open POS sales",
      actionTo: "/app/pos/sales",
      statLabel: "Payment records",
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
  }

  if (type === "invoices") {
    return {
      icon: "Invoice",
      actionLabel: "Open POS sales",
      actionTo: "/app/pos/sales",
      statLabel: "Formal billing",
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
  }

  if (type === "delivery-notes") {
    return {
      icon: "Delivery",
      actionLabel: "Create delivery note",
      actionTo: "/app/documents/delivery-notes/create",
      statLabel: "Goods handover",
      canCreate: true,
      canEdit: true,
      canDelete: true,
      singularLabel: "delivery note",
    };
  }

  if (type === "proformas") {
    return {
      icon: "Proforma",
      actionLabel: "Create proforma",
      actionTo: "/app/documents/proformas/create",
      statLabel: "Quotations",
      canCreate: true,
      canEdit: true,
      canDelete: true,
      singularLabel: "proforma",
    };
  }

  if (type === "warranties") {
    return {
      icon: "Warranty",
      actionLabel: "Create warranty",
      actionTo: "/app/documents/warranties/create",
      statLabel: "After-sales proof",
      canCreate: true,
      canEdit: true,
      canDelete: true,
      singularLabel: "warranty",
    };
  }

  return {
    icon: "Document",
    actionLabel: null,
    actionTo: null,
    statLabel: "Documents",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    singularLabel: "document",
  };
}

function buildCards(type, rows) {
  if (type === "warranties") {
    return rows.map((row) => ({
      id: row.id,
      title: row.number || "Warranty",
      subtitle: row.customerName || row.customer?.name || "Walk-in Customer",
      metaLeft: row.customerPhone || row.customer?.phone || "—",
      metaRight: row.cashierName || row.issuedBy || "—",
      status: row.policy || row.status || "Warranty",
      amount: row.endsAt ? `Ends ${formatDate(row.endsAt)}` : "No end date",
      createdAt: row.createdAt,
      rightHint: row.unitsCount ? `${row.unitsCount} covered unit(s)` : "Coverage record",
    }));
  }

  if (type === "proformas") {
    return rows.map((row) => ({
      id: row.id,
      title: row.number || "Proforma",
      subtitle: row.customerName || row.customer?.name || "Customer",
      metaLeft: row.customerPhone || row.customer?.phone || row.customerEmail || "—",
      metaRight: row.preparedBy || row.cashierName || "—",
      status: row.status || "DRAFT",
      amount: formatMoney(row.total, row.currency || "RWF"),
      createdAt: row.createdAt,
      rightHint: row.validUntil ? `Valid until ${formatDate(row.validUntil)}` : "No validity date",
    }));
  }

  if (type === "delivery-notes") {
    return rows.map((row) => ({
      id: row.id,
      title: row.number || "Delivery Note",
      subtitle: row.customerName || row.customer?.name || "Customer",
      metaLeft: row.customerPhone || row.customer?.phone || "—",
      metaRight: row.deliveredBy || row.cashierName || "—",
      status: row.status || "DELIVERED",
      amount: row.itemsCount ? `${row.itemsCount} item(s)` : "Document",
      createdAt: row.createdAt || row.date,
      rightHint: row.receivedBy ? `Received by ${row.receivedBy}` : "Delivery proof",
    }));
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.number || `${type.slice(0, -1)} document`,
    subtitle: row.customerName || row.customer?.name || "Walk-in Customer",
    metaLeft: row.customerPhone || row.customer?.phone || "—",
    metaRight: row.cashierName || row.preparedBy || "—",
    status: row.status || row.saleType || "—",
    amount: formatMoney(row.total, row.currency || "RWF"),
    createdAt: row.date || row.createdAt,
    rightHint: row.receiptNumber ? `Ref ${row.receiptNumber}` : "Branded print-ready document",
  }));
}

async function deleteByType(type, id) {
  if (type === "delivery-notes") return deleteDeliveryNote(id);
  if (type === "proformas") return deleteProforma(id);
  if (type === "warranties") return deleteWarranty(id);
  throw new Error("Delete is not supported for this document type");
}

export default function DocumentListPage({
  type,
  title,
  subtitle,
  listFn,
}) {
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const typeMeta = useMemo(() => getTypeMeta(type), [type]);

  async function load(search = "") {
    try {
      setLoading(true);
      const data = await listFn(search);
      setRows(normalizeListResponse(type, data));
    } catch (err) {
      console.error(err);
      toast.error(err?.message || `Failed to load ${title.toLowerCase()}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  const cards = useMemo(() => buildCards(type, rows), [type, rows]);

  const totalCount = cards.length;
  const activeCount = cards.filter((x) =>
    ["PAID", "SENT", "CONVERTED", "ACTIVE", "COMPLETED", "DELIVERED"].includes(
      String(x.status || "").toUpperCase()
    )
  ).length;
  const flaggedCount = cards.filter((x) =>
    ["PARTIAL", "UNPAID", "PENDING", "EXPIRED", "OVERDUE"].includes(
      String(x.status || "").toUpperCase()
    )
  ).length;

  function previewPath(id) {
    return `/app/documents/${type}/${encodeURIComponent(id)}/preview`;
  }

  function editPath(id) {
    return `/app/documents/${type}/${encodeURIComponent(id)}/edit`;
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?.id) return;

    try {
      setDeletingId(deleteTarget.id);
      await deleteByType(type, deleteTarget.id);
      toast.success(`${deleteTarget.title || typeMeta.singularLabel} deleted`);
      setDeleteTarget(null);
      await load(query);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || `Failed to delete ${typeMeta.singularLabel}`);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete ${typeMeta.singularLabel || "document"}?`}
        body={
          deleteTarget
            ? `You are about to permanently delete "${deleteTarget.title}". This action cannot be undone.`
            : ""
        }
        deleting={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        onCancel={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <section className={cx(shell(), "relative overflow-hidden p-5 md:p-6")}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 opacity-[0.03] dark:from-white dark:via-white dark:to-white dark:opacity-[0.04]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Document workspace
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              {title}
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/documents" className={secondaryBtn()}>
              Document Center
            </Link>

            {typeMeta.actionTo && typeMeta.actionLabel ? (
              <Link to={typeMeta.actionTo} className={primaryBtn()}>
                {typeMeta.actionLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard
            label="Total"
            value={String(totalCount)}
            note={`${typeMeta.statLabel} available`}
            tone="neutral"
            loading={loading}
          />
          <SummaryCard
            label="Healthy"
            value={String(activeCount)}
            note="Active / completed documents"
            tone="success"
            loading={loading}
          />
          <SummaryCard
            label="Needs attention"
            value={String(flaggedCount)}
            note={query ? `Filtered by: ${query}` : "Pending / unpaid / expiring"}
            tone={flaggedCount > 0 ? "warning" : "info"}
            loading={loading}
          />
        </div>
      </section>

      <section className={cx(panel(), "p-4 md:p-5")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className={cx("text-base font-semibold", strongText())}>Search and explore</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Find documents fast and move directly into preview, edit, or lifecycle actions.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(draftQuery);
              load(draftQuery);
            }}
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              className={inputClass()}
              placeholder={`Search ${title.toLowerCase()}...`}
            />

            <button type="submit" className={primaryBtn()}>
              Search
            </button>

            <button
              type="button"
              className={secondaryBtn()}
              onClick={() => {
                setDraftQuery("");
                setQuery("");
                load("");
              }}
            >
              Reset
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <TableSkeletonRows rows={6} />
        ) : cards.length === 0 ? (
          <EmptyState
            title={`No ${title.toLowerCase()} found`}
            note="When documents exist, they will appear here for preview, editing, and printing."
            linkTo="/app/documents"
            linkLabel="Back to Document Center"
          />
        ) : (
          cards.map((row) => {
            const isDeletingThis = deletingId === row.id;

            return (
              <article
                key={row.id}
                className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:hover:border-[rgb(var(--border-strong))]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={cx("truncate text-base font-semibold", strongText())}>
                        {row.title}
                      </h3>
                      <span className={badgeClass(statusKind(row.status))}>{row.status}</span>
                    </div>

                    <div className={cx("mt-1 text-sm", mutedText())}>{row.subtitle}</div>

                    <div className={cx("mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs", softText())}>
                      <span>Contact: {row.metaLeft}</span>
                      <span>Staff: {row.metaRight}</span>
                      <span>Date: {formatDate(row.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 xl:w-[420px] xl:items-end">
                    <div className="text-left xl:text-right">
                      <div className={cx("text-lg font-semibold", strongText())}>{row.amount}</div>
                      <div className={cx("mt-1 text-xs", softText())}>{row.rightHint}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Link to={previewPath(row.id)} className={primaryBtn()}>
                        Preview
                      </Link>

                      {typeMeta.canEdit ? (
                        <Link to={editPath(row.id)} className={secondaryBtn()}>
                          Edit
                        </Link>
                      ) : null}

                      {typeMeta.canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className={dangerBtn()}
                          disabled={Boolean(deletingId)}
                        >
                          {isDeletingThis ? "Deleting..." : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}