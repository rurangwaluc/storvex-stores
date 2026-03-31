import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createProduct } from "../../services/inventoryApi";
import { handleSubscriptionBlockedError } from "../../utils/subscriptionError";

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

function checkboxCardClass(active) {
  return cx(
    "rounded-2xl border p-4 transition",
    active
      ? "border-stone-900 bg-stone-950 text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]"
      : "border-stone-200 bg-white hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:hover:bg-[rgb(var(--bg-muted))]"
  );
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 min-w-[150px] items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
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

export default function InventoryCreate() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasSerial, setHasSerial] = useState(false);

  const [form, setForm] = useState({
    name: "",
    itemCode: "",
    serial: "",
    barcode: "",
    costPrice: "",
    sellPrice: "",
    stockQty: "",
    minStockLevel: "",
    category: "",
    subcategory: "",
    subcategoryOther: "",
    brand: "",
  });

  const category = useMemo(() => normCategory(form.category), [form.category]);
  const isAccessories = category === "Accessories";
  const isOtherAccessoryType = isAccessories && String(form.subcategory || "") === "Other";

  const buyPrice = Number(form.costPrice || 0);
  const sellPrice = Number(form.sellPrice || 0);
  const stockQty = Number(form.stockQty || 0);
  const minStockLevel =
    form.minStockLevel === "" ? null : Number(form.minStockLevel || 0);

  const projectedMargin = Number.isFinite(sellPrice - buyPrice) ? sellPrice - buyPrice : 0;
  const estimatedStockCost = Number.isFinite(stockQty * buyPrice) ? stockQty * buyPrice : 0;
  const estimatedStockRetail = Number.isFinite(stockQty * sellPrice) ? stockQty * sellPrice : 0;

  const stockTone =
    stockQty <= 0 ? "danger" : minStockLevel != null && stockQty <= minStockLevel ? "warning" : "success";

  const stockLabel =
    stockQty <= 0
      ? "No opening stock"
      : minStockLevel != null && stockQty <= minStockLevel
      ? "Low opening stock"
      : "Healthy opening stock";

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
        sku: String(form.itemCode || "").trim() || null,
        serial: hasSerial ? String(form.serial || "").trim() || null : null,
        barcode: String(form.barcode || "").trim() || null,
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        stockQty: Number(form.stockQty),
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

      if (!Number.isFinite(payload.stockQty) || payload.stockQty < 0) {
        toast.error("Opening stock must be 0 or more");
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

      await createProduct(payload);

      toast.success("Product created");
      navigate("/app/inventory");
    } catch (err) {
      const msg = err?.message || "Failed to create product";

      if (handleSubscriptionBlockedError(err, { toastId: "inventory-create-blocked" })) {
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
                Create product
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Add a new inventory item with pricing, stock setup, category structure, and
                tracking rules that fit a real electronics retail workflow.
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            label="Opening stock"
            value={Number.isFinite(stockQty) ? stockQty : 0}
            tone={stockTone}
          />
          <SummaryStat
            label="Unit margin"
            value={formatMoney(projectedMargin)}
            tone={projectedMargin > 0 ? "success" : projectedMargin < 0 ? "danger" : "warning"}
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
              text="Define the item exactly the way your staff should recognize and search it."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={cx("text-sm font-medium", strongText())}>Product name</label>
                <input
                  placeholder="Example: Samsung Galaxy A15 128GB"
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
                  placeholder="Example: SAM-A15-128-BLK"
                  className={inputClass()}
                  value={form.itemCode}
                  onChange={(e) => setField("itemCode", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Brand</label>
                <input
                  placeholder="Apple, Samsung, HP, Epson..."
                  className={inputClass()}
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Barcode</label>
                <input
                  placeholder="Optional barcode"
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
                        placeholder="Example: Laptop adapter"
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
              text="Decide whether this item should carry unique serial or IMEI control."
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
                  Best for bulk accessories or general stock items.
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
                  Best for phones, laptops, and other uniquely tracked units.
                </div>
              </button>

              {hasSerial ? (
                <div className="md:col-span-2">
                  <label className={cx("text-sm font-medium", strongText())}>Serial / IMEI</label>
                  <input
                    placeholder="Unique serial or IMEI"
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
              text="Set buy and sell prices with enough margin clarity before this item goes live."
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
              eyebrow="Stock"
              title="Opening stock setup"
              text="Create the product with the correct opening quantity and the minimum level that should trigger attention."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={cx("text-sm font-medium", strongText())}>Opening stock</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.stockQty}
                  onChange={(e) => setField("stockQty", e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

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
                  placeholder="Example: 5"
                  disabled={saving}
                />
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
                    Saving...
                  </span>
                ) : (
                  "Save product"
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
              text="This gives the owner a fast read on how this item will enter the inventory system."
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
                    <StatusPill text={form.subcategory === "Other" ? form.subcategoryOther || "Other accessory" : form.subcategory} />
                  ) : null}
                  {hasSerial ? <StatusPill text="Serial tracked" tone="success" /> : <StatusPill text="Bulk tracked" />}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <SummaryStat
                  label="Opening stock status"
                  value={stockLabel}
                  tone={stockTone}
                />
                <SummaryStat
                  label="Estimated stock cost"
                  value={formatMoney(estimatedStockCost)}
                />
                <SummaryStat
                  label="Estimated stock retail"
                  value={formatMoney(estimatedStockRetail)}
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
              title="Operational discipline"
              text="These rules keep inventory cleaner once real staff start using the system."
            />

            <ul className={cx("mt-4 space-y-3 text-sm leading-6", mutedText())}>
              <li>Use a clear product name staff can recognize immediately.</li>
              <li>Use SKU or item code for faster search and reporting.</li>
              <li>Use serial tracking only when each unit must be uniquely controlled.</li>
              <li>Set a realistic minimum stock level so shortages are caught early.</li>
              <li>After creation, future quantity changes should go through stock adjustment flow.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatusPill({ text, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
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