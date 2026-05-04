import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { searchProducts } from "../../services/inventoryApi";
import {
  assignWhatsAppConversationOwner,
  clearWhatsAppConversationOwner,
  createWhatsAppSaleDraft,
  finalizeWhatsAppSaleDraft,
  listAssignableWhatsAppStaff,
  listWhatsAppAccounts,
  listWhatsAppBroadcasts,
  listWhatsAppConversationMessages,
  listWhatsAppConversations,
  listWhatsAppPromotions,
  listWhatsAppSaleDrafts,
  replyToWhatsAppConversation,
  updateWhatsAppConversationStatus,
} from "../../services/whatsappApi";

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function money(value) {
  const n = Number(value || 0);
  return `${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-US")} RWF`;
}

function initials(value) {
  const text = String(value || "").trim();
  if (!text) return "WA";

  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function cleanPhone(value) {
  return String(value || "").trim() || "No phone";
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
    conversation?.assignedTo?.name ||
    conversation?.phone ||
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

  if (conversation?.latestMessage?.direction === "INBOUND") {
    const n = Number(conversation?.messageCount || 0);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
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
    stockQty: Number(item.stockQty || item.availableQty || 0),
  }));
}

function toneForStatus(status) {
  const value = String(status || "").toUpperCase();

  if (value === "OPEN") return "bg-emerald-500/10 text-emerald-600";
  if (value === "CLOSED") return "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";
  if (value === "SENT" || value === "PAID") return "bg-emerald-500/10 text-emerald-600";
  if (value === "PARTIAL" || value === "QUEUED") return "bg-amber-500/10 text-amber-600";
  if (value === "FAILED" || value === "OVERDUE") return "bg-red-500/10 text-red-600";

  return "bg-[rgba(74,163,255,0.12)] text-[var(--color-primary)]";
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black",
        className
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
    >
      {children}
    </button>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-[32px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-2xl">
          💬
        </div>
        <h3 className="mt-4 text-lg font-black text-[var(--color-text)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{body}</p>
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
        <div className="w-[72%] max-w-sm rounded-[26px] rounded-br-md bg-emerald-500/15 p-4 shadow-[var(--shadow-soft)]">
          <div className="h-3 w-full animate-pulse rounded-full bg-emerald-500/15" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-emerald-500/15" />
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
          ? "bg-emerald-500/10 ring-1 ring-emerald-500/20"
          : "hover:bg-[var(--color-surface-2)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-[var(--shadow-soft)]",
            active ? "bg-emerald-500" : "bg-[var(--color-primary)]"
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
                    : "font-semibold text-[var(--color-text-muted)]"
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
                    ? "font-black text-emerald-600"
                    : "font-bold text-[var(--color-text-muted)]"
                )}
              >
                {formatTime(conversation.updatedAt)}
              </div>

              {count > 0 ? (
                <div className="ml-auto mt-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-black text-white">
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
              <Pill className="bg-[rgba(74,163,255,0.12)] text-[var(--color-primary)]">
                Branch set
              </Pill>
            ) : (
              <Pill className="bg-amber-500/10 text-amber-600">
                Needs branch
              </Pill>
            )}

            {draft ? (
              <Pill className="bg-amber-500/10 text-amber-600">
                Draft sale
              </Pill>
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
            ? "rounded-br-md bg-emerald-500/15 text-[var(--color-text)]"
            : "rounded-bl-md bg-[var(--color-card)] text-[var(--color-text)]"
        )}
      >
        <div className="whitespace-pre-wrap text-sm font-semibold leading-6">
          {message.textContent || "Message"}
        </div>
        <div className="mt-2 text-right text-[10px] font-bold text-[var(--color-text-muted)]">
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
        <div className="text-sm font-black text-[var(--color-text)]">No linked draft sale</div>
        <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
          Create a draft only after the customer asks to buy. Stock, drawer, receipt, and audit flow stay branch-aware.
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
            {draft.items.length} item{draft.items.length === 1 ? "" : "s"} • {draft.saleType} sale
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
      const data = await searchProducts(clean, 12);
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
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
        item.productId === productId ? { ...item, quantity: qty } : item
      )
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
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
              WhatsApp sale draft
            </div>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-text)]">
              Prepare customer order
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Customer sees one WhatsApp number. Storvex keeps branch stock, drawer, and audit control internally.
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
                className="h-12 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
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
                  className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left transition hover:-translate-y-0.5"
                >
                  <div className="text-sm font-black text-[var(--color-text)]">{product.name}</div>
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
                  <div
                    key={item.productId}
                    className="rounded-[22px] bg-[var(--color-surface-2)] p-3"
                  >
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
                      <span className="text-xs font-bold text-[var(--color-text-muted)]">Qty</span>
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
                <div className="rounded-[22px] border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-text-muted)]">
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
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text)]"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center">
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
          {staff.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => assign(person.id)}
              disabled={Boolean(savingId)}
              className="flex w-full items-center justify-between rounded-[24px] bg-[var(--color-card)] p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 disabled:opacity-60"
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
          ))}
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  async function load({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        conversationData,
        draftData,
        staffData,
        accountData,
        broadcastData,
        promotionData,
      ] = await Promise.all([
        listWhatsAppConversations(),
        listWhatsAppSaleDrafts().catch(() => ({ drafts: [] })),
        listAssignableWhatsAppStaff().catch(() => ({ staff: [] })),
        listWhatsAppAccounts().catch(() => ({ accounts: [] })),
        listWhatsAppBroadcasts({ limit: 20 }).catch(() => ({ broadcasts: [] })),
        listWhatsAppPromotions({ limit: 20 }).catch(() => ({ promotions: [] })),
      ]);

      const nextConversations = conversationData.conversations || [];

      setConversations((current) => {
        const openedIds = new Set(
          current
            .filter((item) => {
              const explicit =
                item.unreadCount ??
                item.unreadMessages ??
                item.unreadMessageCount ??
                item.unseenCount ??
                null;

              return explicit === 0;
            })
            .map((item) => item.id)
        );

        return nextConversations.map((item) =>
          openedIds.has(item.id) || item.id === selectedId
            ? markConversationOpened(item)
            : item
        );
      });

      setDrafts(draftData.drafts || []);
      setStaff(staffData.staff || []);
      setAccounts(accountData.accounts || []);
      setBroadcasts(broadcastData.broadcasts || []);
      setPromotions(promotionData.promotions || []);

      if (!selectedId && nextConversations[0]?.id) {
        setSelectedId(nextConversations[0].id);
        setConversations((current) =>
          current.map((item) =>
            item.id === nextConversations[0].id ? markConversationOpened(item) : item
          )
        );
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load WhatsApp");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedId) || null;
  }, [conversations, selectedId]);

  const linkedDraft = useMemo(() => {
    if (!selectedConversation) return null;

    return (
      drafts.find((draft) => draft.conversationId && draft.conversationId === selectedConversation.id) ||
      drafts.find(
        (draft) =>
          draft.customerId &&
          selectedConversation.customerId &&
          draft.customerId === selectedConversation.customerId
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
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [conversations, search]);

  const metrics = useMemo(() => {
    return {
      open: conversations.filter((item) => item.status === "OPEN").length,
      unassigned: conversations.filter((item) => !item.assignedToId).length,
      needsBranch: conversations.filter((item) => !item.branchId).length,
      drafts: drafts.length,
      activeAccounts: accounts.filter((item) => item.isActive).length,
    };
  }, [accounts, conversations, drafts]);

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
          item.id === selectedId ? markConversationOpened(item) : item
        )
      );
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
        item.id === nextConversation.id ? { ...item, ...nextConversation } : item
      )
    );
  }

  function openConversation(conversation) {
    if (!conversation?.id) return;

    setSelectedId(conversation.id);

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id ? markConversationOpened(item) : item
      )
    );
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

  async function finalizeDraft() {
    if (!linkedDraft?.id) return;

    setFinalizing(true);

    try {
      const result = await finalizeWhatsAppSaleDraft(linkedDraft.id, {
        branchId: linkedDraft.branchId || selectedConversation?.branchId || undefined,
        saleType: linkedDraft.saleType || "CREDIT",
        amountPaid: linkedDraft.saleType === "CASH" ? linkedDraft.total : linkedDraft.amountPaid || 0,
        paymentMethod: "MOMO",
      });

      if (result.finalized) {
        toast.success("WhatsApp sale finalized");
        await load({ silent: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to finalize sale");
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
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
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-emerald-500 text-2xl text-white shadow-[var(--shadow-soft)]">
            💬
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
                WhatsApp
              </h1>
              <Pill className="bg-emerald-500/10 text-emerald-600">
                One store number
              </Pill>
            </div>

            <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
              Inbox, drafts, broadcasts, and customer sales in one branch-aware workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["inbox", "Inbox"],
            ["drafts", "Drafts"],
            ["broadcasts", "Broadcasts"],
            ["setup", "Setup"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setWorkspaceTab(key)}
              className={cx(
                "h-11 rounded-2xl px-4 text-sm font-black transition",
                workspaceTab === key
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text)]"
              )}
            >
              {label}
            </button>
          ))}

          <AsyncButton
            onClick={() => load({ silent: true })}
            loading={refreshing}
            loadingText="Refreshing..."
            variant="secondary"
          >
            Refresh
          </AsyncButton>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Open chats", metrics.open],
          ["Unassigned", metrics.unassigned],
          ["Needs branch", metrics.needsBranch],
          ["Draft sales", metrics.drafts],
          ["Active number", metrics.activeAccounts],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {label}
            </div>
            <div className="mt-2 text-2xl font-black text-[var(--color-text)]">{value}</div>
          </div>
        ))}
      </div>

      {workspaceTab !== "inbox" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)] xl:col-span-2">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
              {workspaceTab}
            </div>
            <h2 className="mt-3 text-2xl font-black text-[var(--color-text)]">
              {workspaceTab === "drafts"
                ? "WhatsApp draft sales"
                : workspaceTab === "broadcasts"
                  ? "Broadcast control"
                  : "WhatsApp setup"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              This workspace is now reachable from one WhatsApp menu. The detailed premium screens for this tab will be folded here next, instead of splitting WhatsApp into separate old pages.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(workspaceTab === "drafts"
                ? drafts
                : workspaceTab === "broadcasts"
                  ? broadcasts
                  : accounts
              )
                .slice(0, 8)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] bg-[var(--color-surface-2)] p-4"
                  >
                    <div className="text-sm font-black text-[var(--color-text)]">
                      {item.title || item.templateName || item.businessName || item.id}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-[var(--color-text-muted)]">
                      {item.status || item.phoneNumber || money(item.total || 0)}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="text-sm font-black text-[var(--color-text)]">
              WhatsApp system rule
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Customers see one store WhatsApp number. Internally, sales, stock, cash drawer, receipts, and audit records stay branch-aware.
            </p>

            <div className="mt-5 space-y-2">
              {promotions.slice(0, 4).map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-[20px] bg-[var(--color-surface-2)] p-3"
                >
                  <div className="text-sm font-black text-[var(--color-text)]">{promo.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                    {promo.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
              />
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:thin]">
              {filteredConversations.map((conversation) => (
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
                          draft.customerId === conversation.customerId)
                    ) || null
                  }
                  onClick={() => openConversation(conversation)}
                />
              ))}
            </div>
          </aside>

          <main className="flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-[var(--shadow-soft)]">
            {selectedConversation ? (
              <>
                <div className="shrink-0 flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black text-white">
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
                    <AsyncButton
                      onClick={() => setDraftModalOpen(true)}
                      variant="secondary"
                    >
                      Create draft sale
                    </AsyncButton>

                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(true)}
                      className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)]"
                    >
                      Assign
                    </button>

                    <button
                      type="button"
                      onClick={toggleStatus}
                      className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)]"
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
                      messages.map((message) => <MessageBubble key={message.id} message={message} />)
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
                  className="shrink-0 flex items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-card)] p-4"
                >
                  <input
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={`Send a reply to ${customerName(selectedConversation)}...`}
                    className="h-13 min-h-13 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-black text-white">
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
                    ["Branch truth", selectedConversation.branchId ? "Assigned internally" : "Needs internal branch"],
                    ["WhatsApp", selectedConversation.customer?.whatsappOptIn === false ? "Not opted in" : "Opted in"],
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
                    onFinalize={finalizeDraft}
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
                      className="h-12 w-full rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
                    >
                      Create new draft
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(true)}
                      className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
                    >
                      Assign conversation
                    </button>

                    <button
                      type="button"
                      onClick={toggleStatus}
                      className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
                    >
                      {selectedConversation.status === "OPEN" ? "Close conversation" : "Reopen conversation"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
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

      <AssignModal
        open={assignModalOpen}
        staff={staff}
        conversation={selectedConversation}
        onClose={() => setAssignModalOpen(false)}
        onAssigned={(conversation) => {
          updateConversationLocally(conversation);
        }}
      />
    </div>
  );
}