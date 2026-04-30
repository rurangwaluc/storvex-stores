import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
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

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function panel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cx(shell(), "w-full max-w-lg overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
            <div className={cx("text-base font-black tracking-tight", strongText())}>{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text)] transition hover:opacity-90"
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

function SkeletonLine({ className = "" }) {
  return <div className={cx("animate-pulse rounded-full bg-[var(--color-surface)]", className)} />;
}

export default function SupplierSupplyCreate() {
  const { id } = useParams();
  const nav = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loadingSupplier, setLoadingSupplier] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sourceType, setSourceType] = useState("BOUGHT");
  const [sourceDetails, setSourceDetails] = useState("");
  const [documentRef, setDocumentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [alsoUpdateStock, setAlsoUpdateStock] = useState(true);

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

  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [pickRowIndex, setPickRowIndex] = useState(0);
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
    const totalBuy = items.reduce(
      (sum, it) => sum + Number(it.buyPrice || 0) * Number(it.quantity || 0),
      0
    );
    const totalSell = items.reduce(
      (sum, it) => sum + Number(it.sellPrice || 0) * Number(it.quantity || 0),
      0
    );

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

    const cleanItems = items
      .map((it) => {
        const linked = Boolean(it.productId);

        return {
          productId: it.productId || null,
          productName: String(it.productName || "").trim(),
          category: linked ? String(it.category || "").trim() || null : null,
          subcategory: linked ? String(it.subcategory || "").trim() || null : null,
          subcategoryOther: linked ? String(it.subcategoryOther || "").trim() || null : null,
          brand: linked ? String(it.brand || "").trim() || null : null,
          serial: String(it.serial || "").trim() || null,
          quantity: Number(it.quantity),
          buyPrice: Number(it.buyPrice),
          sellPrice: Number(it.sellPrice),
          notes: String(it.notes || "").trim() || null,
        };
      })
      .filter((it) => it.productName);

    if (cleanItems.length === 0) return toast.error("Add at least 1 item");

    for (const it of cleanItems) {
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return toast.error("Quantity must be more than 0");
      }
      if (!Number.isFinite(it.buyPrice) || it.buyPrice < 0) {
        return toast.error("Buy price must be 0 or more");
      }
      if (!Number.isFinite(it.sellPrice) || it.sellPrice < 0) {
        return toast.error("Sell price must be 0 or more");
      }
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

  if (loadingSupplier) {
    return (
      <div className="space-y-6">
        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="mt-4 h-8 w-52" />
            <SkeletonLine className="mt-3 h-4 w-80" />
          </div>
          <div className="p-5 sm:p-6">
            <div className={cx(panel(), "space-y-4 p-5 sm:p-6")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <SkeletonLine className="mb-2 h-3 w-24" />
                    <div className="h-11 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!supplier) return <p className={mutedText()}>Supplier not found.</p>;

  return (
    <div className="space-y-6">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", mutedText())}>
                Supplier deliveries
              </div>
              <h1 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
                New Delivery
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Supplier: <span className={strongText()}>{supplier.name}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => nav(`/app/suppliers/${id}`)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
              >
                Help
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className={cx(panel(), "p-5 sm:p-6")}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Source type</label>
                  <select
                    className="app-input"
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
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Source details</label>
                  <input
                    className="app-input"
                    value={sourceDetails}
                    onChange={(e) => setSourceDetails(e.target.value)}
                    placeholder="Example: bought in Dubai"
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Document ref</label>
                  <input
                    className="app-input"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="Invoice number / receipt number"
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Notes</label>
                  <textarea
                    className="app-textarea w-full min-h-[108px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Example: delivered by John"
                  />
                </div>
              </div>

              <label className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={alsoUpdateStock}
                  onChange={(e) => setAlsoUpdateStock(e.target.checked)}
                />
                Also update inventory stock
              </label>
            </div>

            <div className={cx(panel(), "p-5 sm:p-6")}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className={cx("text-base font-black tracking-tight", strongText())}>Items</div>
                  <div className={cx("mt-1 text-sm", mutedText())}>Add products in this delivery.</div>
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
                >
                  + Add item
                </button>
              </div>

              <div className="mt-4 rounded-[18px] bg-[var(--color-surface)] p-4">
                <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Find product</label>
                <input
                  className="app-input"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Type product name / code / brand..."
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className={cx("text-xs", mutedText())}>Fill row:</div>
                  <select
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-text)]"
                    value={pickRowIndex}
                    onChange={(e) => setPickRowIndex(Number(e.target.value || 0))}
                  >
                    {items.map((_, idx) => (
                      <option key={idx} value={idx}>
                        #{idx + 1}
                      </option>
                    ))}
                  </select>
                </div>

                {searchQ.trim() ? (
                  <div className="mt-3">
                    {searching ? (
                      <div className={cx("text-sm", mutedText())}>Searching...</div>
                    ) : results.length === 0 ? (
                      <div className={cx("text-sm", mutedText())}>No results.</div>
                    ) : (
                      <div className="max-h-56 overflow-auto rounded-2xl bg-[var(--color-card)]">
                        {results.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => pickProduct(pickRowIndex, p)}
                            className="block w-full border-b border-[var(--color-border)] px-4 py-3 text-left transition hover:bg-[var(--color-surface-2)]"
                          >
                            <div className={cx("text-sm font-semibold", strongText())}>{p.name}</div>
                            <div className={cx("mt-1 text-xs", mutedText())}>
                              {p.category || "—"} • Stock: {p.stockQty ?? 0} • {fmtMoney(p.sellPrice)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className={cx("p-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Product name
                      </th>
                      <th className={cx("p-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Qty
                      </th>
                      <th className={cx("p-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Buy
                      </th>
                      <th className={cx("p-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Sell
                      </th>
                      <th className={cx("p-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Serial
                      </th>
                      <th className={cx("p-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Item notes
                      </th>
                      <th className={cx("p-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                        Remove
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-b border-[var(--color-border)] align-top">
                        <td className="p-3">
                          <input
                            className="app-input"
                            value={it.productName}
                            onChange={(e) => setItem(idx, "productName", e.target.value)}
                            placeholder="Example: iPhone 13 128GB"
                          />
                          <div className={cx("mt-1 text-xs", mutedText())}>
                            {it.productId ? "Linked to inventory" : "Not linked"}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            className="w-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-center text-sm text-[var(--color-text)]"
                            value={it.quantity}
                            onChange={(e) => setItem(idx, "quantity", Number(e.target.value || 1))}
                          />
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            className="w-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-right text-sm text-[var(--color-text)]"
                            value={it.buyPrice}
                            onChange={(e) => setItem(idx, "buyPrice", e.target.value)}
                            placeholder="0"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            className="w-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-right text-sm text-[var(--color-text)]"
                            value={it.sellPrice}
                            onChange={(e) => setItem(idx, "sellPrice", e.target.value)}
                            placeholder="0"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            className="w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)]"
                            value={it.serial}
                            onChange={(e) => setItem(idx, "serial", e.target.value)}
                            placeholder="Only if product has serial"
                          />
                        </td>

                        <td className="p-3">
                          <textarea
                            className="w-64 min-h-[92px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm leading-6 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                            rows={3}
                            value={it.notes}
                            onChange={(e) => setItem(idx, "notes", e.target.value)}
                            placeholder="Optional notes for this item"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-sm font-semibold text-[var(--color-danger)] transition hover:opacity-80 disabled:opacity-60"
                            disabled={items.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={cx("rounded-[18px] bg-[var(--color-surface)] p-4")}>
                  <div className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                    Total buy
                  </div>
                  <div className={cx("mt-2 text-xl font-black tracking-tight", strongText())}>
                    {fmtMoney(totals.totalBuy)}
                  </div>
                </div>

                <div className={cx("rounded-[18px] bg-[var(--color-surface)] p-4")}>
                  <div className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                    Total sell
                  </div>
                  <div className={cx("mt-2 text-xl font-black tracking-tight", strongText())}>
                    {fmtMoney(totals.totalSell)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => nav(`/app/suppliers/${id}`)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
                disabled={saving}
              >
                Cancel
              </button>

              <AsyncButton type="submit" loading={saving} loadingText="Saving..." variant="primary">
                Save delivery
              </AsyncButton>
            </div>
          </form>
        </div>
      </section>

      <Modal open={helpOpen} title="Quick rules" onClose={() => setHelpOpen(false)}>
        <div className={cx("space-y-2 text-sm", strongText())}>
          <div>1. If you write a serial number, keep quantity = 1.</div>
          <div>2. Use the search box to link items to inventory.</div>
          <div>3. If stock update is on, inventory increases automatically.</div>
        </div>

        <div className="mt-4 flex justify-end">
          <AsyncButton type="button" variant="primary" onClick={() => setHelpOpen(false)}>
            OK
          </AsyncButton>
        </div>
      </Modal>
    </div>
  );
}