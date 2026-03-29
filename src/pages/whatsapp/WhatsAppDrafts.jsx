import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";
import InlineSpinner from "../../components/ui/InlineSpinner";

import { searchProducts } from "../../services/inventoryApi";
import {
  listWhatsAppSaleDrafts,
  getWhatsAppSaleDraft,
  updateWhatsAppSaleDraft,
  deleteWhatsAppSaleDraft,
  finalizeWhatsAppSaleDraft,
} from "../../services/whatsappInboxApi";

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
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
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function panel() {
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "min-h-[96px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function toneBtn(active, tone = "neutral") {
  if (!active) return secondaryBtn();

  if (tone === "success") {
    return "inline-flex h-10 items-center justify-center rounded-2xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-medium text-white";
  }

  if (tone === "warning") {
    return "inline-flex h-10 items-center justify-center rounded-2xl border border-amber-600 bg-amber-600 px-4 text-sm font-medium text-white";
  }

  if (tone === "danger") {
    return "inline-flex h-10 items-center justify-center rounded-2xl border border-rose-600 bg-rose-600 px-4 text-sm font-medium text-white";
  }

  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-900 bg-stone-900 px-4 text-sm font-medium text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";
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

function SummaryCard({ label, value, note, tone = "neutral", loading = false }) {
  const accent =
    tone === "danger"
      ? "bg-rose-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "success"
      ? "bg-emerald-500"
      : "bg-stone-900 dark:bg-[rgb(var(--text))]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>

        {loading ? (
          <>
            <div className="mt-3 h-8 w-28 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
            <div className="mt-2 h-4 w-40 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          </>
        ) : (
          <>
            <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
            {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-1 text-lg font-semibold", strongText())}>{title}</h2>
      {subtitle ? <p className={cx("mt-1 text-sm", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm",
        mutedText()
      )}
    >
      {text}
    </div>
  );
}

function DraftListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-[24px] border border-stone-200 p-4 dark:border-[rgb(var(--border))]"
        >
          <div className="h-4 w-40 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-3 h-3 w-28 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
          <div className="mt-2 h-3 w-32 rounded bg-stone-100 dark:bg-[rgb(var(--bg-muted))]" />
        </div>
      ))}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className={cx(shell(), "p-5")}>
      <table className="w-full">
        <tbody>
          <TableSkeleton rows={10} cols={2} />
        </tbody>
      </table>
    </div>
  );
}

function normalizeDraftFromApi(raw) {
  if (!raw) return null;

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    cashierId: raw.cashierId || "",
    customerId: raw.customerId || "",
    conversationId: raw.conversationId || raw.conversation?.id || "",
    total: Number(raw.total || 0),
    saleType: String(raw.saleType || "CREDIT").toUpperCase(),
    amountPaid: Number(raw.amountPaid || 0),
    balanceDue: Number(raw.balanceDue || 0),
    dueDate: raw.dueDate ? String(raw.dueDate).slice(0, 10) : "",
    status: raw.status || "",
    isDraft: Boolean(raw.isDraft),
    draftSource: raw.draftSource || "",
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.finalizedAt || raw.createdAt || null,
    cashier: raw.cashier || null,
    conversation: raw.conversation || null,
    customer: {
      name: raw.customer?.name || "",
      phone: raw.customer?.phone || raw.conversation?.phone || "",
      email: raw.customer?.email || "",
      address: raw.customer?.address || "",
      tinNumber: raw.customer?.tinNumber || "",
      idNumber: raw.customer?.idNumber || "",
      notes: raw.customer?.notes || "",
    },
    items: Array.isArray(raw.items)
      ? raw.items.map((it) => ({
          id: it.id,
          saleId: it.saleId,
          productId: it.productId,
          quantity: Number(it.quantity || 0),
          unitPrice: Number(it.price || 0),
          product: it.product || null,
        }))
      : [],
  };
}

function relativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

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

export default function WhatsAppDrafts() {
  const nav = useNavigate();

  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  const [draft, setDraft] = useState(null);

  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const productReqIdRef = useRef(0);
  const searchTimer = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  async function loadDrafts({ preserveSelection = true, silent = false } = {}) {
    if (!silent) setDraftsLoading(true);
    setRefreshing(true);

    try {
      const res = await listWhatsAppSaleDrafts();
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.drafts) ? res.drafts.map(normalizeDraftFromApi) : [];
      setDrafts(list);

      if (!preserveSelection) {
        setSelectedDraftId(list[0]?.id || "");
        return;
      }

      if (selectedDraftId) {
        const stillExists = list.some((x) => x.id === selectedDraftId);
        if (!stillExists) {
          setSelectedDraftId(list[0]?.id || "");
        }
      } else {
        setSelectedDraftId(list[0]?.id || "");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load WhatsApp drafts");
      if (!mountedRef.current) return;
      setDrafts([]);
      setSelectedDraftId("");
    } finally {
      if (!mountedRef.current) return;
      setDraftsLoading(false);
      setRefreshing(false);
    }
  }

  async function loadDraft(saleId) {
    if (!saleId) {
      setDraft(null);
      return;
    }

    setDraftLoading(true);

    try {
      const res = await getWhatsAppSaleDraft(saleId);
      if (!mountedRef.current) return;
      setDraft(normalizeDraftFromApi(res?.draft));
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load draft");
      if (!mountedRef.current) return;
      setDraft(null);
    } finally {
      if (!mountedRef.current) return;
      setDraftLoading(false);
    }
  }

  useEffect(() => {
    void loadDrafts({ preserveSelection: false });
  }, []);

  useEffect(() => {
    if (!selectedDraftId) {
      setDraft(null);
      return;
    }
    void loadDraft(selectedDraftId);
  }, [selectedDraftId]);

  useEffect(() => {
    const q = productQuery.trim();
    let cancelled = false;

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!q) {
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }

    setSearchingProducts(true);
    const myReqId = ++productReqIdRef.current;

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchProducts(q, 12);
        if (!mountedRef.current || cancelled) return;
        if (myReqId !== productReqIdRef.current) return;
        setProductResults(Array.isArray(res?.products) ? res.products : []);
      } catch (err) {
        console.error(err);
        if (!mountedRef.current || cancelled) return;
        if (myReqId !== productReqIdRef.current) return;
        setProductResults([]);
      } finally {
        if (!mountedRef.current || cancelled) return;
        if (myReqId !== productReqIdRef.current) return;
        setSearchingProducts(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [productQuery]);

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafts;

    return drafts.filter((d) => {
      const customerName = String(d.customer?.name || "").toLowerCase();
      const customerPhone = String(d.customer?.phone || "").toLowerCase();
      const cashierName = String(d.cashier?.name || "").toLowerCase();
      const draftId = String(d.id || "").toLowerCase();

      return (
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        cashierName.includes(q) ||
        draftId.includes(q)
      );
    });
  }, [drafts, query]);

  const draftItemsCount = useMemo(() => {
    return Array.isArray(draft?.items)
      ? draft.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : 0;
  }, [draft]);

  const computedTotal = useMemo(() => {
    return Array.isArray(draft?.items)
      ? draft.items.reduce(
          (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
          0
        )
      : 0;
  }, [draft]);

  const linkedConversationCount = useMemo(() => {
    return drafts.filter((d) => d.conversationId).length;
  }, [drafts]);

  function setDraftField(key, value) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function setCustomerField(key, value) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            customer: {
              ...(prev.customer || {}),
              [key]: value,
            },
          }
        : prev
    );
  }

  function changeItem(productId, patch) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.productId === productId ? { ...item, ...patch } : item
        ),
      };
    });
  }

  function removeItem(productId) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.productId !== productId),
      };
    });
  }

  function addProductToDraft(product) {
    const stock = Number(product?.stockQty || 0);
    if (!product?.id) return;

    setDraft((prev) => {
      if (!prev) return prev;

      const existing = prev.items.find((item) => item.productId === product.id);

      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: Number(item.quantity || 0) + 1 }
              : item
          ),
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: `tmp-${product.id}-${Date.now()}`,
            saleId: prev.id,
            productId: product.id,
            quantity: 1,
            unitPrice: Number(product.sellPrice || 0),
            product: {
              ...product,
              stockQty: stock,
            },
          },
        ],
      };
    });

    setProductQuery("");
    setProductResults([]);
  }

  function buildSavePayload() {
    if (!draft) return null;

    return {
      saleType: draft.saleType,
      dueDate: draft.saleType === "CREDIT" ? draft.dueDate || null : null,
      customer:
        String(draft.customer?.name || "").trim() || String(draft.customer?.phone || "").trim()
          ? {
              name: String(draft.customer?.name || "").trim(),
              phone: String(draft.customer?.phone || "").trim(),
              email: String(draft.customer?.email || "").trim() || null,
              address: String(draft.customer?.address || "").trim() || null,
              tinNumber: String(draft.customer?.tinNumber || "").trim() || null,
              idNumber: String(draft.customer?.idNumber || "").trim() || null,
              notes: String(draft.customer?.notes || "").trim() || null,
            }
          : null,
      items: draft.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      })),
    };
  }

  function buildFinalizePayload() {
    if (!draft) return null;

    return {
      saleType: draft.saleType,
      dueDate: draft.saleType === "CREDIT" ? draft.dueDate || null : null,
      amountPaid: draft.saleType === "CASH" ? computedTotal : 0,
      paymentMethod: "CASH",
      customer:
        String(draft.customer?.name || "").trim() || String(draft.customer?.phone || "").trim()
          ? {
              name: String(draft.customer?.name || "").trim(),
              phone: String(draft.customer?.phone || "").trim(),
              email: String(draft.customer?.email || "").trim() || null,
              address: String(draft.customer?.address || "").trim() || null,
              tinNumber: String(draft.customer?.tinNumber || "").trim() || null,
              idNumber: String(draft.customer?.idNumber || "").trim() || null,
              notes: String(draft.customer?.notes || "").trim() || null,
            }
          : null,
    };
  }

  function validateDraftForSave() {
    if (!draft) return { ok: false, msg: "No draft selected." };

    if (!Array.isArray(draft.items) || draft.items.length === 0) {
      return { ok: false, msg: "Add at least one product." };
    }

    for (const item of draft.items) {
      if (!item.productId) return { ok: false, msg: "Each item must have a product." };
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        return { ok: false, msg: "Each quantity must be at least 1." };
      }
      if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
        return { ok: false, msg: "Each unit price must be greater than 0." };
      }
    }

    const hasCustomerBits =
      String(draft.customer?.name || "").trim() || String(draft.customer?.phone || "").trim();

    if (hasCustomerBits) {
      if (
        !String(draft.customer?.name || "").trim() ||
        !String(draft.customer?.phone || "").trim()
      ) {
        return { ok: false, msg: "Customer name and phone are required together." };
      }
    }

    if (draft.saleType === "CREDIT" && !draft.dueDate) {
      return { ok: false, msg: "Credit finalization requires a due date." };
    }

    return { ok: true };
  }

  async function handleSave() {
    const v = validateDraftForSave();
    if (!v.ok) {
      toast.error(v.msg);
      return;
    }

    setSaving(true);

    try {
      const payload = buildSavePayload();
      const res = await updateWhatsAppSaleDraft(draft.id, payload);
      const updated = normalizeDraftFromApi(res?.draft);
      setDraft(updated);
      toast.success("Draft saved");
      void loadDrafts({ preserveSelection: true, silent: true });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    const v = validateDraftForSave();
    if (!v.ok) {
      toast.error(v.msg);
      return;
    }

    setFinalizing(true);

    try {
      const payload = buildFinalizePayload();
      const res = await finalizeWhatsAppSaleDraft(draft.id, payload);
      const saleId = res?.sale?.id || draft.id;

      toast.success("Draft finalized");
      await loadDrafts({ preserveSelection: false, silent: true });
      nav(`/app/pos/sales/${saleId}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to finalize draft");
    } finally {
      setFinalizing(false);
    }
  }

  async function handleDelete() {
    if (!draft?.id) return;

    const confirmed = window.confirm("Delete this WhatsApp sale draft?");
    if (!confirmed) return;

    setDeleting(true);

    try {
      await deleteWhatsAppSaleDraft(draft.id);
      toast.success("Draft deleted");

      const deletedId = draft.id;
      setDraft(null);

      const nextDrafts = drafts.filter((d) => d.id !== deletedId);
      setDrafts(nextDrafts);
      setSelectedDraftId(nextDrafts[0]?.id || "");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to delete draft");
    } finally {
      setDeleting(false);
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
                Sale drafts
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Review WhatsApp-created drafts, polish customer and line details, then finalize into
                real sales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => nav("/app/whatsapp/inbox")} className={secondaryBtn()}>
                Open inbox
              </button>
              <button onClick={() => nav("/app/pos")} className={secondaryBtn()}>
                POS
              </button>
              <button onClick={() => nav("/app/pos/sales")} className={secondaryBtn()}>
                Sales list
              </button>
              <AsyncButton
                loading={refreshing}
                onClick={() => loadDrafts({ preserveSelection: true })}
                className={primaryBtn()}
              >
                Refresh drafts
              </AsyncButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Drafts"
            value={drafts.length}
            note="WhatsApp drafts currently available"
            loading={draftsLoading}
          />
          <SummaryCard
            label="Selected draft"
            value={draft ? String(draft.id).slice(-6).toUpperCase() : "—"}
            note={draft?.customer?.phone || "No draft selected"}
            tone="warning"
            loading={draftLoading}
          />
          <SummaryCard
            label="Linked conversations"
            value={linkedConversationCount}
            note="Drafts tied to inbox threads"
            tone="neutral"
            loading={draftsLoading}
          />
          <SummaryCard
            label="Draft total"
            value={formatMoney(computedTotal)}
            note={draft?.saleType === "CASH" ? "Cash finalization" : "Credit finalization"}
            tone={draft?.saleType === "CREDIT" ? "warning" : "success"}
            loading={draftLoading}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px,1fr]">
        <section className={cx(shell(), "p-4")}>
          <div className="flex items-center justify-between gap-3">
            <SectionHeading
              title="Draft queue"
              subtitle="Pick a WhatsApp sale draft to review, correct, and finalize."
            />
          </div>

          <div className="mt-4">
            <input
              className={inputClass()}
              placeholder="Search by customer, phone, cashier, or draft code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="mt-4">
            {draftsLoading ? (
              <DraftListSkeleton />
            ) : filteredDrafts.length === 0 ? (
              <EmptyState text="No WhatsApp sale drafts found." />
            ) : (
              <div className="space-y-3">
                {filteredDrafts.map((item) => {
                  const isActive = item.id === selectedDraftId;
                  const customerName = item.customer?.name || "Unassigned customer";
                  const customerPhone = item.customer?.phone || "—";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDraftId(item.id)}
                      className={cx(
                        "w-full rounded-[24px] border p-4 text-left transition-all duration-200",
                        isActive
                          ? "border-amber-300 bg-amber-50 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/20"
                          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:bg-stone-50 hover:shadow-md dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:hover:bg-[rgb(var(--bg-muted))]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={cx("truncate text-sm font-semibold", strongText())}>
                            {customerName}
                          </div>
                          <div className={cx("mt-1 text-xs", mutedText())}>{customerPhone}</div>
                          <div className={cx("mt-1 text-xs", softText())}>
                            Draft #{String(item.id).slice(-6).toUpperCase()}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {statusPill(
                            item.saleType === "CREDIT" ? "warning" : "success",
                            item.saleType
                          )}
                          {item.conversationId ? statusPill("neutral", "Linked") : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {statusPill("neutral", formatMoney(item.total))}
                        {item.cashier?.name ? statusPill("neutral", item.cashier.name) : null}
                      </div>

                      <div className={cx("mt-3 text-xs", softText())}>
                        Updated {relativeTime(item.updatedAt || item.createdAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          {draftLoading ? (
            <EditorSkeleton />
          ) : !draft ? (
            <div className={cx(shell(), "p-8")}>
              <EmptyState text="Select a WhatsApp draft to open the editor." />
            </div>
          ) : (
            <>
              <section className={cx(shell(), "p-5")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <SectionHeading
                    title="Draft workspace"
                    subtitle="Edit customer details, choose a finalization mode, and review line items before converting this draft into a sale."
                  />

                  <div className="flex flex-wrap gap-2">
                    {draft?.conversationId ? (
                      <button
                        type="button"
                        onClick={() => nav("/app/whatsapp/inbox")}
                        className={secondaryBtn()}
                      >
                        Open conversation
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className={cx("text-sm font-medium", strongText())}>Finalize mode</div>
                      <div className={cx("mt-1 text-sm", mutedText())}>
                        Choose how this WhatsApp draft should be converted into a real sale.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftField("saleType", "CASH")}
                        className={toneBtn(draft.saleType === "CASH", "success")}
                      >
                        Finalize as cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftField("saleType", "CREDIT")}
                        className={toneBtn(draft.saleType === "CREDIT", "warning")}
                      >
                        Finalize as credit
                      </button>
                    </div>
                  </div>

                  <div className={cx("mt-3 text-sm", mutedText())}>
                    {draft.saleType === "CASH"
                      ? "Cash finalization will mark this sale as fully paid."
                      : "Credit finalization will keep a balance due and requires a due date."}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className={cx(panel(), "p-4")}>
                    <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                      Draft ID
                    </div>
                    <div className={cx("mt-2 text-sm font-semibold", strongText())}>
                      #{String(draft.id).slice(-6).toUpperCase()}
                    </div>
                  </div>

                  <div className={cx(panel(), "p-4")}>
                    <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                      Customer phone
                    </div>
                    <div className={cx("mt-2 text-sm font-semibold", strongText())}>
                      {draft.customer?.phone || "—"}
                    </div>
                  </div>

                  <div className={cx(panel(), "p-4")}>
                    <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                      Assigned cashier
                    </div>
                    <div className={cx("mt-2 text-sm font-semibold", strongText())}>
                      {draft.cashier?.name || "—"}
                    </div>
                  </div>

                  <div className={cx(panel(), "p-4")}>
                    <div className={cx("text-xs uppercase tracking-[0.14em]", softText())}>
                      Link status
                    </div>
                    <div className="mt-2">
                      {draft.conversationId
                        ? statusPill("neutral", "Linked conversation")
                        : statusPill("warning", "No link")}
                    </div>
                  </div>

                  {draft.saleType === "CREDIT" ? (
                    <div className="md:col-span-2 xl:col-span-4">
                      <label className={cx("text-sm font-medium", strongText())}>Due date</label>
                      <div className={cx("mt-1 text-xs", softText())}>
                        Required for credit finalization
                      </div>
                      <input
                        type="date"
                        className={cx(inputClass(), "mt-2 max-w-sm")}
                        value={draft.dueDate}
                        onChange={(e) => setDraftField("dueDate", e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              <section className={cx(shell(), "p-5")}>
                <SectionHeading
                  title="Customer"
                  subtitle="Keep the customer profile clean before finalizing the sale."
                />

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Full name</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      value={draft.customer.name}
                      onChange={(e) => setCustomerField("name", e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Phone</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      value={draft.customer.phone}
                      onChange={(e) => setCustomerField("phone", e.target.value)}
                      placeholder="Phone"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Email</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      value={draft.customer.email}
                      onChange={(e) => setCustomerField("email", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Address</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      value={draft.customer.address}
                      onChange={(e) => setCustomerField("address", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>TIN number</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      value={draft.customer.tinNumber}
                      onChange={(e) => setCustomerField("tinNumber", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>ID number</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      value={draft.customer.idNumber}
                      onChange={(e) => setCustomerField("idNumber", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={cx("text-sm font-medium", strongText())}>Notes</label>
                    <textarea
                      className={cx(textareaClass(), "mt-2")}
                      value={draft.customer.notes}
                      onChange={(e) => setCustomerField("notes", e.target.value)}
                      placeholder="Optional customer notes"
                    />
                  </div>
                </div>
              </section>

              <section className={cx(shell(), "p-5")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <SectionHeading
                    title="Items"
                    subtitle="Search products, add them to the draft, and adjust quantities and prices."
                  />

                  <div className="w-full max-w-md">
                    <input
                      className={inputClass()}
                      placeholder="Search products to add..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                    />
                    {searchingProducts ? (
                      <div className="mt-2">
                        <InlineSpinner label="Searching..." />
                      </div>
                    ) : null}
                  </div>
                </div>

                {productQuery.trim() ? (
                  <div className="mt-4">
                    {productResults.length === 0 && !searchingProducts ? (
                      <EmptyState text="No products found." />
                    ) : (
                      <div className="divide-y divide-stone-200 overflow-hidden rounded-[24px] border border-stone-200 dark:divide-[rgb(var(--border))] dark:border-[rgb(var(--border))]">
                        {productResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProductToDraft(p)}
                            className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-stone-50 dark:hover:bg-[rgb(var(--bg-muted))]"
                          >
                            <div>
                              <div className={cx("text-sm font-medium", strongText())}>{p.name}</div>
                              <div className={cx("mt-1 text-xs", mutedText())}>
                                {p.sku ? `SKU: ${p.sku} • ` : ""}
                                Stock: {p.stockQty}
                              </div>
                            </div>
                            <div className={cx("text-sm font-semibold", strongText())}>
                              {formatMoney(p.sellPrice)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-5">
                  {!draft.items.length ? (
                    <EmptyState text="No items in this draft yet." />
                  ) : (
                    <div className="space-y-3">
                      {draft.items.map((item) => (
                        <div
                          key={item.productId}
                          className="rounded-[24px] border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={cx("text-sm font-medium", strongText())}>
                                {item.product?.name || "Unknown product"}
                              </div>
                              <div className={cx("mt-1 text-xs", mutedText())}>
                                {item.product?.sku ? `SKU: ${item.product.sku} • ` : ""}
                                Stock: {item.product?.stockQty ?? "—"}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-xs text-rose-700 transition hover:underline dark:text-rose-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div>
                              <label className={cx("text-sm font-medium", strongText())}>
                                Quantity
                              </label>
                              <input
                                className={cx(inputClass(), "mt-2")}
                                inputMode="numeric"
                                value={String(item.quantity)}
                                onChange={(e) =>
                                  changeItem(item.productId, {
                                    quantity: Number(normalizeDigits(e.target.value) || 0),
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label className={cx("text-sm font-medium", strongText())}>
                                Unit price
                              </label>
                              <input
                                className={cx(inputClass(), "mt-2")}
                                inputMode="numeric"
                                value={String(item.unitPrice)}
                                onChange={(e) =>
                                  changeItem(item.productId, {
                                    unitPrice: Number(normalizeDigits(e.target.value) || 0),
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label className={cx("text-sm font-medium", strongText())}>
                                Line total
                              </label>
                              <div className={cx("mt-3 text-sm font-semibold", strongText())}>
                                {formatMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className={cx(shell(), "p-5")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className={cx("text-sm font-medium", strongText())}>Finalize draft</div>
                    <div className={cx("mt-1 text-sm", mutedText())}>
                      Review the draft, choose a finalization mode, then convert it into a real
                      sale.
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={cx("text-sm", mutedText())}>Draft total</div>
                    <div className={cx("mt-1 text-2xl font-semibold", strongText())}>
                      {formatMoney(computedTotal)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <AsyncButton
                    loading={saving}
                    onClick={handleSave}
                    className={cx(primaryBtn(), "sm:flex-1")}
                  >
                    Save draft
                  </AsyncButton>

                  <AsyncButton
                    loading={finalizing}
                    onClick={handleFinalize}
                    className={cx(
                      "inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium text-white transition disabled:opacity-60 sm:flex-1",
                      draft.saleType === "CREDIT"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {draft.saleType === "CREDIT" ? "Finalize credit sale" : "Finalize cash sale"}
                  </AsyncButton>

                  <AsyncButton
                    loading={deleting}
                    onClick={handleDelete}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-600 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:bg-[rgb(var(--bg))] dark:text-rose-300 dark:hover:bg-rose-950/20"
                  >
                    Delete draft
                  </AsyncButton>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  );
}