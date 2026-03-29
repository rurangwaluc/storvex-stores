import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { listWarranties } from "../../services/warrantiesApi";

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

function softText() {
  return "text-stone-500 dark:text-[rgb(var(--text-soft))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function badgeClass() {
  return "inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-700 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))] dark:text-[rgb(var(--text-muted))]";
}

function money(n, currency = "RWF") {
  return `${currency} ${Number(n || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function WarrantiesList() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);

  async function load() {
    try {
      setLoading(true);
      const data = await listWarranties(query ? { q: query } : undefined);
      setRows(Array.isArray(data?.warranties) ? data.warranties : []);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load warranties");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [
        row?.number,
        row?.customerName,
        row?.customerPhone,
        row?.cashierName,
        row?.policy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "p-5 md:p-6")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Documents
            </div>
            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Warranties
            </h1>
            <p className={cx("mt-2 text-sm", mutedText())}>
              View, preview, and edit warranty documents in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/documents" className={secondaryBtn()}>
              Document Center
            </Link>
            <Link to="/app/documents/warranties/create" className={primaryBtn()}>
              Create Warranty
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass()}
            placeholder="Search warranty number, customer, phone, cashier..."
          />
        </div>
      </section>

      <section className={cx(shell(), "overflow-hidden")}>
        {loading ? (
          <div className="p-5 text-sm text-stone-600 dark:text-[rgb(var(--text-muted))]">
            Loading warranties...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-sm text-stone-600 dark:text-[rgb(var(--text-muted))]">
            No warranties found.
          </div>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-[rgb(var(--border))]">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={cx("text-sm font-semibold", strongText())}>
                      {row.number || "Warranty"}
                    </div>
                    <span className={badgeClass()}>Warranty</span>
                  </div>

                  <div className={cx("mt-1 text-sm", mutedText())}>
                    {row.customerName || "Walk-in Customer"}
                    {row.customerPhone ? ` • ${row.customerPhone}` : ""}
                  </div>

                  <div className={cx("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs", softText())}>
                    <span>Date: {formatDate(row.createdAt || row.startsAt)}</span>
                    <span>Cashier: {row.cashierName || "—"}</span>
                    <span>Units: {row.unitsCount ?? 0}</span>
                    {row.endsAt ? <span>Ends: {formatDate(row.endsAt)}</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/app/documents/warranties/${encodeURIComponent(row.id)}/preview`}
                    className={secondaryBtn()}
                  >
                    Preview
                  </Link>

                  <Link
                    to={`/app/documents/warranties/${encodeURIComponent(row.id)}/edit`}
                    className={secondaryBtn()}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}