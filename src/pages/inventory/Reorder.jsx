import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { adjustStock, downloadReorderPdf, getStockAdjustments, listProducts } from "../../services/inventoryApi";
import TableSkeleton from "../../components/ui/TableSkeleton";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center sm:p-4">
        <div className="w-full max-w-xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-xl">
          <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-4">
            <div className="font-semibold text-[rgb(var(--text))]">{title}</div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function PillButton({ active, tone = "neutral", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center h-10 px-4 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const inactive =
    "bg-[rgb(var(--bg))] border-[rgb(var(--border))] text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-muted))]";

  const activeNeutral = "bg-[rgb(var(--text))] border-[rgb(var(--text))] text-[rgb(var(--bg-elevated))]";
  const activeDanger = "bg-red-700 border-red-700 text-white";
  const activeWarning = "bg-amber-700 border-amber-700 text-white";

  const activeCls =
    tone === "danger" ? activeDanger : tone === "warning" ? activeWarning : activeNeutral;

  return (
    <button type="button" className={classNames(base, active ? activeCls : inactive, className)} {...props} />
  );
}

function inputClass() {
  return "mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--text-soft))] focus:ring-2 focus:ring-[rgb(var(--border))]";
}

export default function Reorder() {
  const nav = useNavigate();

  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [outRows, setOutRows] = useState([]);
  const [lowRows, setLowRows] = useState([]);
  const [tab, setTab] = useState("OUT");
  const [downloading, setDownloading] = useState(false);

  const [stockOpen, setStockOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockBusy, setStockBusy] = useState(false);
  const [stockType, setStockType] = useState("RESTOCK");
  const [stockQty, setStockQty] = useState("");
  const [stockNewQty, setStockNewQty] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [stockHistory, setStockHistory] = useState([]);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const th = Number(threshold || 5);
      const safeTh = Number.isFinite(th) && th >= 0 ? Math.floor(th) : 5;

      const [outRes, lowRes] = await Promise.all([
        listProducts({ outOfStock: true, active: true, limit: 200, sort: "name" }),
        listProducts({ lowStock: true, threshold: safeTh, active: true, limit: 200, sort: "stock_low" }),
      ]);

      setOutRows(Array.isArray(outRes?.products) ? outRes.products : []);
      setLowRows(Array.isArray(lowRes?.products) ? lowRes.products : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load reorder list");
      setOutRows([]);
      setLowRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [threshold]);

  async function handleDownloadPdf() {
    if (downloading) return;

    setDownloading(true);
    try {
      const blobData = await downloadReorderPdf({ threshold });
      const blob = new Blob([blobData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "storvex-reorder-list.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function openStockModal(p) {
    setStockProduct(p);
    setStockType("RESTOCK");
    setStockQty("");
    setStockNewQty("");
    setStockNote("");
    setStockHistory([]);
    setStockOpen(true);

    setStockHistoryLoading(true);
    try {
      const data = await getStockAdjustments(p.id);
      const rows = Array.isArray(data?.adjustments) ? data.adjustments : [];
      setStockHistory(rows.slice(0, 10));
    } catch {
      setStockHistory([]);
    } finally {
      setStockHistoryLoading(false);
    }
  }

  function calcPreview() {
    const current = Number(stockProduct?.stockQty || 0);

    if (stockType === "CORRECTION") {
      const n = Number(stockNewQty);
      if (!Number.isFinite(n) || n < 0) return null;
      return { before: current, after: Math.floor(n) };
    }

    const qn = Number(stockQty);
    if (!Number.isFinite(qn) || qn <= 0) return null;

    const delta = Math.floor(qn);
    const after = stockType === "RESTOCK" ? current + delta : current - delta;
    if (after < 0) return null;

    return { before: current, after };
  }

  async function submitStock() {
    if (!stockProduct) return;

    const preview = calcPreview();
    if (!preview) {
      toast.error("Please enter a correct number");
      return;
    }

    setStockBusy(true);
    try {
      const payload =
        stockType === "CORRECTION"
          ? { type: "CORRECTION", newStockQty: preview.after, note: stockNote || null }
          : { type: stockType, quantity: Number(stockQty), note: stockNote || null };

      await adjustStock(stockProduct.id, payload);

      toast.success("Stock updated");
      setStockOpen(false);
      setStockProduct(null);
      await load();
    } catch (err) {
      toast.error(err?.message || "Failed to update stock");
    } finally {
      setStockBusy(false);
    }
  }

  const preview = calcPreview();
  const rows = tab === "OUT" ? outRows : lowRows;

  const summaryCards = useMemo(
    () => [
      { label: "Out of stock", value: outRows.length },
      { label: "Low stock", value: lowRows.length },
      { label: "Threshold", value: threshold },
    ],
    [outRows.length, lowRows.length, threshold]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">Reorder list</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Use this page to act on stock risk before sales are lost.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => nav("/app/inventory")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
          >
            Back to inventory
          </button>

          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[rgb(var(--text))] px-4 text-sm font-medium text-[rgb(var(--bg-elevated))] transition hover:opacity-90 disabled:opacity-60"
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--text))]">Filters</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Low stock threshold</label>
              <input
                type="number"
                min="0"
                className={inputClass()}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value || 5))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3"
                >
                  <div className="text-xs text-[rgb(var(--text-muted))]">{card.label}</div>
                  <div className="mt-1 text-xl font-semibold text-[rgb(var(--text))]">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <PillButton active={tab === "OUT"} tone="danger" onClick={() => setTab("OUT")}>
                Out of stock
              </PillButton>
              <PillButton active={tab === "LOW"} tone="warning" onClick={() => setTab("LOW")}>
                Low stock
              </PillButton>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4 shadow-sm">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-left text-sm font-medium text-[rgb(var(--text-muted))]">Product</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-left text-sm font-medium text-[rgb(var(--text-muted))]">Category</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-center text-sm font-medium text-[rgb(var(--text-muted))]">Stock</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-right text-sm font-medium text-[rgb(var(--text-muted))]">Sell</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-right text-sm font-medium text-[rgb(var(--text-muted))]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={8} cols={5} />
                </tbody>
              </table>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgb(var(--border))] px-4 py-10 text-center text-sm text-[rgb(var(--text-muted))]">
              {tab === "OUT" ? "No products are out of stock." : "No products are currently below threshold."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-left text-sm font-medium text-[rgb(var(--text-muted))]">Product</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-left text-sm font-medium text-[rgb(var(--text-muted))]">Category</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-center text-sm font-medium text-[rgb(var(--text-muted))]">Stock</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-right text-sm font-medium text-[rgb(var(--text-muted))]">Sell</th>
                    <th className="border-b border-[rgb(var(--border))] px-3 py-3 text-right text-sm font-medium text-[rgb(var(--text-muted))]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text))]">
                        <div className="font-medium">{p.name}</div>
                        {p.serial ? (
                          <div className="mt-1 text-xs text-[rgb(var(--text-muted))]">Serial: {p.serial}</div>
                        ) : null}
                      </td>
                      <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text-muted))]">
                        {p.category || "—"}
                      </td>
                      <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-center text-sm font-semibold text-[rgb(var(--text))]">
                        {p.stockQty}
                      </td>
                      <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-right text-sm text-[rgb(var(--text))]">
                        {formatMoney(p.sellPrice)}
                      </td>
                      <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openStockModal(p)}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-[rgb(var(--text))] px-4 text-sm font-medium text-[rgb(var(--bg-elevated))] transition hover:opacity-90"
                        >
                          Adjust stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">
                Use stock adjustments when items arrive, are damaged, or physical count differs.
              </p>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={stockOpen}
        title="Stock adjustment"
        onClose={() => {
          if (stockBusy) return;
          setStockOpen(false);
          setStockProduct(null);
        }}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm">
            <div className="font-medium text-[rgb(var(--text))]">{stockProduct?.name || "—"}</div>
            <div className="mt-1 text-[rgb(var(--text-muted))]">
              Current stock: {stockProduct?.stockQty ?? 0}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Type</label>
              <select
                value={stockType}
                onChange={(e) => {
                  setStockType(e.target.value);
                  setStockQty("");
                  setStockNewQty("");
                }}
                className={inputClass()}
              >
                <option value="RESTOCK">Restock</option>
                <option value="LOSS">Loss / Damage</option>
                <option value="CORRECTION">Correction</option>
              </select>
            </div>

            {stockType === "CORRECTION" ? (
              <div>
                <label className="text-sm font-medium text-[rgb(var(--text))]">New stock</label>
                <input
                  type="number"
                  min="0"
                  value={stockNewQty}
                  onChange={(e) => setStockNewQty(e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. 50"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-[rgb(var(--text))]">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. 10"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-[rgb(var(--text))]">Note</label>
            <input
              value={stockNote}
              onChange={(e) => setStockNote(e.target.value)}
              className={inputClass()}
              placeholder="Reason for this change"
            />
          </div>

          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm">
            {preview ? (
              <div className="text-[rgb(var(--text))]">
                New stock will be <span className="font-semibold">{preview.after}</span>
              </div>
            ) : (
              <div className="text-[rgb(var(--text-muted))]">Enter a valid value to preview the result.</div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                if (stockBusy) return;
                setStockOpen(false);
                setStockProduct(null);
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
              disabled={stockBusy}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submitStock}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[rgb(var(--text))] px-4 text-sm font-medium text-[rgb(var(--bg-elevated))] transition hover:opacity-90 disabled:opacity-60"
              disabled={stockBusy || !preview}
            >
              {stockBusy ? "Saving..." : "Save adjustment"}
            </button>
          </div>

          <div className="border-t border-[rgb(var(--border))] pt-4">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">Recent changes</div>

            {stockHistoryLoading ? (
              <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Loading...</p>
            ) : stockHistory.length === 0 ? (
              <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">No history yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {stockHistory.map((h) => (
                  <li key={h.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
                    <div className="font-medium text-[rgb(var(--text))]">
                      {h.type} • {h.beforeQty} → {h.afterQty}
                    </div>
                    <div className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                      {new Date(h.createdAt).toLocaleString()}
                    </div>
                    {h.note ? (
                      <div className="mt-1 text-xs text-[rgb(var(--text-muted))]">Note: {h.note}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}