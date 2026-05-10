import { useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { searchProducts } from "../../services/inventoryApi";
import {
  assignWhatsAppConversationOwner,
  clearWhatsAppConversationOwner,
  createWhatsAppAccount,
  createWhatsAppBroadcast,
  createWhatsAppPromotion,
  createWhatsAppSaleDraft,
  deleteWhatsAppPromotion,
  finalizeWhatsAppSaleDraft,
  listAssignableWhatsAppStaff,
  listWhatsAppAccounts,
  listWhatsAppBroadcasts,
  listWhatsAppConversationMessages,
  listWhatsAppConversations,
  listWhatsAppPromotions,
  listWhatsAppSaleDrafts,
  markWhatsAppConversationRead,
  queueWhatsAppBroadcast,
  replyToWhatsAppConversation,
  sendWhatsAppBroadcastNow,
  setWhatsAppAccountActive,
  updateWhatsAppAccount,
  updateWhatsAppConversationStatus,
  updateWhatsAppPromotion,
} from "../../services/whatsappApi";

const WHATSAPP_WORKSPACE_ROLES = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "SELLER",
  "STOREKEEPER",
  "TECHNICIAN",
];

const WHATSAPP_MANAGER_ROLES = ["OWNER", "MANAGER"];

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function getCurrentUserRole() {
  try {
    const token = localStorage.getItem("tenantToken") || localStorage.getItem("token");
    if (!token) return "";

    const decoded = jwtDecode(token);
    const role = decoded?.role || decoded?.roles?.[0] || "";

    return normalizeRole(role);
  } catch {
    return "";
  }
}

function canManageWhatsAppTools(role) {
  return WHATSAPP_MANAGER_ROLES.includes(normalizeRole(role));
}

function canUseWhatsAppInbox(role) {
  return WHATSAPP_WORKSPACE_ROLES.includes(normalizeRole(role));
}

function money(value) {
  const n = Number(value || 0);
  return `${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-US")} RWF`;
}

function initials(value) {
  const text = String(value || "").trim();
  if (!text) return "WA";

  return (
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "WA"
  );
}

function cleanPhone(value) {
  return String(value || "").trim() || "No phone";
}

function trimString(value) {
  return String(value || "").trim();
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDay(value) {
  if (!value) return "Today";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function customerName(conversation) {
  return (
    conversation?.customer?.name ||
    conversation?.phone ||
    conversation?.assignedTo?.name ||
    "WhatsApp customer"
  );
}

function latestPreview(conversation) {
  const msg = conversation?.latestMessage;
  if (!msg) return "No messages yet";

  const prefix = msg.direction === "OUTBOUND" ? "You: " : "";
  return `${prefix}${msg.textContent || "Message"}`;
}

function unreadCount(conversation, active) {
  if (active) return 0;

  const explicit =
    conversation?.unreadCount ??
    conversation?.unreadMessages ??
    conversation?.unreadMessageCount ??
    conversation?.unseenCount ??
    null;

  if (explicit !== null && explicit !== undefined) {
    const n = Number(explicit);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }

  return 0;
}

function markConversationOpened(conversation) {
  if (!conversation) return conversation;

  return {
    ...conversation,
    unreadCount: 0,
    unreadMessages: 0,
    unreadMessageCount: 0,
    unseenCount: 0,
  };
}

function normalizeProductList(data) {
  const raw =
    data?.products ||
    data?.data?.products ||
    data?.data ||
    data?.items ||
    data ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item) => ({
    id: String(item.id || ""),
    name: String(item.name || "Product"),
    sku: String(item.sku || ""),
    serial: String(item.serial || ""),
    sellPrice: Number(item.sellPrice || item.price || 0),
    stockQty: Number(item.stockQty || item.availableQty || item.branchQty || 0),
  }));
}

function toneForStatus(status) {
  const value = String(status || "").toUpperCase();

  if (value === "OPEN") {
    return "bg-[var(--color-primary-soft)] text-[var(--color-primary)]";
  }

  if (value === "CLOSED") {
    return "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";
  }

  if (value === "SENT" || value === "PAID" || value === "ACTIVE" || value === "READY") {
    return "bg-[var(--color-primary-soft)] text-[var(--color-primary)]";
  }

  if (value === "PARTIAL" || value === "QUEUED" || value === "DRAFT") {
    return "bg-amber-500/10 text-amber-600";
  }

  if (value === "FAILED" || value === "OVERDUE" || value === "MISSING") {
    return "bg-red-500/10 text-red-600";
  }

  return "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black",
        className,
      )}
    >
      {children}
    </span>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
    >
      {children}
    </button>
  );
}

function EmptyState({ title, body, icon = "💬" }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-[32px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-2xl">
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-black text-[var(--color-text)]">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
          {body}
        </p>
      </div>
    </div>
  );
}

function ChatMessagesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="mx-auto h-7 w-28 animate-pulse rounded-full bg-[var(--color-card)]" />

      <div className="flex justify-start">
        <div className="w-[78%] max-w-md rounded-[26px] rounded-bl-md bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]">
          <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
          <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[var(--color-surface-2)]" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-[72%] max-w-sm rounded-[26px] rounded-br-md bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]">
          <div className="h-3 w-full animate-pulse rounded-full bg-[var(--color-surface-2)]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
        </div>
      </div>

      <div className="flex justify-start">
        <div className="w-[64%] max-w-sm rounded-[26px] rounded-bl-md bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]">
          <div className="h-3 w-full animate-pulse rounded-full bg-[var(--color-surface-2)]" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
          {subtitle}
        </p>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ConversationRow({ conversation, active, draft, onClick }) {
  const name = customerName(conversation);
  const count = unreadCount(conversation, active);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group w-full rounded-[24px] p-3 text-left transition",
        active
          ? "bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary-ring)]"
          : "hover:bg-[var(--color-surface-2)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-[var(--shadow-soft)]",
            active
              ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
              : "bg-[var(--color-surface-2)] text-[var(--color-text)]",
          )}
        >
          {initials(name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-[var(--color-text)]">
                {name}
              </div>

              <div
                className={cx(
                  "mt-0.5 truncate text-xs",
                  count > 0
                    ? "font-black text-[var(--color-text)]"
                    : "font-semibold text-[var(--color-text-muted)]",
                )}
              >
                {latestPreview(conversation)}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className={cx(
                  "text-[11px]",
                  count > 0
                    ? "font-black text-[var(--color-primary)]"
                    : "font-bold text-[var(--color-text-muted)]",
                )}
              >
                {formatTime(conversation.updatedAt)}
              </div>

              {count > 0 ? (
                <div className="ml-auto mt-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-black text-[var(--color-primary-contrast)]">
                  {count > 99 ? "99+" : count}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill className={toneForStatus(conversation.status)}>
              {conversation.status}
            </Pill>

            {conversation.branchId ? (
              <Pill className="bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                Branch set
              </Pill>
            ) : (
              <Pill className="bg-amber-500/10 text-amber-600">
                Needs branch
              </Pill>
            )}

            {conversation.assignedTo?.name ? (
              <Pill className="bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                {conversation.assignedTo.name}
              </Pill>
            ) : null}

            {draft ? (
              <Pill className="bg-amber-500/10 text-amber-600">Draft sale</Pill>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }) {
  const outbound = message.direction === "OUTBOUND";

  return (
    <div className={cx("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[82%] rounded-[26px] px-4 py-3 shadow-[var(--shadow-soft)]",
          outbound
            ? "rounded-br-md bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
            : "rounded-bl-md bg-[var(--color-card)] text-[var(--color-text)]",
        )}
      >
        <div className="whitespace-pre-wrap text-sm font-semibold leading-6">
          {message.textContent || "Message"}
        </div>
        <div
          className={cx(
            "mt-2 text-right text-[10px] font-bold",
            outbound
              ? "text-[var(--color-primary-contrast)]/75"
              : "text-[var(--color-text-muted)]",
          )}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function DraftSummaryCard({ draft, onFinalize, finalizing = false }) {
  if (!draft) {
    return (
      <div className="rounded-[26px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
        <div className="text-sm font-black text-[var(--color-text)]">
          No linked draft sale
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
          Create a draft only after the customer asks to buy. Stock, drawer, receipt,
          and audit flow stay branch-aware.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-amber-400/30 bg-amber-500/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Pill className="bg-amber-500/15 text-amber-700">Draft pending</Pill>
          <div className="mt-3 text-2xl font-black text-[var(--color-text)]">
            {money(draft.total)}
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
            {draft.items.length} item{draft.items.length === 1 ? "" : "s"} •{" "}
            {draft.saleType} sale
          </div>
        </div>
      </div>

      {draft.items.length ? (
        <div className="mt-4 space-y-2">
          {draft.items.slice(0, 3).map((item) => (
            <div
              key={item.id || item.productId}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-card)] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-[var(--color-text)]">
                  {item.product?.name || "Product"}
                </div>
                <div className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                  Qty {item.quantity}
                </div>
              </div>
              <div className="shrink-0 text-xs font-black text-[var(--color-text)]">
                {money(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <AsyncButton
        onClick={onFinalize}
        loading={finalizing}
        className="mt-4 w-full"
        loadingText="Finalizing..."
      >
        Finalize sale
      </AsyncButton>
    </div>
  );
}

function DraftCard({ draft, conversation, onOpenConversation, onFinalize, finalizing }) {
  return (
    <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Pill className={toneForStatus(draft.status || "DRAFT")}>
              {draft.status || "DRAFT"}
            </Pill>
            <Pill
              className={
                draft.branchId
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "bg-amber-500/10 text-amber-600"
              }
            >
              {draft.branchId ? "Branch ready" : "Needs branch"}
            </Pill>
            <Pill className="bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
              {draft.saleType || "CREDIT"}
            </Pill>
          </div>

          <h3 className="mt-4 truncate text-lg font-black text-[var(--color-text)]">
            {draft.customer?.name || draft.conversation?.phone || "WhatsApp customer"}
          </h3>

          <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
            {cleanPhone(draft.customer?.phone || draft.conversation?.phone)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-2xl font-black text-[var(--color-text)]">
            {money(draft.total)}
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
            {draft.items.length} item{draft.items.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {draft.items.length ? (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {draft.items.slice(0, 4).map((item) => (
            <div
              key={item.id || item.productId}
              className="rounded-[20px] bg-[var(--color-surface-2)] p-3"
            >
              <div className="truncate text-sm font-black text-[var(--color-text)]">
                {item.product?.name || "Product"}
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Qty {item.quantity} • {money(item.price)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <AsyncButton
          onClick={() => onFinalize(draft)}
          loading={finalizing === draft.id}
          loadingText="Finalizing..."
        >
          Finalize sale
        </AsyncButton>

        {conversation ? (
          <button
            type="button"
            onClick={() => onOpenConversation(conversation)}
            className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
          >
            Open conversation
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DraftsWorkspace({
  drafts,
  conversations,
  onOpenConversation,
  onFinalize,
  finalizingDraftId,
}) {
  const totalValue = drafts.reduce((sum, draft) => sum + Number(draft.total || 0), 0);
  const needsBranch = drafts.filter((draft) => !draft.branchId).length;
  const creditDrafts = drafts.filter((draft) => draft.saleType === "CREDIT").length;

  return (
    <div>
      <SectionHeader
        eyebrow="WhatsApp orders"
        title="Draft sales waiting for action"
        subtitle="These are customer orders prepared from WhatsApp conversations. Finalizing still respects branch stock, drawer, payment, receipt, and audit control."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          ["Draft orders", drafts.length],
          ["Draft value", money(totalValue)],
          ["Needs branch", needsBranch],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {label}
            </div>
            <div className="mt-2 text-xl font-black text-[var(--color-text)]">
              {value}
            </div>
          </div>
        ))}
      </div>

      {drafts.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {drafts.map((draft) => {
            const conversation =
              conversations.find((item) => item.id === draft.conversationId) ||
              conversations.find(
                (item) =>
                  item.customerId &&
                  draft.customerId &&
                  item.customerId === draft.customerId,
              ) ||
              null;

            return (
              <DraftCard
                key={draft.id}
                draft={draft}
                conversation={conversation}
                onOpenConversation={onOpenConversation}
                onFinalize={onFinalize}
                finalizing={finalizingDraftId}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No WhatsApp draft sales"
          body="When a customer asks to buy through WhatsApp, staff can create a draft sale and finalize it from here."
        />
      )}

      {creditDrafts > 0 ? (
        <div className="mt-4 rounded-[28px] border border-amber-400/20 bg-amber-500/10 p-5">
          <div className="text-sm font-black text-[var(--color-text)]">
            Credit attention
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
            {creditDrafts} WhatsApp draft sale{creditDrafts === 1 ? "" : "s"} use
            credit terms. Confirm customer identity, deposit, and due date before
            finalizing.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PromotionForm({ editingPromotion, onCancel, onSaved }) {
  const [title, setTitle] = useState(editingPromotion?.title || "");
  const [message, setMessage] = useState(editingPromotion?.message || "");
  const [productId, setProductId] = useState(editingPromotion?.productId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(editingPromotion?.title || "");
    setMessage(editingPromotion?.message || "");
    setProductId(editingPromotion?.productId || "");
  }, [editingPromotion]);

  async function submit(event) {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Promotion title is required");
      return;
    }

    if (!message.trim()) {
      toast.error("Promotion message is required");
      return;
    }

    setSaving(true);

    try {
      if (editingPromotion?.id) {
        await updateWhatsAppPromotion(editingPromotion.id, {
          title: title.trim(),
          message: message.trim(),
          productId: productId.trim() || null,
        });

        toast.success("Promotion updated");
      } else {
        await createWhatsAppPromotion({
          title: title.trim(),
          message: message.trim(),
          productId: productId.trim() || null,
        });

        toast.success("Promotion created");
      }

      onSaved?.();
      onCancel?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Promotion save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black text-[var(--color-text)]">
            {editingPromotion?.id ? "Edit promotion" : "Create promotion"}
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
            Promotion is the offer content. Broadcast is how you send it.
          </p>
        </div>

        {editingPromotion ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-[var(--color-surface-2)] px-3 py-2 text-xs font-black text-[var(--color-text)]"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Weekend phone offer"
          className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        />

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell customers what the offer is..."
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        />

        <input
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          placeholder="Optional product ID"
          className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        />

        <AsyncButton type="submit" loading={saving} loadingText="Saving..." className="w-full">
          {editingPromotion?.id ? "Save promotion" : "Create promotion"}
        </AsyncButton>
      </div>
    </form>
  );
}

function BroadcastForm({ promotions, accounts, onSaved }) {
  const [promotionId, setPromotionId] = useState("");
  const [templateName, setTemplateName] = useState("promo_template");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [targetMode, setTargetMode] = useState("ALL_OPTED_IN");
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    setSaving(true);

    try {
      await createWhatsAppBroadcast({
        accountId: accounts[0]?.id || undefined,
        promotionId: promotionId || undefined,
        templateName: templateName.trim(),
        languageCode: languageCode.trim() || "en_US",
        targeting: {
          mode: targetMode,
          branchId: trimString(branchId) || null,
          productId: trimString(productId) || null,
          customerIds: [],
        },
      });

      toast.success("Broadcast draft created");
      setPromotionId("");
      setTemplateName("promo_template");
      setLanguageCode("en_US");
      setTargetMode("ALL_OPTED_IN");
      setBranchId("");
      setProductId("");
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Broadcast create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="text-sm font-black text-[var(--color-text)]">Create broadcast</div>
      <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
        Choose promotion content, WhatsApp template, and internal customer targeting.
      </p>

      <div className="mt-4 space-y-3">
        <select
          value={promotionId}
          onChange={(event) => setPromotionId(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-black text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        >
          <option value="">No promotion selected</option>
          {promotions.map((promotion) => (
            <option key={promotion.id} value={promotion.id}>
              {promotion.title}
            </option>
          ))}
        </select>

        <input
          value={templateName}
          onChange={(event) => setTemplateName(event.target.value)}
          placeholder="WhatsApp template name"
          className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        />

        <input
          value={languageCode}
          onChange={(event) => setLanguageCode(event.target.value)}
          placeholder="en_US"
          className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        />

        <select
          value={targetMode}
          onChange={(event) => setTargetMode(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-black text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
        >
          <option value="ALL_OPTED_IN">All opted-in customers</option>
          <option value="BRANCH_CUSTOMERS">Branch customers</option>
          <option value="CREDIT_CUSTOMERS">Credit customers</option>
          <option value="OVERDUE_CREDIT_CUSTOMERS">Overdue credit customers</option>
          <option value="PRODUCT_BUYERS">Product buyers</option>
        </select>

        {targetMode === "BRANCH_CUSTOMERS" ? (
          <input
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            placeholder="Branch ID"
            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
          />
        ) : null}

        {targetMode === "PRODUCT_BUYERS" ? (
          <input
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Product ID"
            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
          />
        ) : null}

        <AsyncButton type="submit" loading={saving} loadingText="Creating..." className="w-full">
          Create broadcast
        </AsyncButton>
      </div>
    </form>
  );
}

function BroadcastsWorkspace({ accounts, promotions, broadcasts, onRefresh }) {
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [busyBroadcastId, setBusyBroadcastId] = useState("");
  const [busyPromotionId, setBusyPromotionId] = useState("");

  async function queueBroadcast(id) {
    setBusyBroadcastId(id);

    try {
      await queueWhatsAppBroadcast(id);
      toast.success("Broadcast queued");
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Queue failed");
    } finally {
      setBusyBroadcastId("");
    }
  }

  async function sendBroadcast(id) {
    setBusyBroadcastId(id);

    try {
      const result = await sendWhatsAppBroadcastNow(id, {
        limit: 50,
        targeting: {
          mode: "ALL_OPTED_IN",
        },
      });

      toast.success(result.summary?.delivered ? "Broadcast sent" : "Broadcast attempted");
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Send failed");
    } finally {
      setBusyBroadcastId("");
    }
  }

  async function removePromotion(promotion) {
    if (!promotion?.id) return;

    setBusyPromotionId(promotion.id);

    try {
      await deleteWhatsAppPromotion(promotion.id);
      toast.success("Promotion deleted");
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Delete failed");
    } finally {
      setBusyPromotionId("");
    }
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Growth"
        title="Broadcasts and promotions"
        subtitle="Promotions define the offer. Broadcasts send that offer through the store WhatsApp number to the right customer segment."
      />

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <PromotionForm
            editingPromotion={editingPromotion}
            onCancel={() => setEditingPromotion(null)}
            onSaved={onRefresh}
          />

          <BroadcastForm promotions={promotions} accounts={accounts} onSaved={onRefresh} />
        </div>

        <div className="space-y-4">
          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-black text-[var(--color-text)]">Promotions</div>
                <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  Offer content ready to attach to broadcasts.
                </p>
              </div>
              <Pill className="bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                {promotions.length}
              </Pill>
            </div>

            {promotions.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {promotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="rounded-[24px] bg-[var(--color-surface-2)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[var(--color-text)]">
                          {promotion.title}
                        </div>
                        <div className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
                          {promotion.message}
                        </div>
                      </div>
                      <Pill className={toneForStatus(promotion.status)}>
                        {promotion.status}
                      </Pill>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPromotion(promotion)}
                        disabled={!promotion.canEdit}
                        className="h-10 rounded-2xl bg-[var(--color-card)] px-3 text-xs font-black text-[var(--color-text)] disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removePromotion(promotion)}
                        disabled={!promotion.canDelete || busyPromotionId === promotion.id}
                        className="h-10 rounded-2xl bg-red-500/10 px-3 text-xs font-black text-red-600 disabled:opacity-50"
                      >
                        {busyPromotionId === promotion.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No promotions yet"
                body="Create a promotion first, then attach it to a WhatsApp broadcast."
              />
            )}
          </div>

          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-black text-[var(--color-text)]">Broadcasts</div>
                <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  Campaign drafts, queued messages, and sent history.
                </p>
              </div>
              <Pill className="bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                {broadcasts.length}
              </Pill>
            </div>

            {broadcasts.length ? (
              <div className="space-y-3">
                {broadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Pill className={toneForStatus(broadcast.status)}>
                            {broadcast.status}
                          </Pill>
                          <Pill className="bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                            {broadcast.languageCode}
                          </Pill>
                        </div>

                        <div className="mt-3 text-sm font-black text-[var(--color-text)]">
                          {broadcast.templateName}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                          {broadcast.promotion?.title || "No promotion linked"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-right">
                        <div className="rounded-2xl bg-[var(--color-card)] p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                            Recipients
                          </div>
                          <div className="mt-1 text-lg font-black text-[var(--color-text)]">
                            {broadcast.recipientCount}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[var(--color-card)] p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                            Delivered
                          </div>
                          <div className="mt-1 text-lg font-black text-[var(--color-text)]">
                            {broadcast.deliveredCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <AsyncButton
                        onClick={() => queueBroadcast(broadcast.id)}
                        loading={busyBroadcastId === broadcast.id}
                        loadingText="Working..."
                        variant="secondary"
                      >
                        Queue
                      </AsyncButton>
                      <AsyncButton
                        onClick={() => sendBroadcast(broadcast.id)}
                        loading={busyBroadcastId === broadcast.id}
                        loadingText="Sending..."
                      >
                        Send now
                      </AsyncButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No broadcasts yet"
                body="Create a broadcast draft, attach a promotion, choose targeting, then queue or send."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupWorkspace({ accounts, onRefresh }) {
  const account = accounts[0] || null;

  const [businessName, setBusinessName] = useState(account?.businessName || "");
  const [phoneNumber, setPhoneNumber] = useState(account?.phoneNumber || "");
  const [phoneNumberId, setPhoneNumberId] = useState(account?.phoneNumberId || "");
  const [wabaId, setWabaId] = useState(account?.wabaId || "");
  const [accessToken, setAccessToken] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setBusinessName(account?.businessName || "");
    setPhoneNumber(account?.phoneNumber || "");
    setPhoneNumberId(account?.phoneNumberId || "");
    setWabaId(account?.wabaId || "");
    setAccessToken("");
    setWebhookVerifyToken("");
    setAppSecret("");
  }, [account?.id]);

  async function save(event) {
    event.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error("Store WhatsApp number is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        businessName: businessName.trim(),
        phoneNumber: phoneNumber.trim(),
        phoneNumberId: phoneNumberId.trim() || null,
        wabaId: wabaId.trim() || null,
        ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        ...(webhookVerifyToken.trim() ? { webhookVerifyToken: webhookVerifyToken.trim() } : {}),
        ...(appSecret.trim() ? { appSecret: appSecret.trim() } : {}),
      };

      if (account?.id) {
        await updateWhatsAppAccount(account.id, payload);
        toast.success("WhatsApp connection updated");
      } else {
        await createWhatsAppAccount(payload);
        toast.success("WhatsApp connection saved");
      }

      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "WhatsApp setup failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!account?.id) return;

    setToggling(true);

    try {
      await setWhatsAppAccountActive(account.id, !account.isActive);
      toast.success(account.isActive ? "WhatsApp paused" : "WhatsApp activated");
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Status update failed");
    } finally {
      setToggling(false);
    }
  }

  const checks = account?.setupStatus?.checks || {};
  const readyCount = [
    checks.hasPhone,
    checks.hasPhoneNumberId,
    checks.hasWabaId,
    checks.hasAccessToken,
    checks.hasWebhookVerifyToken,
    checks.hasAppSecret,
  ].filter(Boolean).length;

  const isConnected = Boolean(account?.setupStatus?.isReady || readyCount >= 5);
  const isActive = Boolean(account?.isActive);

  return (
    <div>
      <SectionHeader
        eyebrow="Connection"
        title="WhatsApp setup"
        subtitle="Connect one store WhatsApp number. Customers message one number; Storvex handles branches, sales, stock, drawer, receipts, and audit records internally."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
            <div className="border-b border-[var(--color-border)] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill
                      className={
                        isConnected
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "bg-amber-500/10 text-amber-600"
                      }
                    >
                      {isConnected ? "Connection ready" : "Connection not complete"}
                    </Pill>

                    <Pill
                      className={
                        isActive
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                      }
                    >
                      {isActive ? "Active" : "Paused"}
                    </Pill>
                  </div>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-[var(--color-text)]">
                    Store WhatsApp number
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
                    This is the number customers will message. They do not need to know branches.
                    Your team handles branch choice and sale control inside Storvex.
                  </p>
                </div>

                {account?.id ? (
                  <AsyncButton
                    type="button"
                    onClick={toggleActive}
                    loading={toggling}
                    loadingText="Updating..."
                    variant={isActive ? "secondary" : "primary"}
                  >
                    {isActive ? "Pause WhatsApp" : "Activate WhatsApp"}
                  </AsyncButton>
                ) : null}
              </div>
            </div>

            <form onSubmit={save} className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Business name shown to customers
                  </label>
                  <input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                    placeholder="Kigali Tech Store"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Store WhatsApp number
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                    placeholder="2507XXXXXXXX"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-black text-[var(--color-text)]">
                      Recommended setup
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
                      Soon, the owner will click one button, log in with Meta, choose the business
                      WhatsApp number, approve permission, and return to Storvex connected.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="h-12 shrink-0 cursor-not-allowed rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 text-sm font-black text-[var(--color-text-muted)] opacity-80"
                  >
                    Connect with Meta — Coming soon
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((value) => !value)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <div className="text-sm font-black text-[var(--color-text)]">
                      Admin-assisted setup
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
                      Use this only when a technical admin or Storvex support is connecting the store manually.
                    </p>
                  </div>

                  <span className="rounded-2xl bg-[var(--color-card)] px-3 py-2 text-xs font-black text-[var(--color-text)]">
                    {advancedOpen ? "Hide" : "Open"}
                  </span>
                </button>

                {advancedOpen ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        Meta phone connection
                      </label>
                      <input
                        value={phoneNumberId}
                        onChange={(event) => setPhoneNumberId(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                        placeholder="Provided by Meta"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        Meta business connection
                      </label>
                      <input
                        value={wabaId}
                        onChange={(event) => setWabaId(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                        placeholder="Provided by Meta"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        Message sending permission
                      </label>
                      <input
                        value={accessToken}
                        onChange={(event) => setAccessToken(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                        placeholder={
                          account?.hasAccessToken
                            ? "Already saved. Enter only if replacing."
                            : "Paste admin connection key"
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        Webhook verification
                      </label>
                      <input
                        value={webhookVerifyToken}
                        onChange={(event) => setWebhookVerifyToken(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                        placeholder={
                          account?.webhookVerifyToken
                            ? "Already saved. Enter only if replacing."
                            : "Can be generated by Storvex admin"
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        Security verification
                      </label>
                      <input
                        value={appSecret}
                        onChange={(event) => setAppSecret(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                        placeholder={
                          account?.appSecret
                            ? "Already saved. Enter only if replacing."
                            : "Provided by Meta app setup"
                        }
                      />
                    </div>

                    <div className="rounded-[24px] bg-amber-500/10 p-4 md:col-span-2">
                      <div className="text-sm font-black text-[var(--color-text)]">
                        Owner note
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
                        A normal store owner should not fill these fields. They are only here until
                        the one-click Meta connection is implemented.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <AsyncButton type="submit" loading={saving} loadingText="Saving...">
                  Save WhatsApp connection
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-black text-[var(--color-text)]">
                  Readiness checklist
                </div>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
                  {readyCount}/6 connection checks are ready.
                </p>
              </div>

              <Pill
                className={
                  isConnected
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "bg-amber-500/10 text-amber-600"
                }
              >
                {isConnected ? "Ready" : "Needs setup"}
              </Pill>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Store WhatsApp number", checks.hasPhone],
                ["Meta phone connection", checks.hasPhoneNumberId],
                ["Meta business connection", checks.hasWabaId],
                ["Message sending permission", checks.hasAccessToken],
                ["Webhook verification", checks.hasWebhookVerifyToken],
                ["Security verification", checks.hasAppSecret],
              ].map(([label, ok]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-surface-2)] px-4 py-3"
                >
                  <div className="text-sm font-black text-[var(--color-text)]">{label}</div>
                  <Pill
                    className={
                      ok
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "bg-red-500/10 text-red-600"
                    }
                  >
                    {ok ? "Ready" : "Missing"}
                  </Pill>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="text-lg font-black text-[var(--color-text)]">
              How WhatsApp works in Storvex
            </div>

            <div className="mt-5 space-y-4">
              {[
                [
                  "1",
                  "Customer messages the store",
                  "The customer sends a message to the store WhatsApp number.",
                ],
                [
                  "2",
                  "Storvex creates the conversation",
                  "The customer, message, and conversation are saved under the correct store.",
                ],
                [
                  "3",
                  "Staff replies or prepares a sale",
                  "Staff can reply, assign the conversation, create a draft sale, and finalize it.",
                ],
                [
                  "4",
                  "Branch truth stays internal",
                  "The customer sees one number. Storvex keeps branch stock, drawer, receipt, and audit records clean.",
                ],
              ].map(([step, title, body]) => (
                <div key={step} className="flex gap-3 rounded-[24px] bg-[var(--color-surface-2)] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-contrast)]">
                    {step}
                  </div>
                  <div>
                    <div className="text-sm font-black text-[var(--color-text)]">{title}</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="text-lg font-black text-[var(--color-text)]">
              One-number rule
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
              Customers do not need to choose a branch. They message one store number.
              Storvex handles the correct branch internally when a sale is prepared or finalized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateDraftModal({ open, conversation, onClose, onCreated }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [saleType, setSaleType] = useState("CREDIT");
  const [amountPaid, setAmountPaid] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setProducts([]);
      setSearching(false);
      setItems([]);
      setSaleType("CREDIT");
      setAmountPaid("");
      setDueDate("");
    }
  }, [open]);

  if (!open) return null;

  async function runSearch(event) {
    event?.preventDefault?.();

    const clean = query.trim();
    if (!clean) {
      toast.error("Search product first");
      return;
    }

    setSearching(true);

    try {
      const data = await searchProducts({
        q: clean,
        limit: 12,
      });

      setProducts(normalizeProductList(data));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Product search failed");
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.sellPrice,
          stockQty: product.stockQty,
        },
      ];
    });
  }

  function updateQty(productId, nextQty) {
    const qty = Math.max(1, Number(nextQty || 1));

    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item,
      ),
    );
  }

  function removeItem(productId) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  async function submit() {
    if (!conversation?.id) return;

    if (!items.length) {
      toast.error("Add at least one product");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        branchId: conversation.branchId || undefined,
        customerId: conversation.customerId || undefined,
        customer: conversation.customer
          ? undefined
          : {
              name: conversation.phone,
              phone: conversation.phone,
            },
        saleType,
        dueDate: saleType === "CREDIT" && dueDate ? dueDate : null,
        amountPaid: Number(amountPaid || 0),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const result = await createWhatsAppSaleDraft(conversation.id, payload);

      toast.success("WhatsApp draft sale created");
      onCreated?.(result.draft);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create draft");
    } finally {
      setSaving(false);
    }
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
              WhatsApp sale draft
            </div>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-text)]">
              Prepare customer order
            </h2>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
              Customer sees one WhatsApp number. Storvex keeps branch stock, drawer,
              and audit control internally.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[var(--color-surface-2)] px-4 py-2 text-sm font-black text-[var(--color-text)]"
          >
            Close
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-110px)] gap-4 overflow-y-auto p-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <form onSubmit={runSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, SKU, model, barcode..."
                className="h-12 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
              />
              <AsyncButton type="submit" loading={searching} loadingText="Searching...">
                Search
              </AsyncButton>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                >
                  <div className="text-sm font-black text-[var(--color-text)]">
                    {product.name}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {product.sku ? `SKU ${product.sku} • ` : ""}Stock {product.stockQty}
                  </div>
                  <div className="mt-3 text-lg font-black text-[var(--color-primary)]">
                    {money(product.sellPrice)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="text-sm font-black text-[var(--color-text)]">Draft summary</div>

            <div className="mt-4 space-y-3">
              {items.length ? (
                items.map((item) => (
                  <div key={item.productId} className="rounded-[22px] bg-[var(--color-surface-2)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[var(--color-text)]">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
                          {money(item.unitPrice)} each
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-xs font-black text-red-500"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--color-text-muted)]">
                        Qty
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => updateQty(item.productId, event.target.value)}
                        className="h-10 w-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm font-black text-[var(--color-text)] outline-none"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[var(--color-border)] p-5 text-sm font-semibold text-[var(--color-text-muted)]">
                  No product added yet.
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {["CREDIT", "CASH"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSaleType(type)}
                  className={cx(
                    "h-11 rounded-2xl text-sm font-black transition",
                    saleType === type
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text)]",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {saleType === "CREDIT" ? (
              <div className="mt-4 space-y-3">
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  placeholder="Deposit paid now"
                  className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none"
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none"
                />
              </div>
            ) : null}

            <div className="mt-5 rounded-[22px] bg-[var(--color-surface-2)] p-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Total
              </div>
              <div className="mt-2 text-2xl font-black text-[var(--color-text)]">
                {money(total)}
              </div>
            </div>

            <AsyncButton
              onClick={submit}
              loading={saving}
              loadingText="Creating..."
              className="mt-4 w-full"
            >
              Create draft sale
            </AsyncButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ open, staff, conversation, onClose, onAssigned }) {
  const [savingId, setSavingId] = useState("");

  if (!open) return null;

  async function assign(staffId) {
    if (!conversation?.id) return;

    setSavingId(staffId);

    try {
      const result = await assignWhatsAppConversationOwner(conversation.id, {
        assignedToId: staffId,
      });

      toast.success("Conversation assigned");
      onAssigned?.(result.conversation);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Assignment failed");
    } finally {
      setSavingId("");
    }
  }

  async function clear() {
    if (!conversation?.id) return;

    setSavingId("clear");

    try {
      const result = await clearWhatsAppConversationOwner(conversation.id);
      toast.success("Assignment cleared");
      onAssigned?.(result.conversation);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to clear assignment");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-[34px] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Assign conversation
            </div>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-text)]">
              Choose responsible staff
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[var(--color-surface-2)] px-4 py-2 text-sm font-black text-[var(--color-text)]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {staff.length ? (
            staff.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => assign(person.id)}
                disabled={Boolean(savingId)}
                className="flex w-full items-center justify-between rounded-[24px] border border-transparent bg-[var(--color-card)] p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] disabled:opacity-60"
              >
                <div>
                  <div className="text-sm font-black text-[var(--color-text)]">
                    {person.name || person.email}
                  </div>
                  <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
                    {person.role}
                  </div>
                </div>

                <div className="text-xs font-black text-[var(--color-primary)]">
                  {savingId === person.id ? "Assigning..." : "Assign"}
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-5 text-sm font-semibold text-[var(--color-text-muted)]">
              No assignable staff loaded.
            </div>
          )}
        </div>

        <AsyncButton
          onClick={clear}
          loading={savingId === "clear"}
          loadingText="Clearing..."
          variant="secondary"
          className="mt-4 w-full"
        >
          Clear assignment
        </AsyncButton>
      </div>
    </div>
  );
}

export default function WhatsAppInbox() {
  const messagesEndRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  const currentRole = useMemo(() => getCurrentUserRole(), []);
  const canManageTools = canManageWhatsAppTools(currentRole);
  const canUseInbox = canUseWhatsAppInbox(currentRole);

  const [loading, setLoading] = useState(false);
  const [showPageSkeleton, setShowPageSkeleton] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState("inbox");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizingDraftId, setFinalizingDraftId] = useState("");

  async function loadConversations({ showSkeleton = false } = {}) {
    let skeletonTimer = null;

    if (showSkeleton && !hasLoadedOnceRef.current) {
      setLoading(true);

      skeletonTimer = window.setTimeout(() => {
        setShowPageSkeleton(true);
      }, 220);
    }

    try {
      const conversationData = await listWhatsAppConversations();
      const nextConversations = conversationData.conversations || [];

      setConversations(
        nextConversations.map((item) =>
          item.id === selectedId ? markConversationOpened(item) : item,
        ),
      );

      if (!selectedId && nextConversations[0]?.id) {
        setSelectedId(nextConversations[0].id);
      }

      setConversationsLoaded(true);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load WhatsApp conversations",
      );
    } finally {
      if (skeletonTimer) window.clearTimeout(skeletonTimer);
      setLoading(false);
      setShowPageSkeleton(false);
    }
  }

  async function loadSecondaryWhatsAppData({ showToast = false } = {}) {
    setSecondaryLoading(true);

    try {
      const safeDrafts = canUseInbox
        ? listWhatsAppSaleDrafts().catch(() => ({ drafts: [] }))
        : Promise.resolve({ drafts: [] });

      const safeStaff = canManageTools
        ? listAssignableWhatsAppStaff().catch(() => ({ staff: [] }))
        : Promise.resolve({ staff: [] });

      const safeAccounts = canManageTools
        ? listWhatsAppAccounts().catch(() => ({ accounts: [] }))
        : Promise.resolve({ accounts: [] });

      const safeBroadcasts = canManageTools
        ? listWhatsAppBroadcasts({ limit: 20 }).catch(() => ({ broadcasts: [] }))
        : Promise.resolve({ broadcasts: [] });

      const safePromotions = canManageTools
        ? listWhatsAppPromotions({ limit: 50 }).catch(() => ({ promotions: [] }))
        : Promise.resolve({ promotions: [] });

      const [draftData, staffData, accountData, broadcastData, promotionData] =
        await Promise.all([
          safeDrafts,
          safeStaff,
          safeAccounts,
          safeBroadcasts,
          safePromotions,
        ]);

      setDrafts(draftData.drafts || []);
      setStaff(staffData.staff || []);
      setAccounts(accountData.accounts || []);
      setBroadcasts(broadcastData.broadcasts || []);
      setPromotions(promotionData.promotions || []);
    } catch (err) {
      if (showToast) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to load WhatsApp details");
      } else {
        console.error("loadSecondaryWhatsAppData error:", err?.message || err);
      }
    } finally {
      setSecondaryLoading(false);
    }
  }

  async function load({ silent = false } = {}) {
    if (!canUseInbox) return;

    if (silent) setRefreshing(true);

    try {
      await loadConversations({ showSkeleton: !silent });

      if (silent) {
        await loadSecondaryWhatsAppData({ showToast: true });
      } else {
        loadSecondaryWhatsAppData();
      }
    } finally {
      if (silent) setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canManageTools && ["broadcasts", "setup"].includes(workspaceTab)) {
      setWorkspaceTab("inbox");
    }
  }, [canManageTools, workspaceTab]);

  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedId) || null;
  }, [conversations, selectedId]);

  const linkedDraft = useMemo(() => {
    if (!selectedConversation) return null;

    return (
      drafts.find(
        (draft) => draft.conversationId && draft.conversationId === selectedConversation.id,
      ) ||
      drafts.find(
        (draft) =>
          draft.customerId &&
          selectedConversation.customerId &&
          draft.customerId === selectedConversation.customerId,
      ) ||
      null
    );
  }, [drafts, selectedConversation]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((item) => {
      const haystack = [
        customerName(item),
        item.phone,
        item.customer?.email,
        item.latestMessage?.textContent,
        item.status,
        item.assignedTo?.name,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [conversations, search]);

  const metrics = useMemo(() => {
    const base = [
      ["Open chats", conversations.filter((item) => item.status === "OPEN").length],
      ["Unassigned", conversations.filter((item) => !item.assignedToId).length],
      ["Needs branch", conversations.filter((item) => !item.branchId).length],
      ["Draft sales", drafts.length],
    ];

    if (canManageTools) {
      base.push(["Active number", accounts.filter((item) => item.isActive).length]);
    }

    return base;
  }, [accounts, canManageTools, conversations, drafts]);

  useEffect(() => {
    let alive = true;

    async function loadMessages() {
      if (!selectedId) {
        setMessages([]);
        setMessagesLoading(false);
        return;
      }

      setMessagesLoading(true);
      setMessages([]);

      try {
        const data = await listWhatsAppConversationMessages(selectedId);

        if (!alive) return;

        setMessages(data.messages || []);

        setConversations((current) =>
          current.map((item) =>
            item.id === selectedId ? markConversationOpened(item) : item,
          ),
        );

        try {
          await markWhatsAppConversationRead(selectedId);
        } catch (readErr) {
          console.error("mark read after message load failed:", readErr?.message || readErr);
        }
      } catch (err) {
        if (!alive) return;
        toast.error(err?.response?.data?.message || err?.message || "Failed to load messages");
      } finally {
        if (alive) setMessagesLoading(false);
      }
    }

    loadMessages();

    return () => {
      alive = false;
    };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages]);

  function updateConversationLocally(nextConversation) {
    if (!nextConversation?.id) return;

    setConversations((current) =>
      current.map((item) =>
        item.id === nextConversation.id ? { ...item, ...nextConversation } : item,
      ),
    );
  }

  async function openConversation(conversation) {
    if (!conversation?.id) return;

    setWorkspaceTab("inbox");
    setSelectedId(conversation.id);

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id ? markConversationOpened(item) : item,
      ),
    );

    try {
      await markWhatsAppConversationRead(conversation.id);
    } catch (err) {
      console.error("markWhatsAppConversationRead failed:", err?.message || err);
    }
  }

  async function submitReply(event) {
    event.preventDefault();

    const text = replyText.trim();
    if (!text || !selectedConversation?.id) return;

    setSending(true);

    try {
      const result = await replyToWhatsAppConversation(selectedConversation.id, { text });

      if (result.message) {
        setMessages((current) => [...current, result.message]);
      }

      setReplyText("");
      toast.success("Reply sent");
      load({ silent: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!selectedConversation?.id) return;

    const nextStatus = selectedConversation.status === "OPEN" ? "CLOSED" : "OPEN";

    try {
      const result = await updateWhatsAppConversationStatus(selectedConversation.id, {
        status: nextStatus,
      });

      if (result.updated) {
        updateConversationLocally({ ...selectedConversation, ...result.updated });
      }

      toast.success(nextStatus === "OPEN" ? "Conversation reopened" : "Conversation closed");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update conversation");
    }
  }

  async function finalizeDraftById(draft) {
    if (!draft?.id) return;

    setFinalizingDraftId(draft.id);
    if (linkedDraft?.id === draft.id) setFinalizing(true);

    try {
      const result = await finalizeWhatsAppSaleDraft(draft.id, {
        branchId: draft.branchId || selectedConversation?.branchId || undefined,
        saleType: draft.saleType || "CREDIT",
        amountPaid: draft.saleType === "CASH" ? draft.total : draft.amountPaid || 0,
        paymentMethod: "MOMO",
      });

      if (result.finalized) {
        toast.success("WhatsApp sale finalized");
        await load({ silent: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to finalize sale");
    } finally {
      setFinalizingDraftId("");
      setFinalizing(false);
    }
  }

  async function finalizeLinkedDraft() {
    if (!linkedDraft?.id) return;
    await finalizeDraftById(linkedDraft);
  }

  if (!canUseInbox) {
    return (
      <div className="min-h-[calc(100vh-78px)] bg-[var(--color-bg)] p-3 sm:p-4 lg:p-5">
        <EmptyState
          icon="🔒"
          title="WhatsApp access is not enabled for this role"
          body="Ask the owner or manager to give this staff member WhatsApp workspace access."
        />
      </div>
    );
  }

  if (!conversationsLoaded && showPageSkeleton) {
    return (
      <div className="p-4 sm:p-6">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[var(--color-bg)] p-3 sm:p-4 lg:p-5">
      <div className="mb-4 flex flex-col gap-3 rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)] xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-2xl text-[var(--color-text)] shadow-[var(--shadow-soft)]">
            💬
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
                WhatsApp
              </h1>
              <Pill className="bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                One store number
              </Pill>
            </div>

            <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
              {canManageTools
                ? "Inbox, drafts, broadcasts, setup, and customer sales in one branch-aware workspace."
                : "Inbox, draft sales, and customer replies in one branch-aware workspace."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["inbox", "Inbox"],
            ["drafts", "Drafts"],
            ...(canManageTools
              ? [
                  ["broadcasts", "Broadcasts"],
                  ["setup", "Setup"],
                ]
              : []),
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setWorkspaceTab(key)}
              className={cx(
                "h-11 rounded-2xl px-4 text-sm font-black transition",
                workspaceTab === key
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-[var(--shadow-soft)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)]",
              )}
            >
              {label}
            </button>
          ))}

          <AsyncButton
            onClick={() => load({ silent: true })}
            loading={refreshing || loading}
            loadingText="Refreshing..."
            variant="secondary"
          >
            Refresh
          </AsyncButton>

          {secondaryLoading ? (
            <span className="inline-flex h-11 items-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-xs font-black text-[var(--color-text-muted)]">
              Syncing tools...
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={cx(
          "mb-4 grid gap-3 sm:grid-cols-2",
          canManageTools ? "xl:grid-cols-5" : "xl:grid-cols-4",
        )}
      >
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {label}
            </div>
            <div className="mt-2 text-2xl font-black text-[var(--color-text)]">
              {value}
            </div>
          </div>
        ))}
      </div>

      {workspaceTab === "drafts" ? (
        <DraftsWorkspace
          drafts={drafts}
          conversations={conversations}
          onOpenConversation={openConversation}
          onFinalize={finalizeDraftById}
          finalizingDraftId={finalizingDraftId}
        />
      ) : workspaceTab === "broadcasts" && canManageTools ? (
        <BroadcastsWorkspace
          accounts={accounts}
          promotions={promotions}
          broadcasts={broadcasts}
          onRefresh={() => load({ silent: true })}
        />
      ) : workspaceTab === "setup" && canManageTools ? (
        <SetupWorkspace accounts={accounts} onRefresh={() => load({ silent: true })} />
      ) : !conversationsLoaded ? (
        <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-2xl">
            💬
          </div>
          <h3 className="mt-4 text-lg font-black text-[var(--color-text)]">
            Opening WhatsApp workspace
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
            Loading customer conversations first. WhatsApp tools will load in the background.
          </p>
        </div>
      ) : !conversations.length ? (
        <EmptyState
          title="No WhatsApp conversations yet"
          body="Once customers message the store WhatsApp number, conversations will appear here for staff to reply, create sale drafts, and keep customer context."
        />
      ) : (
        <div className="grid h-[calc(100dvh-250px)] min-h-[680px] gap-4 overflow-hidden xl:grid-cols-[370px_minmax(0,1fr)_340px]">
          <aside className="sticky top-4 flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
            <div className="shrink-0 border-b border-[var(--color-border)] p-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
              />
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:thin]">
              {filteredConversations.length ? (
                filteredConversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === selectedId}
                    draft={
                      drafts.find(
                        (draft) =>
                          draft.conversationId === conversation.id ||
                          (draft.customerId &&
                            conversation.customerId &&
                            draft.customerId === conversation.customerId),
                      ) || null
                    }
                    onClick={() => openConversation(conversation)}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-5 text-sm font-semibold text-[var(--color-text-muted)]">
                  No matching conversations.
                </div>
              )}
            </div>
          </aside>

          <main className="flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-[var(--shadow-soft)]">
            {selectedConversation ? (
              <>
                <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-contrast)]">
                      {initials(customerName(selectedConversation))}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-lg font-black text-[var(--color-text)]">
                        {customerName(selectedConversation)}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--color-text-muted)]">
                        <span>{cleanPhone(selectedConversation.phone)}</span>
                        <span>•</span>
                        <span>{selectedConversation.status}</span>
                        {selectedConversation.branchId ? (
                          <>
                            <span>•</span>
                            <span>Branch assigned internally</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AsyncButton onClick={() => setDraftModalOpen(true)} variant="secondary">
                      Create draft sale
                    </AsyncButton>

                    {canManageTools ? (
                      <button
                        type="button"
                        onClick={() => setAssignModalOpen(true)}
                        className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                      >
                        Assign
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={toggleStatus}
                      className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                    >
                      {selectedConversation.status === "OPEN" ? "Close" : "Reopen"}
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-6">
                  <div className="mb-6 text-center">
                    <Pill className="bg-[var(--color-card)] text-[var(--color-text-muted)]">
                      {formatDay(messages[0]?.createdAt || selectedConversation.createdAt)}
                    </Pill>
                  </div>

                  <div className="space-y-4">
                    {messagesLoading ? (
                      <ChatMessagesSkeleton />
                    ) : messages.length ? (
                      messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))
                    ) : (
                      <EmptyState
                        title="No messages loaded"
                        body="Select a conversation or wait for new customer messages from WhatsApp."
                      />
                    )}

                    {!messagesLoading ? <div ref={messagesEndRef} /> : null}
                  </div>
                </div>

                <form
                  onSubmit={submitReply}
                  className="flex shrink-0 items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-card)] p-4"
                >
                  <input
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={`Send a reply to ${customerName(selectedConversation)}...`}
                    className="h-13 min-h-13 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]"
                  />

                  <IconButton title="Attach file">📎</IconButton>

                  <AsyncButton type="submit" loading={sending} loadingText="Sending...">
                    Send
                  </AsyncButton>
                </form>
              </>
            ) : (
              <EmptyState
                title="Choose a conversation"
                body="Pick a customer on the left to view messages, reply, and create a sale draft."
              />
            )}
          </main>

          <aside className="sticky top-4 h-full min-h-0 overflow-y-auto rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] [scrollbar-width:thin]">
            <div className="text-lg font-black text-[var(--color-text)]">Customer profile</div>

            {selectedConversation ? (
              <>
                <div className="mt-5 flex items-center gap-3 rounded-[26px] bg-[var(--color-surface-2)] p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-black text-[var(--color-primary-contrast)]">
                    {initials(customerName(selectedConversation))}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[var(--color-text)]">
                      {customerName(selectedConversation)}
                    </div>
                    <div className="mt-1 truncate text-xs font-bold text-[var(--color-text-muted)]">
                      {cleanPhone(selectedConversation.phone)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ["Name", customerName(selectedConversation)],
                    ["Phone", cleanPhone(selectedConversation.phone)],
                    ["Assigned to", selectedConversation.assignedTo?.name || "Unassigned"],
                    [
                      "Branch truth",
                      selectedConversation.branchId
                        ? "Assigned internally"
                        : "Needs internal branch",
                    ],
                    [
                      "WhatsApp",
                      selectedConversation.customer?.whatsappOptIn === false
                        ? "Not opted in"
                        : "Opted in",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3"
                    >
                      <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                        {label}
                      </div>
                      <div className="max-w-[190px] truncate text-right text-sm font-black text-[var(--color-text)]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-3 text-lg font-black text-[var(--color-text)]">
                    Linked draft sale
                  </div>

                  <DraftSummaryCard
                    draft={linkedDraft}
                    onFinalize={finalizeLinkedDraft}
                    finalizing={finalizing}
                  />
                </div>

                <div className="mt-6">
                  <div className="mb-3 text-lg font-black text-[var(--color-text)]">
                    Quick actions
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setDraftModalOpen(true)}
                      className="h-12 w-full rounded-2xl bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-contrast)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
                    >
                      Create new draft
                    </button>

                    {canManageTools ? (
                      <button
                        type="button"
                        onClick={() => setAssignModalOpen(true)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                      >
                        Assign conversation
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={toggleStatus}
                      className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                    >
                      {selectedConversation.status === "OPEN"
                        ? "Close conversation"
                        : "Reopen conversation"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
                Select a customer conversation to see customer details, draft sale status, and quick actions.
              </p>
            )}
          </aside>
        </div>
      )}

      <CreateDraftModal
        open={draftModalOpen}
        conversation={selectedConversation}
        onClose={() => setDraftModalOpen(false)}
        onCreated={async () => {
          await load({ silent: true });
        }}
      />

      {canManageTools ? (
        <AssignModal
          open={assignModalOpen}
          staff={staff}
          conversation={selectedConversation}
          onClose={() => setAssignModalOpen(false)}
          onAssigned={(conversation) => {
            updateConversationLocally(conversation);
          }}
        />
      ) : null}
    </div>
  );
}