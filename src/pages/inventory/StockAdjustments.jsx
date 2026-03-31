import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { downloadStockAdjustmentsExcel, listAllStockAdjustments } from "../../services/inventoryApi";
import TableSkeleton from "../../components/ui/TableSkeleton";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

function toISODate(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function labelType(t) {
  if (t === "RESTOCK") return "Restock";
  if (t === "LOSS") return "Loss / Damage";
  if (t === "CORRECTION") return "Correction";
  return String(t || "—");
}

function formatDelta(n) {
  const x = Number(n || 0);
  if (x > 0) return `+${x}`;
  return String(x);
}

function inputClass() {
  return "mt-1 h-11 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--text-soft))] focus:ring-2 focus:ring-[rgb(var(--border))]";
}

function shell() {
  return "rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-sm";
}

export default function StockAdjustments() {
  const nav = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(toISODate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toISODate(today));
  const [type, setType] = useState("");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listAllStockAdjustments({
        from,
        to,
        type: type || undefined,
        q: q.trim() || undefined,
        limit: 200,
      });

      const list = Array.isArray(data?.adjustments) ? data.adjustments : [];
      setRows(list);
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "stock-history-load-blocked" })) return;
      toast.error(err?.message || "Failed to load stock history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadExcel() {
    if (downloadingExcel) return;

    setDownloadingExcel(true);
    try {
      const { blob, filename } = await downloadStockAdjustmentsExcel({
        from,
        to,
        type: type || undefined,
        q: q.trim() || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "storvex-stock-history.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded");
    } catch (err) {
      if (handleSubscriptionBlockedError(err, { toastId: "stock-history-export-blocked" })) return;
      toast.error(err?.message || "Failed to download Excel");
    } finally {
      setDownloadingExcel(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [from, to, type, q]);

  return (
    <div className="space-y-5">
      <section className={shell()}>
        <div className="border-b border-[rgb(var(--border))] px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-soft))]">
                Inventory
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--text))]">
                Stock history
              </h1>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
                Every stock movement should be explainable by product, person, type, and note.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => nav("/app/inventory")}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
              >
                Back to inventory
              </button>

              <button
                type="button"
                onClick={load}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-[rgb(var(--text))] px-4 text-sm font-medium text-[rgb(var(--bg-elevated))] transition hover:opacity-90 disabled:opacity-60"
              >
                {downloadingExcel ? "Downloading..." : "Download Excel"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">From</label>
              <input type="date" className={inputClass()} value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">To</label>
              <input type="date" className={inputClass()} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Type</label>
              <select className={inputClass()} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All</option>
                <option value="RESTOCK">Restock</option>
                <option value="LOSS">Loss / Damage</option>
                <option value="CORRECTION">Correction</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Search</label>
              <input
                className={inputClass()}
                placeholder="Product / code / serial / barcode"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-[rgb(var(--text-muted))]">
            Showing <span className="font-semibold text-[rgb(var(--text))]">{rows.length}</span> change(s)
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {["Date", "Product", "Type", "Delta", "Before", "After", "By", "Note"].map((h) => (
                        <th
                          key={h}
                          className="border-b border-[rgb(var(--border))] px-3 py-3 text-left text-sm font-medium text-[rgb(var(--text-muted))]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <TableSkeleton rows={10} cols={8} />
                  </tbody>
                </table>
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] px-4 py-10 text-center text-sm text-[rgb(var(--text-muted))]">
                No stock changes found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {["Date", "Product", "Type", "Delta", "Before", "After", "By", "Note"].map((h) => (
                        <th
                          key={h}
                          className="border-b border-[rgb(var(--border))] px-3 py-3 text-left text-sm font-medium text-[rgb(var(--text-muted))]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r) => {
                      const delta = Number(r.delta || 0);
                      const deltaTone =
                        delta > 0
                          ? "text-emerald-700"
                          : delta < 0
                          ? "text-red-700"
                          : "text-[rgb(var(--text))]";

                      return (
                        <tr key={r.id}>
                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text-muted))]">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>

                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text))]">
                            <div className="font-medium">{r.product?.name || "—"}</div>
                            <div className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                              {r.product?.category || ""}
                            </div>
                          </td>

                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text-muted))]">
                            {labelType(r.type)}
                          </td>

                          <td className={`border-b border-[rgb(var(--border))] px-3 py-3 text-sm font-semibold ${deltaTone}`}>
                            {formatDelta(delta)}
                          </td>

                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text))]">
                            {r.beforeQty}
                          </td>

                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text))]">
                            {r.afterQty}
                          </td>

                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text-muted))]">
                            {r.createdBy?.name || "System"}
                          </td>

                          <td className="border-b border-[rgb(var(--border))] px-3 py-3 text-sm text-[rgb(var(--text-muted))]">
                            {r.note || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">
                  Suspicious changes should be investigated using the user name, note, and timestamp.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}