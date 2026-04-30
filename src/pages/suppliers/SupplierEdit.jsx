import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { getSupplierById, updateSupplier } from "../../services/suppliersApi";

const ID_TYPE_OPTIONS = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PASSPORT", label: "Passport" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "BOUGHT", label: "Bought" },
  { value: "GIFT", label: "Gift" },
  { value: "TRADE_IN", label: "Trade-in" },
  { value: "CONSIGNMENT", label: "Consignment" },
  { value: "OTHER", label: "Other" },
];

function safeStr(x) {
  return x == null ? "" : String(x);
}

function pickInSet(value, allowed, fallback) {
  const v = String(value || "").trim().toUpperCase();
  return allowed.has(v) ? v : fallback;
}

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function panel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function SkeletonLine({ className = "" }) {
  return <div className={cx("animate-pulse rounded-full bg-[var(--color-surface)]", className)} />;
}

export default function SupplierEdit() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    idType: "NATIONAL_ID",
    idNumber: "",
    phone: "",
    email: "",
    address: "",
    companyName: "",
    taxId: "",
    sourceType: "OTHER",
    sourceDetails: "",
    notes: "",
  });

  const allowedIdTypes = useMemo(() => new Set(ID_TYPE_OPTIONS.map((o) => o.value)), []);
  const allowedSourceTypes = useMemo(
    () => new Set(SOURCE_TYPE_OPTIONS.map((o) => o.value)),
    []
  );

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const s = await getSupplierById(String(id));
        if (cancelled) return;

        setForm({
          name: safeStr(s?.name),
          idType: pickInSet(s?.idType, allowedIdTypes, "NATIONAL_ID"),
          idNumber: safeStr(s?.idNumber),
          phone: safeStr(s?.phone),
          email: safeStr(s?.email),
          address: safeStr(s?.address),
          companyName: safeStr(s?.companyName),
          taxId: safeStr(s?.taxId),
          sourceType: pickInSet(s?.sourceType, allowedSourceTypes, "OTHER"),
          sourceDetails: safeStr(s?.sourceDetails),
          notes: safeStr(s?.notes),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || "Failed to load supplier");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, allowedIdTypes, allowedSourceTypes]);

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        companyName: form.companyName.trim() || null,
        taxId: form.taxId.trim() || null,
        sourceType: form.sourceType,
        sourceDetails: form.sourceDetails.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (!payload.name) {
        setSaving(false);
        return toast.error("Name is required");
      }

      if (!payload.idNumber) {
        setSaving(false);
        return toast.error("ID number is required");
      }

      await updateSupplier(String(id), payload);
      toast.success("Supplier updated");
      nav(`/app/suppliers/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Failed to update supplier";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <section className={cx(shell(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="mt-4 h-8 w-52" />
            <SkeletonLine className="mt-3 h-4 w-72" />
          </div>
          <div className="p-5 sm:p-6">
            <div className={cx(panel(), "space-y-4 p-5 sm:p-6")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <SkeletonLine className="mb-2 h-3 w-24" />
                    <div className="h-11 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <SkeletonLine className="mb-2 h-3 w-24" />
                  <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error && !form.name) {
    return <p className="text-sm text-[var(--color-danger)]">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", mutedText())}>
                Suppliers
              </div>
              <h1 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
                Edit Supplier
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Keep supplier records complete and correct for stock control and proof of origin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav(`/app/suppliers/${id}`)}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
            >
              Back to Supplier
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className={cx(panel(), "p-5 sm:p-6")}>
              {error ? (
                <div className="mb-4 rounded-2xl bg-[rgba(219,80,74,0.12)] px-4 py-3 text-sm text-[var(--color-danger)]">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Name</label>
                  <input
                    className="app-input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>ID type</label>
                  <select
                    className="app-input"
                    value={form.idType}
                    onChange={(e) => setField("idType", e.target.value)}
                  >
                    {ID_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>ID number</label>
                  <input
                    className="app-input"
                    value={form.idNumber}
                    onChange={(e) => setField("idNumber", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Phone</label>
                  <input
                    className="app-input"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+2507..."
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Email</label>
                  <input
                    className="app-input"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="name@email.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Address</label>
                  <input
                    className="app-input"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Kigali..."
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Company name</label>
                  <input
                    className="app-input"
                    value={form.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Tax ID</label>
                  <input
                    className="app-input"
                    value={form.taxId}
                    onChange={(e) => setField("taxId", e.target.value)}
                  />
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>
                    Where items come from
                  </label>
                  <select
                    className="app-input"
                    value={form.sourceType}
                    onChange={(e) => setField("sourceType", e.target.value)}
                  >
                    {SOURCE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Details</label>
                  <input
                    className="app-input"
                    value={form.sourceDetails}
                    onChange={(e) => setField("sourceDetails", e.target.value)}
                    placeholder="Example: bought in Dubai"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={cx("mb-1.5 block text-sm font-medium", strongText())}>Notes</label>
                  <textarea
                    className="app-textarea w-full min-h-[128px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                    rows={5}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Example: trusted supplier, verified ID..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => nav(`/app/suppliers/${id}`)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
                disabled={saving}
              >
                Cancel
              </button>

              <AsyncButton type="submit" loading={saving} loadingText="Updating..." variant="primary">
                Update Supplier
              </AsyncButton>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}