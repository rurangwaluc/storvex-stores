import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { getAuditLogById, getAuditLogs, getAuditStats } from "../../services/auditApi";

const PAGE_SIZE = 20;

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

function sectionEyebrow() {
  return "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]";
}

function successBadge() {
  return "bg-[#7cfcc6] text-[#0b3b2e]";
}

function infoBadge() {
  return "bg-[#57b5ff] text-[#06263d]";
}

function warningBadge() {
  return "bg-[#ff9f43] text-[#402100]";
}

function processBadge() {
  return "bg-[#ffe45e] text-[#4a4300]";
}

function neutralBadge() {
  return "bg-[var(--color-surface)] text-[var(--color-text-muted)]";
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function prettifyEnum(value) {
  const s = String(value || "")
    .replaceAll("_", " ")
    .toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
}

function entityBadgeClass(entity) {
  const key = String(entity || "").toUpperCase();

  if (key.includes("SALE")) return infoBadge();
  if (key.includes("PAYMENT")) return successBadge();
  if (key.includes("INVOICE")) return warningBadge();
  if (key.includes("SUPPLIER")) return processBadge();
  return neutralBadge();
}

function actionBadgeClass(action) {
  const key = String(action || "").toUpperCase();

  if (key.includes("CREATE") || key.includes("CREATED")) return successBadge();
  if (key.includes("UPDATE") || key.includes("EDIT")) return infoBadge();
  if (key.includes("DELETE") || key.includes("REMOVE")) return warningBadge();
  if (key.includes("LOGIN") || key.includes("AUTH")) return processBadge();
  return neutralBadge();
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? <div className={sectionEyebrow()}>{eyebrow}</div> : null}
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

function StatCard({ label, value, note, tone = "neutral" }) {
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

function AuditBadge({ value, tone = "neutral" }) {
  const cls =
    tone === "entity"
      ? entityBadgeClass(value)
      : tone === "action"
      ? actionBadgeClass(value)
      : neutralBadge();

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
      {prettifyEnum(value)}
    </span>
  );
}

function JsonPreview({ value }) {
  const pretty = useMemo(() => {
    try {
      return JSON.stringify(value || {}, null, 2);
    } catch {
      return "{}";
    }
  }, [value]);

  return (
    <pre className="overflow-x-auto rounded-[20px] bg-[var(--color-surface)] p-4 text-xs leading-6 text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
      {pretty}
    </pre>
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

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function AuditSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cx(pageCard(), "p-5")}>
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-3 h-8 w-24" />
            <SkeletonBlock className="mt-2 h-4 w-40" />
          </div>
        ))}
      </div>

      <div className={cx(pageCard(), "p-5")}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <SkeletonBlock className="h-12 lg:col-span-5" />
          <SkeletonBlock className="h-12 lg:col-span-2" />
          <SkeletonBlock className="h-12 lg:col-span-2" />
          <SkeletonBlock className="h-12 lg:col-span-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cx(pageCard(), "p-5")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <SkeletonBlock className="h-7 w-28 rounded-full" />
                  <SkeletonBlock className="h-7 w-28 rounded-full" />
                </div>
                <SkeletonBlock className="mt-4 h-6 w-56" />
                <SkeletonBlock className="mt-2 h-4 w-72" />
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                </div>
              </div>
              <SkeletonBlock className="h-12 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditRowCard({ item, onOpen }) {
  return (
    <article
      className={cx(
        pageCard(),
        "overflow-hidden border border-[var(--color-border)] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-5"
      )}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_180px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AuditBadge value={item.action} tone="action" />
            <AuditBadge value={item.entity} tone="entity" />
          </div>

          <div className="mt-4">
            <h3 className={cx("truncate text-lg font-black tracking-tight", strongText())}>
              {prettifyEnum(item.action)}
            </h3>
            <div className={cx("mt-1 text-sm leading-6", mutedText())}>
              {prettifyEnum(item.entity)}
              {item.entityId ? (
                <>
                  {" "}
                  • Entity ID: <span className={strongText()}>{item.entityId}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                User
              </div>
              <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>
                {item.user?.name || "System"}
              </div>
              <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                {item.user?.role ? prettifyEnum(item.user.role) : "No linked user"}
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Time
              </div>
              <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>
                {formatDate(item.createdAt)}
              </div>
              <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                {formatDateTime(item.createdAt)}
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Metadata
              </div>
              <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>
                {item.metadata && typeof item.metadata === "object" ? "Attached" : "Empty"}
              </div>
              <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                Click details to inspect the full payload.
              </div>
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <div className={cx(softPanel(), "h-full p-4")}>
            <div className={cx("text-sm font-bold", strongText())}>Details</div>
            <div className={cx("mt-1 text-xs leading-5", mutedText())}>
              Open the full audit payload and event context.
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={() => onOpen(item.id)} className={primaryBtn()}>
                Open log
              </button>
            </div>

            <div className="mt-4 rounded-[20px] bg-[var(--color-surface)] px-4 py-3 ring-1 ring-[var(--color-border)]">
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                Log ID
              </div>
              <div className={cx("mt-2 break-all text-xs font-medium leading-6", strongText())}>
                {item.id}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function AuditDetailModal({ open, item, loading, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className={cx(pageCard(), "relative w-full max-w-4xl p-5 sm:p-6")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className={sectionEyebrow()}>Audit detail</div>
              <h3 className={cx("mt-3 text-2xl font-black tracking-tight", strongText())}>
                {loading ? "Loading log..." : prettifyEnum(item?.action)}
              </h3>
              {!loading && item ? (
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Full event payload, actor context, and entity reference.
                </p>
              ) : null}
            </div>

            <button type="button" onClick={onClose} className={secondaryBtn()}>
              Close
            </button>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-64 w-full" />
            </div>
          ) : item ? (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <AuditBadge value={item.action} tone="action" />
                <AuditBadge value={item.entity} tone="entity" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className={cx(softPanel(), "p-4")}>
                  <div className={sectionEyebrow()}>User</div>
                  <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>
                    {item.user?.name || "System"}
                  </div>
                  <div className={cx("mt-1 text-xs leading-5", mutedText())}>
                    {item.user?.email || item.user?.role || "No linked user"}
                  </div>
                </div>

                <div className={cx(softPanel(), "p-4")}>
                  <div className={sectionEyebrow()}>Created</div>
                  <div className={cx("mt-2 text-sm font-bold leading-6", strongText())}>
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>

                <div className={cx(softPanel(), "p-4")}>
                  <div className={sectionEyebrow()}>Entity ID</div>
                  <div className={cx("mt-2 break-all text-sm font-bold leading-6", strongText())}>
                    {item.entityId || "—"}
                  </div>
                </div>

                <div className={cx(softPanel(), "p-4")}>
                  <div className={sectionEyebrow()}>Log ID</div>
                  <div className={cx("mt-2 break-all text-sm font-bold leading-6", strongText())}>
                    {item.id}
                  </div>
                </div>
              </div>

              <div>
                <div className={cx("text-sm font-bold", strongText())}>Metadata payload</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Exact backend metadata attached to this audit event.
                </div>
                <div className="mt-4">
                  <JsonPreview value={item.metadata} />
                </div>
              </div>
            </div>
          ) : (
            <div className={cx("mt-6 text-sm leading-6", mutedText())}>Audit log not available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsAudit() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState(null);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    q: "",
    action: "",
    entity: "",
    from: "",
    to: "",
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  async function loadAll({ showMainLoader = false } = {}) {
    try {
      if (showMainLoader) setLoading(true);
      else setRefreshing(true);

      const [statsRes, logsRes] = await Promise.all([
        getAuditStats(),
        getAuditLogs({
          page,
          limit: PAGE_SIZE,
          q: filters.q,
          action: filters.action,
          entity: filters.entity,
          from: filters.from,
          to: filters.to,
        }),
      ]);

      setStats(statsRes?.stats || null);
      setList(Array.isArray(logsRes?.items) ? logsRes.items : []);
      setPage(Number(logsRes?.page || 1));
      setTotalPages(Number(logsRes?.totalPages || 1));
      setTotal(Number(logsRes?.total || 0));
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load audit logs");
      setList([]);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll({ showMainLoader: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    setPage(1);
    loadAll();
  }

  function clearFilters() {
    setFilters({
      q: "",
      action: "",
      entity: "",
      from: "",
      to: "",
    });
    setPage(1);
    setTimeout(() => loadAll(), 0);
  }

  async function openDetail(id) {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailItem(null);

      const data = await getAuditLogById(id);
      setDetailItem(data?.item || null);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load audit detail");
    } finally {
      setDetailLoading(false);
    }
  }

  const topAction = stats?.topActions?.[0];
  const topEntity = stats?.topEntities?.[0];

  if (loading) {
    return <AuditSkeleton />;
  }

  return (
    <>
      <AuditDetailModal
        open={detailOpen}
        item={detailItem}
        loading={detailLoading}
        onClose={() => {
          if (detailLoading) return;
          setDetailOpen(false);
          setDetailItem(null);
        }}
      />

      <div className="space-y-6">
        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <SectionHeading
              eyebrow="Settings"
              title="Audit logs"
              subtitle="Track sensitive operational actions, review who changed what and when, and inspect the exact payload behind every recorded event."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total logs" value={stats?.total ?? 0} note="All recorded tenant audit events" />
            <StatCard label="Last 24 hours" value={stats?.last24h ?? 0} note="Recent operational activity" tone="info" />
            <StatCard label="Last 7 days" value={stats?.last7d ?? 0} note="Short-range review window" tone="success" />
            <StatCard
              label="Top activity"
              value={topAction ? prettifyEnum(topAction.action) : "—"}
              note={topEntity ? `Top entity: ${prettifyEnum(topEntity.entity)}` : "No entity trend yet"}
              tone="warning"
            />
          </div>
        </section>

        <section className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-end">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <label className={cx("text-sm font-medium", strongText())}>Search</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="Search user name or entity id..."
                  value={filters.q}
                  onChange={(e) => updateFilter("q", e.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>Action</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="Example: SALE_CREATED"
                  value={filters.action}
                  onChange={(e) => updateFilter("action", e.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>Entity</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="Example: INVOICE"
                  value={filters.entity}
                  onChange={(e) => updateFilter("entity", e.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>From</label>
                <input
                  type="date"
                  className={cx(inputClass(), "mt-2")}
                  value={filters.from}
                  onChange={(e) => updateFilter("from", e.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>To</label>
                <input
                  type="date"
                  className={cx(inputClass(), "mt-2")}
                  value={filters.to}
                  onChange={(e) => updateFilter("to", e.target.value)}
                />
              </div>
            </div>

            <div className={cx(softPanel(), "p-4")}>
              <div className={cx("text-sm font-semibold", strongText())}>Visible results</div>
              <div className={cx("mt-2 text-2xl font-black tracking-tight", strongText())}>{total}</div>
              <div className={cx("mt-1 text-sm leading-6", mutedText())}>
                Filtered audit events ready for review.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterChip active={!filters.action} onClick={() => updateFilter("action", "")}>
              All actions
            </FilterChip>
            <FilterChip active={filters.action === "CREATE"} onClick={() => updateFilter("action", "CREATE")}>
              Create
            </FilterChip>
            <FilterChip active={filters.action === "UPDATE"} onClick={() => updateFilter("action", "UPDATE")}>
              Update
            </FilterChip>
            <FilterChip active={filters.action === "DELETE"} onClick={() => updateFilter("action", "DELETE")}>
              Delete
            </FilterChip>
            <FilterChip active={filters.action === "LOGIN"} onClick={() => updateFilter("action", "LOGIN")}>
              Login
            </FilterChip>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <AsyncButton
              type="button"
              loading={refreshing}
              onClick={applyFilters}
              className={primaryBtn()}
            >
              Apply filters
            </AsyncButton>

            <button type="button" onClick={clearFilters} className={secondaryBtn()}>
              Clear filters
            </button>
          </div>
        </section>

        <section className="space-y-4">
          {list.length === 0 ? (
            <EmptyState
              title="No audit logs found"
              text="No audit events match the current filters."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {list.map((item) => (
                  <AuditRowCard key={item.id} item={item} onOpen={openDetail} />
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <div className={cx("text-sm", mutedText())}>
                  Page {page} of {totalPages}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={secondaryBtn()}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className={secondaryBtn()}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}