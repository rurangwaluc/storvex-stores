import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  listWhatsAppConversationMessages,
  replyToWhatsAppConversation,
  updateWhatsAppConversationStatus,
} from "../../services/whatsappInboxApi";

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

function panelCard() {
  return "rounded-[24px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[18px] bg-[var(--color-surface-2)]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
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
        "inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
        cls
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(softPanel(), "mx-3 my-3 px-4 py-8 text-center")}>
      <div className={cx("text-sm font-semibold", strongText())}>{title}</div>
      <div className={cx("mt-2 text-xs leading-5", mutedText())}>{text}</div>
    </div>
  );
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
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days}d ago`;
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-primary-ring)]">
      {label}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-3 px-3 py-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={cx("flex", i % 2 ? "justify-end" : "justify-start")}>
          <div
            className={cx(
              "max-w-[82%] rounded-[20px] px-4 py-3",
              i % 2
                ? "bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary-ring)]"
                : "bg-[var(--color-surface-2)]"
            )}
          >
            <div className="h-3 w-16 rounded bg-[var(--color-surface)]" />
            <div className="mt-2 h-3 w-40 rounded bg-[var(--color-surface)]" />
            <div className="mt-2 h-3 w-28 rounded bg-[var(--color-surface)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ item }) {
  const outbound = item.direction === "OUTBOUND";

  return (
    <div className={cx("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[84%] rounded-[20px] px-4 py-3 shadow-[var(--shadow-card)]",
          outbound
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-surface-2)] text-[var(--color-text)]"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "text-[10px] font-semibold uppercase tracking-[0.18em]",
              outbound ? "text-white/80" : "text-[var(--color-text-muted)]"
            )}
          >
            {outbound ? "Store" : "Customer"}
          </span>

          <span
            className={cx(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              outbound ? "bg-white/15 text-white" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
            )}
          >
            {item.type}
          </span>
        </div>

        <div
          className={cx(
            "mt-2 whitespace-pre-wrap break-words text-sm leading-6",
            outbound ? "text-white" : "text-[var(--color-text)]"
          )}
        >
          {item.textContent || "No text content"}
        </div>

        {item.mediaUrl ? (
          <div
            className={cx(
              "mt-2 break-all text-xs leading-5",
              outbound ? "text-white/80" : "text-[var(--color-text-muted)]"
            )}
          >
            {item.mediaUrl}
          </div>
        ) : null}

        <div
          className={cx(
            "mt-2 text-[11px]",
            outbound ? "text-white/75" : "text-[var(--color-text-muted)]"
          )}
        >
          {formatTimeAgo(item.createdAt)}
        </div>
      </div>
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
  const closeTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);
  const [minimized, setMinimized] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
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
      setMinimized(false);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setRendered(false);
    }, 220);
  }, [open]);

  useEffect(() => {
    if (!rendered) return undefined;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!sending && !minimized) void handleReply();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rendered, onClose, sending, minimized, replyText]);

  useEffect(() => {
    if (!open || !conversationId || minimized) return;
    void loadMessages();
  }, [open, conversationId, minimized]);

  useEffect(() => {
    if (!rendered || minimized) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, rendered, minimized]);

  useEffect(() => {
    if (!open || minimized) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 140);
    return () => clearTimeout(timer);
  }, [open, conversationId, minimized]);

  async function loadMessages(showToast = false) {
    try {
      if (!messages.length) setLoading(true);
      else setRefreshing(true);

      const res = await listWhatsAppConversationMessages(conversationId);
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.messages)
        ? res.messages.map(normalizeMessage).filter(Boolean)
        : [];

      list.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );

      setMessages(list);

      if (showToast) toast.success("Conversation refreshed");
    } catch (err) {
      console.error(err);
      if (!mountedRef.current) return;
      toast.error(err?.message || "Failed to load conversation");
      setMessages([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleReply() {
    const text = String(replyText || "").trim();

    if (!conversationId) {
      toast.error("Conversation not found");
      return;
    }

    if (!text) {
      toast.error("Reply message is required");
      return;
    }

    try {
      setSending(true);

      const res = await replyToWhatsAppConversation(conversationId, { text });

      const saved = res?.message
        ? normalizeMessage({
            id: res.message.id,
            direction: "OUTBOUND",
            type: "TEXT",
            textContent: text,
            mediaUrl: "",
            messageId: res.message.messageId || "",
            createdAt: res.message.createdAt || new Date().toISOString(),
            sentById: res.message.sentById || "",
          })
        : null;

      if (saved) {
        setMessages((prev) => [...prev, saved]);
      } else {
        await loadMessages();
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

    try {
      setStatusSaving(true);

      await updateWhatsAppConversationStatus(conversationId, { status: nextStatus });

      onConversationPatched?.({
        ...conversation,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      toast.success(nextStatus === "CLOSED" ? "Conversation closed" : "Conversation reopened");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update conversation");
    } finally {
      setStatusSaving(false);
    }
  }

  const stats = useMemo(() => {
    const total = messages.length;
    const inbound = messages.filter((m) => m.direction === "INBOUND").length;
    const outbound = messages.filter((m) => m.direction === "OUTBOUND").length;
    return { total, inbound, outbound };
  }, [messages]);

  if (!rendered || !conversation) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <div
        className={cx(
          "pointer-events-none absolute inset-0 transition duration-200",
          visible ? "bg-black/20 opacity-100" : "bg-black/0 opacity-0"
        )}
      />

      <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:right-4 sm:bottom-4">
        <div
          className={cx(
            "pointer-events-auto ml-auto w-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl transition-all duration-200",
            minimized
              ? "max-w-[380px] rounded-[22px]"
              : "max-w-[420px] rounded-[26px] sm:max-w-[430px]",
            visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          )}
        >
          <div className="bg-[var(--color-primary)] px-3 py-3 text-white">
            <div className="flex items-start gap-3">
              <CustomerAvatar conversation={conversation} />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {conversation.customer?.name || conversation.phone || "Unknown customer"}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-white/80">
                      {conversation.customer?.phone || conversation.phone || "—"}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMinimized((v) => !v)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/18"
                      aria-label={minimized ? "Expand chat" : "Minimize chat"}
                    >
                      <MinimizeIcon />
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/18"
                      aria-label="Close chat"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ProtectionPill tone={conversation.status === "OPEN" ? "success" : "warning"}>
                    {conversation.status === "OPEN" ? "Open" : "Closed"}
                  </ProtectionPill>

                  <ProtectionPill tone="info">{stats.total} messages</ProtectionPill>

                  {linkedDraft ? (
                    <ProtectionPill tone="process">
                      Draft #{String(linkedDraft.id).slice(-6).toUpperCase()}
                    </ProtectionPill>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {!minimized ? (
            <>
              <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5">
                <div className="flex flex-wrap gap-2">
                  <AsyncButton
                    type="button"
                    loading={refreshing}
                    loadingText="Refreshing..."
                    onClick={() => loadMessages(true)}
                    className={secondaryBtn()}
                  >
                    <span className={cx("mr-2 inline-flex", refreshing ? "animate-spin" : "")}>
                      <RefreshIcon />
                    </span>
                    Refresh
                  </AsyncButton>

                  <AsyncButton
                    type="button"
                    loading={statusSaving}
                    loadingText="Updating..."
                    onClick={() => handleStatusChange("OPEN")}
                    className={secondaryBtn()}
                    disabled={conversation.status === "OPEN"}
                  >
                    Reopen
                  </AsyncButton>

                  <AsyncButton
                    type="button"
                    loading={statusSaving}
                    loadingText="Updating..."
                    onClick={() => handleStatusChange("CLOSED")}
                    className={secondaryBtn()}
                    disabled={conversation.status === "CLOSED"}
                  >
                    Close
                  </AsyncButton>
                </div>
              </div>

              <div className="h-[330px] overflow-y-auto bg-[var(--color-bg)] px-3 py-3 sm:h-[360px]">
                {loading ? (
                  <MessageSkeleton />
                ) : messages.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    text="This conversation exists, but no messages were returned."
                  />
                ) : (
                  <div className="space-y-3">
                    {messages.map((item) => (
                      <MessageBubble key={item.id} item={item} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3">
                <div className={cx(softPanel(), "p-3")}>
                  <label className={cx("mb-2 block text-xs font-semibold", strongText())}>
                    Reply
                  </label>

                  <textarea
                    ref={textareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[88px] w-full resize-none rounded-[18px] border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-3 text-sm leading-6 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                  />

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className={cx("text-[11px] leading-5", mutedText())}>
                      Ctrl/Cmd + Enter to send
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

                      <AsyncButton
                        type="button"
                        loading={sending}
                        loadingText="Sending..."
                        onClick={handleReply}
                        className={primaryBtn()}
                      >
                        <span className="mr-2 inline-flex">
                          <SendIcon />
                        </span>
                        Send
                      </AsyncButton>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {linkedDraft ? (
                    <button
                      type="button"
                      onClick={() => nav("/app/whatsapp/drafts")}
                      className={secondaryBtn()}
                    >
                      Open draft
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => nav("/app/pos/sales")}
                    className={secondaryBtn()}
                  >
                    Sales
                  </button>

                  <button
                    type="button"
                    onClick={() => nav("/app/customers")}
                    className={secondaryBtn()}
                  >
                    Customers
                  </button>
                </div>

                <div className="mt-2 text-[11px] leading-5 text-[var(--color-text-muted)]">
                  Last activity: {formatDateTime(conversation.updatedAt || conversation.createdAt)}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}