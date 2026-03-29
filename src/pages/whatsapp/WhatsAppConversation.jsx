// src/pages/whatsapp/WhatsAppConversation.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  listWhatsAppConversations,
  listWhatsAppConversationMessages,
  replyToWhatsAppConversation,
  updateWhatsAppConversationStatus,
} from "../../services/whatsappInboxApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
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
  return "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "min-h-[110px] w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
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

function EmptyState({ text }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm",
        mutedText()
      )}
    >
      {text}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={cx("max-w-[80%] rounded-2xl border p-4", i % 2 ? "ml-auto" : "")}>
          <div className="h-4 w-40 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-2 h-3 w-52 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-2 h-3 w-28 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
        </div>
      ))}
    </div>
  );
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
    ? "ml-auto border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
    : "mr-auto border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

export default function WhatsAppConversation() {
  const { id } = useParams();
  const nav = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const mountedRef = useRef(true);
  const messagesBottomRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function loadConversation() {
    setLoadingConversation(true);

    try {
      const res = await listWhatsAppConversations();
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.conversations)
        ? res.conversations.map(normalizeConversation).filter(Boolean)
        : [];

      const found = list.find((item) => item.id === id) || null;
      setConversation(found);

      if (!found) {
        toast.error("Conversation not found");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load conversation");
      if (!mountedRef.current) return;
      setConversation(null);
    } finally {
      if (!mountedRef.current) return;
      setLoadingConversation(false);
    }
  }

  async function loadMessages({ silent = false } = {}) {
    if (!silent) setLoadingMessages(true);
    setRefreshing(true);

    try {
      const res = await listWhatsAppConversationMessages(id);
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
      toast.error(err?.message || "Failed to load messages");
      if (!mountedRef.current) return;
      setMessages([]);
    } finally {
      if (!mountedRef.current) return;
      setLoadingMessages(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadConversation();
    loadMessages();
  }, [id]);

  const stats = useMemo(() => {
    const inbound = messages.filter((m) => m.direction === "INBOUND").length;
    const outbound = messages.filter((m) => m.direction === "OUTBOUND").length;
    return { inbound, outbound, total: messages.length };
  }, [messages]);

  async function handleReply() {
    const text = String(replyText || "").trim();
    if (!text) {
      toast.error("Reply message is required");
      return;
    }

    setSending(true);

    try {
      const res = await replyToWhatsAppConversation(id, { text });
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
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    setStatusSaving(true);

    try {
      await updateWhatsAppConversationStatus(id, { status: nextStatus });
      setConversation((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      toast.success(
        nextStatus === "CLOSED" ? "Conversation closed" : "Conversation reopened"
      );
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                WhatsApp
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Conversation
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Read inbound messages, reply as staff, and manage the thread status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => nav("/app/whatsapp/inbox")} className={secondaryBtn()}>
                Back to inbox
              </button>
              <button onClick={() => nav("/app/whatsapp/drafts")} className={secondaryBtn()}>
                Drafts
              </button>
              <button onClick={() => loadMessages()} className={primaryBtn()} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-4">
          <div className={cx(shell(), "p-4")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Phone
            </div>
            <div className={cx("mt-2 text-lg font-semibold", strongText())}>
              {loadingConversation ? "…" : conversation?.phone || "—"}
            </div>
          </div>

          <div className={cx(shell(), "p-4")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Customer
            </div>
            <div className={cx("mt-2 text-lg font-semibold", strongText())}>
              {loadingConversation ? "…" : conversation?.customer?.name || "Unknown"}
            </div>
          </div>

          <div className={cx(shell(), "p-4")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Status
            </div>
            <div className="mt-2">
              {loadingConversation
                ? "…"
                : statusPill(
                    conversation?.status === "OPEN" ? "success" : "warning",
                    conversation?.status || "—"
                  )}
            </div>
          </div>

          <div className={cx(shell(), "p-4")}>
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Messages
            </div>
            <div className={cx("mt-2 text-lg font-semibold", strongText())}>
              {loadingMessages ? "…" : stats.total}
            </div>
            <div className={cx("mt-1 text-sm", mutedText())}>
              {stats.inbound} inbound • {stats.outbound} outbound
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr,360px]">
        <section className={cx(shell(), "p-4 sm:p-5")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Thread</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Full WhatsApp conversation history for this customer.
              </p>
            </div>
          </div>

          <div className="mt-5 min-h-[420px] rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
            {loadingMessages ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <EmptyState text="No messages found for this conversation." />
            ) : (
              <div className="space-y-4">
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className={cx(
                      "max-w-[85%] rounded-2xl border p-4",
                      messageBubbleClass(item.direction)
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                        {item.direction === "OUTBOUND" ? "Staff / Store" : "Customer"}
                      </div>
                      <div className="text-xs">{statusPill("neutral", item.type)}</div>
                    </div>

                    <div className={cx("mt-2 whitespace-pre-wrap text-sm leading-6", strongText())}>
                      {item.textContent || "No text content"}
                    </div>

                    {item.mediaUrl ? (
                      <div className={cx("mt-2 break-all text-xs", mutedText())}>{item.mediaUrl}</div>
                    ) : null}

                    <div className={cx("mt-3 text-xs", softText())}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                    </div>
                  </div>
                ))}
                <div ref={messagesBottomRef} />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <section className={cx(shell(), "p-5")}>
            <h2 className={cx("text-lg font-semibold", strongText())}>Reply</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Send a manual WhatsApp response from Storvex staff.
            </p>

            <div className="mt-4">
              <textarea
                className={textareaClass()}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={handleReply} className={primaryBtn()} disabled={sending}>
                {sending ? "Sending..." : "Send reply"}
              </button>
              <button onClick={() => setReplyText("")} className={secondaryBtn()} disabled={sending}>
                Clear
              </button>
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <h2 className={cx("text-lg font-semibold", strongText())}>Conversation status</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Mark the thread open or closed without leaving this page.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusChange("OPEN")}
                className={cx(
                  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition disabled:opacity-60",
                  conversation?.status === "OPEN"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : secondaryBtn()
                )}
                disabled={statusSaving}
              >
                Reopen
              </button>

              <button
                onClick={() => handleStatusChange("CLOSED")}
                className={cx(
                  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition disabled:opacity-60",
                  conversation?.status === "CLOSED"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : secondaryBtn()
                )}
                disabled={statusSaving}
              >
                Close
              </button>
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <h2 className={cx("text-lg font-semibold", strongText())}>Quick actions</h2>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Jump directly into related sales work.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => nav("/app/whatsapp/drafts")} className={secondaryBtn()}>
                Open WhatsApp drafts
              </button>
              <button onClick={() => nav("/app/pos/sales")} className={secondaryBtn()}>
                Open sales list
              </button>
              <button onClick={() => nav("/app/customers")} className={secondaryBtn()}>
                Open customers
              </button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}