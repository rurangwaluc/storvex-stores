// src/pages/suppliers/SupplierSupplyCreate.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getSupplierById, createSupplierSupply } from "../../services/suppliersApi";
import { searchProducts } from "../../services/inventoryApi";

const SOURCE_TYPE_OPTIONS = [
  { value: "BOUGHT", label: "Bought" },
  { value: "GIFT", label: "Gift" },
  { value: "TRADE_IN", label: "Trade-in" },
  { value: "CONSIGNMENT", label: "Consignment" },
  { value: "OTHER", label: "Other" },
];

function fmtMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white border border-stone-200 shadow-lg">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div className="font-semibold text-slate-900">{title}</div>
            <button
              type="button"
              className="h-9 w-9 rounded-lg border border-stone-300 bg-white hover:bg-stone-50"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function SupplierSupplyCreate() {
  const { id } = useParams(); // supplier id
  const nav = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loadingSupplier, setLoadingSupplier] = useState(true);

  const [saving, setSaving] = useState(false);

  // supply header
  const [sourceType, setSourceType] = useState("BOUGHT");
  const [sourceDetails, setSourceDetails] = useState("");
  const [documentRef, setDocumentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [alsoUpdateStock, setAlsoUpdateStock] = useState(true);

  // items
  const [items, setItems] = useState([
    {
      productId: "",
      productName: "",
      category: "",
      subcategory: "",
      subcategoryOther: "",
      brand: "",
      serial: "",
      quantity: 1,
      buyPrice: "",
      sellPrice: "",
      notes: "",
    },
  ]);

  // product search
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // ✅ choose which row to fill from search
  const [pickRowIndex, setPickRowIndex] = useState(0);

  // optional helper modal
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingSupplier(true);
      try {
        const s = await getSupplierById(String(id));
        setSupplier(s);
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Failed to load supplier");
        setSupplier(null);
      } finally {
        setLoadingSupplier(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    const q = searchQ.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchProducts(q, 20);
        setResults(Array.isArray(data?.products) ? data.products : []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchQ]);

  const totals = useMemo(() => {
    const totalBuy = items.reduce((sum, it) => sum + Number(it.buyPrice || 0) * Number(it.quantity || 0), 0);
    const totalSell = items.reduce((sum, it) => sum + Number(it.sellPrice || 0) * Number(it.quantity || 0), 0);
    return { totalBuy, totalSell };
  }, [items]);

  function setItem(i, k, v) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        productName: "",
        category: "",
        subcategory: "",
        subcategoryOther: "",
        brand: "",
        serial: "",
        quantity: 1,
        buyPrice: "",
        sellPrice: "",
        notes: "",
      },
    ]);
    setPickRowIndex((v) => v); // keep as-is
  }

  function removeRow(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setPickRowIndex((v) => Math.max(0, Math.min(v, items.length - 2)));
  }

  function pickProduct(i, p) {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== i) return it;

        return {
          ...it,
          productId: p.id,
          productName: p.name || "",
          category: p.category || "",
          subcategory: p.subcategory || "",
          subcategoryOther: p.subcategoryOther || "",
          brand: p.brand || "",
          // ✅ auto-fill prices (big time saver)
          buyPrice: p.costPrice ?? it.buyPrice ?? "",
          sellPrice: p.sellPrice ?? it.sellPrice ?? "",
        };
      })
    );

    setSearchQ("");
    setResults([]);
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    // build clean items
    const cleanItems = items
      .map((it) => {
        const linked = Boolean(it.productId);

        return {
          productId: it.productId || null,
          productName: String(it.productName || "").trim(),
          // ✅ only keep category/brand when linked to inventory
          category: linked ? (String(it.category || "").trim() || null) : null,
          subcategory: linked ? (String(it.subcategory || "").trim() || null) : null,
          subcategoryOther: linked ? (String(it.subcategoryOther || "").trim() || null) : null,
          brand: linked ? (String(it.brand || "").trim() || null) : null,

          serial: String(it.serial || "").trim() || null,
          quantity: Number(it.quantity),
          buyPrice: Number(it.buyPrice),
          sellPrice: Number(it.sellPrice),
          notes: String(it.notes || "").trim() || null,
        };
      })
      .filter((it) => it.productName);

    if (cleanItems.length === 0) return toast.error("Add at least 1 item");

    // validation
    for (const it of cleanItems) {
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) return toast.error("Quantity must be more than 0");
      if (!Number.isFinite(it.buyPrice) || it.buyPrice < 0) return toast.error("Buy price must be 0 or more");
      if (!Number.isFinite(it.sellPrice) || it.sellPrice < 0) return toast.error("Sell price must be 0 or more");

      // ✅ serial rule (simple and safe)
      if (it.serial && it.quantity !== 1) {
        return toast.error("If you write a serial number, quantity must be 1");
      }
    }

    setSaving(true);
    try {
      await createSupplierSupply(String(id), {
        sourceType,
        sourceDetails: sourceDetails.trim() || null,
        documentRef: documentRef.trim() || null,
        notes: notes.trim() || null,
        alsoUpdateStock,
        items: cleanItems,
      });

      toast.success("Delivery saved");
      nav(`/app/suppliers/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to save delivery");
    } finally {
      setSaving(false);
    }
  }

  if (loadingSupplier) return <p className="text-slate-600">Loading…</p>;
  if (!supplier) return <p className="text-slate-600">Supplier not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New delivery</h1>
          <p className="text-sm text-slate-600 mt-1">
            Supplier: <span className="font-medium text-slate-900">{supplier.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => nav(`/app/suppliers/${id}`)}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
          >
            Help
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Header */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Source type</label>
              <select
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                {SOURCE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Source details (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={sourceDetails}
                onChange={(e) => setSourceDetails(e.target.value)}
                placeholder="Example: bought in Dubai"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Document ref (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={documentRef}
                onChange={(e) => setDocumentRef(e.target.value)}
                placeholder="Invoice number / receipt number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: delivered by John"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={alsoUpdateStock}
              onChange={(e) => setAlsoUpdateStock(e.target.checked)}
            />
            Also update inventory stock (recommended)
          </label>
        </div>

        {/* Items */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">Items</div>
              <div className="text-sm text-slate-600">Add products in this delivery.</div>
            </div>

            <button
              type="button"
              onClick={addRow}
              className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
            >
              + Add item
            </button>
          </div>

          {/* Search picker */}
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <label className="text-sm font-medium text-slate-700">Find product (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Type product name / code / brand…"
            />

            <div className="mt-2 flex items-center gap-2">
              <div className="text-xs text-slate-600">Fill row:</div>
              <select
                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs"
                value={pickRowIndex}
                onChange={(e) => setPickRowIndex(Number(e.target.value || 0))}
              >
                {items.map((_, idx) => (
                  <option key={idx} value={idx}>
                    #{idx + 1}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500">(Pick which line to fill)</div>
            </div>

            {searchQ.trim() ? (
              <div className="mt-2">
                {searching ? (
                  <div className="text-sm text-slate-600">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="text-sm text-slate-500">No results.</div>
                ) : (
                  <div className="max-h-56 overflow-auto border border-stone-200 rounded-lg bg-white">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pickProduct(pickRowIndex, p)}
                        className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-100"
                      >
                        <div className="text-sm font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {p.category || "—"} • Stock: {p.stockQty ?? 0} • {fmtMoney(p.sellPrice)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-500 mt-2">
                  Tip: this picker fills the selected row.
                </div>
              </div>
            ) : null}
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200">
                  <th className="p-3 text-left text-sm text-slate-700">Product name</th>
                  <th className="p-3 text-center text-sm text-slate-700">Qty</th>
                  <th className="p-3 text-right text-sm text-slate-700">Buy</th>
                  <th className="p-3 text-right text-sm text-slate-700">Sell</th>
                  <th className="p-3 text-left text-sm text-slate-700">Serial (if any)</th>
                  <th className="p-3 text-right text-sm text-slate-700">Remove</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b border-stone-200">
                    <td className="p-3">
                      <input
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        value={it.productName}
                        onChange={(e) => setItem(idx, "productName", e.target.value)}
                        placeholder="Example: iPhone 13 128GB"
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        Link: {it.productId ? "Linked to inventory" : "Not linked"}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm text-center"
                        value={it.quantity}
                        onChange={(e) => setItem(idx, "quantity", Number(e.target.value || 1))}
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        If serial is filled, keep qty = 1
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <input
                        type="number"
                        min="0"
                        className="w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm text-right"
                        value={it.buyPrice}
                        onChange={(e) => setItem(idx, "buyPrice", e.target.value)}
                        placeholder="0"
                      />
                    </td>

                    <td className="p-3 text-right">
                      <input
                        type="number"
                        min="0"
                        className="w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm text-right"
                        value={it.sellPrice}
                        onChange={(e) => setItem(idx, "sellPrice", e.target.value)}
                        placeholder="0"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        className="w-56 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        value={it.serial}
                        onChange={(e) => setItem(idx, "serial", e.target.value)}
                        placeholder="Only if product has serial"
                      />
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-rose-700 hover:underline text-sm disabled:opacity-60"
                        disabled={items.length <= 1}
                        title={items.length <= 1 ? "Keep at least 1 item" : "Remove item"}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="text-xs text-slate-500">Total buy</div>
              <div className="text-lg font-semibold text-slate-900 mt-1">{fmtMoney(totals.totalBuy)}</div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="text-xs text-slate-500">Total sell</div>
              <div className="text-lg font-semibold text-slate-900 mt-1">{fmtMoney(totals.totalSell)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => nav(`/app/suppliers/${id}`)}
            className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-sm"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save delivery"}
          </button>
        </div>
      </form>

      {/* Help modal */}
      <Modal open={helpOpen} title="Quick rules" onClose={() => setHelpOpen(false)}>
        <div className="space-y-2 text-sm text-slate-700">
          <div>1) If you write a serial number, keep quantity = 1.</div>
          <div>2) Use the search box to link items to your inventory.</div>
          <div>3) If “Also update stock” is ON, stock will increase automatically.</div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm"
            onClick={() => setHelpOpen(false)}
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}