// src/pages/deliveryNotes/DeliveryNotesList.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { listDeliveryNotes } from "../../services/deliveryNotesApi";
import TableSkeleton from "../../components/ui/TableSkeleton";

export default function DeliveryNotesList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const query = useMemo(() => q.trim(), [q]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // cancel in-flight request when query changes
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function load(currentQuery) {
    // cancel previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const data = await listDeliveryNotes(
        { q: currentQuery || undefined },
        { signal: controller.signal } // if service supports it; safe if ignored
      );

      if (!mountedRef.current || controller.signal.aborted) return;

      setRows(Array.isArray(data?.deliveryNotes) ? data.deliveryNotes : []);
    } catch (e) {
      // ignore abort errors
      if (controller.signal.aborted) return;

      console.error(e);
      toast.error(e?.message || "Failed to load delivery notes");
      setRows([]);
    } finally {
      if (!mountedRef.current || controller.signal.aborted) return;
      setLoading(false);
    }
  }

  // single debounced loader (handles initial load too)
  useEffect(() => {
    const t = setTimeout(() => {
      load(query);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Delivery Notes</h1>
          <p className="text-sm text-slate-600 mt-1">
            Proof of delivery from your store to a customer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => nav("/app/delivery-notes/new")}
          disabled={loading}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          New delivery note
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customer name / phone…"
          className="w-full lg:w-96 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
        />

        <div className="overflow-x-auto">
          <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th className="p-3 text-left text-sm text-slate-700">#</th>
                <th className="p-3 text-left text-sm text-slate-700">Date</th>
                <th className="p-3 text-left text-sm text-slate-700">Customer</th>
                <th className="p-3 text-left text-sm text-slate-700">Phone</th>
                <th className="p-3 text-right text-sm text-slate-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? <TableSkeleton rows={6} cols={5} /> : null}

              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-stone-200">
                    <td className="p-3 text-sm text-slate-900 font-medium">{r.number}</td>
                    <td className="p-3 text-sm text-slate-700">
                      {r.date ? new Date(r.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3 text-sm text-slate-900">{r.customerName}</td>
                    <td className="p-3 text-sm text-slate-700">{r.customerPhone || "—"}</td>
                    <td className="p-3 text-right text-sm">
                      <Link
                        to={`/app/delivery-notes/${r.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        View / Print
                      </Link>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-slate-500">
                    No delivery notes found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <p className="text-xs text-slate-500 mt-3">
            Tip: print the note and let both sides sign.
          </p>
        </div>
      </div>
    </div>
  );
}