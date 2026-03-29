import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { buildDocumentPrintUrl, openDocumentPrint } from "../../services/documentPrint";
import { deleteDeliveryNote } from "../../services/deliveryNotesApi";
import { deleteProforma } from "../../services/proformasApi";
import { deleteWarranty } from "../../services/warrantiesApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function strongText() {
  return "text-stone-950 dark:text-[rgb(var(--text))]";
}

function mutedText() {
  return "text-stone-600 dark:text-[rgb(var(--text-muted))]";
}

function softBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-rose-300 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800/50 dark:bg-[rgb(var(--bg))] dark:text-rose-300 dark:hover:bg-rose-950/20";
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
          <button type="button" onClick={onCancel} className={softBtn()} disabled={deleting}>
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

const RESOURCE_META = {
  receipts: {
    title: "Receipt Preview",
    backTo: "/app/documents/receipts",
    backLabel: "Receipts",
    editTo: null,
    createTo: null,
    createLabel: null,
    canDelete: false,
    singularLabel: "receipt",
  },
  invoices: {
    title: "Invoice Preview",
    backTo: "/app/documents/invoices",
    backLabel: "Invoices",
    editTo: null,
    createTo: null,
    createLabel: null,
    canDelete: false,
    singularLabel: "invoice",
  },
  proformas: {
    title: "Proforma Preview",
    backTo: "/app/documents/proformas",
    backLabel: "Proformas",
    editTo: (id) => `/app/documents/proformas/${encodeURIComponent(id)}/edit`,
    createTo: "/app/documents/proformas/create",
    createLabel: "Create Proforma",
    canDelete: true,
    singularLabel: "proforma",
  },
  warranties: {
    title: "Warranty Preview",
    backTo: "/app/documents/warranties",
    backLabel: "Warranties",
    editTo: (id) => `/app/documents/warranties/${encodeURIComponent(id)}/edit`,
    createTo: "/app/documents/warranties/create",
    createLabel: "Create Warranty",
    canDelete: true,
    singularLabel: "warranty",
  },
  "delivery-notes": {
    title: "Delivery Note Preview",
    backTo: "/app/documents/delivery-notes",
    backLabel: "Delivery Notes",
    editTo: (id) => `/app/documents/delivery-notes/${encodeURIComponent(id)}/edit`,
    createTo: "/app/documents/delivery-notes/create",
    createLabel: "Create Delivery Note",
    canDelete: true,
    singularLabel: "delivery note",
  },
};

async function deleteByType(resource, id) {
  if (resource === "delivery-notes") return deleteDeliveryNote(id);
  if (resource === "proformas") return deleteProforma(id);
  if (resource === "warranties") return deleteWarranty(id);
  throw new Error("Delete is not supported for this document type");
}

export default function DocumentPreviewRoute() {
  const navigate = useNavigate();
  const { resource, id } = useParams();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = RESOURCE_META[resource] || {
    title: "Document Preview",
    backTo: "/app/documents",
    backLabel: "Documents",
    editTo: null,
    createTo: null,
    createLabel: null,
    canDelete: false,
    singularLabel: "document",
  };

  const printUrl = useMemo(() => {
    if (!resource || !id) return "";
    return buildDocumentPrintUrl(resource, id);
  }, [resource, id]);

  const editUrl = useMemo(() => {
    if (!meta.editTo || !id) return null;
    return meta.editTo(id);
  }, [meta, id]);

  async function handleDelete() {
    if (!resource || !id) return;

    try {
      setDeleting(true);
      await deleteByType(resource, id);
      toast.success(`${meta.singularLabel} deleted`);
      navigate(meta.backTo, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || `Failed to delete ${meta.singularLabel}`);
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      <ConfirmDeleteModal
        open={showDelete}
        title={`Delete ${meta.singularLabel}?`}
        body={`You are about to permanently delete this ${meta.singularLabel}. This action cannot be undone.`}
        deleting={deleting}
        onCancel={() => {
          if (!deleting) setShowDelete(false);
        }}
        onConfirm={handleDelete}
      />

      <div className={cx(shell(), "p-5")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              to="/app/documents"
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-stone-700 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text-muted))] dark:hover:bg-[rgb(var(--bg-muted))]"
            >
              Document Center
            </Link>
            <span className={mutedText()}>/</span>
            <Link
              to={meta.backTo}
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-stone-700 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text-muted))] dark:hover:bg-[rgb(var(--bg-muted))]"
            >
              {meta.backLabel}
            </Link>
            <span className={mutedText()}>/</span>
            <span className={cx("rounded-full px-3 py-1.5", strongText())}>Preview</span>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                Live renderer preview
              </div>
              <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight", strongText())}>
                {meta.title}
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                This is the real backend document renderer. Brand colors and terms from General
                Settings appear here directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/app/documents" className={softBtn()}>
                Back to Document Center
              </Link>

              <Link to={meta.backTo} className={softBtn()}>
                Back to {meta.backLabel}
              </Link>

              {editUrl ? (
                <Link to={editUrl} className={softBtn()}>
                  Edit
                </Link>
              ) : null}

              {meta.createTo && meta.createLabel ? (
                <Link to={meta.createTo} className={softBtn()}>
                  {meta.createLabel}
                </Link>
              ) : null}

              {meta.canDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className={dangerBtn()}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              ) : null}

              <button type="button" onClick={() => navigate(-1)} className={softBtn()}>
                Go Back
              </button>

              <button
                type="button"
                onClick={() => openDocumentPrint(resource, id)}
                className={primaryBtn()}
              >
                Open Print Tab
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={cx(shell(), "overflow-hidden p-2 md:p-3")}>
        {printUrl ? (
          <iframe
            title={`${meta.title} ${id}`}
            src={printUrl}
            className="h-[78vh] w-full rounded-[20px] bg-white"
          />
        ) : (
          <div className="p-8 text-sm text-stone-500 dark:text-[rgb(var(--text-muted))]">
            Preview URL is not available.
          </div>
        )}
      </div>
    </div>
  );
}