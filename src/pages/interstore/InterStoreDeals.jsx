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
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function successBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-amber-500 px-4 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60";
}

function neutralMiniBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] ring-1 ring-[var(--color-border)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
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
      chip:
        "border border-[#f7b267]/35 bg-[#f7a541] text-[#3b2206] dark:border-[#f7a541]/22 dark:bg-[#f7a541] dark:text-[#1b1206]",
    },
    RECEIVED: {
      label: "Received",
      chip:
        "border border-[#59b8ff]/35 bg-[#4aa8ff] text-[#071b2b] dark:border-[#4aa8ff]/22 dark:bg-[#4aa8ff] dark:text-[#06131f]",
    },
    SOLD: {
      label: "Sold",
      chip:
        "border border-[#d7ef4a]/35 bg-[#d7ef4a] text-[#283103] dark:border-[#d7ef4a]/22 dark:bg-[#d7ef4a] dark:text-[#182001]",
    },
    PAID: {
      label: "Paid",
      chip:
        "border border-[#8ef0ea]/35 bg-[#8ef0ea] text-[#083232] dark:border-[#8ef0ea]/22 dark:bg-[#8ef0ea] dark:text-[#041d1d]",
    },
    RETURNED: {
      label: "Returned",
      chip:
        "border border-[#ffd36e]/35 bg-[#ffd36e] text-[#3a2804] dark:border-[#ffd36e]/22 dark:bg-[#ffd36e] dark:text-[#1f1603]",
    },
  };

  return (
    map[String(status || "").toUpperCase()] || {
      label: String(status || "Unknown"),
      chip:
        "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]",
    }
  );
}

function StatusPill({ status }) {
  const meta = statusMeta(status);

  return (
    <span
      className={cx(
        "inline-flex min-h-[2rem] items-center justify-center rounded-full px-4 py-1.5 text-xs font-black tracking-[0.01em] shadow-[var(--shadow-soft)]",
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
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        isInternal
          ? "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          : "bg-[rgba(60,145,230,0.14)] text-[var(--color-primary)]"
      )}
    >
      {isInternal ? "Internal store" : "External supplier"}
    </span>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "danger"
      ? "text-[var(--color-danger)]"
      : strongText();

  const accentClass =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-[var(--color-danger)]"
      : "bg-[var(--color-primary)]";

  return (
    <article className={cx(pageCard(), "relative overflow-hidden p-5 sm:p-6")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accentClass)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-[1.7rem] font-black tracking-tight", toneClass)}>{value}</div>
        {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>
      {subtitle ? <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition",
        active
          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      {children}
    </button>
  );
}

function InfoStat({ label, value, sub }) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>{value || "—"}</div>
      {sub ? <div className={cx("mt-1 text-xs leading-5", mutedText())}>{sub}</div> : null}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "overflow-hidden p-4 sm:p-5")}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4">
              <div className="flex gap-2">
                <SkeletonBlock className="h-7 w-24 rounded-full" />
                <SkeletonBlock className="h-7 w-28 rounded-full" />
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="h-6 w-64" />
                <SkeletonBlock className="h-4 w-44" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
              </div>

              <SkeletonBlock className="h-16 w-full" />
            </div>

            <div>
              <SkeletonBlock className="h-[220px] w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(pageCard(), "px-5 py-12 text-center")}>
      <div className={cx("text-base font-semibold", strongText())}>{title}</div>
      <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
    </div>
  );
}

function DealCard({ deal, busyKey, onOpen, onReceive, onReturn, onSold }) {
  const supplierLabel = deal.supplierTenantId
    ? "Internal store"
    : deal.externalSupplierName || "External supplier";

  const busy = (key) => busyKey === `${deal.id}:${key}`;
  const meta = statusMeta(deal.status);

  return (
    <article
      className={cx(
        pageCard(),
        "overflow-hidden border border-[var(--color-border)] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-5"
      )}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={deal.status} />
            <SupplierPill deal={deal} />
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h3 className={cx("truncate text-lg font-black tracking-tight", strongText())}>
                {deal.productName || "Unnamed product"}
              </h3>
              <div className={cx("mt-1 text-sm", mutedText())}>
                Serial: <span className={cx("font-semibold", strongText())}>{deal.serial || "—"}</span>
              </div>
            </div>

            <div className="shrink-0 text-left xl:text-right">
              <div className={softText()}>Agreed price</div>
              <div className={cx("mt-1 text-base font-black tracking-tight", strongText())}>
                {formatMoney(deal.agreedPrice)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoStat label="Supplier" value={supplierLabel} />
            <InfoStat
              label="Reseller"
              value={deal.resellerName || "—"}
              sub={deal.resellerPhone || "No phone"}
            />
            <InfoStat
              label="Timeline"
              value={`Created ${toDateLabel(deal.createdAt)}`}
              sub={`Due ${toDateLabel(deal.dueDate)}`}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoStat label="Qty" value={String(deal.quantity ?? "—")} />
            <InfoStat label="Sold" value={String(deal.soldQuantity ?? 0)} />
            <InfoStat label="Returned" value={String(deal.returnedQuantity ?? 0)} />
            <InfoStat label="Updated" value={toDateLabel(deal.updatedAt)} />
          </div>

          {deal.notes ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
              {deal.notes}
            </div>
          ) : null}
        </div>

        <aside className="min-w-0">
          <div className={cx(softPanel(), "h-full p-4")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={cx("text-sm font-bold", strongText())}>Actions</div>
                <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                  Open full detail or move this deal to the next valid stage.
                </div>
              </div>

              <span className={cx("mt-1 h-2.5 w-2.5 rounded-full", meta.dot)} />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={() => onOpen(deal.id)} className={primaryBtn()}>
                Open details
              </button>

              {deal.status === "BORROWED" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onReceive(deal.id)}
                    disabled={busy("receive")}
                    className={successBtn()}
                  >
                    {busy("receive") ? "Receiving..." : "Receive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onReturn(deal.id)}
                    disabled={busy("return")}
                    className={neutralMiniBtn()}
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
                  className={warningBtn()}
                >
                  {busy("sold") ? "Saving..." : "Record sale"}
                </button>
              ) : null}
            </div>

            <div className="mt-4 rounded-[20px] bg-[var(--color-surface)] px-4 py-3 ring-1 ring-[var(--color-border)]">
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Last updated
              </div>
              <div className={cx("mt-2 text-sm font-medium leading-6", strongText())}>
                {toDateTimeLabel(deal.updatedAt)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </article>
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
      <CreateDealModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadDeals} />

      <div className="space-y-6">
        <section className="space-y-5">
          <div className={cx(pageCard(), "overflow-hidden")}>
            <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <SectionHeading
                    eyebrow="Inter-store"
                    title="Inter-store deals"
                    subtitle="Manage borrowed electronics, receipt confirmation, sales progress, returns, and supplier settlement from one locked operational screen."
                  />
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
              <SummaryCard
                label="Borrowed"
                value={summary.borrowed}
                note="Waiting for receipt"
                tone="warning"
              />
              <SummaryCard
                label="Received"
                value={summary.received}
                note="Inside your store"
              />
              <SummaryCard
                label="Sold"
                value={summary.sold}
                note="Awaiting full payment closure"
                tone="success"
              />
              <SummaryCard
                label="Paid"
                value={summary.paid}
                note="Closed successfully"
                tone="success"
              />
            </div>
          </div>
        </section>

        <section className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <label className={cx("text-sm font-medium", strongText())}>Search</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="Search product, serial number, reseller, phone, supplier..."
                  value={filters.q}
                  onChange={(e) => setFilter("q", e.target.value)}
                />
              </div>

              <div className="lg:col-span-3">
                <label className={cx("text-sm font-medium", strongText())}>Stage</label>
                <select
                  className={cx(inputClass(), "mt-2")}
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
                  className={cx(inputClass(), "mt-2")}
                  value={filters.supplier}
                  onChange={(e) => setFilter("supplier", e.target.value)}
                >
                  <option value="ALL">All suppliers</option>
                  <option value="INTERNAL">Internal store</option>
                  <option value="EXTERNAL">External supplier</option>
                </select>
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-sm font-semibold", strongText())}>Visible results</div>
              <div className={cx("mt-2 text-2xl font-black tracking-tight", strongText())}>
                {filteredDeals.length}
              </div>
              <div className={cx("mt-1 text-sm leading-6", mutedText())}>
                Filtered deals ready for action.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterChip active={filters.status === "ALL"} onClick={() => setFilter("status", "ALL")}>
              All
            </FilterChip>
            <FilterChip
              active={filters.status === "BORROWED"}
              onClick={() => setFilter("status", "BORROWED")}
            >
              Borrowed
            </FilterChip>
            <FilterChip
              active={filters.status === "RECEIVED"}
              onClick={() => setFilter("status", "RECEIVED")}
            >
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
                    onOpen={(dealId) => navigate(`/app/interstore/${dealId}`)}
                    onReceive={(dealId) =>
                      runAction(
                        `${dealId}:receive`,
                        () => markReceived(dealId),
                        "Deal marked as received"
                      )
                    }
                    onReturn={(dealId) =>
                      runAction(`${dealId}:return`, () => markReturned(dealId), "Return recorded")
                    }
                    onSold={(dealId) =>
                      runAction(`${dealId}:sold`, () => markSold(dealId), "Sale recorded")
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