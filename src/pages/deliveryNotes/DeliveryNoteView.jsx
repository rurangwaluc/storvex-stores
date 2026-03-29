// src/pages/deliveryNotes/DeliveryNoteView.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getDeliveryNoteById, openDeliveryNotePrint } from "../../services/deliveryNotesApi";
import TableSkeleton from "../../components/ui/TableSkeleton";

function safeStr(x) {
  return x == null ? "" : String(x);
}

export default function DeliveryNoteView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const [printing, setPrinting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getDeliveryNoteById(String(id));
      setNote(data || null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load delivery note");
      setNote(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNote(null);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function professionalPrint() {
    if (!id) return;

    const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      nav("/login", { replace: true });
      return;
    }

    setPrinting(true);
    try {
      openDeliveryNotePrint(id); // opens server HTML in new tab
    } finally {
      // can't know when tab prints, unlock quickly
      setTimeout(() => setPrinting(false), 300);
    }
  }

  const items = Array.isArray(note?.items)
    ? note.items
    : Array.isArray(note?.DeliveryNoteItem)
    ? note.DeliveryNoteItem
    : [];

  // ✅ Skeleton layout matches final table (4 columns)
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="h-8 w-72 bg-stone-200 rounded-md animate-pulse" />
            <div className="h-4 w-56 bg-stone-100 rounded-md animate-pulse mt-2" />
          </div>

          <div className="flex gap-2">
            <div className="h-10 w-24 bg-stone-200 rounded-xl animate-pulse" />
            <div className="h-10 w-40 bg-stone-200 rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-stone-200 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-4 w-24 bg-stone-100 rounded-md animate-pulse" />
            </div>

            <div className="space-y-2 text-right">
              <div className="h-4 w-16 bg-stone-100 rounded-md animate-pulse ml-auto" />
              <div className="h-6 w-20 bg-stone-200 rounded-md animate-pulse ml-auto" />
              <div className="h-4 w-16 bg-stone-100 rounded-md animate-pulse ml-auto" />
              <div className="h-4 w-24 bg-stone-200 rounded-md animate-pulse ml-auto" />
            </div>
          </div>

          <hr className="my-5" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-stone-100 rounded-md animate-pulse" />
              <div className="h-5 w-48 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-4 w-36 bg-stone-100 rounded-md animate-pulse" />
              <div className="h-4 w-56 bg-stone-100 rounded-md animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-24 bg-stone-100 rounded-md animate-pulse" />
              <div className="h-4 w-52 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-4 w-44 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-4 w-56 bg-stone-200 rounded-md animate-pulse" />
            </div>
          </div>

          <div className="mt-6">
            <div className="h-5 w-16 bg-stone-200 rounded-md animate-pulse mb-3" />

            <div className="overflow-x-auto">
              <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
                <thead className="bg-stone-50">
                  <tr className="border-b border-stone-200">
                    <th className="p-3 text-left text-sm text-slate-700">#</th>
                    <th className="p-3 text-left text-sm text-slate-700">Product</th>
                    <th className="p-3 text-left text-sm text-slate-700">Serial</th>
                    <th className="p-3 text-right text-sm text-slate-700">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={6} cols={4} />
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-3 w-16 bg-stone-100 rounded-md animate-pulse" />
              <div className="h-4 w-full bg-stone-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) return <p className="text-slate-600">Delivery note not found.</p>;

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-card { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Delivery Note #{note.number}</h1>
          <p className="text-sm text-slate-600 mt-1">Print and attach to delivered goods.</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => nav("/app/delivery-notes")}
            className="h-10 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-4 text-sm"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={professionalPrint}
            disabled={printing}
            className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-sm font-medium disabled:opacity-60"
            title="Opens the backend print template in a new tab"
          >
            {printing ? "Opening…" : "Professional Print"}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-sm font-medium"
          >
            Print (simple)
          </button>
        </div>
      </div>

      <div className="print-card bg-white border border-stone-200 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-slate-900">STORVEX</div>
            <div className="text-sm text-slate-600">Delivery Note</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-600">No.</div>
            <div className="text-lg font-semibold text-slate-900">{note.number}</div>
            <div className="text-sm text-slate-600 mt-1">Date</div>
            <div className="text-sm text-slate-900">
              {note.date ? new Date(note.date).toLocaleDateString() : new Date(note.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <hr className="my-5" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Deliver To</div>
            <div className="font-semibold text-slate-900">{note.customerName}</div>
            <div className="text-slate-700">{note.customerPhone || "—"}</div>
            <div className="text-slate-700">{note.customerAddress || "—"}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Delivery Info</div>
            <div className="text-slate-700">
              Delivered by: <span className="font-medium text-slate-900">{note.deliveredBy || "—"}</span>
            </div>
            <div className="text-slate-700">
              Received by: <span className="font-medium text-slate-900">{note.receivedBy || "—"}</span>
            </div>
            <div className="text-slate-700">
              Receiver phone: <span className="font-medium text-slate-900">{note.receivedByPhone || "—"}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-900 mb-2">Items</div>

          <div className="overflow-x-auto">
            <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200">
                  <th className="p-3 text-left text-sm text-slate-700">#</th>
                  <th className="p-3 text-left text-sm text-slate-700">Product</th>
                  <th className="p-3 text-left text-sm text-slate-700">Serial</th>
                  <th className="p-3 text-right text-sm text-slate-700">Qty</th>
                </tr>
              </thead>

              <tbody>
                {items.length ? (
                  items.map((it, idx) => (
                    <tr key={it.id || idx} className="border-b border-stone-200">
                      <td className="p-3 text-sm text-slate-700">{idx + 1}</td>
                      <td className="p-3 text-sm text-slate-900">{safeStr(it.productName)}</td>
                      <td className="p-3 text-sm text-slate-700">{it.serial || "—"}</td>
                      <td className="p-3 text-sm text-slate-900 text-right">{it.quantity ?? 1}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-sm text-slate-600" colSpan={4}>
                      No items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Notes</div>
            <div className="text-slate-900 mt-1">{note.notes || "—"}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
          <div>
            <div className="text-slate-600">Delivered by (Signature)</div>
            <div className="mt-8 border-t border-slate-300" />
          </div>
          <div>
            <div className="text-slate-600">Received by (Signature)</div>
            <div className="mt-8 border-t border-slate-300" />
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-500">Generated by Storvex • Keep this document for proof of delivery.</div>
      </div>
    </div>
  );
}
