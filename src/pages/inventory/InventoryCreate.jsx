import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
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
  return `Rwf ${Number(n || 0).toLocaleString("en-US")}`;
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

function primaryBtn() {
  return "inline-flex h-11 min-w-[160px] items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:opacity-60";
}

function chipCardClass(active) {
  return cx(
    "rounded-[22px] p-4 text-left transition",
    active
      ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
      : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
  );
}

function SummaryStat({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "danger"
      ? "text-[var(--color-danger)]"
      : strongText();

  return (
    <div className="rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]">
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 text-xl font-black tracking-tight", toneClass)}>{value}</div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-3 text-[1.5rem] font-black tracking-tight", strongText())}>{title}</h2>
      {text ? <p className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</p> : null}
    </div>
  );
}

function StatusPill({ text, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : tone === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
      {text}
    </span>
  );
}

function FormField({ label, children, hint = "" }) {
  return (
    <div>
      <label className={cx("text-sm font-medium", strongText())}>{label}</label>
      <div className="mt-2">{children}</div>
      {hint ? <p className={cx("mt-2 text-xs leading-5", softText())}>{hint}</p> : null}
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
  const minStockLevel = form.minStockLevel === "" ? null : Number(form.minStockLevel || 0);

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
    <div className="space-y-6">
      <section className="space-y-5">
        <div>
          <h1 className={cx("text-4xl font-black tracking-tight sm:text-5xl", strongText())}>
            Create product
          </h1>
          <p className={cx("mt-3 max-w-3xl text-sm leading-6", mutedText())}>
            Add a new inventory item with pricing, stock setup, category structure, and tracking
            rules that fit a real electronics retail workflow.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <SummaryStat label="Opening stock" value={Number.isFinite(stockQty) ? stockQty : 0} tone={stockTone} />
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
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} className="space-y-5">
          {error ? (
            <div className="rounded-[22px] bg-[rgba(219,80,74,0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Identity"
              title="Product identity"
              text="Define the item exactly the way your staff should recognize and search it."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField
                  label="Product name"
                  hint="Use the exact product name staff should search and recognize quickly."
                >
                  <input
                    placeholder="Example: Samsung Galaxy A15 128GB"
                    className={inputClass()}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                    disabled={saving}
                  />
                </FormField>
              </div>

              <FormField
                label="Item code / SKU"
                hint="Optional, but useful for search, reporting, and internal control."
              >
                <input
                  placeholder="Example: SAM-A15-128-BLK"
                  className={inputClass()}
                  value={form.itemCode}
                  onChange={(e) => setField("itemCode", e.target.value)}
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Brand"
                hint="Use the commercial brand exactly as you want it displayed across inventory."
              >
                <input
                  placeholder="Apple, Samsung, HP, Epson..."
                  className={inputClass()}
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Barcode"
                hint="Useful when scanning stock or matching items physically in store."
              >
                <input
                  placeholder="Optional barcode"
                  className={inputClass()}
                  value={form.barcode}
                  onChange={(e) => setField("barcode", e.target.value)}
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Category"
                hint="Pick the main category the team will expect this product to live under."
              >
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
              </FormField>

              {isAccessories ? (
                <>
                  <FormField
                    label="Accessory type"
                    hint="Use a sub-type so accessories stay organized and searchable."
                  >
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
                  </FormField>

                  {isOtherAccessoryType ? (
                    <FormField
                      label="Custom accessory type"
                      hint="Only fill this when the accessory type is not covered above."
                    >
                      <input
                        className={inputClass()}
                        value={form.subcategoryOther}
                        onChange={(e) => setField("subcategoryOther", e.target.value)}
                        placeholder="Example: Laptop adapter"
                        disabled={saving}
                      />
                    </FormField>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Tracking"
              title="Tracking rules"
              text="Decide whether this item should carry unique serial or IMEI control."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => onToggleSerial(false)}
                className={chipCardClass(!hasSerial)}
                disabled={saving}
              >
                <div className="text-sm font-semibold">No serial tracking</div>
                <div className={cx("mt-2 text-sm leading-6", !hasSerial ? "text-white/80" : mutedText())}>
                  Best for bulk accessories or general stock items.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onToggleSerial(true)}
                className={chipCardClass(hasSerial)}
                disabled={saving}
              >
                <div className="text-sm font-semibold">Track by serial / IMEI</div>
                <div className={cx("mt-2 text-sm leading-6", hasSerial ? "text-white/80" : mutedText())}>
                  Best for phones, laptops, and other uniquely tracked units.
                </div>
              </button>

              {hasSerial ? (
                <div className="md:col-span-2">
                  <FormField label="Serial / IMEI" hint="Required when unique tracking is enabled.">
                    <input
                      placeholder="Unique serial or IMEI"
                      className={inputClass()}
                      value={form.serial}
                      onChange={(e) => setField("serial", e.target.value)}
                      disabled={saving}
                    />
                  </FormField>
                </div>
              ) : null}
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Pricing"
              title="Pricing setup"
              text="Set buy and sell prices with enough margin clarity before this item goes live."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Buy price" hint="Your acquisition cost per unit.">
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.costPrice}
                  onChange={(e) => setField("costPrice", e.target.value)}
                  required
                  disabled={saving}
                />
              </FormField>

              <FormField label="Sell price" hint="The retail price staff will use when selling.">
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.sellPrice}
                  onChange={(e) => setField("sellPrice", e.target.value)}
                  required
                  disabled={saving}
                />
              </FormField>
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Stock"
              title="Opening stock setup"
              text="Create the product with the correct opening quantity and the minimum level that should trigger attention."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="Opening stock"
                hint="The number of units you physically have available right now."
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.stockQty}
                  onChange={(e) => setField("stockQty", e.target.value)}
                  required
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Minimum stock level"
                hint="When stock reaches this number, the system should start drawing attention."
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass()}
                  value={form.minStockLevel}
                  onChange={(e) => setField("minStockLevel", e.target.value)}
                  placeholder="Example: 5"
                  disabled={saving}
                />
              </FormField>
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/app/inventory")}
                className={secondaryBtn()}
                disabled={saving}
              >
                Cancel
              </button>

              <AsyncButton type="submit" loading={saving} className={primaryBtn()}>
                Save product
              </AsyncButton>
            </div>
          </section>
        </form>

        <aside className="space-y-5">
          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Preview"
              title="Live product snapshot"
              text="This gives the owner a fast read on how this item will enter the inventory system."
            />

            <div className="mt-6 space-y-4">
              <div className={cx(softPanel(), "p-5")}>
                <div className={cx("text-lg font-bold", strongText())}>
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
                  {hasSerial ? <StatusPill text="Serial tracked" tone="success" /> : <StatusPill text="Bulk tracked" />}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <SummaryStat label="Opening stock status" value={stockLabel} tone={stockTone} />
                <SummaryStat label="Estimated stock cost" value={formatMoney(estimatedStockCost)} />
                <SummaryStat label="Estimated stock retail" value={formatMoney(estimatedStockRetail)} />
                <SummaryStat
                  label="Unit margin"
                  value={formatMoney(projectedMargin)}
                  tone={projectedMargin > 0 ? "success" : projectedMargin < 0 ? "danger" : "warning"}
                />
              </div>
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <SectionHeading
              eyebrow="Control"
              title="Operational discipline"
              text="These rules keep inventory cleaner once real staff start using the system."
            />

            <div className="mt-5 space-y-3">
              {[
                "Use a clear product name staff can recognize immediately.",
                "Use SKU or item code for faster search and reporting.",
                "Use serial tracking only when each unit must be uniquely controlled.",
                "Set a realistic minimum stock level so shortages are caught early.",
                "After creation, future quantity changes should go through stock adjustment flow.",
              ].map((item) => (
                <div key={item} className={cx(softPanel(), "px-4 py-3 text-sm leading-6", mutedText())}>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}