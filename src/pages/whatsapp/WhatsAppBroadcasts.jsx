import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import {
  createWhatsAppBroadcast,
  listWhatsAppBroadcasts,
  queueWhatsAppBroadcast,
  sendWhatsAppBroadcastNow,
  updateWhatsAppBroadcast,
} from "../../services/whatsappBroadcastsApi";
import { listWhatsAppAccounts } from "../../services/whatsappAccountsApi";
import WhatsAppWorkspaceTabs from "./WhatsAppWorkspaceTabs";

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

function polishedTextareaClass() {
  return cx(
    "w-full min-h-[160px] resize-y rounded-[20px] border border-[var(--color-border)]",
    "bg-[var(--color-card)] px-4 py-3.5 text-sm leading-6 text-[var(--color-text)]",
    "outline-none transition placeholder:text-[var(--color-text-muted)]",
    "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
  );
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
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

function fieldLabel() {
  return "mb-1.5 block text-sm font-medium text-[var(--color-text)]";
}

function fieldHelp() {
  return "mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]";
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatTimeAgo(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const diff = Date.now() - d.getTime();
  if (diff < 60 * 1000) return "Just now";

  const mins = Math.floor(diff / (60 * 1000));
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `RWF ${n.toLocaleString()}`;
}

function cxPillTone(tone) {
  if (tone === "success") return successBadge();
  if (tone === "info") return infoBadge();
  if (tone === "warning") return warningBadge();
  if (tone === "process") return processBadge();
  return neutralBadge();
}

function ProtectionPill({ tone = "neutral", children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        cxPillTone(tone)
      )}
    >
      {children}
    </span>
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
        <div className={cx("mt-2 text-[1.7rem] font-black tracking-tight", toneClass)}>
          {value}
        </div>
        {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
      </div>
    </article>
  );
}

function InfoStat({ label, value, sub }) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 break-words text-sm font-bold leading-6", strongText())}>
        {value || "—"}
      </div>
      {sub ? <div className={cx("mt-1 text-xs leading-5", mutedText())}>{sub}</div> : null}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(softPanel(), "px-5 py-10 text-center")}>
      <div className={cx("text-base font-semibold", strongText())}>{title}</div>
      <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 10-2.34 5.66M20 12V6m0 6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeAccount(raw) {
  return {
    id: String(raw?.id || ""),
    phoneNumber: String(raw?.phoneNumber || ""),
    businessName: String(raw?.businessName || ""),
    isActive: Boolean(raw?.isActive),
  };
}

function normalizeBroadcast(raw) {
  return {
    id: String(raw?.id || ""),
    tenantId: String(raw?.tenantId || ""),
    accountId: String(raw?.accountId || ""),
    promotionId: String(raw?.promotionId || ""),
    templateName: String(raw?.templateName || ""),
    languageCode: String(raw?.languageCode || "en_US"),
    status: String(raw?.status || "DRAFT").toUpperCase(),
    createdById: String(raw?.createdById || ""),
    queuedAt: raw?.queuedAt || null,
    sentAt: raw?.sentAt || null,
    createdAt: raw?.createdAt || null,
    recipientCount: Number(raw?.recipientCount || 0),
    deliveredCount: Number(raw?.deliveredCount || 0),
    account: raw?.account
      ? {
          id: String(raw.account.id || ""),
          phoneNumber: String(raw.account.phoneNumber || ""),
          businessName: String(raw.account.businessName || ""),
          isActive: Boolean(raw.account.isActive),
        }
      : null,
    promotion: raw?.promotion
      ? {
          id: String(raw.promotion.id || ""),
          title: String(raw.promotion.title || ""),
          message: typeof raw.promotion.message === "string" ? raw.promotion.message : "",
          productId: String(raw.promotion.productId || ""),
          sentAt: raw.promotion.sentAt || null,
          createdAt: raw.promotion.createdAt || null,
        }
      : null,
    createdBy: raw?.createdBy
      ? {
          id: String(raw.createdBy.id || ""),
          name: String(raw.createdBy.name || ""),
          role: String(raw.createdBy.role || ""),
        }
      : null,
  };
}

function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "SENT") return "success";
  if (s === "QUEUED") return "process";
  if (s === "FAILED") return "warning";
  return "info";
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "SENT") return "Sent";
  if (s === "QUEUED") return "Queued";
  if (s === "FAILED") return "Failed";
  return "Draft";
}

function BroadcastCard({
  item,
  selected,
  onOpen,
  onQueue,
  onSend,
  queueing,
  sending,
}) {
  const tone = statusTone(item.status);
  const isDraft = item.status === "DRAFT";
  const canSend = item.status === "DRAFT" || item.status === "QUEUED";

  return (
    <div
      className={cx(
        softPanel(),
        "border border-transparent p-4 transition",
        selected ? "ring-1 ring-[var(--color-primary-ring)] bg-[var(--color-primary-soft)]" : ""
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ProtectionPill tone={tone}>{statusLabel(item.status)}</ProtectionPill>
            {item.account?.businessName ? (
              <ProtectionPill tone="neutral">{item.account.businessName}</ProtectionPill>
            ) : null}
          </div>

          <div className={cx("mt-3 truncate text-base font-black tracking-tight", strongText())}>
            {item.promotion?.title || item.templateName || "Untitled campaign"}
          </div>

          <div className={cx("mt-1 text-sm leading-6", mutedText())}>
            Template: {item.templateName || "—"} • Language: {item.languageCode || "—"}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoStat label="Recipients" value={String(item.recipientCount || 0)} />
            <InfoStat label="Delivered" value={String(item.deliveredCount || 0)} />
            <InfoStat
              label="Created"
              value={formatTimeAgo(item.createdAt)}
              sub={formatDateTime(item.createdAt)}
            />
            <InfoStat
              label="Last stage"
              value={
                item.sentAt
                  ? formatTimeAgo(item.sentAt)
                  : item.queuedAt
                  ? formatTimeAgo(item.queuedAt)
                  : "Not sent"
              }
              sub={item.sentAt ? "Sent" : item.queuedAt ? "Queued" : "Draft"}
            />
          </div>
        </button>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <button type="button" onClick={onOpen} className={secondaryBtn()}>
            Open
          </button>

          {isDraft ? (
            <AsyncButton
              type="button"
              loading={queueing}
              loadingText="Queueing..."
              onClick={onQueue}
              className={secondaryBtn()}
            >
              Queue
            </AsyncButton>
          ) : null}

          {canSend ? (
            <AsyncButton
              type="button"
              loading={sending}
              loadingText="Sending..."
              onClick={onSend}
              className={primaryBtn()}
            >
              Send now
            </AsyncButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppBroadcasts() {
  const mountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [broadcasts, setBroadcasts] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [accountFilter, setAccountFilter] = useState("ALL");

  const [selectedBroadcastId, setSelectedBroadcastId] = useState("");

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [queueingId, setQueueingId] = useState("");
  const [sendingId, setSendingId] = useState("");

  const [form, setForm] = useState({
    id: "",
    accountId: "",
    promotionId: "",
    promotionTitle: "",
    promotionMessage: "",
    templateName: "",
    languageCode: "en_US",
  });

  useEffect(() => {
    mountedRef.current = true;
    document.title = "WhatsApp Broadcasts • Storvex";
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadAll(showToast = false) {
    try {
      if (!broadcasts.length && !accounts.length) setLoading(true);
      else setRefreshing(true);

      const [broadcastRes, accountRes] = await Promise.all([
        listWhatsAppBroadcasts({ limit: 100 }),
        listWhatsAppAccounts(),
      ]);

      if (!mountedRef.current) return;

      const nextBroadcasts = Array.isArray(broadcastRes?.broadcasts)
        ? broadcastRes.broadcasts.map(normalizeBroadcast)
        : [];
      const nextAccounts = Array.isArray(accountRes?.accounts)
        ? accountRes.accounts.map(normalizeAccount)
        : [];

      setBroadcasts(nextBroadcasts);
      setAccounts(nextAccounts);

      if (selectedBroadcastId) {
        const exists = nextBroadcasts.some((item) => item.id === selectedBroadcastId);
        if (!exists) {
          setSelectedBroadcastId("");
          resetForm(nextAccounts);
        }
      }

      if (showToast) toast.success("Broadcasts refreshed");
    } catch (err) {
      console.error(err);
      if (!mountedRef.current) return;
      toast.error(err?.message || "Failed to load WhatsApp broadcasts");
      setBroadcasts([]);
      setAccounts([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredBroadcasts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return broadcasts.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : String(item.status || "").toUpperCase() === statusFilter;

      const matchesAccount =
        accountFilter === "ALL" ? true : String(item.accountId || "") === accountFilter;

      const hay =
        `${item.templateName} ${item.languageCode} ${item.promotion?.title || ""} ${item.promotion?.message || ""} ${item.account?.businessName || ""} ${item.account?.phoneNumber || ""}`
          .toLowerCase()
          .trim();

      const matchesQuery = !q || hay.includes(q);

      return matchesStatus && matchesAccount && matchesQuery;
    });
  }, [broadcasts, query, statusFilter, accountFilter]);

  const selectedBroadcast = useMemo(() => {
    return broadcasts.find((item) => item.id === selectedBroadcastId) || null;
  }, [broadcasts, selectedBroadcastId]);

  const summary = useMemo(() => {
    const drafts = broadcasts.filter((x) => x.status === "DRAFT").length;
    const queued = broadcasts.filter((x) => x.status === "QUEUED").length;
    const sent = broadcasts.filter((x) => x.status === "SENT").length;
    const delivered = broadcasts.reduce((sum, item) => sum + Number(item.deliveredCount || 0), 0);

    return {
      total: broadcasts.length,
      drafts,
      queued,
      sent,
      delivered,
    };
  }, [broadcasts]);

  function resetForm(nextAccounts = accounts) {
    setForm({
      id: "",
      accountId: nextAccounts.find((x) => x.isActive)?.id || nextAccounts[0]?.id || "",
      promotionId: "",
      promotionTitle: "",
      promotionMessage: "",
      templateName: "",
      languageCode: "en_US",
    });
  }

  useEffect(() => {
    if (!form.accountId && accounts.length) {
      setForm((curr) => ({
        ...curr,
        accountId: accounts.find((x) => x.isActive)?.id || accounts[0]?.id || "",
      }));
    }
  }, [accounts, form.accountId]);

  function openBroadcast(item) {
    setSelectedBroadcastId(item.id);
    setForm({
      id: item.id,
      accountId: item.accountId || "",
      promotionId: item.promotionId || "",
      promotionTitle: item.promotion?.title || "",
      promotionMessage: item.promotion?.message || "",
      templateName: item.templateName || "",
      languageCode: item.languageCode || "en_US",
    });
  }

  function updateField(key, value) {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  function buildPayloadFromForm() {
    return {
      accountId: String(form.accountId || "").trim() || null,
      templateName: String(form.templateName || "").trim() || null,
      languageCode: String(form.languageCode || "").trim() || "en_US",
      promotionId: String(form.promotionId || "").trim() || null,
    };
  }

  function validateForm() {
    if (!String(form.accountId || "").trim()) {
      toast.error("Choose the WhatsApp number that will send this campaign");
      return false;
    }

    if (!String(form.templateName || "").trim()) {
      toast.error("Template name is required");
      return false;
    }

    if (!String(form.languageCode || "").trim()) {
      toast.error("Language code is required");
      return false;
    }

    return true;
  }

  async function handleCreate() {
    if (!validateForm()) return;

    try {
      setCreating(true);

      const payload = buildPayloadFromForm();
      const res = await createWhatsAppBroadcast(payload);
      const created = normalizeBroadcast(res?.broadcast);

      setBroadcasts((prev) => [created, ...prev]);
      setSelectedBroadcastId(created.id);
      setForm({
        id: created.id,
        accountId: created.accountId || "",
        promotionId: created.promotionId || "",
        promotionTitle: created.promotion?.title || form.promotionTitle,
        promotionMessage: created.promotion?.message || form.promotionMessage,
        templateName: created.templateName || "",
        languageCode: created.languageCode || "en_US",
      });

      toast.success("Broadcast draft created");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to create broadcast");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!selectedBroadcastId) {
      toast.error("Open a campaign first");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayloadFromForm();
      const res = await updateWhatsAppBroadcast(selectedBroadcastId, payload);
      const updated = normalizeBroadcast(res?.broadcast);

      setBroadcasts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      setForm({
        id: updated.id,
        accountId: updated.accountId || "",
        promotionId: updated.promotionId || "",
        promotionTitle: updated.promotion?.title || form.promotionTitle,
        promotionMessage: updated.promotion?.message || form.promotionMessage,
        templateName: updated.templateName || "",
        languageCode: updated.languageCode || "en_US",
      });

      toast.success("Broadcast updated");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update broadcast");
    } finally {
      setSaving(false);
    }
  }

  async function handleQueue(item) {
    try {
      setQueueingId(item.id);
      const res = await queueWhatsAppBroadcast(item.id);
      const updated = normalizeBroadcast(res?.broadcast);

      setBroadcasts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

      if (selectedBroadcastId === updated.id) {
        openBroadcast(updated);
      }

      toast.success("Broadcast queued");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to queue broadcast");
    } finally {
      setQueueingId("");
    }
  }

  async function handleSend(item) {
    try {
      setSendingId(item.id);

      const res = await sendWhatsAppBroadcastNow(item.id, { limit: 50 });
      const updated = normalizeBroadcast(res?.broadcast);

      setBroadcasts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

      if (selectedBroadcastId === updated.id) {
        openBroadcast(updated);
      }

      const summaryText = res?.summary
        ? `${res.summary.delivered} delivered, ${res.summary.failed} failed`
        : "Campaign sent";

      toast.success(summaryText);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to send broadcast");
    } finally {
      setSendingId("");
    }
  }

  if (loading) {
    return <PageSkeleton titleWidth="w-52" lines={6} variant="default" />;
  }

  return (
    <div className="space-y-6">
      <section className={cx(pageCard(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <SectionHeading
                eyebrow="WhatsApp"
                title="Broadcasts"
                subtitle="Create simple customer campaigns owners can understand, queue them safely, and send them from the correct WhatsApp number."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ProtectionPill tone="info">{summary.total} campaigns</ProtectionPill>

              <AsyncButton
                type="button"
                loading={refreshing}
                loadingText="Refreshing..."
                onClick={() => loadAll(true)}
                className={primaryBtn()}
              >
                <span className={cx("mr-2 inline-flex", refreshing ? "animate-spin" : "")}>
                  <RefreshIcon />
                </span>
                Refresh
              </AsyncButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Campaigns"
            value={summary.total}
            note="All WhatsApp broadcast drafts and sends"
          />
          <SummaryCard
            label="Drafts"
            value={summary.drafts}
            note="Not queued yet"
            tone="info"
          />
          <SummaryCard
            label="Queued"
            value={summary.queued}
            note="Ready to send"
            tone="warning"
          />
          <SummaryCard
            label="Sent"
            value={summary.sent}
            note="Already pushed to customers"
            tone="success"
          />
          <SummaryCard
            label="Delivered"
            value={summary.delivered}
            note="Messages with provider IDs recorded"
            tone="success"
          />
        </div>
      </section>

      <WhatsAppWorkspaceTabs />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className={cx("text-lg font-black tracking-tight", strongText())}>
                  Campaign queue
                </div>
                <p className={cx("mt-1 text-sm leading-6", mutedText())}>
                  Review every WhatsApp campaign clearly before you queue or send it.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="relative min-w-0">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    <SearchIcon />
                  </span>
                  <input
                    className={cx(inputClass(), "pl-10")}
                    placeholder="Search campaigns..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <select
                  className={inputClass()}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="QUEUED">Queued</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                </select>

                <select
                  className={inputClass()}
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                >
                  <option value="ALL">All numbers</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.businessName || acc.phoneNumber || "Channel"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {filteredBroadcasts.length === 0 ? (
              <EmptyState
                title="No campaigns found"
                text="Create your first WhatsApp campaign draft, or adjust the search and filters."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredBroadcasts.map((item) => (
                  <BroadcastCard
                    key={item.id}
                    item={item}
                    selected={item.id === selectedBroadcastId}
                    onOpen={() => openBroadcast(item)}
                    onQueue={() => handleQueue(item)}
                    onSend={() => handleSend(item)}
                    queueing={queueingId === item.id}
                    sending={sendingId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Builder"
              title="Campaign setup"
              subtitle="Keep this simple: choose the sending number, define the template, then save as a draft first."
            />

            <div className="mt-6 space-y-4">
              <div>
                <label className={fieldLabel()}>WhatsApp number to send from</label>
                <select
                  className={inputClass()}
                  value={form.accountId}
                  onChange={(e) => updateField("accountId", e.target.value)}
                >
                  <option value="">Select WhatsApp number</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.businessName || "WhatsApp channel"} • {acc.phoneNumber || "No number"}
                    </option>
                  ))}
                </select>
                <div className={fieldHelp()}>
                  This is the business WhatsApp number customers will see.
                </div>
              </div>

              <div>
                <label className={fieldLabel()}>Template name</label>
                <input
                  className={inputClass()}
                  value={form.templateName}
                  onChange={(e) => updateField("templateName", e.target.value)}
                  placeholder="Example: promo_update"
                />
                <div className={fieldHelp()}>
                  This must match the approved WhatsApp template name on your connected channel.
                </div>
              </div>

              <div>
                <label className={fieldLabel()}>Language code</label>
                <input
                  className={inputClass()}
                  value={form.languageCode}
                  onChange={(e) => updateField("languageCode", e.target.value)}
                  placeholder="en_US"
                />
              </div>

              <div>
                <label className={fieldLabel()}>Promotion ID</label>
                <input
                  className={inputClass()}
                  value={form.promotionId}
                  onChange={(e) => updateField("promotionId", e.target.value)}
                  placeholder="Optional existing promotion ID"
                />
                <div className={fieldHelp()}>
                  Use this only when the message content was already prepared in the backend.
                </div>
              </div>

              <div>
                <label className={fieldLabel()}>Campaign title preview</label>
                <input
                  className={inputClass()}
                  value={form.promotionTitle}
                  onChange={(e) => updateField("promotionTitle", e.target.value)}
                  placeholder="Example: Weekend phone sale"
                />
                <div className={fieldHelp()}>
                  This helps staff and owners understand what the campaign is about.
                </div>
              </div>

              <div>
                <label className={fieldLabel()}>Message preview</label>
                <div className={cx(softPanel(), "border border-[var(--color-border)] p-3 sm:p-4")}>
                  <textarea
                    className={polishedTextareaClass()}
                    value={form.promotionMessage}
                    onChange={(e) => updateField("promotionMessage", e.target.value)}
                    placeholder="Example:
Hello, we have new phone arrivals this week.
Reply if you want price and stock details."
                  />
                </div>
                <div className={fieldHelp()}>
                  This is a clean internal preview for your team. Keep it short, clear, and easy to understand.
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <AsyncButton
                  type="button"
                  loading={creating}
                  loadingText="Creating..."
                  onClick={handleCreate}
                  className="w-full"
                >
                  Create draft
                </AsyncButton>

                <AsyncButton
                  type="button"
                  loading={saving}
                  loadingText="Saving..."
                  onClick={handleSave}
                  className={cx(primaryBtn(), "w-full")}
                  disabled={!selectedBroadcastId}
                >
                  Save changes
                </AsyncButton>
              </div>
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className={cx("text-lg font-black tracking-tight", strongText())}>
              Current selection
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <InfoStat
                label="Campaign"
                value={
                  selectedBroadcast
                    ? selectedBroadcast.promotion?.title ||
                      selectedBroadcast.templateName ||
                      "Untitled"
                    : "None selected"
                }
                sub={
                  selectedBroadcast
                    ? `Created ${formatTimeAgo(selectedBroadcast.createdAt)}`
                    : "Open a campaign from the list"
                }
              />
              <InfoStat
                label="Status"
                value={selectedBroadcast ? statusLabel(selectedBroadcast.status) : "—"}
                sub={
                  selectedBroadcast?.queuedAt
                    ? `Queued ${formatDateTime(selectedBroadcast.queuedAt)}`
                    : selectedBroadcast?.sentAt
                    ? `Sent ${formatDateTime(selectedBroadcast.sentAt)}`
                    : "Not queued yet"
                }
              />
              <InfoStat
                label="Recipients"
                value={selectedBroadcast ? String(selectedBroadcast.recipientCount || 0) : "—"}
                sub={
                  selectedBroadcast
                    ? `${selectedBroadcast.deliveredCount || 0} delivered so far`
                    : "No campaign selected"
                }
              />
              <InfoStat
                label="Channel"
                value={
                  selectedBroadcast?.account?.businessName ||
                  selectedBroadcast?.account?.phoneNumber ||
                  "—"
                }
                sub={
                  selectedBroadcast?.account?.isActive
                    ? "Active sending number"
                    : "Choose an active account"
                }
              />
            </div>

            {selectedBroadcast ? (
              <div className="mt-4 flex flex-col gap-2">
                {selectedBroadcast.status === "DRAFT" ? (
                  <AsyncButton
                    type="button"
                    loading={queueingId === selectedBroadcast.id}
                    loadingText="Queueing..."
                    onClick={() => handleQueue(selectedBroadcast)}
                    className={secondaryBtn()}
                  >
                    Queue selected campaign
                  </AsyncButton>
                ) : null}

                {(selectedBroadcast.status === "DRAFT" ||
                  selectedBroadcast.status === "QUEUED") && (
                  <AsyncButton
                    type="button"
                    loading={sendingId === selectedBroadcast.id}
                    loadingText="Sending..."
                    onClick={() => handleSend(selectedBroadcast)}
                    className={primaryBtn()}
                  >
                    Send selected campaign now
                  </AsyncButton>
                )}
              </div>
            ) : null}
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className={cx("text-lg font-black tracking-tight", strongText())}>
              How this helps the store
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <InfoStat
                label="New arrivals"
                value="Tell customers fast"
                sub="Use campaigns to announce newly arrived products without staff typing one by one."
              />
              <InfoStat
                label="Slow stock"
                value="Push stagnant items"
                sub="Promote products that have been sitting too long and bring them back into attention."
              />
              <InfoStat
                label="Owner clarity"
                value="Simple campaign control"
                sub="Owners can see what was drafted, queued, or sent without needing technical knowledge."
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}