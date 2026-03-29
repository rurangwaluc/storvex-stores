import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  activateProduct,
  deleteProduct,
  getInventorySummary,
  listProducts,
} from "../../services/inventoryApi";
import PageSkeleton from "../../components/ui/PageSkeleton";

const PAGE_SIZE = 10;

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
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

function shell() {
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function inputClass() {
  return "h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function subtleBtn() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-red-300 bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60 dark:border-red-900 dark:bg-red-700 dark:hover:bg-red-600";
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "success"
      ? "bg-emerald-500"
      : "bg-stone-900 dark:bg-[rgb(var(--text))]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
        {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
      </div>
    </div>
  );
}

function StatusBadge({ kind = "neutral", children }) {
  const cls =
    kind === "danger"
      ? "badge-danger"
      : kind === "warning"
      ? "badge-warning"
      : kind === "success"
      ? "badge-success"
      : "badge-neutral";

  return <span className={cls}>{children}</span>;
}

function FilterChip({ active, children, onClick, tone = "neutral" }) {
  const activeCls =
    tone === "danger"
      ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
      : tone === "warning"
      ? "border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
      : "border-stone-950 bg-stone-950 text-white hover:bg-stone-800 dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition",
        active
          ? activeCls
          : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]"
      )}
    >
      {children}
    </button>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cx(
            "w-full max-w-md rounded-3xl border border-stone-200 bg-white shadow-2xl",
            "dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]"
          )}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border px-0"
                style={{
                  background: "rgb(var(--danger-bg))",
                  color: "rgb(var(--danger-text))",
                  borderColor: "rgb(var(--danger-border))",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 8v5m0 4h.01M10.29 3.86l-8 14A1 1 0 003.16 19h17.68a1 1 0 00.87-1.5l-8-14a1 1 0 00-1.74 0z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className={cx("text-lg font-semibold", strongText())}>{title}</h3>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>{message}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={secondaryBtn()}
              >
                Cancel
              </button>

              <AsyncButton loading={loading} onClick={onConfirm} className={dangerBtn()}>
                {confirmLabel}
              </AsyncButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshBar({ visible }) {
  return (
    <div
      className={cx(
        "overflow-hidden border-b border-stone-200 bg-stone-50 transition-all dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]",
        visible ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 text-xs">
        <span className={mutedText()}>Refreshing inventory…</span>
        <span className="inline-flex items-center gap-2 text-stone-500 dark:text-[rgb(var(--text-soft))]">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Syncing
        </span>
      </div>
    </div>
  );
}

function DesktopRow({
  product,
  threshold,
  busyId,
  onEdit,
  onDeactivate,
  onActivate,
}) {
  const qty = Number(product.stockQty || 0);
  const min = Number.isFinite(Number(product.minStockLevel))
    ? Number(product.minStockLevel)
    : null;

  const thresholdToUse = min != null && min >= 0 ? min : threshold;
  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= thresholdToUse;

  const categoryLabel = [
    product.category || null,
    product.subcategory || null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <tr className="border-b border-stone-200 align-middle last:border-b-0 dark:border-[rgb(var(--border))]">
      <td className="px-4 py-4">
        <div className="min-w-0">
          <div className={cx("truncate text-sm font-semibold", strongText())}>
            {product.name}
          </div>
          <div className={cx("mt-1 text-sm", mutedText())}>
            {product.brand || "—"}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className={cx("text-sm", strongText())}>{categoryLabel || "—"}</div>
      </td>

      <td className="px-4 py-4">
        <div className={cx("space-y-1 text-sm leading-5", mutedText())}>
          <div className="truncate">SKU: {product.sku || "—"}</div>
          <div className="truncate">Barcode: {product.barcode || "—"}</div>
          <div className="truncate">Serial: {product.serial || "—"}</div>
        </div>
      </td>

      <td className={cx("px-4 py-4 text-right", strongText())}>
        <div className="text-sm font-medium">{formatMoney(product.costPrice)}</div>
      </td>

      <td className={cx("px-4 py-4 text-right", strongText())}>
        <div className="text-sm font-semibold">{formatMoney(product.sellPrice)}</div>
      </td>

      <td className="px-4 py-4 text-center">
        <div className={cx("text-xl font-semibold leading-none", strongText())}>
          {qty}
        </div>
        <div className={cx("mt-2 text-xs", softText())}>Min {thresholdToUse}</div>
      </td>

      <td className="px-4 py-4">
        <div className="flex flex-col items-center gap-2">
          {isOut ? (
            <StatusBadge kind="danger" className="min-w-[116px]">
              Stock Out
            </StatusBadge>
          ) : null}

          {!isOut && isLow ? (
            <StatusBadge kind="warning" className="min-w-[116px]">
              Low
            </StatusBadge>
          ) : null}

          {!isOut && !isLow ? (
            <StatusBadge kind="success" className="min-w-[116px]">
              Healthy
            </StatusBadge>
          ) : null}

          {!product.isActive ? (
            <StatusBadge className="min-w-[116px]">Inactive</StatusBadge>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(product.id)}
            className={subtleBtn()}
          >
            Edit
          </button>

          {product.isActive ? (
            <AsyncButton
              loading={busyId === product.id}
              onClick={() => onDeactivate(product)}
              variant="secondary"
              className={subtleBtn()}
            >
              Deactivate
            </AsyncButton>
          ) : (
            <AsyncButton
              loading={busyId === product.id}
              onClick={() => onActivate(product)}
              className={primaryBtn()}
            >
              Activate
            </AsyncButton>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileCard({
  product,
  threshold,
  busyId,
  onEdit,
  onDeactivate,
  onActivate,
}) {
  const qty = Number(product.stockQty || 0);
  const min = Number.isFinite(Number(product.minStockLevel))
    ? Number(product.minStockLevel)
    : null;
  const thresholdToUse = min != null && min >= 0 ? min : threshold;
  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= thresholdToUse;

  return (
    <div className={cx(shell(), "overflow-hidden")}>
      <div className="border-b border-stone-200 px-4 py-4 dark:border-[rgb(var(--border))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={cx("truncate text-base font-semibold", strongText())}>{product.name}</div>
            <div className={cx("mt-1 text-sm", mutedText())}>{product.brand || "—"}</div>
          </div>
          <div className="text-right">
            <div className={cx("text-xs", softText())}>Stock</div>
            <div className={cx("mt-1 text-xl font-semibold", strongText())}>{qty}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isOut ? <StatusBadge kind="danger">Out of stock</StatusBadge> : null}
          {!isOut && isLow ? <StatusBadge kind="warning">Low stock</StatusBadge> : null}
          {!isOut && !isLow ? <StatusBadge kind="success">Healthy</StatusBadge> : null}
          {!product.isActive ? <StatusBadge>Inactive</StatusBadge> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-4 text-sm">
        <div>
          <div className={softText()}>Category</div>
          <div className={cx("mt-1", strongText())}>
            {product.category || "—"}
            {product.subcategory ? ` • ${product.subcategory}` : ""}
          </div>
        </div>

        <div>
          <div className={softText()}>Min stock</div>
          <div className={cx("mt-1", strongText())}>{thresholdToUse}</div>
        </div>

        <div>
          <div className={softText()}>Buy</div>
          <div className={cx("mt-1", strongText())}>{formatMoney(product.costPrice)}</div>
        </div>

        <div>
          <div className={softText()}>Sell</div>
          <div className={cx("mt-1", strongText())}>{formatMoney(product.sellPrice)}</div>
        </div>

        <div className="col-span-2">
          <div className={softText()}>Codes</div>
          <div className={cx("mt-1 space-y-1", mutedText())}>
            <div>SKU: {product.sku || "—"}</div>
            <div>Barcode: {product.barcode || "—"}</div>
            <div>Serial: {product.serial || "—"}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-stone-200 px-4 py-4 dark:border-[rgb(var(--border))]">
        <button type="button" onClick={() => onEdit(product.id)} className={secondaryBtn()}>
          Edit product
        </button>

        {product.isActive ? (
          <AsyncButton
            loading={busyId === product.id}
            onClick={() => onDeactivate(product)}
            variant="secondary"
            className={secondaryBtn()}
          >
            Deactivate
          </AsyncButton>
        ) : (
          <AsyncButton
            loading={busyId === product.id}
            onClick={() => onActivate(product)}
            className={primaryBtn()}
          >
            Activate
          </AsyncButton>
        )}
      </div>
    </div>
  );
}

export default function InventoryList() {
  const navigate = useNavigate();
  const requestSeqRef = useRef(0);

  const [initialSummaryLoading, setInitialSummaryLoading] = useState(true);
  const [initialListLoading, setInitialListLoading] = useState(true);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(false);
  const [refreshingList, setRefreshingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [nextCursor, setNextCursor] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    product: null,
    loading: false,
  });

  const [summary, setSummary] = useState({
    totalActiveProducts: 0,
    totalStockUnits: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    stockCostValue: 0,
    stockSellValue: 0,
  });

  const [products, setProducts] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    sort: "newest",
    active: "true",
    lowStock: false,
    outOfStock: false,
    threshold: 5,
    category: "",
    brand: "",
  });

  const [debouncedQuery, setDebouncedQuery] = useState("");

  const safeThreshold = useMemo(() => {
    const n = Number(filters.threshold);
    return Number.isFinite(n) && n >= 0 ? n : 5;
  }, [filters.threshold]);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function buildListParams(cursor = undefined) {
    return {
      q: debouncedQuery.trim() || undefined,
      sort: filters.sort,
      active: filters.active === "true",
      lowStock: filters.lowStock,
      outOfStock: filters.outOfStock,
      threshold: safeThreshold,
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      limit: PAGE_SIZE,
      cursor,
    };
  }

  async function loadSummary({ silent = false } = {}) {
    if (!silent) setInitialSummaryLoading(true);

    try {
      const data = await getInventorySummary();
      setSummary(
        data?.summary || {
          totalActiveProducts: 0,
          totalStockUnits: 0,
          outOfStockCount: 0,
          lowStockCount: 0,
          stockCostValue: 0,
          stockSellValue: 0,
        }
      );
    } catch (err) {
      toast.error(err?.message || "Failed to load inventory summary");
    } finally {
      if (!silent) setInitialSummaryLoading(false);
    }
  }

  async function loadFirstPage() {
    const requestId = ++requestSeqRef.current;
    const hasExistingRows = products.length > 0;

    if (hasExistingRows) {
      setRefreshingList(true);
    } else {
      setInitialListLoading(true);
    }

    try {
      const data = await listProducts(buildListParams());

      if (requestId !== requestSeqRef.current) return;

      setProducts(Array.isArray(data?.products) ? data.products : []);
      setNextCursor(data?.nextCursor || null);
    } catch (err) {
      if (requestId !== requestSeqRef.current) return;

      toast.error(err?.message || "Failed to load products");

      if (!hasExistingRows) {
        setProducts([]);
        setNextCursor(null);
      }
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialListLoading(false);
        setRefreshingList(false);
      }
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await listProducts(buildListParams(nextCursor));
      const more = Array.isArray(data?.products) ? data.products : [];
      setProducts((prev) => [...prev, ...more]);
      setNextCursor(data?.nextCursor || null);
    } catch (err) {
      toast.error(err?.message || "Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadSummary({ silent: true }), loadFirstPage()]);
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(filters.q);
    }, 180);

    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedQuery,
    filters.sort,
    filters.active,
    filters.lowStock,
    filters.outOfStock,
    filters.threshold,
    filters.category,
    filters.brand,
  ]);

  useEffect(() => {
    if (!initialListLoading) {
      setShowInitialSkeleton(false);
      return;
    }

    const t = setTimeout(() => {
      setShowInitialSkeleton(true);
    }, 120);

    return () => clearTimeout(t);
  }, [initialListLoading]);

  function openDeactivateDialog(product) {
    setConfirmState({
      open: true,
      product,
      loading: false,
    });
  }

  function closeDeactivateDialog() {
    if (confirmState.loading) return;
    setConfirmState({
      open: false,
      product: null,
      loading: false,
    });
  }

  async function confirmDeactivate() {
    const product = confirmState.product;
    if (!product) return;

    setConfirmState((prev) => ({ ...prev, loading: true }));
    setBusyId(product.id);

    try {
      await deleteProduct(product.id);
      toast.success("Product deactivated");
      setConfirmState({
        open: false,
        product: null,
        loading: false,
      });
      await refreshAll();
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate product");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    } finally {
      setBusyId("");
    }
  }

  async function handleActivate(product) {
    setBusyId(product.id);
    try {
      await activateProduct(product.id);
      toast.success("Product activated");
      await refreshAll();
    } catch (err) {
      toast.error(err?.message || "Failed to activate product");
    } finally {
      setBusyId("");
    }
  }

  const inventoryHealthTone =
    summary.outOfStockCount > 0
      ? "danger"
      : summary.lowStockCount > 0
      ? "warning"
      : "success";

  const inventoryHealthText =
    summary.outOfStockCount > 0
      ? `${summary.outOfStockCount} items need urgent replenishment`
      : summary.lowStockCount > 0
      ? `${summary.lowStockCount} items are approaching stock risk`
      : "Inventory is currently healthy";

  const currentScopeLabel = filters.outOfStock
    ? "Showing products that are already out of stock."
    : filters.lowStock
    ? `Showing products at or below low-stock level (${safeThreshold} default).`
    : "Showing current catalog state across active inventory.";

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={confirmState.open}
        title="Deactivate product"
        message={
          confirmState.product
            ? `"${confirmState.product.name}" will be hidden from active inventory and daily selling flows until you activate it again.`
            : ""
        }
        confirmLabel="Deactivate"
        loading={confirmState.loading}
        onCancel={closeDeactivateDialog}
        onConfirm={confirmDeactivate}
      />

      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Inventory
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Inventory control
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Monitor stock position, value on hand, replenishment risk, and catalog quality
                from one operational screen.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/app/inventory/reorder")}
                className={secondaryBtn()}
              >
                Reorder list
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/inventory/stock-history")}
                className={secondaryBtn()}
              >
                Stock history
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/inventory/create")}
                className={primaryBtn()}
              >
                Add product
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          {initialSummaryLoading ? (
            <div className="col-span-full">
              <PageSkeleton titleWidth="w-40" lines={1} showTable={false} />
            </div>
          ) : (
            <>
              <SummaryCard
                label="Active products"
                value={summary.totalActiveProducts}
                note="Products currently available in your catalog"
              />
              <SummaryCard
                label="Units in stock"
                value={summary.totalStockUnits}
                note="Total sellable units on hand"
              />
              <SummaryCard
                label="Inventory cost value"
                value={formatMoney(summary.stockCostValue)}
                note="Capital tied in stock"
              />
              <SummaryCard
                label="Inventory retail value"
                value={formatMoney(summary.stockSellValue)}
                note={inventoryHealthText}
                tone={inventoryHealthTone}
              />
            </>
          )}
        </div>

        {!initialSummaryLoading ? (
          <div className="grid grid-cols-1 gap-3 border-t border-stone-200 px-5 py-4 sm:grid-cols-2 xl:grid-cols-3 dark:border-[rgb(var(--border))]">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              <div className={cx("text-xs font-medium uppercase tracking-[0.14em]", softText())}>
                Out of stock
              </div>
              <div className={cx("mt-2 text-xl font-semibold", strongText())}>
                {summary.outOfStockCount}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              <div className={cx("text-xs font-medium uppercase tracking-[0.14em]", softText())}>
                Low stock
              </div>
              <div className={cx("mt-2 text-xl font-semibold", strongText())}>
                {summary.lowStockCount}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              <div className={cx("text-xs font-medium uppercase tracking-[0.14em]", softText())}>
                Current focus
              </div>
              <div className={cx("mt-2 text-sm leading-6", strongText())}>{currentScopeLabel}</div>
            </div>
          </div>
        ) : null}
      </section>

      <section className={cx(shell(), "p-4")}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className={cx("text-sm font-medium", strongText())}>Search</label>
            <input
              className={inputClass()}
              placeholder="Name, item code, serial, barcode..."
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Sort</label>
            <select
              className={inputClass()}
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="stock_low">Stock low → high</option>
              <option value="stock_high">Stock high → low</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Status</label>
            <select
              className={inputClass()}
              value={filters.active}
              onChange={(e) => setFilter("active", e.target.value)}
            >
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Category</label>
            <input
              className={inputClass()}
              placeholder="Phones, Laptops..."
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <label className={cx("text-sm font-medium", strongText())}>Brand</label>
            <input
              className={inputClass()}
              placeholder="Apple, Samsung..."
              value={filters.brand}
              onChange={(e) => setFilter("brand", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={!filters.lowStock && !filters.outOfStock}
              onClick={() => {
                setFilter("lowStock", false);
                setFilter("outOfStock", false);
              }}
            >
              All products
            </FilterChip>

            <FilterChip
              active={filters.lowStock && !filters.outOfStock}
              tone="warning"
              onClick={() => {
                setFilter("lowStock", true);
                setFilter("outOfStock", false);
              }}
            >
              Low stock
            </FilterChip>

            <FilterChip
              active={filters.outOfStock}
              tone="danger"
              onClick={() => {
                setFilter("outOfStock", true);
                setFilter("lowStock", false);
              }}
            >
              Out of stock
            </FilterChip>
          </div>

          <div className="flex items-center gap-2">
            <label className={cx("text-sm", mutedText())}>Default low-stock level</label>
            <input
              type="number"
              min="0"
              className="h-10 w-24 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]"
              value={filters.threshold}
              onChange={(e) => setFilter("threshold", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="hidden lg:block">
          <div className={shell()}>
            <RefreshBar visible={refreshingList} />

            {initialListLoading && showInitialSkeleton && products.length === 0 ? (
              <div className="px-4 py-6">
                <PageSkeleton titleWidth="w-40" lines={1} showTable={true} />
              </div>
            ) : (
              <div className={cx("overflow-x-auto", refreshingList ? "opacity-80" : "opacity-100")}>
                <table className="w-full min-w-[1040px]">
                  <thead className="border-b border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                    <tr>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Product
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Category
                      </th>
                      <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Codes
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Buy
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Sell
                      </th>
                      <th className={cx("px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Stock
                      </th>
                      <th className={cx("px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Status
                      </th>
                      <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {!initialListLoading && products.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={cx("px-4 py-12 text-center text-sm", mutedText())}>
                          No products found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <DesktopRow
                          key={product.id}
                          product={product}
                          threshold={safeThreshold}
                          busyId={busyId}
                          onEdit={(id) => navigate(`/app/inventory/${id}/edit`)}
                          onDeactivate={openDeactivateDialog}
                          onActivate={handleActivate}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:hidden">
          {initialListLoading && showInitialSkeleton && products.length === 0 ? (
            <PageSkeleton titleWidth="w-40" lines={1} showTable={true} />
          ) : !initialListLoading && products.length === 0 ? (
            <div className={cx(shell(), "px-4 py-10 text-center text-sm", mutedText())}>
              No products found for the current filters.
            </div>
          ) : (
            <>
              {refreshingList ? (
                <div className={cx(shell(), "px-4 py-2 text-xs", mutedText())}>
                  Refreshing inventory…
                </div>
              ) : null}

              <div className={cx("grid grid-cols-1 gap-3", refreshingList ? "opacity-80" : "opacity-100")}>
                {products.map((product) => (
                  <MobileCard
                    key={product.id}
                    product={product}
                    threshold={safeThreshold}
                    busyId={busyId}
                    onEdit={(id) => navigate(`/app/inventory/${id}/edit`)}
                    onDeactivate={openDeactivateDialog}
                    onActivate={handleActivate}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!initialListLoading && products.length > 0 ? (
          <div className="flex flex-col items-center gap-2">
            {nextCursor ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className={cx(secondaryBtn(), "min-w-[160px]")}
              >
                {loadingMore ? "Loading..." : "Load 10 more"}
              </button>
            ) : (
              <div className={cx("text-sm", mutedText())}>All matching products loaded</div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}