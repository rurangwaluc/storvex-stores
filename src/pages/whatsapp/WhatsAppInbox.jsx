import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { listWhatsAppConversations } from "../../services/whatsappInboxApi";
import WhatsAppConversationDrawer from "./WhatsAppConversationDrawer";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
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

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function statCardTone(kind = "neutral") {
  if (kind === "success") {
    return "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20";
  }
  if (kind === "warning") {
    return "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20";
  }
  return "border-stone-200 bg-white dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

function statusPill(kind, text) {
  const cls =
    kind === "success"
      ? "badge-success"
      : kind === "warning"
      ? "badge-warning"
      : kind === "danger"
      ? "badge-danger"
      : "badge-neutral";

  return <span className={cls}>{text}</span>;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function relativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function normalizeConversation(raw) {
  if (!raw) return null;

  return {
    id: raw.id,
    phone: raw.phone || "",
    status: String(raw.status || "OPEN").toUpperCase(),
    assignedToId: raw.assignedToId || "",
    accountId: raw.accountId || "",
    customerId: raw.customerId || raw.customer?.id || "",
    updatedAt: raw.updatedAt || null,
    createdAt: raw.createdAt || null,
    customer: raw.customer
      ? {
          id: raw.customer.id || "",
          name: raw.customer.name || "",
          phone: raw.customer.phone || raw.phone || "",
          email: raw.customer.email || "",
        }
      : null,
  };
}

function EmptyState({ title, text }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className={cx("text-base font-semibold", strongText())}>{title}</div>
        <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
      </div>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className="rounded-[24px] border border-stone-200 bg-white p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
        >
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-36 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
              <div className="mt-2 h-3 w-24 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
              <div className="mt-3 h-3 w-40 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
            </div>
          </div>
          <div className="mt-4 h-3 w-28 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
        </div>
      ))}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17l-3 3V6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
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
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      {label}
    </div>
  );
}

export default function WhatsAppInbox() {
  const nav = useNavigate();
  const mountedRef = useRef(true);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadConversations({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setRefreshing(true);

    try {
      const res = await listWhatsAppConversations();
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.conversations)
        ? res.conversations.map(normalizeConversation).filter(Boolean)
        : [];

      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );

      setConversations(list);

      if (selectedConversationId && !list.some((item) => item.id === selectedConversationId)) {
        setSelectedConversationId("");
        setDrawerOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load WhatsApp inbox");
      if (!mountedRef.current) return;
      setConversations([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadConversations();
  }, []);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((item) => {
      const phone = String(item.phone || "").toLowerCase();
      const customerName = String(item.customer?.name || "").toLowerCase();
      const customerPhone = String(item.customer?.phone || "").toLowerCase();
      const email = String(item.customer?.email || "").toLowerCase();

      return (
        phone.includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        email.includes(q)
      );
    });
  }, [conversations, query]);

  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const summary = useMemo(() => {
    const openCount = conversations.filter((x) => x.status === "OPEN").length;
    const closedCount = conversations.filter((x) => x.status === "CLOSED").length;
    return {
      total: conversations.length,
      open: openCount,
      closed: closedCount,
    };
  }, [conversations]);

  function openConversation(item) {
    setSelectedConversationId(item.id);
    setDrawerOpen(true);
  }

  function patchConversation(nextConversation) {
    setConversations((prev) => {
      const next = prev.map((item) =>
        item.id === nextConversation.id ? { ...item, ...nextConversation } : item
      );

      next.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );

      return next;
    });
  }

  return (
    <>
      <div className="space-y-5">
        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                  WhatsApp
                </div>
                <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                  Inbox
                </h1>
                <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Manage live customer conversations, reply quickly, and move buying intent into
                  WhatsApp drafts for staff review.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => nav("/app/whatsapp/drafts")}
                  className={secondaryBtn()}
                >
                  Open drafts
                </button>

                <button
                  type="button"
                  onClick={() => void loadConversations()}
                  className={primaryBtn()}
                  disabled={refreshing}
                >
                  <span className={cx("mr-2 inline-flex", refreshing ? "animate-spin" : "")}>
                    <RefreshIcon />
                  </span>
                  {refreshing ? "Refreshing..." : "Refresh inbox"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-3">
            <div className={cx(shell(), statCardTone("neutral"), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                Total conversations
              </div>
              <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{summary.total}</div>
              <div className={cx("mt-1 text-sm", mutedText())}>All WhatsApp threads in this store</div>
            </div>

            <div className={cx(shell(), statCardTone("success"), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                Open
              </div>
              <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{summary.open}</div>
              <div className={cx("mt-1 text-sm", mutedText())}>Active threads needing attention</div>
            </div>

            <div className={cx(shell(), statCardTone("warning"), "p-4")}>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
                Closed
              </div>
              <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{summary.closed}</div>
              <div className={cx("mt-1 text-sm", mutedText())}>Resolved or parked conversations</div>
            </div>
          </div>
        </section>

        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-stone-200 px-5 py-4 dark:border-[rgb(var(--border))]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className={cx("text-lg font-semibold", strongText())}>Conversation queue</h2>
                <p className={cx("mt-1 text-sm", mutedText())}>
                  Open any card to launch the slide-over conversation workspace.
                </p>
              </div>

              <div className="relative w-full max-w-md">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-[rgb(var(--text-soft))]">
                  <SearchIcon />
                </span>
                <input
                  className={cx(inputClass(), "pl-10")}
                  placeholder="Search by phone, customer name, or email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <ConversationListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                title="No conversations found"
                text="There are no WhatsApp conversations matching your current search."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredConversations.map((item) => {
                  const customerName = item.customer?.name || "Unknown customer";
                  const customerPhone = item.customer?.phone || item.phone || "—";
                  const isSelected = drawerOpen && item.id === selectedConversationId;
                  const lastSeen = item.updatedAt || item.createdAt || null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openConversation(item)}
                      className={cx(
                        "group rounded-[24px] border p-4 text-left transition-all duration-200",
                        isSelected
                          ? "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/20"
                          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:bg-stone-50 hover:shadow-md dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:hover:bg-[rgb(var(--bg-muted))]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <CustomerAvatar conversation={item} />

                          <div className="min-w-0">
                            <div className={cx("truncate text-sm font-semibold", strongText())}>
                              {customerName}
                            </div>
                            <div className={cx("mt-1 text-xs", mutedText())}>{customerPhone}</div>
                            {item.customer?.email ? (
                              <div className={cx("mt-1 truncate text-xs", softText())}>
                                {item.customer.email}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {statusPill(item.status === "OPEN" ? "success" : "warning", item.status)}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className={cx("text-xs", softText())}>
                            {lastSeen ? `Last activity ${relativeTime(lastSeen)}` : "—"}
                          </div>
                          <div className={cx("mt-1 text-xs", mutedText())}>
                            {formatDateTime(lastSeen)}
                          </div>
                        </div>

                        <div className="shrink-0 text-xs font-medium text-emerald-700 transition group-hover:translate-x-0.5 dark:text-emerald-300">
                          Open →
                        </div>
                      </div>
                    </button>
                  );
                })}
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
      />
    </>
  );
}