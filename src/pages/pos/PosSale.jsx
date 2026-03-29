import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";
import InlineSpinner from "../../components/ui/InlineSpinner";

import { createSale, getQuickPicks } from "../../services/posApi";
import { searchProducts } from "../../services/inventoryApi";
import { listCustomers } from "../../services/customersApi";
import { getCashDrawerStatus } from "../../services/cashDrawerApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

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
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function inputClass() {
  return "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "min-h-[96px] w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function modeBtn(active, tone = "neutral") {
  if (!active) return secondaryBtn();

  if (tone === "success") {
    return "inline-flex h-10 items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-medium text-white";
  }

  if (tone === "warning") {
    return "inline-flex h-10 items-center justify-center rounded-xl border border-amber-600 bg-amber-600 px-4 text-sm font-medium text-white";
  }

  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-900 bg-stone-900 px-4 text-sm font-medium text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]";
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

function QuickPicksSkeleton() {
  return (
    <div className="mt-4">
      <div className="mb-3 h-4 w-40 rounded bg-stone-200 dark:bg-[rgb(var(--bg-muted))]" />
      <table className="w-full">
        <tbody>
          <TableSkeleton rows={6} cols={3} />
        </tbody>
      </table>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className={cx(shell(), "p-4")}>
      <table className="w-full">
        <tbody>
          <TableSkeleton rows={4} cols={2} />
        </tbody>
      </table>
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
        "mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm",
        mutedText()
      )}
    >
      {text}
    </div>
  );
}

export default function PosSale() {
  const nav = useNavigate();

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

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setQuickLoading(true);
      try {
        const data = await getQuickPicks(7, 10);
        if (cancelled || !mountedRef.current) return;

        setQuickBest(Array.isArray(data?.bestSellers) ? data.bestSellers : []);
        setQuickLatest(Array.isArray(data?.latest) ? data.latest : []);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        console.error(e);
        if (!handleSubscriptionBlockedError(e, { toastId: "quick-picks-blocked" })) {
          setQuickBest([]);
          setQuickLatest([]);
        }
      } finally {
        if (cancelled || !mountedRef.current) return;
        setQuickLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadDrawerStatus({ silent: true });
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
    }, 250);

    return () => {
      cancelled = true;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [productQuery]);

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
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity - 1) }
          : i
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

  useEffect(() => {
    if (saleType === "CASH") {
      setDueDate("");
      setAmountPaid("");
      setPaymentMethod("CASH");
      void loadDrawerStatus({ silent: true });
    }
  }, [saleType]);

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                POS
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Point of sale
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Build the sale, attach the right customer, and complete checkout with confidence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Cart items"
            value={cartItemsCount}
            note="Total units currently in cart"
          />
          <SummaryCard
            label="Cart total"
            value={formatMoney(total)}
            note="Current sale value"
            tone={saleType === "CREDIT" ? "warning" : "success"}
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
          />
          <SummaryCard
            label="Drawer"
            value={drawerLoading ? "Loading..." : drawerOpen ? "Open" : "Closed"}
            note={blockCashSales ? "Cash sales blocked when closed" : "Cash sales allowed when closed"}
            tone={drawerOpen ? "success" : "danger"}
            loading={drawerLoading}
          />
        </div>
      </section>

      <section className={cx(shell(), "p-4")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading
            title="Sale mode"
            subtitle="Choose payment workflow before finalizing the cart."
          />

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

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className={cx("text-sm font-medium", strongText())}>Sale type</label>
            <div className="mt-2">
              {saleType === "CREDIT"
                ? statusPill("warning", "Credit workflow enabled")
                : statusPill("success", "Immediate payment workflow")}
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

      <section className={cx(shell(), "p-4")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading
            title="Customer"
            subtitle="Attach a customer to this sale, or continue as walk-in."
          />

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
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            Credit sale cannot be completed as walk-in. Pick an existing customer or create a new one.
          </div>
        ) : null}

        {customerMode === "WALKIN" ? (
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
            <div className={cx("text-sm font-medium", strongText())}>Walk-in customer</div>
            <p className={cx("mt-1 text-sm", mutedText())}>
              Use this only for simple cash sales where no customer record is needed.
            </p>
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

            <div className="mt-3">
              {customersLoading ? (
                <CustomerSkeleton />
              ) : filteredCustomers.length === 0 ? (
                <EmptyState text="No matching customers found." />
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {filteredCustomers.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={cx(
                        "rounded-xl border px-3 py-3 text-left transition",
                        selectedCustomerId === c.id
                          ? "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:hover:bg-[rgb(var(--bg-muted))]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={cx("text-sm font-medium", strongText())}>{c.name}</div>
                          <div className={cx("mt-1 text-xs", mutedText())}>{c.phone}</div>

                          {c.email ? (
                            <div className={cx("mt-1 text-xs", softText())}>{c.email}</div>
                          ) : null}

                          {c.outstanding > 0 ? (
                            <div className="mt-2">
                              {statusPill("warning", `Outstanding ${formatMoney(c.outstanding)}`)}
                            </div>
                          ) : null}
                        </div>

                        {selectedCustomerId === c.id ? statusPill("success", "Selected") : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {customerMode === "NEW" ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
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
        <section className={cx(shell(), "p-4")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className={cx("text-sm font-medium", strongText())}>Cash drawer control</div>
              <div className={cx("mt-1 text-sm", mutedText())}>
                {drawerLoading
                  ? "Checking drawer status..."
                  : drawerOpen
                  ? "Drawer is open and ready for cash sales."
                  : "Drawer is closed."}
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

          <div className="mt-3">
            {drawerLoading
              ? statusPill("neutral", "Checking status")
              : drawerOpen
              ? statusPill("success", "Drawer open")
              : statusPill("danger", "Drawer closed")}
          </div>

          {mustOpenDrawerForCash ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              Cash drawer is closed. Open it first to complete CASH sales.
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className={cx(shell(), "p-4 lg:col-span-2")}>
          <div className="flex items-center justify-between gap-3">
            <SectionHeading
              title="Products"
              subtitle="Search inventory or use quick picks to build the sale."
            />

            <div className="w-80 max-w-full">
              <input
                className={inputClass()}
                placeholder="Search name / SKU / serial... (Enter adds first result)"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={onProductKeyDown}
              />

              {!showQuickPicks && searching ? (
                <div className="mt-2">
                  <InlineSpinner label="Searching..." />
                </div>
              ) : null}
            </div>
          </div>

          {showQuickPicks ? (
            quickLoading ? (
              <QuickPicksSkeleton />
            ) : (
              <>
                <div className={cx("mt-4 text-sm font-medium", strongText())}>{quickTitle}</div>

                {quickList.length === 0 ? (
                  <EmptyState text="No products." />
                ) : (
                  <div className="mt-3 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 dark:divide-[rgb(var(--border))] dark:border-[rgb(var(--border))]">
                    {quickList.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={Number(p.stockQty || 0) <= 0}
                        className={cx(
                          "flex w-full items-center justify-between gap-3 p-4 text-left transition",
                          Number(p.stockQty || 0) <= 0
                            ? "cursor-not-allowed opacity-60"
                            : "hover:bg-stone-50 dark:hover:bg-[rgb(var(--bg-muted))]"
                        )}
                      >
                        <div>
                          <div className={cx("text-sm font-medium", strongText())}>{p.name}</div>
                          <div className={cx("mt-1 text-xs", mutedText())}>
                            Stock: <span className="font-medium">{p.stockQty}</span>
                            {p.soldQty != null ? (
                              <>
                                {" • "}Sold (7d): <span className="font-medium">{p.soldQty}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className={cx("text-sm font-semibold", strongText())}>
                          {formatMoney(p.sellPrice)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          ) : productResults.length === 0 ? (
            <EmptyState text="No results." />
          ) : (
            <div className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 dark:divide-[rgb(var(--border))] dark:border-[rgb(var(--border))]">
              {productResults.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={Number(p.stockQty || 0) <= 0}
                  className={cx(
                    "flex w-full items-center justify-between gap-3 p-4 text-left transition",
                    Number(p.stockQty || 0) <= 0
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-stone-50 dark:hover:bg-[rgb(var(--bg-muted))]"
                  )}
                >
                  <div>
                    <div className={cx("text-sm font-medium", strongText())}>{p.name}</div>
                    <div className={cx("mt-1 text-xs", mutedText())}>
                      {p.sku ? `SKU: ${p.sku} • ` : ""}
                      {p.serial ? `Serial: ${p.serial} • ` : ""}
                      Stock: <span className="font-medium">{p.stockQty}</span>
                    </div>
                  </div>

                  <div className={cx("text-sm font-semibold", strongText())}>
                    {formatMoney(p.sellPrice)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={cx(shell(), "p-4")}>
          <div className="flex items-center justify-between gap-3">
            <SectionHeading
              title="Cart"
              subtitle="Review quantities and complete the sale."
            />

            <button
              type="button"
              onClick={clearCart}
              className="text-sm text-stone-600 transition hover:text-stone-900 disabled:opacity-50 dark:text-[rgb(var(--text-muted))] dark:hover:text-[rgb(var(--text))]"
              disabled={!cart.length}
            >
              Clear
            </button>
          </div>

          {!cart.length ? (
            <EmptyState text="No items in cart yet." />
          ) : (
            <div className="mt-4 space-y-3">
              {cart.map((i) => (
                <div
                  key={i.productId}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={cx("text-sm font-medium", strongText())}>{i.name}</div>
                      <div className={cx("mt-1 text-xs", mutedText())}>{formatMoney(i.price)}</div>
                      <div className={cx("mt-1 text-[11px]", softText())}>Stock: {i.stockQty}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(i.productId)}
                      className="text-xs text-rose-700 transition hover:underline dark:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => dec(i.productId)}
                        className="h-9 w-9 rounded-xl border border-stone-300 bg-white text-sm transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:hover:bg-[rgb(var(--bg-muted))]"
                      >
                        −
                      </button>

                      <div className={cx("w-8 text-center text-sm font-semibold", strongText())}>
                        {i.quantity}
                      </div>

                      <button
                        type="button"
                        onClick={() => inc(i.productId)}
                        className="h-9 w-9 rounded-xl border border-stone-300 bg-white text-sm transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:hover:bg-[rgb(var(--bg-muted))]"
                      >
                        +
                      </button>
                    </div>

                    <div className={cx("text-sm font-semibold", strongText())}>
                      {formatMoney(i.price * i.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-stone-200 pt-4 dark:border-[rgb(var(--border))]">
            <div className="flex items-center justify-between">
              <div className={cx("text-sm", mutedText())}>Total</div>
              <div className={cx("text-xl font-semibold", strongText())}>{formatMoney(total)}</div>
            </div>

            <AsyncButton
              loading={loading}
              onClick={completeSale}
              disabled={!cart.length || (saleType === "CASH" && mustOpenDrawerForCash)}
              className={cx(
                "mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60",
                saleType === "CREDIT"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
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
      </div>
    </div>
  );
} 