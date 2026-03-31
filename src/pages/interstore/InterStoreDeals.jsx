import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

import CreateDealModal from "./InterStoreCreateModal";
import {
  getDeals,
  markReceived,
  markReturned,
  markSold,
} from "../../services/interStoreApi";

const PAGE_SIZE = 10;

function getCurrentRole() {
  const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded?.role ? String(decoded.role).toUpperCase() : null;
  } catch {
    return null;
  }
}

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
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
  return "rounded-[26px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function panel() {
  return "rounded-[22px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function miniBtn(kind = "default") {
  if (kind === "success") {
    return "inline-flex h-9 items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 px-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60";
  }

  if (kind === "warning") {
    return "inline-flex h-9 items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-60";
  }

  return "inline-flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function formatMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function toDateLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function toDateTimeLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusMeta(status) {
  const map = {
    BORROWED: {
      label: "Borrowed",
      chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
    },
    RECEIVED: {
      label: "Received",
      chip: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300",
    },
    SOLD: {
      label: "Sold",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
    },
    PAID: {
      label: "Paid",
      chip: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300",
    },
    RETURNED: {
      label: "Returned",
      chip: "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200",
    },
  };

  return (
    map[String(status || "").toUpperCase()] || {
      label: String(status || "Unknown"),
      chip: "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200",
    }
  );
}

function StatusPill({ status }) {
  const meta = statusMeta(status);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.chip
      )}
    >
      {meta.label}
    </span>
  );
}

function SupplierPill({ deal }) {
  const isInternal = Boolean(deal?.supplierTenantId);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        isInternal
          ? "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
          : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300"
      )}
    >
      {isInternal ? "Internal store" : "External supplier"}
    </span>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "danger"
      ? "bg-rose-500"
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

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
        active
          ? "border-stone-950 bg-stone-950 text-white hover:bg-stone-800 dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]"
          : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]"
      )}
    >
      {children}
    </button>
  );
}

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cx(
            panel(),
            "overflow-hidden p-4 animate-pulse"
          )}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-stone-200 dark:bg-stone-700" />
                <div className="h-6 w-28 rounded-full bg-stone-200 dark:bg-stone-700" />
              </div>

              <div className="mt-3 h-5 w-64 rounded bg-stone-200 dark:bg-stone-700" />
              <div className="mt-2 h-4 w-52 rounded bg-stone-100 dark:bg-stone-800" />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="h-20 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                <div className="h-20 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                <div className="h-20 rounded-2xl bg-stone-100 dark:bg-stone-800" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="h-10 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="h-10 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="h-10 rounded bg-stone-100 dark:bg-stone-800" />
                <div className="h-10 rounded bg-stone-100 dark:bg-stone-800" />
              </div>
            </div>

            <div className="xl:w-[220px] xl:shrink-0">
              <div className="h-44 rounded-2xl bg-stone-100 dark:bg-stone-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(shell(), "px-5 py-12 text-center")}>
      <div className={cx("text-base font-semibold", strongText())}>{title}</div>
      <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
    </div>
  );
}

function DealCard({
  deal,
  busyKey,
  onOpen,
  onReceive,
  onReturn,
  onSold,
}) {
  const supplierLabel = deal.supplierTenantId
    ? "Internal store"
    : deal.externalSupplierName || "External supplier";

  const busy = (key) => busyKey === `${deal.id}:${key}`;

  return (
    <div className={cx(panel(), "overflow-hidden p-4 transition hover:shadow-md")}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={deal.status} />
            <SupplierPill deal={deal} />
          </div>

          <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h3 className={cx("truncate text-lg font-semibold", strongText())}>
                {deal.productName || "Unnamed product"}
              </h3>
              <div className={cx("mt-1 text-sm", mutedText())}>
                Serial: <span className={cx("font-medium", strongText())}>{deal.serial || "—"}</span>
              </div>
            </div>

            <div className="shrink-0 text-left xl:text-right">
              <div className={softText()}>Agreed price</div>
              <div className={cx("mt-1 text-base font-semibold", strongText())}>
                {formatMoney(deal.agreedPrice)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
              <div className={softText()}>Supplier</div>
              <div className={cx("mt-1 text-sm font-medium", strongText())}>{supplierLabel}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
              <div className={softText()}>Reseller</div>
              <div className={cx("mt-1 text-sm font-medium", strongText())}>{deal.resellerName || "—"}</div>
              <div className={cx("mt-1 text-xs", mutedText())}>{deal.resellerPhone || "No phone"}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
              <div className={softText()}>Timeline</div>
              <div className={cx("mt-1 text-sm font-medium", strongText())}>
                Created {toDateLabel(deal.createdAt)}
              </div>
              <div className={cx("mt-1 text-xs", mutedText())}>
                Due {toDateLabel(deal.dueDate)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className={softText()}>Qty</div>
              <div className={cx("mt-1 text-sm font-semibold", strongText())}>{deal.quantity ?? "—"}</div>
            </div>
            <div>
              <div className={softText()}>Sold</div>
              <div className={cx("mt-1 text-sm font-semibold", strongText())}>{deal.soldQuantity ?? 0}</div>
            </div>
            <div>
              <div className={softText()}>Returned</div>
              <div className={cx("mt-1 text-sm font-semibold", strongText())}>{deal.returnedQuantity ?? 0}</div>
            </div>
            <div>
              <div className={softText()}>Updated</div>
              <div className={cx("mt-1 text-sm font-semibold", strongText())}>{toDateLabel(deal.updatedAt)}</div>
            </div>
          </div>

          {deal.notes ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-700 dark:border-[rgb(var(--border))] dark:text-[rgb(var(--text-muted))]">
              {deal.notes}
            </div>
          ) : null}
        </div>

        <div className="xl:border-l xl:border-stone-200 xl:pl-4 dark:xl:border-[rgb(var(--border))]">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
            <div className={cx("text-sm font-semibold", strongText())}>Actions</div>
            <div className={cx("mt-2 text-xs leading-5", mutedText())}>
              Open details for payments and full timeline.
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onOpen(deal.id)}
                className={primaryBtn()}
              >
                Open details
              </button>

              {deal.status === "BORROWED" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onReceive(deal.id)}
                    disabled={busy("receive")}
                    className={miniBtn("success")}
                  >
                    {busy("receive") ? "Receiving..." : "Receive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onReturn(deal.id)}
                    disabled={busy("return")}
                    className={miniBtn()}
                  >
                    {busy("return") ? "Returning..." : "Return"}
                  </button>
                </>
              ) : null}

              {deal.status === "RECEIVED" ? (
                <button
                  type="button"
                  onClick={() => onSold(deal.id)}
                  disabled={busy("sold")}
                  className={miniBtn("warning")}
                >
                  {busy("sold") ? "Saving..." : "Record sale"}
                </button>
              ) : null}
            </div>

            <div className={cx("mt-3 text-[11px]", softText())}>
              Last updated: {toDateTimeLabel(deal.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterStoreDeals() {
  const navigate = useNavigate();
  const role = useMemo(() => getCurrentRole(), []);
  const [deals, setDeals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [filters, setFilters] = useState({
    q: "",
    status: "ALL",
    supplier: "ALL",
  });

  async function loadDeals() {
    try {
      setLoading(true);
      const data = await getDeals();
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load inter-store deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    let data = [...deals];
    const q = String(filters.q || "").trim().toLowerCase();

    if (filters.status !== "ALL") {
      data = data.filter((d) => String(d.status || "").toUpperCase() === filters.status);
    }

    if (filters.supplier === "INTERNAL") {
      data = data.filter((d) => Boolean(d.supplierTenantId));
    }

    if (filters.supplier === "EXTERNAL") {
      data = data.filter((d) => Boolean(d.externalSupplierName));
    }

    if (q) {
      data = data.filter((d) => {
        const product = String(d.productName || "").toLowerCase();
        const serial = String(d.serial || "").toLowerCase();
        const reseller = String(d.resellerName || "").toLowerCase();
        const phone = String(d.resellerPhone || "").toLowerCase();
        const supplier = String(d.externalSupplierName || "").toLowerCase();

        return (
          product.includes(q) ||
          serial.includes(q) ||
          reseller.includes(q) ||
          phone.includes(q) ||
          supplier.includes(q)
        );
      });
    }

    return data;
  }, [deals, filters]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters.q, filters.status, filters.supplier, deals.length]);

  const visibleDeals = useMemo(
    () => filteredDeals.slice(0, visibleCount),
    [filteredDeals, visibleCount]
  );

  const hasMore = visibleDeals.length < filteredDeals.length;

  const summary = useMemo(() => {
    return {
      total: deals.length,
      borrowed: deals.filter((d) => d.status === "BORROWED").length,
      received: deals.filter((d) => d.status === "RECEIVED").length,
      sold: deals.filter((d) => d.status === "SOLD").length,
      paid: deals.filter((d) => d.status === "PAID").length,
    };
  }, [deals]);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function exportCSV() {
    try {
      const rows = [
        [
          "Product",
          "Serial Number",
          "Supplier",
          "Reseller",
          "Reseller Phone",
          "Agreed Price",
          "Stage",
          "Created Date",
        ],
        ...filteredDeals.map((d) => [
          d.productName || "",
          d.serial || "",
          d.supplierTenantId ? "Internal store" : d.externalSupplierName || "",
          d.resellerName || "",
          d.resellerPhone || "",
          d.agreedPrice ?? "",
          statusMeta(d.status).label,
          d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
        ]),
      ];

      const csv = rows
        .map((row) =>
          row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "interstore-deals.csv";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    }
  }

  async function runAction(actionKey, fn, successMessage) {
    try {
      setBusyKey(actionKey);
      await fn();
      toast.success(successMessage);
      await loadDeals();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Action failed");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <>
      <CreateDealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadDeals}
      />

      <div className="space-y-5">
        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  Inter-store
                </div>
                <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                  Inter-store deals
                </h1>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Manage borrowed electronics, sales progress, returns, and supplier settlement
                  from one premium operational screen.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={exportCSV} className={secondaryBtn()}>
                  Export CSV
                </button>
                <button type="button" onClick={() => setModalOpen(true)} className={primaryBtn()}>
                  New deal
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Total deals" value={summary.total} note="All visible records" />
            <SummaryCard label="Borrowed" value={summary.borrowed} note="Waiting for receipt" tone="warning" />
            <SummaryCard label="Received" value={summary.received} note="Inside your store" />
            <SummaryCard label="Sold" value={summary.sold} note="Awaiting full payment closure" tone="success" />
            <SummaryCard label="Paid" value={summary.paid} note="Closed successfully" tone="success" />
          </div>
        </section>

        <section className={cx(shell(), "p-4")}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <label className={cx("text-sm font-medium", strongText())}>Search</label>
              <input
                className={inputClass()}
                placeholder="Search product, serial number, reseller, phone, supplier..."
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <label className={cx("text-sm font-medium", strongText())}>Stage</label>
              <select
                className={inputClass()}
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
              >
                <option value="ALL">All stages</option>
                <option value="BORROWED">Borrowed</option>
                <option value="RECEIVED">Received</option>
                <option value="SOLD">Sold</option>
                <option value="PAID">Paid</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className={cx("text-sm font-medium", strongText())}>Supplier type</label>
              <select
                className={inputClass()}
                value={filters.supplier}
                onChange={(e) => setFilter("supplier", e.target.value)}
              >
                <option value="ALL">All suppliers</option>
                <option value="INTERNAL">Internal store</option>
                <option value="EXTERNAL">External supplier</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={filters.status === "ALL"} onClick={() => setFilter("status", "ALL")}>
              All
            </FilterChip>
            <FilterChip active={filters.status === "BORROWED"} onClick={() => setFilter("status", "BORROWED")}>
              Borrowed
            </FilterChip>
            <FilterChip active={filters.status === "RECEIVED"} onClick={() => setFilter("status", "RECEIVED")}>
              Received
            </FilterChip>
            <FilterChip active={filters.status === "SOLD"} onClick={() => setFilter("status", "SOLD")}>
              Sold
            </FilterChip>
            <FilterChip active={filters.status === "PAID"} onClick={() => setFilter("status", "PAID")}>
              Paid
            </FilterChip>
          </div>
        </section>

        <section className="space-y-4">
          {loading ? (
            <DealsSkeleton />
          ) : filteredDeals.length === 0 ? (
            <EmptyState
              title="No deals found"
              text="No inter-store deals match your current search and filters."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {visibleDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    busyKey={busyKey}
                    onOpen={(id) => navigate(`/app/interstore/${id}`)}
                    onReceive={(id) =>
                      runAction(`${id}:receive`, () => markReceived(id), "Deal marked as received")
                    }
                    onReturn={(id) =>
                      runAction(`${id}:return`, () => markReturned(id), "Return recorded")
                    }
                    onSold={(id) =>
                      runAction(`${id}:sold`, () => markSold(id), "Sale recorded")
                    }
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-2 pt-1">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className={secondaryBtn()}
                  >
                    Load 10 more
                  </button>
                ) : (
                  <div className={cx("text-sm", mutedText())}>All matching deals loaded</div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}