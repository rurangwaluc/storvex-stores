import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createDeal,
  listInternalSuppliers,
  searchInternalSupplierProducts,
} from "../../services/interStoreApi";

const EMPTY_FORM = {
  supplierType: "EXTERNAL",
  supplierTenantId: "",
  externalSupplierName: "",
  externalSupplierPhone: "",

  resellerName: "",
  resellerPhone: "",
  resellerStore: "",
  resellerWorkplace: "",
  resellerDistrict: "",
  resellerSector: "",
  resellerAddress: "",
  resellerNationalId: "",

  productId: "",
  productName: "",
  productCategory: "",
  productColor: "",
  serial: "",
  quantity: "1",
  agreedPrice: "",
  dueDate: "",
  takenAt: "",
  notes: "",
};

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
  return "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)]";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function ModeCard({ active, title, text, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cx(
        "rounded-[22px] p-4 text-left transition",
        disabled
          ? "cursor-not-allowed bg-[var(--color-surface-2)] opacity-60"
          : active
          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:opacity-90"
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className={cx("mt-2 text-sm leading-6", active ? "text-white/80" : mutedText())}>
        {text}
      </div>
    </button>
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
      <h2 className={cx("mt-3 text-[1.45rem] font-black tracking-tight", strongText())}>{title}</h2>
      {text ? <p className={cx("mt-2 text-sm leading-6", mutedText())}>{text}</p> : null}
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className={cx("text-sm font-medium", strongText())}>{label}</label>
      <div className="mt-2">{children}</div>
      {hint ? <div className={cx("mt-2 text-xs leading-5", mutedText())}>{hint}</div> : null}
    </div>
  );
}

function SummaryStat({ label, value, note, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "danger"
      ? "text-[var(--color-danger)]"
      : strongText();

  return (
    <div className={cx("rounded-[22px] bg-[var(--color-surface-2)] p-4 shadow-[var(--shadow-soft)]")}>
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
        {label}
      </div>
      <div className={cx("mt-2 text-xl font-black tracking-tight", toneClass)}>{value}</div>
      {note ? <div className={cx("mt-2 text-xs leading-5", mutedText())}>{note}</div> : null}
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
      : "bg-[var(--color-surface)] text-[var(--color-text-muted)]";

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold", cls)}>
      {text}
    </span>
  );
}

function SearchResultCard({ active, title, subtitle, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[22px] p-4 text-left transition",
        active
          ? "bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary-ring)]"
          : "bg-[var(--color-surface-2)] hover:opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cx("truncate text-sm font-bold", strongText())}>{title}</div>
          {subtitle ? <div className={cx("mt-1 text-xs leading-5", mutedText())}>{subtitle}</div> : null}
          {meta ? <div className={cx("mt-2 text-xs leading-5", softText())}>{meta}</div> : null}
        </div>

        {active ? <StatusPill text="Selected" tone="success" /> : null}
      </div>
    </button>
  );
}

function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export default function InterStoreCreateModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [supplierQuery, setSupplierQuery] = useState("");
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [productQuery, setProductQuery] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState([]);

  const isExternalSupplier = useMemo(() => form.supplierType === "EXTERNAL", [form.supplierType]);
  const isInternalSupplier = useMemo(() => form.supplierType === "INTERNAL", [form.supplierType]);

  const supplierModeLabel = isExternalSupplier ? "External supplier" : "Internal store";
  const quantity = Number(form.quantity || 0);
  const agreedPrice = Number(form.agreedPrice || 0);
  const dueDateSet = Boolean(String(form.dueDate || "").trim());

  const quantityStatus =
    quantity <= 0 ? "Invalid" : quantity === 1 ? "Single serialized unit" : "Multiple units";

  async function loadSuppliers(search = "") {
    try {
      setSuppliersLoading(true);
      const rows = await listInternalSuppliers({
        q: String(search || "").trim() || undefined,
        take: 12,
      });
      setSuppliers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      setSuppliers([]);
      toast.error(err?.message || "Failed to load suppliers");
    } finally {
      setSuppliersLoading(false);
    }
  }

  async function loadSupplierProducts(supplierTenantId, search = "") {
    if (!supplierTenantId) {
      setSupplierProducts([]);
      return;
    }

    try {
      setProductsLoading(true);
      const rows = await searchInternalSupplierProducts(supplierTenantId, {
        q: String(search || "").trim() || undefined,
        take: 12,
      });
      setSupplierProducts(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      setSupplierProducts([]);
      toast.error(err?.message || "Failed to load supplier products");
    } finally {
      setProductsLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setError("");
    setSupplierQuery("");
    setSuppliers([]);
    setProductQuery("");
    setSupplierProducts([]);
  }

  function closeModal() {
    if (loading) return;
    resetForm();
    onClose?.();
  }

  function switchSupplierType(nextType) {
    setForm((prev) => ({
      ...prev,
      supplierType: nextType,
      supplierTenantId: "",
      externalSupplierName: "",
      externalSupplierPhone: "",
      productId: "",
      productName: "",
      productCategory: "",
      productColor: "",
      serial: "",
      agreedPrice: "",
    }));
    setSupplierQuery("");
    setSuppliers([]);
    setProductQuery("");
    setSupplierProducts([]);
  }

  function chooseSupplier(supplier) {
    setForm((prev) => ({
      ...prev,
      supplierTenantId: supplier.id,
      externalSupplierName: "",
      externalSupplierPhone: "",
      productId: "",
      productName: "",
      productCategory: "",
      productColor: "",
      serial: "",
      agreedPrice: "",
    }));
    setSupplierQuery(supplier.name || "");
    setSupplierProducts([]);
    setProductQuery("");
    void loadSupplierProducts(supplier.id, "");
  }

  function chooseSupplierProduct(product) {
    setForm((prev) => ({
      ...prev,
      productId: product.id || "",
      productName: product.name || "",
      productCategory: product.category || "",
      serial: product.serial || "",
      agreedPrice: product.suggestedPrice != null ? String(product.suggestedPrice) : prev.agreedPrice,
    }));
    setProductQuery(product.name || "");
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        supplierTenantId:
          form.supplierType === "INTERNAL"
            ? String(form.supplierTenantId || "").trim() || null
            : null,
        externalSupplierName:
          form.supplierType === "EXTERNAL"
            ? String(form.externalSupplierName || "").trim() || null
            : null,
        externalSupplierPhone:
          form.supplierType === "EXTERNAL"
            ? String(form.externalSupplierPhone || "").trim() || null
            : null,

        resellerName: String(form.resellerName || "").trim(),
        resellerPhone: String(form.resellerPhone || "").trim(),
        resellerStore: String(form.resellerStore || "").trim() || null,
        resellerWorkplace: String(form.resellerWorkplace || "").trim() || null,
        resellerDistrict: String(form.resellerDistrict || "").trim() || null,
        resellerSector: String(form.resellerSector || "").trim() || null,
        resellerAddress: String(form.resellerAddress || "").trim() || null,
        resellerNationalId: String(form.resellerNationalId || "").trim() || null,

        productId: String(form.productId || "").trim() || null,
        productName: String(form.productName || "").trim(),
        productCategory: String(form.productCategory || "").trim() || null,
        productColor: String(form.productColor || "").trim() || null,
        serial: String(form.serial || "").trim(),
        quantity: Number(form.quantity || 1),
        agreedPrice: Number(form.agreedPrice),
        dueDate: String(form.dueDate || "").trim() || null,
        takenAt: String(form.takenAt || "").trim() || null,
        notes: String(form.notes || "").trim() || null,
      };

      if (!payload.resellerName) {
        toast.error("Reseller name is required");
        return;
      }

      if (!payload.resellerPhone) {
        toast.error("Reseller phone is required");
        return;
      }

      if (isExternalSupplier && !payload.externalSupplierName) {
        toast.error("External supplier name is required");
        return;
      }

      if (isInternalSupplier && !payload.supplierTenantId) {
        toast.error("Please select the internal supplier store");
        return;
      }

      if (!payload.productName) {
        toast.error("Product name is required");
        return;
      }

      if (!payload.serial) {
        toast.error("Serial number is required");
        return;
      }

      if (!Number.isFinite(payload.agreedPrice) || payload.agreedPrice <= 0) {
        toast.error("Agreed price must be more than 0");
        return;
      }

      if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
        toast.error("Quantity must be more than 0");
        return;
      }

      await createDeal(payload);

      toast.success("Deal created");
      resetForm();
      onSaved?.();
      onClose?.();
    } catch (err) {
      const msg = err?.message || "Failed to create deal";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={loading ? undefined : closeModal}
      />

      <div className="absolute inset-0 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto flex min-h-full w-full max-w-7xl items-center justify-center">
          <form onSubmit={submit} className={cx(pageCard(), "w-full overflow-hidden")}>
            <div className="border-b border-[var(--color-border)] px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <SectionHeading
                    eyebrow="Inter-store"
                    title="Create new deal"
                    text="Record the supplier, reseller, serialized product, agreed price, and timing in one disciplined operational flow."
                  />
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={closeModal} disabled={loading} className={secondaryBtn()}>
                    Close
                  </button>
                  <button type="submit" disabled={loading} className={primaryBtn()}>
                    {loading ? "Creating..." : "Create deal"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <SummaryStat
                  label="Supplier mode"
                  value={supplierModeLabel}
                  note="Choose external trader or internal store"
                />
                <SummaryStat
                  label="Quantity"
                  value={quantity || 0}
                  note={quantityStatus}
                  tone={quantity > 0 ? "success" : "danger"}
                />
                <SummaryStat
                  label="Agreed price"
                  value={agreedPrice > 0 ? `RWF ${agreedPrice.toLocaleString()}` : "RWF 0"}
                  note="Supplier settlement amount"
                  tone={agreedPrice > 0 ? "warning" : "neutral"}
                />
                <SummaryStat
                  label="Due date"
                  value={dueDateSet ? "Scheduled" : "Open"}
                  note={dueDateSet ? form.dueDate : "No due date set yet"}
                  tone={dueDateSet ? "success" : "neutral"}
                />
              </section>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                  <section className={cx(pageCard(), "p-5 sm:p-6")}>
                    <SectionHeading
                      eyebrow="Supplier"
                      title="Supplier source"
                      text="Choose where the item is coming from before attaching the reseller and product."
                    />

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      <ModeCard
                        active={form.supplierType === "EXTERNAL"}
                        title="External supplier"
                        text="Use this for outside traders, outside shops, and direct suppliers."
                        onClick={() => switchSupplierType("EXTERNAL")}
                        disabled={loading}
                      />
                      <ModeCard
                        active={form.supplierType === "INTERNAL"}
                        title="Internal store"
                        text="Use this when the product is borrowed from another store inside your network."
                        onClick={() => {
                          switchSupplierType("INTERNAL");
                          void loadSuppliers("");
                        }}
                        disabled={loading}
                      />
                    </div>

                    {isExternalSupplier ? (
                      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          label="Supplier name"
                          hint="Store name, trader name, or company name."
                        >
                          <input
                            className={inputClass()}
                            value={form.externalSupplierName}
                            onChange={(e) => updateField("externalSupplierName", e.target.value)}
                            placeholder="Example: Kigali Tech Supply"
                            disabled={loading}
                          />
                        </FormField>

                        <FormField
                          label="Supplier phone"
                          hint="Optional but useful for follow-up."
                        >
                          <input
                            className={inputClass()}
                            value={form.externalSupplierPhone}
                            onChange={(e) => updateField("externalSupplierPhone", e.target.value)}
                            placeholder="Optional"
                            disabled={loading}
                          />
                        </FormField>
                      </div>
                    ) : null}

                    {isInternalSupplier ? (
                      <div className="mt-6 space-y-4">
                        <FormField
                          label="Search internal supplier store"
                          hint="Search by store name, email, or phone."
                        >
                          <input
                            className={inputClass()}
                            value={supplierQuery}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSupplierQuery(value);
                              void loadSuppliers(value);
                            }}
                            placeholder="Search internal store..."
                            disabled={loading}
                          />
                        </FormField>

                        {suppliersLoading ? (
                          <div className="grid gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className={cx(softPanel(), "h-20 animate-pulse")} />
                            ))}
                          </div>
                        ) : suppliers.length > 0 ? (
                          <div className="grid gap-3">
                            {suppliers.map((supplier) => (
                              <SearchResultCard
                                key={supplier.id}
                                active={form.supplierTenantId === supplier.id}
                                title={supplier.name || "Unnamed store"}
                                subtitle={supplier.phone || supplier.email || "No contact info"}
                                meta={supplier.email && supplier.phone ? `${supplier.phone} • ${supplier.email}` : ""}
                                onClick={() => chooseSupplier(supplier)}
                              />
                            ))}
                          </div>
                        ) : supplierQuery.trim() ? (
                          <div className={cx("rounded-[22px] bg-[var(--color-surface-2)] px-4 py-4 text-sm", mutedText())}>
                            No matching internal stores found.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </section>

                  <section className={cx(pageCard(), "p-5 sm:p-6")}>
                    <SectionHeading
                      eyebrow="Reseller"
                      title="Reseller details"
                      text="Capture who is taking the item and how you will reach them later."
                    />

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        label="Reseller name"
                        hint="Required for every deal."
                      >
                        <input
                          className={inputClass()}
                          value={form.resellerName}
                          onChange={(e) => updateField("resellerName", e.target.value)}
                          placeholder="Example: Jean Luc"
                          disabled={loading}
                        />
                      </FormField>

                      <FormField
                        label="Reseller phone"
                        hint="Required for follow-up and collection."
                      >
                        <input
                          className={inputClass()}
                          value={form.resellerPhone}
                          onChange={(e) => updateField("resellerPhone", e.target.value)}
                          placeholder="Example: 078..."
                          disabled={loading}
                        />
                      </FormField>

                      <FormField
                        label="Store name"
                        hint="Optional reseller business name."
                      >
                        <input
                          className={inputClass()}
                          value={form.resellerStore}
                          onChange={(e) => updateField("resellerStore", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </FormField>

                      <FormField
                        label="Workplace"
                        hint="Optional workplace or location note."
                      >
                        <input
                          className={inputClass()}
                          value={form.resellerWorkplace}
                          onChange={(e) => updateField("resellerWorkplace", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </FormField>

                      <FormField label="District" hint="Optional administrative location.">
                        <input
                          className={inputClass()}
                          value={form.resellerDistrict}
                          onChange={(e) => updateField("resellerDistrict", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </FormField>

                      <FormField label="Sector" hint="Optional administrative location.">
                        <input
                          className={inputClass()}
                          value={form.resellerSector}
                          onChange={(e) => updateField("resellerSector", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </FormField>

                      <div className="md:col-span-2">
                        <FormField
                          label="Address"
                          hint="Optional full address or descriptive location."
                        >
                          <input
                            className={inputClass()}
                            value={form.resellerAddress}
                            onChange={(e) => updateField("resellerAddress", e.target.value)}
                            placeholder="Optional"
                            disabled={loading}
                          />
                        </FormField>
                      </div>

                      <div className="md:col-span-2">
                        <FormField
                          label="National ID"
                          hint="Optional extra identity reference."
                        >
                          <input
                            className={inputClass()}
                            value={form.resellerNationalId}
                            onChange={(e) => updateField("resellerNationalId", e.target.value)}
                            placeholder="Optional"
                            disabled={loading}
                          />
                        </FormField>
                      </div>
                    </div>
                  </section>

                  <section className={cx(pageCard(), "p-5 sm:p-6")}>
                    <SectionHeading
                      eyebrow="Product"
                      title="Product and terms"
                      text="Attach the serialized product and define the financial and timing rules of the deal."
                    />

                    {isInternalSupplier && form.supplierTenantId ? (
                      <div className="mt-6 space-y-4">
                        <FormField
                          label="Search supplier products"
                          hint="Use internal stock search to pick the exact product fast."
                        >
                          <input
                            className={inputClass()}
                            value={productQuery}
                            onChange={(e) => {
                              const value = e.target.value;
                              setProductQuery(value);
                              void loadSupplierProducts(form.supplierTenantId, value);
                            }}
                            placeholder="Search supplier products..."
                            disabled={loading}
                          />
                        </FormField>

                        {productsLoading ? (
                          <div className="grid gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className={cx(softPanel(), "h-20 animate-pulse")} />
                            ))}
                          </div>
                        ) : supplierProducts.length > 0 ? (
                          <div className="grid gap-3">
                            {supplierProducts.map((product) => (
                              <SearchResultCard
                                key={product.id}
                                active={form.productId === product.id}
                                title={product.name || "Unnamed product"}
                                subtitle={product.serial || product.category || "No extra details"}
                                meta={`Stock ${Number(product.stockQty || 0)} • Suggested ${formatMoney(product.suggestedPrice)}`}
                                onClick={() => chooseSupplierProduct(product)}
                              />
                            ))}
                          </div>
                        ) : productQuery.trim() ? (
                          <div className={cx("rounded-[22px] bg-[var(--color-surface-2)] px-4 py-4 text-sm", mutedText())}>
                            No supplier products found for this search.
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-6 grid grid-cols-1 gap-4">
                      <FormField
                        label="Product name"
                        hint="Use the exact product identity staff should recognize."
                      >
                        <input
                          className={inputClass()}
                          value={form.productName}
                          onChange={(e) => updateField("productName", e.target.value)}
                          placeholder="Example: Samsung Galaxy A15 128GB"
                          disabled={loading}
                        />
                      </FormField>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          label="Category"
                          hint="Optional category for clarity."
                        >
                          <input
                            className={inputClass()}
                            value={form.productCategory}
                            onChange={(e) => updateField("productCategory", e.target.value)}
                            placeholder="Phone, Laptop, TV..."
                            disabled={loading}
                          />
                        </FormField>

                        <FormField
                          label="Color"
                          hint="Optional visual product detail."
                        >
                          <input
                            className={inputClass()}
                            value={form.productColor}
                            onChange={(e) => updateField("productColor", e.target.value)}
                            placeholder="Optional"
                            disabled={loading}
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          label="Serial number"
                          hint="Required. Use the exact device serial / IMEI."
                        >
                          <input
                            className={inputClass()}
                            value={form.serial}
                            onChange={(e) => updateField("serial", e.target.value)}
                            placeholder="Required"
                            disabled={loading}
                          />
                        </FormField>

                        <FormField
                          label="Quantity"
                          hint="Backend currently enforces serialized single-unit flow."
                        >
                          <input
                            type="number"
                            min="1"
                            className={inputClass()}
                            value={form.quantity}
                            onChange={(e) => updateField("quantity", normalizeDigits(e.target.value))}
                            disabled={loading}
                          />
                        </FormField>
                      </div>

                      <FormField
                        label="Agreed price"
                        hint="Amount owed to supplier when this deal is settled."
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={inputClass()}
                          value={form.agreedPrice}
                          onChange={(e) => updateField("agreedPrice", e.target.value)}
                          placeholder="0"
                          disabled={loading}
                        />
                      </FormField>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          label="Due date"
                          hint="Optional supplier payment deadline."
                        >
                          <input
                            type="date"
                            className={inputClass()}
                            value={form.dueDate}
                            onChange={(e) => updateField("dueDate", e.target.value)}
                            disabled={loading}
                          />
                        </FormField>

                        <FormField
                          label="Taken at"
                          hint="Optional handover date and time."
                        >
                          <input
                            type="datetime-local"
                            className={inputClass()}
                            value={form.takenAt}
                            onChange={(e) => updateField("takenAt", e.target.value)}
                            disabled={loading}
                          />
                        </FormField>
                      </div>

                      <FormField
                        label="Notes"
                        hint="Anything that should still make sense later without follow-up questions."
                      >
                        <textarea
                          className={cx(textareaClass(), "min-h-[110px]")}
                          value={form.notes}
                          onChange={(e) => updateField("notes", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </FormField>
                    </div>
                  </section>

                  {error ? (
                    <div className="rounded-[22px] bg-[rgba(219,80,74,0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
                      {error}
                    </div>
                  ) : null}

                  <section className={cx(pageCard(), "p-5 sm:p-6")}>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button type="button" onClick={closeModal} disabled={loading} className={secondaryBtn()}>
                        Cancel
                      </button>

                      <button type="submit" disabled={loading} className={primaryBtn()}>
                        {loading ? "Creating..." : "Create deal"}
                      </button>
                    </div>
                  </section>
                </div>

                <aside className="space-y-5">
                  <section className={cx(pageCard(), "p-5 sm:p-6")}>
                    <SectionHeading
                      eyebrow="Preview"
                      title="Live deal snapshot"
                      text="A clean owner-level read of what will be saved if you submit now."
                    />

                    <div className="mt-6 space-y-4">
                      <div className={cx(softPanel(), "p-5")}>
                        <div className={cx("text-lg font-bold", strongText())}>
                          {form.productName || "Unnamed product"}
                        </div>
                        <div className={cx("mt-1 text-sm", mutedText())}>
                          {isExternalSupplier
                            ? form.externalSupplierName || "No external supplier selected"
                            : supplierQuery || "No internal store selected"}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <StatusPill text={supplierModeLabel} />
                          <StatusPill text={form.serial || "No serial"} tone={form.serial ? "success" : "warning"} />
                          <StatusPill
                            text={agreedPrice > 0 ? "Price set" : "Price missing"}
                            tone={agreedPrice > 0 ? "success" : "warning"}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <SummaryStat
                          label="Reseller"
                          value={form.resellerName || "Not set"}
                          note={form.resellerPhone || "Phone missing"}
                        />
                        <SummaryStat
                          label="Product serial"
                          value={form.serial || "Missing"}
                          tone={form.serial ? "success" : "warning"}
                        />
                        <SummaryStat
                          label="Agreed price"
                          value={agreedPrice > 0 ? formatMoney(agreedPrice) : "Missing"}
                          tone={agreedPrice > 0 ? "warning" : "danger"}
                        />
                        <SummaryStat
                          label="Due date"
                          value={form.dueDate || "Open"}
                          note={form.takenAt || "Taken time not set"}
                          tone={form.dueDate ? "success" : "neutral"}
                        />
                      </div>
                    </div>
                  </section>

                  <section className={cx(pageCard(), "p-5 sm:p-6")}>
                    <SectionHeading
                      eyebrow="Control"
                      title="Operational discipline"
                      text="These rules keep inter-store tracking clean from day one."
                    />

                    <div className="mt-5 space-y-3">
                      {[
                        "Use the exact serial number of the item. No shortcuts.",
                        "Keep reseller phone accurate for follow-up and collection.",
                        "Use due date when supplier payment has a timeline.",
                        "For internal supplier flow, select the real store and real product first.",
                        "Every next movement should happen through the detail screen, not by guessing outside the flow.",
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
          </form>
        </div>
      </div>
    </div>
  );
}