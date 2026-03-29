import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createProduct } from "../../services/inventoryApi";

const CATEGORY_OPTIONS = ["Phones", "Laptops", "Accessories", "Other"];

const SUBCATEGORY_OPTIONS = [
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
  "Other",
];

function normCategory(v) {
  const x = String(v || "").trim();
  const low = x.toLowerCase();
  if (low === "accessory" || low === "accessories") return "Accessories";
  if (low === "phone" || low === "phones") return "Phones";
  if (low === "laptop" || low === "laptops") return "Laptops";
  if (x === "Other") return "Other";
  return CATEGORY_OPTIONS.includes(x) ? x : "";
}

function cardInputClass() {
  return "mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none transition focus:border-[rgb(var(--text-soft))] focus:ring-2 focus:ring-[rgb(var(--border))]";
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
  const isOtherType = isAccessories && String(form.subcategory || "") === "Other";

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
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
    if (!checked) setField("serial", "");
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
        minStockLevel:
          form.minStockLevel === "" ? null : Number(form.minStockLevel),
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

      if (!payload.name) return toast.error("Product name is required");
      if (!Number.isFinite(payload.costPrice) || payload.costPrice < 0) {
        return toast.error("Buy price must be 0 or more");
      }
      if (!Number.isFinite(payload.sellPrice) || payload.sellPrice < 0) {
        return toast.error("Sell price must be 0 or more");
      }
      if (!Number.isFinite(payload.stockQty) || payload.stockQty < 0) {
        return toast.error("Opening stock must be 0 or more");
      }
      if (
        payload.minStockLevel !== null &&
        (!Number.isFinite(payload.minStockLevel) || payload.minStockLevel < 0)
      ) {
        return toast.error("Minimum stock level must be 0 or more");
      }

      await createProduct(payload);

      toast.success("Product created");
      navigate("/app/inventory");
    } catch (err) {
      const msg = err?.message || "Failed to create product";
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
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">New product</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Add a product with opening stock, pricing, and tracking details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/app/inventory")}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))]"
          disabled={saving}
        >
          Back to inventory
        </button>
      </div>

      <form
        onSubmit={submit}
        className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-sm"
      >
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Product details</h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Fill the catalog and opening stock carefully. Stock edits later must go through stock adjustments.
          </p>
        </div>

        <div className="space-y-6 px-5 py-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[rgb(var(--text))]">Product name</label>
              <input
                placeholder="Example: iPhone 13 128GB"
                className={cardInputClass()}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Item code</label>
              <input
                placeholder="Example: IP13-128-BLK"
                className={cardInputClass()}
                value={form.itemCode}
                onChange={(e) => setField("itemCode", e.target.value)}
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Brand</label>
              <input
                placeholder="Apple, Samsung, HP"
                className={cardInputClass()}
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Barcode</label>
              <input
                placeholder="Optional barcode"
                className={cardInputClass()}
                value={form.barcode}
                onChange={(e) => setField("barcode", e.target.value)}
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Category</label>
              <select
                className={cardInputClass()}
                value={category}
                onChange={(e) => onChangeCategory(e.target.value)}
                disabled={saving}
              >
                <option value="">—</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Accessory type</label>
              <select
                className={cardInputClass()}
                value={form.subcategory}
                onChange={(e) => setField("subcategory", e.target.value)}
                disabled={!isAccessories || saving}
              >
                <option value="">—</option>
                {SUBCATEGORY_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {isOtherType ? (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[rgb(var(--text))]">Custom accessory type</label>
                <input
                  className={cardInputClass()}
                  value={form.subcategoryOther}
                  onChange={(e) => setField("subcategoryOther", e.target.value)}
                  placeholder="Example: Laptop adapter"
                  disabled={saving}
                />
              </div>
            ) : null}

            <div className="md:col-span-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
              <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text))]">
                <input
                  type="checkbox"
                  checked={hasSerial}
                  onChange={(e) => onToggleSerial(e.target.checked)}
                  disabled={saving}
                />
                This item has Serial / IMEI tracking
              </label>

              {hasSerial ? (
                <div className="mt-3">
                  <label className="text-sm font-medium text-[rgb(var(--text))]">Serial / IMEI</label>
                  <input
                    placeholder="Unique serial or IMEI"
                    className={cardInputClass()}
                    value={form.serial}
                    onChange={(e) => setField("serial", e.target.value)}
                    disabled={saving}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Buy price</label>
              <input
                type="number"
                min="0"
                className={cardInputClass()}
                value={form.costPrice}
                onChange={(e) => setField("costPrice", e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Sell price</label>
              <input
                type="number"
                min="0"
                className={cardInputClass()}
                value={form.sellPrice}
                onChange={(e) => setField("sellPrice", e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Opening stock</label>
              <input
                type="number"
                min="0"
                className={cardInputClass()}
                value={form.stockQty}
                onChange={(e) => setField("stockQty", e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[rgb(var(--text))]">Minimum stock level</label>
              <input
                type="number"
                min="0"
                className={cardInputClass()}
                value={form.minStockLevel}
                onChange={(e) => setField("minStockLevel", e.target.value)}
                placeholder="Example: 5"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[rgb(var(--border))] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/app/inventory")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-muted))] disabled:opacity-60"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-xl bg-[rgb(var(--text))] px-4 text-sm font-medium text-[rgb(var(--bg-elevated))] transition hover:opacity-90 disabled:opacity-60"
            disabled={saving}
          >
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
      </form>
    </div>
  );
}