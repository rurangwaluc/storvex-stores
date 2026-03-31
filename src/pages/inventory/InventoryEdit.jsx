import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getProductById, updateProduct } from "../../services/inventoryApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";
import FormPageSkeleton from "../../components/ui/FormPageSkeleton";

const CATEGORY_OPTIONS = [
  "Phones",
  "Laptops",
  "Tablets",
  "Desktop Computers",
  "Monitors",
  "Printers",
  "Networking",
  "TV & Audio",
  "Gaming",
  "Cameras",
  "Storage",
  "Accessories",
  "Smart Devices",
  "Components",
  "Other",
];

const ACCESSORY_SUBCATEGORY_OPTIONS = [
  "Charger",
  "Headphones/Earbuds",
  "Phone cover",
  "Screen protector",
  "Adapter/Dongle",
  "Cable",
  "Power bank",
  "SSD/HDD",
  "RAM",
  "Keyboard/Mouse",
  "Laptop bag",
  "Battery",
  "Remote",
  "Tripod",
  "Microphone",
  "Webcam",
  "Other",
];

function normCategory(v) {
  const x = String(v || "").trim();
  const low = x.toLowerCase();

  if (low === "accessory" || low === "accessories") return "Accessories";
  if (low === "phone" || low === "phones") return "Phones";
  if (low === "laptop" || low === "laptops") return "Laptops";
  if (low === "tablet" || low === "tablets") return "Tablets";
  if (low === "desktop" || low === "desktop computers") return "Desktop Computers";
  if (low === "monitor" || low === "monitors") return "Monitors";
  if (low === "printer" || low === "printers") return "Printers";
  if (low === "network" || low === "networking") return "Networking";
  if (low === "tv" || low === "tv & audio") return "TV & Audio";
  if (low === "gaming") return "Gaming";
  if (low === "camera" || low === "cameras") return "Cameras";
  if (low === "storage") return "Storage";
  if (low === "smart devices" || low === "smart device") return "Smart Devices";
  if (low === "components" || low === "component") return "Components";
  if (x === "Other") return "Other";

  return CATEGORY_OPTIONS.includes(x) ? x : "";
}

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
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

function sectionCard() {
  return "rounded-[24px] border border-stone-200 bg-stone-50/80 p-5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
}

function inputClass() {
  return "mt-2 h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 min-w-[150px] items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function checkboxCardClass(active) {
  return cx(
    "rounded-2xl border p-4 text-left transition",
    active
      ? "border-stone-900 bg-stone-950 text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]"
      : "border-stone-200 bg-white hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:hover:bg-[rgb(var(--bg-muted))]"
  );
}

function SummaryStat({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "danger"
      ? "text-red-600 dark:text-red-300"
      : strongText();

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.14em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-1 text-lg font-semibold", toneClass)}>{value}</div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-1 text-lg font-semibold", strongText())}>{title}</h2>
      {text ? <p className={cx("mt-1 text-sm leading-6", mutedText())}>{text}</p> : null}
    </div>
  );
}

function StatusPill({ text, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
      : tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
      : "border-stone-200 bg-stone-100 text-stone-700 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))] dark:text-[rgb(var(--text-muted))]";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        cls
      )}
    >
      {text}
    </span>
  );
}

export default function InventoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [productMeta, setProductMeta] = useState(null);
  const [hasSerial, setHasSerial] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    serial: "",
    barcode: "",
    costPrice: "",
    sellPrice: "",
    minStockLevel: "",
    category: "",
    subcategory: "",
    subcategoryOther: "",
    brand: "",
  });

  const category = useMemo(() => normCategory(form.category), [form.category]);
  const isAccessories = category === "Accessories";
  const isOtherAccessoryType =
    isAccessories && String(form.subcategory || "").trim() === "Other";

  const buyPrice = Number(form.costPrice || 0);
  const sellPrice = Number(form.sellPrice || 0);
  const currentStock = Number(productMeta?.stockQty || 0);
  const minStockLevel =
    form.minStockLevel === "" ? null : Number(form.minStockLevel || 0);

  const projectedMargin = Number.isFinite(sellPrice - buyPrice) ? sellPrice - buyPrice : 0;
  const estimatedStockCost = Number.isFinite(currentStock * buyPrice) ? currentStock * buyPrice : 0;
  const estimatedStockRetail =
    Number.isFinite(currentStock * sellPrice) ? currentStock * sellPrice : 0;

  const stockTone =
    currentStock <= 0
      ? "danger"
      : minStockLevel != null && currentStock <= minStockLevel
      ? "warning"
      : "success";

  const stockLabel =
    currentStock <= 0
      ? "Out of stock"
      : minStockLevel != null && currentStock <= minStockLevel
      ? "Low stock"
      : "Healthy stock";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const p = await getProductById(String(id));
        if (cancelled) return;

        const cat = normCategory(p?.category);

        setProductMeta(p);
        setForm({
          name: p?.name || "",
          sku: p?.sku || "",
          serial: p?.serial || "",
          barcode: p?.barcode || "",
          costPrice: p?.costPrice ?? "",
          sellPrice: p?.sellPrice ?? "",
          minStockLevel: p?.minStockLevel ?? "",
          category: cat,
          subcategory: p?.subcategory || "",
          subcategoryOther: p?.subcategoryOther || "",
          brand: p?.brand || "",
        });

        setHasSerial(Boolean(String(p?.serial || "").trim()));
      } catch (err) {
        if (!cancelled) {
          if (!handleSubscriptionBlockedError(err, { toastId: "inventory-edit-load-blocked" })) {
            setError(err?.message || "Failed to load product");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onChangeCategory(nextRaw) {
    const next = normCategory(nextRaw);

    setForm((prev) => {
      const out = { ...prev, category: next };
      if (next !== "Accessories") {
        out.subcategory = "";
        out.subcategoryOther = "";
      }
      return out;
    });
  }

  function onToggleSerial(v) {
    const checked = Boolean(v);
    setHasSerial(checked);

    setForm((prev) => ({
      ...prev,
      serial: checked ? prev.serial : "",
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: String(form.name || "").trim(),
        sku: String(form.sku || "").trim() || null,
        serial: hasSerial ? String(form.serial || "").trim() || null : null,
        barcode: String(form.barcode || "").trim() || null,
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        minStockLevel: form.minStockLevel === "" ? null : Number(form.minStockLevel),
        category: category || null,
        brand: String(form.brand || "").trim() || null,
      };

      if (category === "Accessories") {
        payload.subcategory = String(form.subcategory || "").trim() || null;
        payload.subcategoryOther =
          payload.subcategory === "Other"
            ? String(form.subcategoryOther || "").trim() || null
            : null;
      } else {
        payload.subcategory = null;
        payload.subcategoryOther = null;
      }

      if (!payload.name) {
        toast.error("Product name is required");
        return;
      }

      if (!Number.isFinite(payload.costPrice) || payload.costPrice < 0) {
        toast.error("Buy price must be 0 or more");
        return;
      }

      if (!Number.isFinite(payload.sellPrice) || payload.sellPrice < 0) {
        toast.error("Sell price must be 0 or more");
        return;
      }

      if (
        payload.minStockLevel !== null &&
        (!Number.isFinite(payload.minStockLevel) || payload.minStockLevel < 0)
      ) {
        toast.error("Minimum stock level must be 0 or more");
        return;
      }

      if (hasSerial && !String(payload.serial || "").trim()) {
        toast.error("Serial / IMEI is required when tracking is enabled");
        return;
      }

      if (
        category === "Accessories" &&
        payload.subcategory === "Other" &&
        !String(payload.subcategoryOther || "").trim()
      ) {
        toast.error("Custom accessory type is required");
        return;
      }

      await updateProduct(String(id), payload);

      toast.success("Product updated");
      navigate("/app/inventory");
    } catch (err) {
      const msg = err?.message || "Failed to update product";

      if (handleSubscriptionBlockedError(err, { toastId: "inventory-edit-save-blocked" })) {
        return;
      }

      if (String(msg).toLowerCase().includes("serial")) {
        setError("This Serial/IMEI is already used. Please change it.");
      } else if (String(msg).toLowerCase().includes("barcode")) {
        setError("This barcode is already used. Please change it.");
      } else if (String(msg).toLowerCase().includes("sku")) {
        setError("This item code is already used. Please change it.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <FormPageSkeleton showSideCard={true} titleWidth="w-36" fieldPairs={5} />;
  }

  if (error && !form?.name) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                Inventory
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Edit product
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Update catalog structure, pricing, category placement, and product tracking while
                keeping stock control disciplined through stock-adjustment workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/app/inventory")}
                className={secondaryBtn()}
                disabled={saving}
              >
                Back to inventory
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/inventory/stock-history")}
                className={secondaryBtn()}
                disabled={saving}
              >
                Stock history
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Current stock" value={currentStock} tone={stockTone} />
          <SummaryStat
            label="Unit margin"
            value={formatMoney(projectedMargin)}
            tone={projectedMargin > 0 ? "success" : projectedMargin < 0 ? "danger" : "warning"}
          />
          <SummaryStat label="Stock cost value" value={formatMoney(estimatedStockCost)} />
          <SummaryStat
            label="Stock retail value"
            value={formatMoney(estimatedStockRetail)}
            tone={stockTone}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} className="space-y-5">
          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <section className={cx(shell(), "p-5")}>
            <SectionHeading
              eyebrow="Identity"
              title="Product identity"
              text="Refine the exact way this product should be recognized across search, inventory, and selling flows."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>Product name</label>
                <input
                  className={inputClass()}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Item code / SKU</label>
                <input
                  className={inputClass()}
                  value={form.sku}
                  onChange={(e) => setField("sku", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Brand</label>
                <input
                  className={inputClass()}
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Barcode</label>
                <input
                  className={inputClass()}
                  value={form.barcode}
                  onChange={(e) => setField("barcode", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Category</label>
                <select
                  className={inputClass()}
                  value={category}
                  onChange={(e) => onChangeCategory(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {isAccessories ? (
                <>
                  <div>
                    <label className={cx("text-sm font-medium", strongText())}>
                      Accessory type
                    </label>
                    <select
                      className={inputClass()}
                      value={form.subcategory}
                      onChange={(e) => setField("subcategory", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Select accessory type</option>
                      {ACCESSORY_SUBCATEGORY_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isOtherAccessoryType ? (
                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>
                        Custom accessory type
                      </label>
                      <input
                        className={inputClass()}
                        value={form.subcategoryOther}
                        onChange={(e) => setField("subcategoryOther", e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <SectionHeading
              eyebrow="Tracking"
              title="Tracking rules"
              text="Control whether this product should remain bulk-managed or uniquely tracked by serial / IMEI."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => onToggleSerial(false)}
                className={checkboxCardClass(!hasSerial)}
                disabled={saving}
              >
                <div className="text-sm font-semibold">No serial tracking</div>
                <div className={cx("mt-1 text-sm", !hasSerial ? "text-white/80" : mutedText())}>
                  Best for bulk stock and non-unique units.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onToggleSerial(true)}
                className={checkboxCardClass(hasSerial)}
                disabled={saving}
              >
                <div className="text-sm font-semibold">Track by serial / IMEI</div>
                <div className={cx("mt-1 text-sm", hasSerial ? "text-white/80" : mutedText())}>
                  Best for high-control electronics with unique identity.
                </div>
              </button>

              {hasSerial ? (
                <div className="md:col-span-2">
                  <label className={cx("text-sm font-medium", strongText())}>Serial / IMEI</label>
                  <input
                    className={inputClass()}
                    value={form.serial}
                    onChange={(e) => setField("serial", e.target.value)}
                    disabled={saving}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <SectionHeading
              eyebrow="Pricing"
              title="Pricing setup"
              text="Refine buy and sell prices without touching stock quantities directly."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={cx("text-sm font-medium", strongText())}>Buy price</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.costPrice}
                  onChange={(e) => setField("costPrice", e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Sell price</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.sellPrice}
                  onChange={(e) => setField("sellPrice", e.target.value)}
                  required
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <SectionHeading
              eyebrow="Stock policy"
              title="Minimum stock rule"
              text="Keep the threshold realistic so the system flags replenishment risk early."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={cx("text-sm font-medium", strongText())}>
                  Minimum stock level
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.minStockLevel}
                  onChange={(e) => setField("minStockLevel", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className={sectionCard()}>
                <div className={cx("text-sm font-semibold", strongText())}>Current stock rule</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Quantity changes are intentionally blocked here. Use stock adjustment tools so
                  every movement stays logged and accountable.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill text={stockLabel} tone={stockTone} />
                  <StatusPill
                    text={`Current stock ${currentStock}`}
                    tone={stockTone}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/app/inventory")}
                className={secondaryBtn()}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" className={primaryBtn()} disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating...
                  </span>
                ) : (
                  "Update product"
                )}
              </button>
            </div>
          </section>
        </form>

        <aside className="space-y-5">
          <section className={cx(shell(), "p-5")}>
            <SectionHeading
              eyebrow="Preview"
              title="Live product snapshot"
              text="A fast owner-level read of how this product currently sits inside the inventory system."
            />

            <div className="mt-5 space-y-4">
              <div className={sectionCard()}>
                <div className={cx("text-base font-semibold", strongText())}>
                  {form.name || "Unnamed product"}
                </div>
                <div className={cx("mt-1 text-sm", mutedText())}>
                  {form.brand || "No brand selected"}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill text={category || "No category"} />
                  {isAccessories && form.subcategory ? (
                    <StatusPill
                      text={
                        form.subcategory === "Other"
                          ? form.subcategoryOther || "Other accessory"
                          : form.subcategory
                      }
                    />
                  ) : null}
                  {hasSerial ? (
                    <StatusPill text="Serial tracked" tone="success" />
                  ) : (
                    <StatusPill text="Bulk tracked" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <SummaryStat
                  label="Current stock status"
                  value={stockLabel}
                  tone={stockTone}
                />
                <SummaryStat
                  label="Stock cost value"
                  value={formatMoney(estimatedStockCost)}
                />
                <SummaryStat
                  label="Stock retail value"
                  value={formatMoney(estimatedStockRetail)}
                  tone={stockTone}
                />
                <SummaryStat
                  label="Unit margin"
                  value={formatMoney(projectedMargin)}
                  tone={projectedMargin > 0 ? "success" : projectedMargin < 0 ? "danger" : "warning"}
                />
              </div>
            </div>
          </section>

          <section className={cx(shell(), "p-5")}>
            <SectionHeading
              eyebrow="Control"
              title="Stock discipline"
              text="This keeps catalog editing separated from physical stock movement."
            />

            <div className="mt-4 space-y-3">
              <div className={sectionCard()}>
                <div className={cx("text-sm font-semibold", strongText())}>Current stock</div>
                <div className={cx("mt-2 text-3xl font-semibold", strongText())}>
                  {currentStock}
                </div>
                <div className={cx("mt-2 text-sm", mutedText())}>
                  Use stock adjustment tools for restock, loss, theft, damage, and physical-count corrections.
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/app/inventory/stock-history")}
                className={secondaryBtn()}
                disabled={saving}
              >
                View stock history
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/inventory/reorder")}
                className={secondaryBtn()}
                disabled={saving}
              >
                Open reorder list
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}