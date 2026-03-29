// src/pages/suppliers/SupplierView.jsx

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  activateSupplier,
  deactivateSupplier,
  getSupplierById,
  listSupplierSupplies,
} from "../../services/suppliersApi";

function Pill({ tone = "neutral", children }) {
  const cls =
    tone === "danger"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-stone-50 text-stone-700 border-stone-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function fmtMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function idTypeLabel(t) {
  if (t === "NATIONAL_ID") return "National ID";
  if (t === "PASSPORT") return "Passport";
  return t || "—";
}

export default function SupplierView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);

  const [suppliesLoading, setSuppliesLoading] = useState(true);
  const [supplies, setSupplies] = useState([]);

  const totals = useMemo(() => {
    const rows = Array.isArray(supplies) ? supplies : [];
    const totalCost = rows.reduce((sum, s) => sum + Number(s.totalCost || 0), 0);
    const totalSell = rows.reduce((sum, s) => sum + Number(s.totalSell || 0), 0);
    return { totalCost, totalSell };
  }, [supplies]);

  async function loadSupplier() {
    setLoading(true);
    try {
      const s = await getSupplierById(String(id));
      setSupplier(s);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load supplier");
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupplies() {
    setSuppliesLoading(true);
    try {
      const data = await listSupplierSupplies(String(id));
      setSupplies(Array.isArray(data?.supplies) ? data.supplies : []);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load deliveries");
      setSupplies([]);
    } finally {
      setSuppliesLoading(false);
    }
  }

  useEffect(() => {
    loadSupplier();
    loadSupplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleActive() {
    try {
      if (!supplier) return;

      if (supplier.isActive) {
        await deactivateSupplier(supplier.id);
        toast.success("Supplier hidden");
      } else {
        await activateSupplier(supplier.id);
        toast.success("Supplier shown");
      }

      // ✅ reload both so UI stays correct
      await Promise.all([loadSupplier(), loadSupplies()]);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Action failed");
    }
  }

  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (!supplier) return <p className="text-slate-600">Supplier not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{supplier.name}</h1>
            {supplier.isActive ? <Pill tone="success">Active</Pill> : <Pill tone="warning">Hidden</Pill>}
          </div>

          <p className="text-sm text-slate-600 mt-1">
            ID: <span className="font-medium">{idTypeLabel(supplier.idType)}</span> •{" "}
            <span className="font-medium">{supplier.idNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => nav("/app/suppliers")}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
          >
            ← Back
          </button>

          <Link
            to={`/app/suppliers/${supplier.id}/edit`}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
          >
            Edit
          </Link>

          <Link
            to={`/app/suppliers/${supplier.id}/supplies/new`}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm font-medium"
          >
            Add delivery
          </Link>

          <button
            type="button"
            onClick={toggleActive}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium",
              supplier.isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white",
            ].join(" ")}
          >
            {supplier.isActive ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Contact">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Phone</span>
              <span className="text-slate-900">{supplier.phone || "—"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Email</span>
              <span className="text-slate-900">{supplier.email || "—"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Address</span>
              <span className="text-slate-900">{supplier.address || "—"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Company</span>
              <span className="text-slate-900">{supplier.companyName || "—"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Tax ID</span>
              <span className="text-slate-900">{supplier.taxId || "—"}</span>
            </div>
          </div>
        </Section>

        <Section title="Safety info">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Source type</span>
              <span className="text-slate-900">{supplier.sourceType || "—"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-600">Source details</span>
              <span className="text-slate-900">{supplier.sourceDetails || "—"}</span>
            </div>

            <div className="pt-2">
              <div className="text-slate-600 text-xs">Notes</div>
              <div className="text-slate-900 text-sm mt-1">{supplier.notes || "—"}</div>
            </div>
          </div>
        </Section>
      </div>

      <Section
        title="Deliveries (Supplies)"
        right={
          <button
            type="button"
            onClick={loadSupplies}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
          >
            Refresh
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs text-slate-500">Total deliveries</div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{supplies.length}</div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs text-slate-500">Total buy cost</div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{fmtMoney(totals.totalCost)}</div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs text-slate-500">Total sell value</div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{fmtMoney(totals.totalSell)}</div>
          </div>
        </div>

        {suppliesLoading ? (
          <p className="text-slate-600">Loading…</p>
        ) : supplies.length === 0 ? (
          <p className="text-slate-500">No deliveries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200">
                  <th className="p-3 text-left text-sm text-slate-700">Date</th>
                  <th className="p-3 text-left text-sm text-slate-700">Type</th>
                  <th className="p-3 text-center text-sm text-slate-700">Items</th>
                  <th className="p-3 text-right text-sm text-slate-700">Buy total</th>
                  <th className="p-3 text-right text-sm text-slate-700">Sell total</th>
                </tr>
              </thead>

              <tbody>
                {supplies.map((s) => (
                  <tr key={s.id} className="border-b border-stone-200">
                    <td className="p-3 text-sm text-slate-700">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-sm text-slate-900">{s.sourceType || "—"}</td>
                    <td className="p-3 text-center text-sm text-slate-900">{s.itemsCount || 0}</td>
                    <td className="p-3 text-right text-sm text-slate-900">{fmtMoney(s.totalCost)}</td>
                    <td className="p-3 text-right text-sm text-slate-900">{fmtMoney(s.totalSell)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-xs text-slate-500 mt-3">
              Tip: deliveries help you prove where products came from.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}