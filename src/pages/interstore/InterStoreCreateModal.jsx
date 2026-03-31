import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createDeal } from "../../services/interStoreApi";

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
  return "text-stone-950 dark:text-[rgb(var(--text))]";
}

function mutedText() {
  return "text-stone-600 dark:text-[rgb(var(--text-muted))]";
}

function softText() {
  return "text-stone-500 dark:text-[rgb(var(--text-soft))]";
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-2xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function textareaClass() {
  return "min-h-[104px] w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function ModeCard({ active, title, text, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cx(
        "rounded-2xl border p-4 text-left transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : active
          ? "border-stone-950 bg-stone-950 text-white dark:border-[rgb(var(--text))] dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]"
          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:hover:bg-[rgb(var(--bg-muted))]"
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className={cx("mt-1 text-sm leading-6", active ? "text-white/80" : "text-stone-600 dark:text-[rgb(var(--text-muted))]")}>
        {text}
      </div>
    </button>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <div className={cx("text-sm font-semibold uppercase tracking-[0.14em]", softText())}>
        {title}
      </div>
      {subtitle ? <div className={cx("mt-1 text-sm", mutedText())}>{subtitle}</div> : null}
    </div>
  );
}

export default function InterStoreCreateModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isExternalSupplier = useMemo(
    () => form.supplierType === "EXTERNAL",
    [form.supplierType]
  );

  if (!open) return null;

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setError("");
  }

  function closeModal() {
    if (loading) return;
    resetForm();
    onClose?.();
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

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-stone-950/55 backdrop-blur-[3px]"
        onClick={loading ? undefined : closeModal}
      />

      <div className="absolute inset-0 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center">
          <form onSubmit={submit} className={cx(shell(), "w-full overflow-hidden")}>
            <div className="border-b border-stone-200 px-6 py-5 dark:border-[rgb(var(--border))]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                    Inter-store
                  </div>
                  <h2 className={cx("mt-2 text-2xl font-semibold tracking-tight", strongText())}>
                    Create new deal
                  </h2>
                  <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Record the supplier, reseller, serialized product, agreed price,
                    and timing in one clean premium flow.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={closeModal} disabled={loading} className={secondaryBtn()}>
                    Close
                  </button>
                  <button type="submit" disabled={loading} className={primaryBtn()}>
                    {loading ? "Saving..." : "Create deal"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <section className="space-y-4">
                  <SectionTitle
                    title="Supplier"
                    subtitle="Choose where the item is coming from."
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <ModeCard
                      active={form.supplierType === "EXTERNAL"}
                      title="External supplier"
                      text="For outside traders, shops, or individual suppliers."
                      onClick={() => updateField("supplierType", "EXTERNAL")}
                    />
                    <ModeCard
                      active={form.supplierType === "INTERNAL"}
                      title="Internal store"
                      text="Backend is ready. Keep disabled until store selector is wired."
                      disabled={true}
                    />
                  </div>

                  {isExternalSupplier ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Supplier name</label>
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.externalSupplierName}
                          onChange={(e) => updateField("externalSupplierName", e.target.value)}
                          placeholder="Example: Kigali Tech Supply"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Supplier phone</label>
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.externalSupplierPhone}
                          onChange={(e) => updateField("externalSupplierPhone", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="space-y-4">
                  <SectionTitle
                    title="Reseller"
                    subtitle="Who is taking the item and how do you reach them?"
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Reseller name</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerName}
                        onChange={(e) => updateField("resellerName", e.target.value)}
                        placeholder="Example: Jean Claude"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Reseller phone</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerPhone}
                        onChange={(e) => updateField("resellerPhone", e.target.value)}
                        placeholder="Example: 078..."
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Store name</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerStore}
                        onChange={(e) => updateField("resellerStore", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Workplace</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerWorkplace}
                        onChange={(e) => updateField("resellerWorkplace", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>District</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerDistrict}
                        onChange={(e) => updateField("resellerDistrict", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Sector</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerSector}
                        onChange={(e) => updateField("resellerSector", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={cx("text-sm font-medium", strongText())}>Address</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.resellerAddress}
                        onChange={(e) => updateField("resellerAddress", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="space-y-4">
                  <SectionTitle
                    title="Product and terms"
                    subtitle="Describe the item clearly and define the deal."
                  />

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Product name</label>
                      <input
                        className={cx(inputClass(), "mt-2")}
                        value={form.productName}
                        onChange={(e) => updateField("productName", e.target.value)}
                        placeholder="Example: Samsung Galaxy A15 128GB"
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Category</label>
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.productCategory}
                          onChange={(e) => updateField("productCategory", e.target.value)}
                          placeholder="Phone, Laptop, TV..."
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Color</label>
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.productColor}
                          onChange={(e) => updateField("productColor", e.target.value)}
                          placeholder="Optional"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Serial number</label>
                        <input
                          className={cx(inputClass(), "mt-2")}
                          value={form.serial}
                          onChange={(e) => updateField("serial", e.target.value)}
                          placeholder="Required"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          className={cx(inputClass(), "mt-2")}
                          value={form.quantity}
                          onChange={(e) => updateField("quantity", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Agreed price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={cx(inputClass(), "mt-2")}
                        value={form.agreedPrice}
                        onChange={(e) => updateField("agreedPrice", e.target.value)}
                        placeholder="0"
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Due date</label>
                        <input
                          type="date"
                          className={cx(inputClass(), "mt-2")}
                          value={form.dueDate}
                          onChange={(e) => updateField("dueDate", e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className={cx("text-sm font-medium", strongText())}>Taken at</label>
                        <input
                          type="datetime-local"
                          className={cx(inputClass(), "mt-2")}
                          value={form.takenAt}
                          onChange={(e) => updateField("takenAt", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium", strongText())}>Notes</label>
                      <textarea
                        className={cx(textareaClass(), "mt-2")}
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                  <div className={cx("text-sm font-semibold", strongText())}>Before saving</div>
                  <ul className={cx("mt-3 space-y-2 text-sm leading-6", mutedText())}>
                    <li>Use the exact serial number of the item.</li>
                    <li>Keep reseller phone accurate for follow-up and payment collection.</li>
                    <li>Use due date if supplier payment has a timeline.</li>
                  </ul>
                </section>

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-stone-200 px-6 py-4 sm:flex-row sm:justify-end dark:border-[rgb(var(--border))]">
              <button type="button" onClick={closeModal} disabled={loading} className={secondaryBtn()}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={primaryBtn()}>
                {loading ? "Creating..." : "Create deal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}