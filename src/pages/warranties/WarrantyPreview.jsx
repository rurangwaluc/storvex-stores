import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getWarrantyPrintUrl } from "../../services/warrantiesApi";

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

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

export default function WarrantyPreview() {
  const { id } = useParams();
  const [printUrl, setPrintUrl] = useState("");

  useEffect(() => {
    try {
      setPrintUrl(getWarrantyPrintUrl(id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to build warranty preview URL");
    }
  }, [id]);

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "p-5 md:p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-[rgb(var(--text-soft))]">
              Warranty document
            </div>
            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Warranty Preview
            </h1>
            <p className={cx("mt-2 text-sm", mutedText())}>
              Preview, print, or edit this warranty document.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/documents/warranties" className={secondaryBtn()}>
              Back to Warranties
            </Link>

            <Link
              to={`/app/documents/warranties/${encodeURIComponent(id)}/edit`}
              className={secondaryBtn()}
            >
              Edit Warranty
            </Link>

            {printUrl ? (
              <a
                href={printUrl}
                target="_blank"
                rel="noreferrer"
                className={primaryBtn()}
              >
                Open Print View
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className={cx(shell(), "overflow-hidden")}>
        {printUrl ? (
          <iframe
            title="Warranty Preview"
            src={printUrl}
            className="h-[80vh] w-full"
          />
        ) : (
          <div className="p-5 text-sm text-stone-600 dark:text-[rgb(var(--text-muted))]">
            Loading preview...
          </div>
        )}
      </section>
    </div>
  );
}