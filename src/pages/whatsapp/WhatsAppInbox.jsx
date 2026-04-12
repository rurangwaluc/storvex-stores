import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import {
  listWhatsAppConversations,
  listWhatsAppSaleDrafts,
  listAssignableWhatsAppStaff,
  assignWhatsAppConversationOwner,
  clearWhatsAppConversationOwner,
} from "../../services/whatsappInboxApi";
import WhatsAppConversationDrawer from "./WhatsAppConversationDrawer";
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

function formatTimeAgo(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diff = Date.now() - date.getTime();
  if (diff < 60 * 1000) return "Just now";

  const mins = Math.floor(diff / (60 * 1000));
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}

      <h2
        className={cx(
          "mt-3 text-[1.5rem] font-black tracking-tight sm:text-[1.8rem]",
          strongText()
        )}
      >
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
        <div className={cx("mt-2 text-[1.55rem] font-black tracking-tight", toneClass)}>
          {value}
        </div>
        {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
      </div>
    </article>
  );
}

function ProtectionPill({ tone = "neutral", children }) {
  const cls =
    tone === "success"
      ? successBadge()
      : tone === "info"
      ? infoBadge()
      : tone === "warning"
      ? warningBadge()
      : tone === "process"
      ? processBadge()
      : neutralBadge();

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold",
        cls
      )}
    >
      {children}
    </span>
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

function CustomerAvatar({ conversation }) {
  const label = String(
    conversation?.customer?.name || conversation?.customer?.phone || conversation?.phone || "?"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-primary-ring)]">
      {label}
    </div>
  );
}

function normalizeConversation(raw) {
  if (!raw) return null;

  return {
    id: String(raw.id || ""),
    phone: String(raw.phone || ""),
    status: String(raw.status || "OPEN").toUpperCase(),
    assignedToId: String(raw.assignedToId || ""),
    accountId: String(raw.accountId || ""),
    customerId: String(raw.customerId || raw.customer?.id || ""),
    updatedAt: raw.updatedAt || null,
    createdAt: raw.createdAt || null,
    assignedTo: raw.assignedTo
      ? {
          id: String(raw.assignedTo.id || ""),
          name: String(raw.assignedTo.name || ""),
          email: String(raw.assignedTo.email || ""),
          role: String(raw.assignedTo.role || "").toUpperCase(),
          isActive:
            typeof raw.assignedTo.isActive === "boolean" ? raw.assignedTo.isActive : true,
        }
      : null,
    customer: raw.customer
      ? {
          id: String(raw.customer.id || ""),
          name: String(raw.customer.name || ""),
          phone: String(raw.customer.phone || raw.phone || ""),
          email: String(raw.customer.email || ""),
          address: String(raw.customer.address || ""),
        }
      : null,
  };
}

function normalizeDraft(raw) {
  if (!raw) return null;

  return {
    id: String(raw.id || ""),
    conversationId: String(raw.conversationId || raw.conversation?.id || ""),
    customerId: String(raw.customerId || ""),
    saleType: String(raw.saleType || "CREDIT").toUpperCase(),
    status: String(raw.status || ""),
    total: Number(raw.total || 0),
    balanceDue: Number(raw.balanceDue || 0),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.finalizedAt || raw.createdAt || null,
  };
}

function normalizeStaff(raw) {
  if (!raw) return null;

  return {
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    email: String(raw.email || ""),
    role: String(raw.role || "").toUpperCase(),
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : true,
  };
}

function groupLabel(status) {
  return status === "OPEN" ? "Open conversations" : "Closed conversations";
}

function getConversationSearchText(item, linkedDraft, assignedName) {
  return [
    item?.phone,
    item?.status,
    item?.customer?.name,
    item?.customer?.phone,
    item?.customer?.email,
    linkedDraft?.id,
    linkedDraft?.saleType,
    assignedName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function CompactQueueRow({
  item,
  linkedDraft,
  selected,
  onOpen,
  assignedStaffName,
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        "w-full rounded-[22px] border px-3 py-3 text-left transition sm:px-4",
        selected
          ? "border-[var(--color-primary-ring)] bg-[var(--color-primary-soft)]"
          : "border-transparent bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)]"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <CustomerAvatar conversation={item} />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className={cx("truncate text-sm font-bold", strongText())}>
                {item.customer?.name || "Unknown customer"}
              </div>

              <div className={cx("mt-1 truncate text-xs", mutedText())}>
                {item.customer?.phone || item.phone || "—"}
              </div>

              {item.customer?.email ? (
                <div className={cx("mt-1 truncate text-xs", softText())}>{item.customer.email}</div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <ProtectionPill tone={item.status === "OPEN" ? "success" : "warning"}>
                {item.status === "OPEN" ? "Open" : "Closed"}
              </ProtectionPill>

              {assignedStaffName ? (
                <ProtectionPill tone="info">{assignedStaffName}</ProtectionPill>
              ) : null}

              {linkedDraft ? (
                <ProtectionPill tone="process">
                  Draft #{String(linkedDraft.id).slice(-6).toUpperCase()}
                </ProtectionPill>
              ) : null}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className={cx("min-w-0 truncate", mutedText())}>
              {assignedStaffName
                ? `Assigned to ${assignedStaffName}`
                : linkedDraft
                  ? `${linkedDraft.saleType} draft • RWF ${Number(linkedDraft.total || 0).toLocaleString()}`
                  : "No linked draft yet"}
            </div>

            <div className={cx("shrink-0", softText())}>
              {formatTimeAgo(item.updatedAt || item.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function QueueGroup({
  title,
  items,
  draftsByConversationId,
  selectedConversationId,
  onOpen,
  staffNameById,
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className={cx("text-sm font-bold", strongText())}>{title}</div>
        <div className={cx("text-xs", mutedText())}>{items.length}</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => {
          const assignedStaffName =
            item.assignedTo?.name || staffNameById[item.assignedToId] || "";

          return (
            <CompactQueueRow
              key={item.id}
              item={item}
              linkedDraft={draftsByConversationId[item.id] || null}
              selected={selectedConversationId === item.id}
              onOpen={() => onOpen(item)}
              assignedStaffName={assignedStaffName}
            />
          );
        })}
      </div>
    </section>
  );
}

function LoadMoreRow({ onClick, remaining }) {
  return (
    <div className="flex justify-center pt-2">
      <button type="button" onClick={onClick} className={secondaryBtn()}>
        Show more conversations{remaining > 0 ? ` (${remaining} left)` : ""}
      </button>
    </div>
  );
}

const INITIAL_RENDER_COUNT = 60;
const LOAD_MORE_STEP = 80;

export default function WhatsAppInbox() {
  const nav = useNavigate();
  const mountedRef = useRef(true);

  const [conversations, setConversations] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [linkedFilter, setLinkedFilter] = useState("ALL");
  const [renderCount, setRenderCount] = useState(INITIAL_RENDER_COUNT);

  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    document.title = "WhatsApp Inbox • Storvex";

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadInbox(showToast = false) {
    try {
      if (!conversations.length && !drafts.length && !staffOptions.length) setLoading(true);
      else setRefreshing(true);

      const [conversationRes, draftRes, staffRes] = await Promise.all([
        listWhatsAppConversations(),
        listWhatsAppSaleDrafts(),
        listAssignableWhatsAppStaff(),
      ]);

      if (!mountedRef.current) return;

      const nextConversations = Array.isArray(conversationRes?.conversations)
        ? conversationRes.conversations.map(normalizeConversation).filter(Boolean)
        : [];

      const nextDrafts = Array.isArray(draftRes?.drafts)
        ? draftRes.drafts.map(normalizeDraft).filter(Boolean)
        : [];

      const nextStaff = Array.isArray(staffRes?.staff)
        ? staffRes.staff.map(normalizeStaff).filter(Boolean)
        : [];

      nextConversations.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );

      setConversations(nextConversations);
      setDrafts(nextDrafts);
      setStaffOptions(nextStaff);
      setRenderCount(INITIAL_RENDER_COUNT);

      if (selectedConversationId) {
        const stillExists = nextConversations.some((item) => item.id === selectedConversationId);
        if (!stillExists) {
          setSelectedConversationId("");
          setDrawerOpen(false);
        }
      }

      if (showToast) toast.success("WhatsApp inbox refreshed");
    } catch (err) {
      console.error(err);
      if (!mountedRef.current) return;

      toast.error(err?.message || "Failed to load WhatsApp inbox");
      setConversations([]);
      setDrafts([]);
      setStaffOptions([]);
      setSelectedConversationId("");
      setDrawerOpen(false);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadInbox();
  }, []);

  const draftsByConversationId = useMemo(() => {
    const map = {};
    for (const draft of drafts) {
      if (!draft?.conversationId) continue;

      const existing = map[draft.conversationId];
      if (!existing) {
        map[draft.conversationId] = draft;
        continue;
      }

      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const nextTime = new Date(draft.updatedAt || draft.createdAt || 0).getTime();

      if (nextTime > existingTime) {
        map[draft.conversationId] = draft;
      }
    }
    return map;
  }, [drafts]);

  const staffNameById = useMemo(() => {
    const map = {};
    for (const staff of staffOptions) {
      if (!staff?.id) continue;
      map[staff.id] = staff.name || staff.role || "Staff";
    }
    return map;
  }, [staffOptions]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();

    return conversations.filter((item) => {
      const linkedDraft = draftsByConversationId[item.id] || null;
      const assignedName = item.assignedTo?.name || staffNameById[item.assignedToId] || "";

      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (linkedFilter === "LINKED" && !linkedDraft) return false;
      if (linkedFilter === "UNLINKED" && linkedDraft) return false;
      if (!q) return true;

      return getConversationSearchText(item, linkedDraft, assignedName).includes(q);
    });
  }, [conversations, draftsByConversationId, query, statusFilter, linkedFilter, staffNameById]);

  const visibleConversations = useMemo(() => {
    return filteredConversations.slice(0, renderCount);
  }, [filteredConversations, renderCount]);

  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const summary = useMemo(() => {
    const total = conversations.length;
    const open = conversations.filter((x) => x.status === "OPEN").length;
    const closed = conversations.filter((x) => x.status === "CLOSED").length;
    const linkedDrafts = conversations.filter((x) => draftsByConversationId[x.id]).length;

    return { total, open, closed, linkedDrafts };
  }, [conversations, draftsByConversationId]);

  const groupedVisible = useMemo(() => {
    const openItems = [];
    const closedItems = [];

    for (const item of visibleConversations) {
      if (item.status === "CLOSED") closedItems.push(item);
      else openItems.push(item);
    }

    return { openItems, closedItems };
  }, [visibleConversations]);

  const remainingCount = Math.max(0, filteredConversations.length - visibleConversations.length);

  function openConversation(item) {
    setSelectedConversationId(item.id);
    setDrawerOpen(true);
  }

  function patchConversation(nextConversation) {
    if (!nextConversation?.id) return;

    setConversations((prev) => {
      const next = prev.map((item) =>
        item.id === nextConversation.id
          ? {
              ...item,
              ...nextConversation,
              customer: nextConversation.customer
                ? { ...(item.customer || {}), ...nextConversation.customer }
                : item.customer,
              assignedTo:
                nextConversation.assignedTo !== undefined
                  ? nextConversation.assignedTo
                  : item.assignedTo,
            }
          : item
      );

      next.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );

      return next;
    });
  }

  async function handleAssignConversation(conversationId, userId) {
    if (!conversationId || !userId) return;

    try {
      const res = await assignWhatsAppConversationOwner(conversationId, { assignedToId: userId });
      const updated = res?.conversation || null;

      if (updated?.id) {
        patchConversation(normalizeConversation(updated));
      } else {
        const assignedTo = staffOptions.find((x) => x.id === userId) || null;

        patchConversation({
          id: conversationId,
          assignedToId: userId,
          assignedTo,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success("Conversation assigned");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to assign conversation");
    }
  }

  async function handleClearConversationAssignment(conversationId) {
    if (!conversationId) return;

    try {
      const res = await clearWhatsAppConversationOwner(conversationId);
      const updated = res?.conversation || null;

      if (updated?.id) {
        patchConversation(normalizeConversation(updated));
      } else {
        patchConversation({
          id: conversationId,
          assignedToId: "",
          assignedTo: null,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success("Assignment cleared");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to clear assignment");
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setLinkedFilter("ALL");
    setRenderCount(INITIAL_RENDER_COUNT);
  }

  useEffect(() => {
    setRenderCount(INITIAL_RENDER_COUNT);
  }, [query, statusFilter, linkedFilter]);

  if (loading) {
    return <PageSkeleton titleWidth="w-40" lines={5} variant="default" />;
  }

  return (
    <>
      <div className="space-y-6">
        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <SectionHeading
                  eyebrow="WhatsApp"
                  title="Inbox"
                  subtitle="Manage live customer conversations, reply quickly, and move buying interest into drafts your staff can review and finalize."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ProtectionPill tone="info">{summary.open} open</ProtectionPill>

                <button
                  type="button"
                  onClick={() => nav("/app/whatsapp/drafts")}
                  className={secondaryBtn()}
                >
                  Open drafts
                </button>

                <AsyncButton
                  type="button"
                  loading={refreshing}
                  loadingText="Refreshing..."
                  onClick={() => loadInbox(true)}
                  className={primaryBtn()}
                >
                  <span className={cx("mr-2 inline-flex", refreshing ? "animate-spin" : "")}>
                    <RefreshIcon />
                  </span>
                  Refresh inbox
                </AsyncButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total conversations"
              value={summary.total}
              note="All WhatsApp threads in this store"
            />
            <SummaryCard
              label="Open"
              value={summary.open}
              note="Threads that still need attention"
              tone="success"
            />
            <SummaryCard
              label="Closed"
              value={summary.closed}
              note="Resolved or parked conversations"
              tone="warning"
            />
            <SummaryCard
              label="Linked drafts"
              value={summary.linkedDrafts}
              note="Conversations already connected to drafts"
              tone="neutral"
            />
          </div>
        </section>

        <WhatsAppWorkspaceTabs />

        <section className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className={cx("text-lg font-black tracking-tight", strongText())}>
                    Conversation queue
                  </div>
                  <p className={cx("mt-1 text-sm leading-6", mutedText())}>
                    Compact queue built for high volume. Open any thread to reply, update status,
                    assign an owner, and jump into related draft work.
                  </p>
                </div>

                <div className="relative w-full max-w-md">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    <SearchIcon />
                  </span>
                  <input
                    className={cx(inputClass(), "pl-10")}
                    placeholder="Search by phone, name, email, draft, staff, or status..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cx(
                      statusFilter === "ALL" ? primaryBtn() : secondaryBtn(),
                      "h-10 px-4 text-xs sm:text-sm"
                    )}
                    onClick={() => setStatusFilter("ALL")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={cx(
                      statusFilter === "OPEN" ? primaryBtn() : secondaryBtn(),
                      "h-10 px-4 text-xs sm:text-sm"
                    )}
                    onClick={() => setStatusFilter("OPEN")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className={cx(
                      statusFilter === "CLOSED" ? primaryBtn() : secondaryBtn(),
                      "h-10 px-4 text-xs sm:text-sm"
                    )}
                    onClick={() => setStatusFilter("CLOSED")}
                  >
                    Closed
                  </button>

                  <button
                    type="button"
                    className={cx(
                      linkedFilter === "LINKED" ? primaryBtn() : secondaryBtn(),
                      "h-10 px-4 text-xs sm:text-sm"
                    )}
                    onClick={() => setLinkedFilter("LINKED")}
                  >
                    Linked drafts
                  </button>
                  <button
                    type="button"
                    className={cx(
                      linkedFilter === "UNLINKED" ? primaryBtn() : secondaryBtn(),
                      "h-10 px-4 text-xs sm:text-sm"
                    )}
                    onClick={() => setLinkedFilter("UNLINKED")}
                  >
                    No draft
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ProtectionPill tone="neutral">
                    {filteredConversations.length} matched
                  </ProtectionPill>
                  {(query || statusFilter !== "ALL" || linkedFilter !== "ALL") && (
                    <button type="button" onClick={resetFilters} className={secondaryBtn()}>
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {filteredConversations.length === 0 ? (
              <EmptyState
                title="No conversations found"
                text="There are no WhatsApp conversations matching your current filters."
              />
            ) : (
              <div className="space-y-6">
                <QueueGroup
                  title={groupLabel("OPEN")}
                  items={groupedVisible.openItems}
                  draftsByConversationId={draftsByConversationId}
                  selectedConversationId={selectedConversationId}
                  onOpen={openConversation}
                  staffNameById={staffNameById}
                />

                <QueueGroup
                  title={groupLabel("CLOSED")}
                  items={groupedVisible.closedItems}
                  draftsByConversationId={draftsByConversationId}
                  selectedConversationId={selectedConversationId}
                  onOpen={openConversation}
                  staffNameById={staffNameById}
                />

                {remainingCount > 0 ? (
                  <LoadMoreRow
                    remaining={remainingCount}
                    onClick={() => setRenderCount((prev) => prev + LOAD_MORE_STEP)}
                  />
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>

      <WhatsAppConversationDrawer
        open={drawerOpen}
        conversation={selectedConversation}
        onClose={() => setDrawerOpen(false)}
        onConversationPatched={patchConversation}
        draftsByConversationId={draftsByConversationId}
        canManageAssignment={true}
        staffOptions={staffOptions}
        onAssignConversation={handleAssignConversation}
        onClearConversationAssignment={handleClearConversationAssignment}
      />
    </>
  );
}