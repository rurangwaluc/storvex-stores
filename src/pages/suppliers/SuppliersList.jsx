// src/pages/suppliers/SuppliersList.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { activateSupplier, deactivateSupplier, listSuppliers } from "../../services/suppliersApi";
import TableSkeleton from "../../components/ui/TableSkeleton";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function idTypeLabel(t) {
  if (t === "NATIONAL_ID") return "National ID";
  if (t === "PASSPORT") return "Passport";
  return t || "—";
}

export default function SuppliersList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const query = useMemo(() => q.trim(), [q]);

  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [busyId, setBusyId] = useState(null);

  // Cancel / race control
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function load({ q: qArg, active: activeArg }) {
    // cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      // best-effort: if listSuppliers supports a 2nd arg for axios/fetch config, it will use it.
      // if not supported, it will be ignored and everything still works.
      const data = await listSuppliers(
        { q: qArg || undefined, active: activeArg },
        { signal: controller.signal }
      );

      if (!mountedRef.current || controller.signal.aborted) return;

      setRows(Array.isArray(data?.suppliers) ? data.suppliers : []);
    } catch (e) {
      if (controller.signal.aborted) return;

      console.error(e);
      toast.error(e?.message || "Failed to load suppliers");
      setRows([]);
    } finally {
      if (!mountedRef.current || controller.signal.aborted) return;
      setLoading(false);
    }
  }

  // Single debounced loader (covers initial load + changes)
  useEffect(() => {
    const t = setTimeout(() => {
      load({ q: query, active });
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, active]);

  async function toggleActive(s) {
    if (!s?.id) return;

    setBusyId(s.id);
    try {
      if (active) {
        await deactivateSupplier(s.id);
        toast.success("Supplier hidden");
      } else {
        await activateSupplier(s.id);
        toast.success("Supplier shown");
      }

      // reload with current filters
      await load({ q: query, active });
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-600 mt-1">A supplier is the person/company you buy from.</p>
        </div>

        <button
          type="button"
          onClick={() => nav("/app/suppliers/new")}
          disabled={loading}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Add supplier
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / phone / ID number…"
            className="w-full lg:w-96 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            disabled={loading}
            className={classNames(
              "rounded-lg border px-3 py-2 text-sm disabled:opacity-60",
              active
                ? "bg-white border-stone-300 hover:bg-stone-50 text-slate-900"
                : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
            )}
            title="Show active or hidden suppliers"
          >
            {active ? "Active" : "Hidden"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th className="p-3 text-left text-sm text-slate-700">Supplier</th>
                <th className="p-3 text-left text-sm text-slate-700">ID</th>
                <th className="p-3 text-left text-sm text-slate-700">Phone</th>
                <th className="p-3 text-right text-sm text-slate-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? <TableSkeleton rows={6} cols={4} /> : null}

              {!loading &&
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-stone-200">
                    <td className="p-3 text-sm text-slate-900">
                      <div className="font-medium">{s.name}</div>
                      {s.companyName ? <div className="text-xs text-slate-500">{s.companyName}</div> : null}
                      {s.sourceType ? <div className="text-xs text-slate-500">Source: {s.sourceType}</div> : null}
                    </td>

                    <td className="p-3 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">{idTypeLabel(s.idType)}</div>
                      <div className="font-medium">{s.idNumber}</div>
                    </td>

                    <td className="p-3 text-sm text-slate-700">{s.phone || "—"}</td>

                    <td className="p-3 text-right text-sm space-x-3">
                      <Link to={`/app/suppliers/${s.id}`} className="text-emerald-700 hover:underline">
                        View
                      </Link>

                      <Link to={`/app/suppliers/${s.id}/edit`} className="text-slate-900 hover:underline">
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleActive(s)}
                        disabled={busyId === s.id}
                        className={classNames(
                          "hover:underline disabled:opacity-60",
                          active ? "text-rose-700" : "text-emerald-700"
                        )}
                      >
                        {busyId === s.id ? "Working…" : active ? "Hide" : "Show"}
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-slate-500">
                    No suppliers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <p className="text-xs text-slate-500 mt-3">
            Tip: Always save the supplier ID. This helps you avoid stolen products.
          </p>
        </div>
      </div>
    </div>
  );
}