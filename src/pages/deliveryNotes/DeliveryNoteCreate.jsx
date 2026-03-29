// src/pages/deliveryNotes/DeliveryNoteCreate.jsx
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createDeliveryNote } from "../../services/deliveryNotesApi";
import { searchProducts } from "../../services/inventoryApi";

function fmtMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function DeliveryNoteCreate() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  // header
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveredBy, setDeliveredBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [receivedByPhone, setReceivedByPhone] = useState("");
  const [notes, setNotes] = useState("");

  // items
  const [items, setItems] = useState([
    { productId: "", productName: "", serial: "", quantity: 1 },
  ]);

  // search
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [targetRow, setTargetRow] = useState(0);

  const debounceRef = useRef(null);
  const canSearch = useMemo(() => searchQ.trim().length > 0, [searchQ]);

  async function runSearch(q) {
    setSearching(true);
    try {
      const data = await searchProducts(q, 20);
      setResults(Array.isArray(data?.products) ? data.products : []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function setItem(i, k, v) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it))
    );
  }

  function addRow() {
    setItems((prev) => {
      const nextIndex = prev.length;
      // keep targetRow in sync with the new row index
      setTargetRow(nextIndex);
      return [
        ...prev,
        { productId: "", productName: "", serial: "", quantity: 1 },
      ];
    });
  }

  function removeRow(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setTargetRow((prev) => {
      if (prev === i) return 0;
      if (prev > i) return prev - 1;
      return prev;
    });
  }

  function pickProduct(i, p) {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== i) return it;
        return { ...it, productId: p.id, productName: p.name || "" };
      })
    );
    setSearchQ("");
    setResults([]);
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    if (!customerName.trim()) return toast.error("Customer name is required");

    const cleanItems = items
      .map((it) => ({
        productId: it.productId || null,
        productName: String(it.productName || "").trim(),
        serial: String(it.serial || "").trim() || null,
        quantity: Number(it.quantity),
      }))
      .filter((it) => it.productName);

    if (cleanItems.length === 0) return toast.error("Add at least 1 item");

    for (const it of cleanItems) {
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return toast.error("Quantity must be > 0");
      }
    }

    setSaving(true);
    try {
      const data = await createDeliveryNote({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        deliveredBy: deliveredBy.trim() || null,
        receivedBy: receivedBy.trim() || null,
        receivedByPhone: receivedByPhone.trim() || null,
        notes: notes.trim() || null,
        items: cleanItems,
      });

      toast.success("Delivery note created");
      const id = data?.deliveryNote?.id;
      if (id) nav(`/app/delivery-notes/${id}`);
      else nav(`/app/delivery-notes`);
    } catch (e2) {
      console.error(e2);
      toast.error(e2?.message || "Failed to create delivery note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            New Delivery Note
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            This is for deliveries from your store to a customer (not suppliers).
          </p>
        </div>

        <button
          type="button"
          onClick={() => nav("/app/delivery-notes")}
          className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Header */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Customer name
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Customer phone (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+2507…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Customer address (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Kigali…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Delivered by (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
                placeholder="Staff name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Received by (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Customer / representative"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Receiver phone (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={receivedByPhone}
                onChange={(e) => setReceivedByPhone(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Notes (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: deliver before 5pm"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">Items</div>
              <div className="text-sm text-slate-600">
                Tip: click a row first, then search will fill that row.
              </div>
            </div>

            <button
              type="button"
              onClick={addRow}
              className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-sm"
            >
              + Add item
            </button>
          </div>

          {/* Search */}
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-700">
                Find product (optional)
              </label>
              <div className="text-xs text-slate-500">
                Filling row:{" "}
                <span className="font-semibold">#{targetRow + 1}</span>
              </div>
            </div>

            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={searchQ}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQ(v);

                const t = v.trim();
                if (!t) {
                  setResults([]);
                  return;
                }

                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => runSearch(t), 250);
              }}
              placeholder="Type product name / brand…"
            />

            {canSearch ? (
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
                        onClick={() => pickProduct(targetRow, p)}
                        className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-100"
                      >
                        <div className="text-sm font-medium text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.category || "—"} • Stock: {p.stockQty ?? 0} •{" "}
                          {fmtMoney(p.sellPrice)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200">
                  <th className="p-3 text-left text-sm text-slate-700">
                    Product
                  </th>
                  <th className="p-3 text-center text-sm text-slate-700">
                    Qty
                  </th>
                  <th className="p-3 text-left text-sm text-slate-700">
                    Serial (if any)
                  </th>
                  <th className="p-3 text-right text-sm text-slate-700">
                    Remove
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b border-stone-200">
                    <td className="p-3">
                      <input
                        className={classNames(
                          "w-full rounded-lg border px-3 py-2 text-sm",
                          idx === targetRow
                            ? "border-emerald-400 ring-2 ring-emerald-100"
                            : "border-stone-300"
                        )}
                        value={it.productName}
                        onFocus={() => setTargetRow(idx)}
                        onChange={(e) =>
                          setItem(idx, "productName", e.target.value)
                        }
                        placeholder="Example: Laptop / Charger…"
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        (Optional) Link:{" "}
                        {it.productId ? "Linked to inventory" : "Not linked"}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm text-center"
                        value={it.quantity}
                        onChange={(e) =>
                          setItem(idx, "quantity", Number(e.target.value || 1))
                        }
                      />
                    </td>

                    <td className="p-3">
                      <input
                        className="w-56 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        value={it.serial}
                        onChange={(e) => setItem(idx, "serial", e.target.value)}
                        placeholder="Only if item has serial"
                      />
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-rose-700 hover:underline text-sm"
                        disabled={items.length <= 1}
                        title={
                          items.length <= 1 ? "Keep at least 1 item" : "Remove item"
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => nav("/app/delivery-notes")}
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
              {saving ? "Saving…" : "Create & open"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
