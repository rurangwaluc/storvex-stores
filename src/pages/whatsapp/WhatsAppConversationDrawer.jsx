import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  listWhatsAppConversationMessages,
  replyToWhatsAppConversation,
  updateWhatsAppConversationStatus,
} from "../../services/whatsappInboxApi";

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
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function textareaClass() {
  return "min-h-[88px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
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

function normalizeMessage(raw) {
  return {
    id: raw?.id || "",
    direction: String(raw?.direction || "INBOUND").toUpperCase(),
    type: String(raw?.type || "TEXT").toUpperCase(),
    textContent: raw?.textContent || "",
    mediaUrl: raw?.mediaUrl || "",
    messageId: raw?.messageId || "",
    createdAt: raw?.createdAt || null,
    sentById: raw?.sentById || "",
  };
}

function messageBubbleClass(direction) {
  return direction === "OUTBOUND"
    ? "ml-auto border-emerald-200/80 bg-emerald-50 text-stone-950 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-[rgb(var(--text))]"
    : "mr-auto border-stone-200 bg-white text-stone-950 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))]";
}

function DrawerMessageSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={cx(
            "max-w-[82%] rounded-[24px] border border-stone-200 bg-white p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]",
            i % 2 ? "ml-auto" : "mr-auto"
          )}
        >
          <div className="h-3.5 w-28 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-3 h-3 w-56 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-2 h-3 w-44 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-3 h-3 w-24 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className={cx("text-base font-semibold", strongText())}>{title}</div>
        <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
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

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M22 2L15 22l-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
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

export default function WhatsAppConversationDrawer({
  open,
  conversation,
  onClose,
  onConversationPatched,
  draftsByConversationId = {},
}) {
  const nav = useNavigate();
  const mountedRef = useRef(true);
  const bottomRef = useRef(null);
  const closeTimerRef = useRef(null);
  const textareaRef = useRef(null);

  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const conversationId = conversation?.id || "";
  const linkedDraft = conversationId ? draftsByConversationId[conversationId] || null : null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setRendered(false);
    }, 280);
  }, [open]);

  useEffect(() => {
    if (!rendered) return undefined;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleReply();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [rendered, onClose, replyText, conversationId]);

  useEffect(() => {
    if (!open || !conversationId) return;
    void loadMessages({ silent: false });
  }, [open, conversationId]);

  useEffect(() => {
    if (!rendered) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, rendered]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 220);
    return () => clearTimeout(timer);
  }, [open, conversationId]);

  const stats = useMemo(() => {
    const inbound = messages.filter((m) => m.direction === "INBOUND").length;
    const outbound = messages.filter((m) => m.direction === "OUTBOUND").length;
    return { inbound, outbound, total: messages.length };
  }, [messages]);

  async function loadMessages({ silent = false } = {}) {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (!silent) setMessagesLoading(true);
    setRefreshing(true);

    try {
      const res = await listWhatsAppConversationMessages(conversationId);
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.messages)
        ? res.messages.map(normalizeMessage).filter(Boolean)
        : [];

      list.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );

      setMessages(list);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load conversation messages");
      if (!mountedRef.current) return;
      setMessages([]);
    } finally {
      if (!mountedRef.current) return;
      setMessagesLoading(false);
      setRefreshing(false);
    }
  }

  async function handleReply() {
    const text = String(replyText || "").trim();

    if (!text || !conversationId) {
      toast.error("Reply message is required");
      return;
    }

    setSending(true);

    try {
      const res = await replyToWhatsAppConversation(conversationId, { text });

      const saved = res?.message
        ? {
            id: res.message.id,
            direction: "OUTBOUND",
            type: "TEXT",
            textContent: text,
            mediaUrl: "",
            messageId: res.message.messageId || "",
            createdAt: res.message.createdAt || new Date().toISOString(),
            sentById: "",
          }
        : null;

      if (saved) {
        setMessages((prev) => [...prev, saved]);
      } else {
        await loadMessages({ silent: true });
      }

      setReplyText("");
      toast.success("Reply sent");

      onConversationPatched?.({
        ...conversation,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    if (!conversationId) return;

    setStatusSaving(true);

    try {
      await updateWhatsAppConversationStatus(conversationId, { status: nextStatus });

      onConversationPatched?.({
        ...conversation,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      toast.success(nextStatus === "CLOSED" ? "Conversation closed" : "Conversation reopened");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update conversation status");
    } finally {
      setStatusSaving(false);
    }
  }

  if (!rendered || !conversation) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close conversation drawer"
        className={cx(
          "absolute inset-0 backdrop-blur-[3px] transition-all duration-300",
          visible ? "bg-black/45 opacity-100" : "bg-black/0 opacity-0"
        )}
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-full justify-end overflow-hidden">
        <div
          className={cx(
            "flex h-full w-full max-w-[880px] transform flex-col border-l border-stone-200 bg-[rgb(var(--bg-elevated))] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-[rgb(var(--border))]",
            visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
          )}
        >
          <div className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]/90">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <CustomerAvatar conversation={conversation} />

                  <div className="min-w-0">
                    <div className={cx("truncate text-lg font-semibold", strongText())}>
                      {conversation.customer?.name || "Unknown customer"}
                    </div>
                    <div className={cx("mt-0.5 text-sm", mutedText())}>
                      {conversation.customer?.phone || conversation.phone || "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {statusPill(
                    conversation.status === "OPEN" ? "success" : "warning",
                    conversation.status || "OPEN"
                  )}
                  {statusPill("neutral", `${stats.total} messages`)}
                  {linkedDraft ? statusPill("warning", `Draft #${String(linkedDraft.id).slice(-6).toUpperCase()}`) : null}
                  <span className={cx("text-xs", softText())}>
                    {conversation.updatedAt ? `Updated ${formatDateTime(conversation.updatedAt)}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadMessages()}
                  className={secondaryBtn()}
                  disabled={refreshing}
                >
                  <span className={cx("mr-2 inline-flex", refreshing ? "animate-spin" : "")}>
                    <RefreshIcon />
                  </span>
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-300 bg-white text-stone-900 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]"
                  aria-label="Close drawer"
                >
                  <XIcon />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleStatusChange("OPEN")}
                className={secondaryBtn()}
                disabled={statusSaving}
              >
                Reopen
              </button>

              <button
                type="button"
                onClick={() => void handleStatusChange("CLOSED")}
                className={secondaryBtn()}
                disabled={statusSaving}
              >
                Close
              </button>

              {linkedDraft ? (
                <button
                  type="button"
                  onClick={() => nav("/app/whatsapp/drafts")}
                  className={primaryBtn()}
                >
                  Open draft
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => nav("/app/whatsapp/drafts")}
                  className={secondaryBtn()}
                >
                  Open drafts
                </button>
              )}

              <button
                type="button"
                onClick={() => nav("/app/customers")}
                className={secondaryBtn()}
              >
                Customers
              </button>

              <button
                type="button"
                onClick={() => nav("/app/pos/sales")}
                className={secondaryBtn()}
              >
                Sales
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1fr,280px]">
            <div className="min-h-0 bg-stone-100/70 dark:bg-[rgb(var(--bg))]">
              <div className="h-full overflow-y-auto px-4 py-5 sm:px-5">
                {messagesLoading ? (
                  <DrawerMessageSkeleton />
                ) : messages.length === 0 ? (
                  <EmptyState
                    title="No messages found"
                    text="This conversation exists, but no messages were returned."
                  />
                ) : (
                  <div className="space-y-4">
                    {messages.map((item) => (
                      <div
                        key={item.id}
                        className={cx(
                          "max-w-[86%] rounded-[24px] border p-4",
                          messageBubbleClass(item.direction)
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className={cx(
                              "text-[11px] font-semibold uppercase tracking-[0.16em]",
                              softText()
                            )}
                          >
                            {item.direction === "OUTBOUND" ? "Staff / Store" : "Customer"}
                          </div>

                          <div className="text-xs">{statusPill("neutral", item.type)}</div>
                        </div>

                        <div
                          className={cx(
                            "mt-2 whitespace-pre-wrap break-words text-sm leading-6",
                            strongText()
                          )}
                        >
                          {item.textContent || "No text content"}
                        </div>

                        {item.mediaUrl ? (
                          <div className={cx("mt-2 break-all text-xs", mutedText())}>
                            {item.mediaUrl}
                          </div>
                        ) : null}

                        <div className={cx("mt-3 text-xs", softText())}>
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                    ))}

                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
            </div>

            <aside className="hidden border-l border-stone-200 bg-white/90 p-5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] xl:block">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Context
              </div>

              <div className="mt-4 space-y-4">
                <div className={cx(shell(), "p-4")}>
                  <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                    Customer
                  </div>
                  <div className={cx("mt-2 text-sm font-semibold", strongText())}>
                    {conversation.customer?.name || "Unknown"}
                  </div>
                  <div className={cx("mt-1 text-sm", mutedText())}>
                    {conversation.customer?.phone || conversation.phone || "—"}
                  </div>
                  {conversation.customer?.email ? (
                    <div className={cx("mt-1 break-all text-sm", mutedText())}>
                      {conversation.customer.email}
                    </div>
                  ) : null}
                </div>

                <div className={cx(shell(), "p-4")}>
                  <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                    Thread stats
                  </div>
                  <div className={cx("mt-3 text-sm", mutedText())}>
                    <div>Total: {stats.total}</div>
                    <div className="mt-1">Inbound: {stats.inbound}</div>
                    <div className="mt-1">Outbound: {stats.outbound}</div>
                  </div>
                </div>

                <div className={cx(shell(), "p-4")}>
                  <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                    Sales link
                  </div>
                  <div className={cx("mt-3 text-sm leading-6", mutedText())}>
                    {linkedDraft
                      ? `This conversation already has draft #${String(linkedDraft.id)
                          .slice(-6)
                          .toUpperCase()}.`
                      : "No linked draft detected yet for this conversation."}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]/95">
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                className={textareaClass()}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply to this customer..."
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={cx("text-xs", softText())}>
                  Replies are sent through the connected WhatsApp number. Press Ctrl/Cmd + Enter to send.
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyText("")}
                    className={secondaryBtn()}
                    disabled={sending}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleReply()}
                    className={primaryBtn()}
                    disabled={sending}
                  >
                    <span className="mr-2 inline-flex">
                      <SendIcon />
                    </span>
                    {sending ? "Sending..." : "Send reply"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}