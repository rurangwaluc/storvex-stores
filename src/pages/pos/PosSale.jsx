import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import InlineSpinner from "../../components/ui/InlineSpinner";

import { createSale, getQuickPicks } from "../../services/posApi";
import { searchProducts } from "../../services/inventoryApi";
import { listCustomers } from "../../services/customersApi";
import { getCashDrawerStatus } from "../../services/cashDrawerApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

const formatMoney = (n) => `Rwf ${Number(n || 0).toLocaleString("en-US")}`;

function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

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

function textareaClass() {
  return "min-h-[110px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function successBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function warningBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[#d9a700] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function modeBtn(active, tone = "neutral") {
  if (!active) return secondaryBtn();

  if (tone === "success") return successBtn();
  if (tone === "warning") return warningBtn();
  if (tone === "danger") return dangerBtn();
  return primaryBtn();
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function StatusBadge({ kind = "neutral", children }) {
  const cls =
    kind === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : kind === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : kind === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
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

function SummaryCard({ label, value, note, tone = "neutral", loading = false, icon = "default" }) {
  const iconTone =
    tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : tone === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[#dff1ff] text-[#4aa8ff]";

  function CardIcon() {
    const common = { className: "h-7 w-7", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9 };

    if (icon === "cart") {
      return (
        <svg {...common}>
          <path d="M4 6h2l2.2 9.2a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.8L20 9H8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="20" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    }

    if (icon === "money") {
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.8" />
          <path d="M7 12h.01M17 12h.01" strokeLinecap="round" />
        </svg>
      );
    }

    if (icon === "customer") {
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
        </svg>
      );
    }

    if (icon === "drawer") {
      return (
        <svg {...common}>
          <path d="M4 7h16v10H4z" />
          <path d="M8 11h8" strokeLinecap="round" />
          <path d="M10 15h4" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <svg {...common}>
        <path d="M5 19V9M12 19V5M19 19v-8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <article className={cx(pageCard(), "p-5 sm:p-6")}>
      <div className="flex items-start gap-4 sm:gap-5">
        <div className={cx("flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] shadow-[var(--shadow-soft)]", iconTone)}>
          <CardIcon />
        </div>

        <div className="min-w-0 flex-1">
          <div className={cx("text-sm font-semibold", strongText())}>{label}</div>

          {loading ? (
            <>
              <SkeletonBlock className="mt-3 h-8 w-28" />
              <SkeletonBlock className="mt-2 h-4 w-40" />
            </>
          ) : (
            <>
              <div className={cx("mt-2 text-[1.7rem] font-black leading-tight tracking-[-0.02em]", strongText())}>
                {value}
              </div>
              {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function StepCard({ number, title, text, active = false }) {
  return (
    <div
      className={cx(
        "rounded-[22px] p-4 transition",
        active ? "bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary-ring)]" : "bg-[var(--color-surface-2)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
            active ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text)]"
          )}
        >
          {number}
        </div>

        <div className="min-w-0">
          <div className={cx("text-sm font-bold", strongText())}>{title}</div>
          <div className={cx("mt-1 text-xs leading-5", mutedText())}>{text}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(softPanel(), "px-4 py-10 text-center")}>
      <div className={cx("text-base font-bold", strongText())}>{title}</div>
      <div className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</div>
    </div>
  );
}

function QuickPicksSkeleton() {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cx(softPanel(), "p-4")}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-5 w-56" />
              <SkeletonBlock className="h-4 w-40" />
            </div>
            <div className="space-y-2 text-right">
              <SkeletonBlock className="h-5 w-24 ml-auto" />
              <SkeletonBlock className="h-9 w-24 rounded-full ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cx(softPanel(), "p-4")}>
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="mt-2 h-4 w-28" />
          <SkeletonBlock className="mt-2 h-4 w-44" />
        </div>
      ))}
    </div>
  );
}

function PosSaleSkeleton() {
  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-12 w-72" />
            <SkeletonBlock className="h-4 w-[28rem] max-w-full" />
          </div>

          <div className="flex gap-2">
            <SkeletonBlock className="h-11 w-28 rounded-2xl" />
            <SkeletonBlock className="h-11 w-24 rounded-2xl" />
            <SkeletonBlock className="h-11 w-32 rounded-2xl" />
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className="flex items-start gap-4">
                <SkeletonBlock className="h-16 w-16 rounded-[20px]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-8 w-28" />
                  <SkeletonBlock className="h-4 w-40" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 w-full rounded-[22px]" />
          ))}
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(pageCard(), "p-5 sm:p-6")}>
              <SkeletonBlock className="h-8 w-40" />
              <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <SkeletonBlock className="h-11 w-full rounded-2xl" />
                <SkeletonBlock className="h-11 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        <div className={cx(pageCard(), "p-5 sm:p-6")}>
          <SkeletonBlock className="h-8 w-28" />
          <SkeletonBlock className="mt-3 h-4 w-48" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-28 w-full rounded-[22px]" />
            ))}
          </div>
          <SkeletonBlock className="mt-5 h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, onAdd }) {
  const stock = Number(product.stockQty || 0);
  const soldQty = Number(product.soldQty || 0);
  const disabled = !Number.isFinite(stock) || stock <= 0;

  return (
    <div
      className={cx(
        softPanel(),
        "p-4 transition",
        disabled ? "opacity-60" : "hover:opacity-90"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className={cx("truncate text-base font-bold", strongText())}>{product.name}</div>

          <div className={cx("mt-1 text-sm", mutedText())}>
            {product.brand || "No brand"}
            {product.category ? ` • ${product.category}` : ""}
          </div>

          <div className={cx("mt-2 text-xs leading-5", mutedText())}>
            Stock: <span className={cx("font-semibold", strongText())}>{stock}</span>
            {product.sku ? (
              <>
                {" • "}SKU: <span className={cx("font-semibold", strongText())}>{product.sku}</span>
              </>
            ) : null}
            {product.serial ? (
              <>
                {" • "}Serial: <span className={cx("font-semibold", strongText())}>{product.serial}</span>
              </>
            ) : null}
            {soldQty > 0 ? (
              <>
                {" • "}Sold recently: <span className={cx("font-semibold", strongText())}>{soldQty}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className={cx("text-lg font-black tracking-tight", strongText())}>
            {formatMoney(product.sellPrice)}
          </div>

          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={disabled}
            className={cx(
              "inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-semibold transition",
              disabled
                ? "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                : "bg-[#dcfce7] text-[#15803d] hover:opacity-90"
            )}
          >
            {disabled ? "Out of stock" : "Tap to add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerCard({ customer, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-[22px] p-4 text-left transition",
        active
          ? "bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary-ring)]"
          : "bg-[var(--color-surface-2)] hover:opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cx("truncate text-sm font-bold", strongText())}>{customer.name}</div>
          <div className={cx("mt-1 text-xs", mutedText())}>{customer.phone || "No phone"}</div>
          {customer.email ? <div className={cx("mt-1 text-xs", mutedText())}>{customer.email}</div> : null}
          {Number(customer.outstanding || 0) > 0 ? (
            <div className="mt-2">
              <StatusBadge kind="warning">Outstanding {formatMoney(customer.outstanding)}</StatusBadge>
            </div>
          ) : null}
        </div>

        {active ? <StatusBadge kind="success">Selected</StatusBadge> : null}
      </div>
    </button>
  );
}

function CartItemCard({ item, onDec, onInc, onRemove }) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cx("text-sm font-bold", strongText())}>{item.name}</div>
          <div className={cx("mt-1 text-xs", mutedText())}>
            Unit price: <span className={cx("font-semibold", strongText())}>{formatMoney(item.price)}</span>
          </div>
          <div className={cx("mt-1 text-xs", mutedText())}>
            Available stock: <span className={cx("font-semibold", strongText())}>{item.stockQty}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="text-xs font-semibold text-[var(--color-danger)] transition hover:opacity-80"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onDec(item.productId)} className={secondaryBtn()}>
            −
          </button>

          <div className={cx("min-w-[2rem] text-center text-base font-black", strongText())}>
            {item.quantity}
          </div>

          <button type="button" onClick={() => onInc(item.productId)} className={secondaryBtn()}>
            +
          </button>
        </div>

        <div className="text-right">
          <div className={cx("text-xs", mutedText())}>Line total</div>
          <div className={cx("mt-1 text-lg font-black tracking-tight", strongText())}>
            {formatMoney(item.price * item.quantity)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosSale() {
  const nav = useNavigate();

  const [bootLoading, setBootLoading] = useState(true);

  const [productResults, setProductResults] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [quickBest, setQuickBest] = useState([]);
  const [quickLatest, setQuickLatest] = useState([]);
  const [quickLoading, setQuickLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customersLoading, setCustomersLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const [saleType, setSaleType] = useState("CASH");

  const [customerMode, setCustomerMode] = useState("WALKIN");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    tinNumber: "",
    idNumber: "",
    notes: "",
  });

  const [dueDate, setDueDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [drawerLoading, setDrawerLoading] = useState(true);
  const [drawerStatus, setDrawerStatus] = useState(null);
  const [drawerRefreshBusy, setDrawerRefreshBusy] = useState(false);

  const searchTimer = useRef(null);
  const mountedRef = useRef(true);
  const productReqIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  async function loadDrawerStatus({ silent = false } = {}) {
    if (!silent) setDrawerRefreshBusy(true);
    setDrawerLoading(true);

    try {
      const s = await getCashDrawerStatus();
      if (!mountedRef.current) return;
      setDrawerStatus(s);
    } catch (e) {
      if (!mountedRef.current) return;
      console.error(e);
      if (!handleSubscriptionBlockedError(e, { toastId: "drawer-status-blocked" })) {
        setDrawerStatus(null);
      }
    } finally {
      if (!mountedRef.current) return;
      setDrawerLoading(false);
      setDrawerRefreshBusy(false);
    }
  }

  async function loadCustomers() {
    setCustomersLoading(true);
    try {
      const cRes = await listCustomers();
      if (!mountedRef.current) return;

      const list = Array.isArray(cRes)
        ? cRes
        : Array.isArray(cRes?.customers)
        ? cRes.customers
        : [];

      setCustomers(list);
    } catch (e) {
      if (!mountedRef.current) return;
      console.error(e);
      if (!handleSubscriptionBlockedError(e, { toastId: "customers-load-blocked" })) {
        toast.error(e?.message || "Failed to load customers");
      }
      setCustomers([]);
    } finally {
      if (!mountedRef.current) return;
      setCustomersLoading(false);
    }
  }

  async function loadQuickPicks() {
    setQuickLoading(true);
    try {
      const data = await getQuickPicks(7, 10);
      if (!mountedRef.current) return;

      setQuickBest(Array.isArray(data?.bestSellers) ? data.bestSellers : []);
      setQuickLatest(Array.isArray(data?.latest) ? data.latest : []);
    } catch (e) {
      if (!mountedRef.current) return;
      console.error(e);
      if (!handleSubscriptionBlockedError(e, { toastId: "quick-picks-blocked" })) {
        setQuickBest([]);
        setQuickLatest([]);
      }
    } finally {
      if (!mountedRef.current) return;
      setQuickLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setBootLoading(true);
      try {
        await Promise.all([
          loadQuickPicks(),
          loadCustomers(),
          loadDrawerStatus({ silent: true }),
        ]);
      } finally {
        if (!cancelled && mountedRef.current) setBootLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = productQuery.trim();

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!q) {
      setProductResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const myReqId = ++productReqIdRef.current;

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchProducts(q, 20);
        if (cancelled || !mountedRef.current) return;
        if (myReqId !== productReqIdRef.current) return;

        setProductResults(Array.isArray(res?.products) ? res.products : []);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        if (myReqId !== productReqIdRef.current) return;
        console.error(e);
        if (!handleSubscriptionBlockedError(e, { toastId: "product-search-blocked" })) {
          setProductResults([]);
        }
      } finally {
        if (cancelled || !mountedRef.current) return;
        if (myReqId !== productReqIdRef.current) return;
        setSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [productQuery]);

  useEffect(() => {
    if (saleType === "CASH") {
      setDueDate("");
      setAmountPaid("");
      setPaymentMethod("CASH");
      void loadDrawerStatus({ silent: true });
    }
  }, [saleType]);

  function onProductKeyDown(e) {
    if (e.key !== "Enter") return;
    const first = productResults[0];
    if (!first) return;
    e.preventDefault();
    addToCart(first);
  }

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();

    if (!q) return customers.slice(0, 20);

    return customers
      .filter((c) => {
        const name = String(c.name || "").toLowerCase();
        const phone = String(c.phone || "").toLowerCase();
        const email = String(c.email || "").toLowerCase();
        const tin = String(c.tinNumber || "").toLowerCase();
        const idNumber = String(c.idNumber || "").toLowerCase();

        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          tin.includes(q) ||
          idNumber.includes(q)
        );
      })
      .slice(0, 20);
  }, [customers, customerQuery]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  function setCustomerField(key, value) {
    setCustomerForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetCustomerSelection() {
    setSelectedCustomerId("");
    setCustomerQuery("");
  }

  function resetCustomerForm() {
    setCustomerForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      tinNumber: "",
      idNumber: "",
      notes: "",
    });
  }

  function addToCart(p) {
    const stock = Number(p.stockQty || 0);

    if (!Number.isFinite(stock) || stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);

      if (existing) {
        if (existing.quantity + 1 > stock) {
          toast.error("Cannot exceed stock");
          return prev;
        }

        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.sellPrice,
          quantity: 1,
          stockQty: stock,
        },
      ];
    });
  }

  function inc(productId) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;

        const stock = Number(i.stockQty || 0);
        if (i.quantity + 1 > stock) {
          toast.error("Cannot exceed stock");
          return i;
        }

        return { ...i, quantity: i.quantity + 1 };
      })
    );
  }

  function dec(productId) {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
      )
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0),
    [cart]
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
    [cart]
  );

  const showQuickPicks = !productQuery.trim();
  const quickList = quickBest.length ? quickBest : quickLatest;
  const quickTitle = quickBest.length ? "Best sellers (7 days)" : "Latest products";

  const blockCashSales = Boolean(drawerStatus?.settings?.blockCashSales ?? true);
  const drawerOpen = Boolean(drawerStatus?.openSession?.id);
  const mustOpenDrawerForCash = saleType === "CASH" && blockCashSales && !drawerOpen;

  function validateCustomerForSale() {
    if (customerMode === "WALKIN") {
      if (saleType === "CREDIT") {
        return { ok: false, msg: "Credit sale requires a customer." };
      }
      return { ok: true };
    }

    if (customerMode === "PICK") {
      if (!selectedCustomerId) {
        return { ok: false, msg: "Pick a customer first." };
      }
      return { ok: true };
    }

    const name = String(customerForm.name || "").trim();
    const phone = String(customerForm.phone || "").trim();

    if (!name || !phone) {
      return { ok: false, msg: "Customer name and phone are required." };
    }

    return { ok: true };
  }

  function buildCustomerPayload() {
    if (customerMode === "PICK" && selectedCustomerId) {
      return { customerId: selectedCustomerId };
    }

    if (customerMode === "NEW") {
      const customerPayload = {
        name: String(customerForm.name || "").trim(),
        phone: String(customerForm.phone || "").trim(),
        email: String(customerForm.email || "").trim() || null,
        address: String(customerForm.address || "").trim() || null,
        tinNumber: String(customerForm.tinNumber || "").trim() || null,
        idNumber: String(customerForm.idNumber || "").trim() || null,
        notes: String(customerForm.notes || "").trim() || null,
      };

      return {
        customer: customerPayload,
        customerName: customerPayload.name,
        customerPhone: customerPayload.phone,
        customerEmail: customerPayload.email,
        customerAddress: customerPayload.address,
        customerTinNumber: customerPayload.tinNumber,
        customerIdNumber: customerPayload.idNumber,
        customerNotes: customerPayload.notes,
      };
    }

    return {};
  }

  async function completeSale() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (saleType === "CASH" && blockCashSales && !drawerOpen) {
      toast.error("Cash drawer is closed. Open drawer to make CASH sales.");
      return;
    }

    const customerValidation = validateCustomerForSale();
    if (!customerValidation.ok) {
      toast.error(customerValidation.msg);
      return;
    }

    if (saleType === "CREDIT" && !dueDate) {
      toast.error("Credit sale requires a due date.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        saleType,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        ...buildCustomerPayload(),
      };

      if (saleType === "CREDIT") {
        payload.dueDate = dueDate;

        const paid = Number(amountPaid || 0);
        if (Number.isFinite(paid) && paid > 0) {
          payload.amountPaid = paid;
        }

        payload.paymentMethod = paymentMethod;
      }

      const res = await createSale(payload);
      const saleId = res?.sale?.id || res?.saleId;

      if (!saleId) {
        toast.error("Sale created but missing saleId");
        return;
      }

      clearCart();
      resetCustomerSelection();
      resetCustomerForm();
      setCustomerMode("WALKIN");
      setDueDate("");
      setAmountPaid("");
      setPaymentMethod("CASH");

      toast.success("Sale completed");
      await loadCustomers();
      void loadDrawerStatus({ silent: true });
      nav(`/app/pos/sales/${saleId}`);
    } catch (err) {
      console.error(err);

      if (handleSubscriptionBlockedError(err, { toastId: "sale-create-blocked" })) {
        return;
      }

      if (
        err?.code === "CASH_DRAWER_CLOSED" ||
        String(err?.message || "").includes("Cash drawer is closed")
      ) {
        toast.error("Cash drawer is closed. Open drawer to make CASH sales.");
        void loadDrawerStatus({ silent: true });
        return;
      }

      toast.error(err?.message || "Failed to complete sale");
    } finally {
      setLoading(false);
    }
  }

  const activeStep = useMemo(() => {
    if (cart.length > 0) return 4;
    if (productQuery.trim() || quickList.length > 0 || productResults.length > 0) return 3;
    if (customerMode !== "WALKIN" || selectedCustomerId || customerForm.name) return 2;
    return 1;
  }, [cart.length, productQuery, quickList.length, productResults.length, customerMode, selectedCustomerId, customerForm.name]);

  if (bootLoading) {
    return <PosSaleSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionHeading
            eyebrow="POS"
            title="Point of sale"
            subtitle="This screen is simple: choose sale type, add products, attach a customer if needed, then finish the sale."
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={() => nav("/app/pos/sales")} className={secondaryBtn()}>
              Sales list
            </button>
            <button onClick={() => nav("/app/pos/credit")} className={secondaryBtn()}>
              Credit
            </button>
            <button onClick={() => nav("/app/pos/drawer")} className={secondaryBtn()}>
              Cash drawer
            </button>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Cart items"
            value={cartItemsCount}
            note="Units already added"
            icon="cart"
          />
          <SummaryCard
            label="Cart total"
            value={formatMoney(total)}
            note="Current sale value"
            tone={saleType === "CREDIT" ? "warning" : "success"}
            icon="money"
          />
          <SummaryCard
            label="Customer"
            value={
              customerMode === "WALKIN"
                ? "Walk-in"
                : customerMode === "PICK"
                ? selectedCustomer?.name || "Pick customer"
                : customerForm.name || "New customer"
            }
            note={
              customerMode === "WALKIN"
                ? "No customer attached yet"
                : customerMode === "PICK"
                ? selectedCustomer?.phone || "Select existing customer"
                : customerForm.phone || "Create during sale"
            }
            tone={saleType === "CREDIT" && customerMode === "WALKIN" ? "danger" : "neutral"}
            loading={customersLoading}
            icon="customer"
          />
          <SummaryCard
            label="Drawer"
            value={drawerLoading ? "Loading..." : drawerOpen ? "Open" : "Closed"}
            note={blockCashSales ? "Cash sales require open drawer" : "Cash sales allowed when closed"}
            tone={drawerOpen ? "success" : "danger"}
            loading={drawerLoading}
            icon="drawer"
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StepCard
            number="1"
            title="Choose sale type"
            text="Cash for immediate payment. Credit if customer will pay later."
            active={activeStep === 1}
          />
          <StepCard
            number="2"
            title="Choose customer"
            text="Walk-in for simple cash sale. Pick or create customer for tracked selling."
            active={activeStep === 2}
          />
          <StepCard
            number="3"
            title="Add products"
            text="Search by name, SKU, or serial. You can also tap quick picks below."
            active={activeStep === 3}
          />
          <StepCard
            number="4"
            title="Review and finish"
            text="Adjust quantities in cart, confirm total, then finalize the sale."
            active={activeStep === 4}
          />
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-5">
          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className={cx("text-lg font-bold", strongText())}>Sale type</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Start here before doing anything else.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSaleType("CASH")}
                  className={modeBtn(saleType === "CASH", "success")}
                >
                  Cash
                </button>

                <button
                  type="button"
                  onClick={() => setSaleType("CREDIT")}
                  className={modeBtn(saleType === "CREDIT", "warning")}
                >
                  Credit
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={cx(softPanel(), "p-4")}>
                <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
                  Current mode
                </div>
                <div className="mt-3">
                  {saleType === "CREDIT" ? (
                    <StatusBadge kind="warning">Credit sale</StatusBadge>
                  ) : (
                    <StatusBadge kind="success">Cash sale</StatusBadge>
                  )}
                </div>
              </div>

              {saleType === "CREDIT" ? (
                <>
                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Due date</label>
                    <input
                      type="date"
                      className={cx(inputClass(), "mt-2")}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>Deposit (optional)</label>
                    <input
                      inputMode="numeric"
                      className={cx(inputClass(), "mt-2")}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(normalizeDigits(e.target.value))}
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className={cx("text-sm font-medium", strongText())}>Deposit method</label>
                    <select
                      className={cx(inputClass(), "mt-2")}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOMO">MoMo</option>
                      <option value="BANK">Bank</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className={cx("text-lg font-bold", strongText())}>Customer</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  For cash sales, walk-in is usually enough. For credit sales, customer is required.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("WALKIN");
                    resetCustomerSelection();
                  }}
                  className={modeBtn(customerMode === "WALKIN")}
                >
                  Walk-in
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("PICK");
                    resetCustomerForm();
                  }}
                  className={modeBtn(customerMode === "PICK")}
                >
                  Pick existing
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("NEW");
                    resetCustomerSelection();
                  }}
                  className={modeBtn(customerMode === "NEW")}
                >
                  New customer
                </button>
              </div>
            </div>

            {saleType === "CREDIT" && customerMode === "WALKIN" ? (
              <div className="mt-4 rounded-[22px] bg-[rgba(219,80,74,0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
                Credit sale cannot be completed as walk-in. Pick an existing customer or create a new one.
              </div>
            ) : null}

            {customerMode === "WALKIN" ? (
              <div className={cx(softPanel(), "mt-5 p-4")}>
                <div className={cx("text-sm font-bold", strongText())}>Walk-in customer selected</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Use this for quick cash sales when you do not need a saved customer record.
                </div>
              </div>
            ) : null}

            {customerMode === "PICK" ? (
              <div className="mt-5">
                <label className={cx("text-sm font-medium", strongText())}>
                  Search customer by name, phone, email, TIN, or ID
                </label>

                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="Search customer..."
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />

                <div className="mt-4">
                  {customersLoading ? (
                    <CustomerSkeleton />
                  ) : filteredCustomers.length === 0 ? (
                    <EmptyState title="No matching customers" text="Try a different name, phone, or email." />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {filteredCustomers.map((c) => (
                        <CustomerCard
                          key={c.id}
                          customer={c}
                          active={selectedCustomerId === c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {customerMode === "NEW" ? (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Full name</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    value={customerForm.name}
                    onChange={(e) => setCustomerField("name", e.target.value)}
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Phone</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    value={customerForm.phone}
                    onChange={(e) => setCustomerField("phone", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Email</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    value={customerForm.email}
                    onChange={(e) => setCustomerField("email", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>Address</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    value={customerForm.address}
                    onChange={(e) => setCustomerField("address", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>TIN number</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    value={customerForm.tinNumber}
                    onChange={(e) => setCustomerField("tinNumber", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={cx("text-sm font-medium", strongText())}>ID number</label>
                  <input
                    className={cx(inputClass(), "mt-2")}
                    value={customerForm.idNumber}
                    onChange={(e) => setCustomerField("idNumber", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={cx("text-sm font-medium", strongText())}>Notes</label>
                  <textarea
                    className={cx(textareaClass(), "mt-2")}
                    value={customerForm.notes}
                    onChange={(e) => setCustomerField("notes", e.target.value)}
                    placeholder="Optional customer notes"
                  />
                </div>
              </div>
            ) : null}
          </section>

          {saleType === "CASH" ? (
            <section className={cx(pageCard(), "p-5 sm:p-6")}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className={cx("text-lg font-bold", strongText())}>Cash drawer</div>
                  <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                    This matters only for cash sales.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AsyncButton
                    loading={drawerRefreshBusy}
                    onClick={() => loadDrawerStatus({ silent: false })}
                    className={secondaryBtn()}
                  >
                    Refresh drawer
                  </AsyncButton>

                  <button
                    type="button"
                    onClick={() => nav("/app/pos/drawer")}
                    className={primaryBtn()}
                  >
                    Open drawer page
                  </button>
                </div>
              </div>

              <div className="mt-5">
                {drawerLoading ? (
                  <StatusBadge>Checking status</StatusBadge>
                ) : drawerOpen ? (
                  <StatusBadge kind="success">Drawer open</StatusBadge>
                ) : (
                  <StatusBadge kind="danger">Drawer closed</StatusBadge>
                )}
              </div>

              {mustOpenDrawerForCash ? (
                <div className="mt-4 rounded-[22px] bg-[rgba(219,80,74,0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
                  Cash drawer is closed. Open it first to complete CASH sales.
                </div>
              ) : null}
            </section>
          ) : null}

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className={cx("text-lg font-bold", strongText())}>Products</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Search a product and press Enter to add the first result, or tap one of the quick picks below.
                </div>
              </div>

              <div className="w-full max-w-md">
                <input
                  className={inputClass()}
                  placeholder="Search by name, SKU, or serial..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  onKeyDown={onProductKeyDown}
                />
              </div>
            </div>

            {!showQuickPicks && searching ? (
              <div className="mt-4">
                <InlineSpinner label="Searching products..." />
              </div>
            ) : null}

            {showQuickPicks ? (
              quickLoading ? (
                <QuickPicksSkeleton />
              ) : (
                <div className="mt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={cx("text-sm font-bold", strongText())}>{quickTitle}</div>
                    <StatusBadge kind="success">Tap any product to add it</StatusBadge>
                  </div>

                  {quickList.length === 0 ? (
                    <div className="mt-4">
                      <EmptyState title="No quick picks yet" text="Products will appear here once the system has recent selling activity or latest items to suggest." />
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      {quickList.map((p) => (
                        <ProductRow key={p.id} product={p} onAdd={addToCart} />
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : productResults.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="No products found" text="Try another name, SKU, or serial." />
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3">
                {productResults.map((p) => (
                  <ProductRow key={p.id} product={p} onAdd={addToCart} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className={cx(pageCard(), "sticky top-5 p-5 sm:p-6")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={cx("text-lg font-bold", strongText())}>Cart</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Every product you add appears here. Adjust quantity, review total, then finalize.
                </div>
              </div>

              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-[var(--color-text-muted)] transition hover:opacity-80 disabled:opacity-50"
                disabled={!cart.length}
              >
                Clear
              </button>
            </div>

            {!cart.length ? (
              <div className="mt-5">
                <EmptyState
                  title="No items in cart yet"
                  text="Start by tapping a product from the left side."
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {cart.map((item) => (
                  <CartItemCard
                    key={item.productId}
                    item={item}
                    onDec={dec}
                    onInc={inc}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            )}

            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <div className="flex items-center justify-between">
                <div className={cx("text-sm", mutedText())}>Total</div>
                <div className={cx("text-[1.8rem] font-black tracking-tight", strongText())}>
                  {formatMoney(total)}
                </div>
              </div>

              <AsyncButton
                loading={loading}
                onClick={completeSale}
                disabled={!cart.length || (saleType === "CASH" && mustOpenDrawerForCash)}
                className={cx(
                  "mt-4 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60",
                  saleType === "CREDIT" ? "bg-[#d9a700] hover:opacity-95" : "bg-[var(--color-primary)] hover:opacity-95"
                )}
              >
                {saleType === "CREDIT" ? "Finalize Credit Sale" : "Finalize Cash Sale"}
              </AsyncButton>

              {saleType === "CASH" && mustOpenDrawerForCash ? (
                <button
                  type="button"
                  onClick={() => nav("/app/pos/drawer")}
                  className={cx(secondaryBtn(), "mt-2 w-full")}
                >
                  Go open the cash drawer
                </button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}