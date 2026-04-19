// src/pages/suppliers/SupplierEdit.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full rewrite. All stone-*/slate-*/bg-white/emerald-* tokens replaced with
// var(--color-*) tokens. `<p className="text-slate-600">Loading…</p>` replaced
// with an animate-pulse skeleton. Raw <button> replaced with AsyncButton.
// app-input used throughout. Mobile-first responsive grid.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getSupplierById, updateSupplier } from "../../services/suppliersApi";
import AsyncButton from "../../components/ui/AsyncButton";
import { cn }      from "../../lib/cn";

const S    = () => "text-[var(--color-text)]";
const M    = () => "text-[var(--color-text-muted)]";
const CARD = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const LBL  = () => cn("mb-1.5 block text-sm font-medium", S());
const REQ  = () => "text-[var(--color-danger)]";

const ID_TYPE_OPTIONS = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PASSPORT",    label: "Passport"    },
];
const SOURCE_TYPE_OPTIONS = [
  { value: "BOUGHT",      label: "Bought"      },
  { value: "GIFT",        label: "Gift"         },
  { value: "TRADE_IN",    label: "Trade-in"    },
  { value: "CONSIGNMENT", label: "Consignment" },
  { value: "OTHER",       label: "Other"        },
];

function safeStr(x) { return x == null ? "" : String(x); }
function pickInSet(value, allowed, fallback) {
  const v = String(value || "").trim().toUpperCase();
  return allowed.has(v) ? v : fallback;
}

// ─── Loading skeleton — animate-pulse, no stale tokens ───────────────────────
function FormSkeleton() {
  return (
    <div className={cn(CARD(), "p-5 sm:p-6 space-y-4")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={i === 0 || i === 4 || i === 7 ? "sm:col-span-2" : ""}>
            <div className="h-4 w-20 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
            <div className="mt-2 h-11 w-full animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <div className="h-11 w-24 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
        <div className="h-11 w-32 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
      </div>
    </div>
  );
}

export default function SupplierEdit() {
  const { id }  = useParams();
  const nav     = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    name: "", idType: "NATIONAL_ID", idNumber: "",
    phone: "", email: "", address: "",
    companyName: "", taxId: "",
    sourceType: "OTHER", sourceDetails: "", notes: "",
  });

  const allowedIdTypes     = useMemo(() => new Set(ID_TYPE_OPTIONS.map(o => o.value)),     []);
  const allowedSourceTypes = useMemo(() => new Set(SOURCE_TYPE_OPTIONS.map(o => o.value)), []);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const s = await getSupplierById(String(id));
        if (cancelled) return;
        setForm({
          name:          safeStr(s?.name),
          idType:        pickInSet(s?.idType,     allowedIdTypes,     "NATIONAL_ID"),
          idNumber:      safeStr(s?.idNumber),
          phone:         safeStr(s?.phone),
          email:         safeStr(s?.email),
          address:       safeStr(s?.address),
          companyName:   safeStr(s?.companyName),
          taxId:         safeStr(s?.taxId),
          sourceType:    pickInSet(s?.sourceType, allowedSourceTypes, "OTHER"),
          sourceDetails: safeStr(s?.sourceDetails),
          notes:         safeStr(s?.notes),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || "Failed to load supplier");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, allowedIdTypes, allowedSourceTypes]);

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim())     { toast.error("Name is required");      return; }
    if (!form.idNumber.trim()) { toast.error("ID number is required"); return; }

    setSaving(true); setError("");
    try {
      await updateSupplier(String(id), {
        name:          form.name.trim(),
        idType:        form.idType,
        idNumber:      form.idNumber.trim(),
        phone:         form.phone.trim()         || null,
        email:         form.email.trim()         || null,
        address:       form.address.trim()       || null,
        companyName:   form.companyName.trim()   || null,
        taxId:         form.taxId.trim()         || null,
        sourceType:    form.sourceType,
        sourceDetails: form.sourceDetails.trim() || null,
        notes:         form.notes.trim()         || null,
      });
      toast.success("Supplier updated");
      nav(`/app/suppliers/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Failed to update supplier";
      setError(msg); toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className={cn(CARD(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", M())}>Procurement</div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight", S())}>Edit supplier</h1>
              <p className={cn("mt-2 text-sm leading-6", M())}>
                Keep supplier info accurate to avoid receiving stolen products.
              </p>
            </div>
            <div className="shrink-0">
              <AsyncButton variant="secondary" as={Link} to={`/app/suppliers/${id}`}>
                ← Back
              </AsyncButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Skeleton while loading, form when ready ── */}
      {loading ? <FormSkeleton /> : (
        <div className={cn(CARD(), "p-5 sm:p-6")}>
          {error && (
            <div className="mb-5 rounded-2xl border border-[var(--color-danger)] bg-[rgba(219,80,74,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LBL()}>Name <span className={REQ()}>*</span></label>
                <input className="app-input" value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>

              <div>
                <label className={LBL()}>ID type</label>
                <select className="app-input" value={form.idType} onChange={e => set("idType", e.target.value)}>
                  {ID_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LBL()}>ID number <span className={REQ()}>*</span></label>
                <input className="app-input" value={form.idNumber} onChange={e => set("idNumber", e.target.value)} required />
              </div>

              <div>
                <label className={LBL()}>Phone</label>
                <input className="app-input" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+2507…" />
              </div>

              <div>
                <label className={LBL()}>Email</label>
                <input className="app-input" type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="name@email.com" />
              </div>

              <div className="sm:col-span-2">
                <label className={LBL()}>Address</label>
                <input className="app-input" value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="Kigali…" />
              </div>

              <div>
                <label className={LBL()}>Company name</label>
                <input className="app-input" value={form.companyName} onChange={e => set("companyName", e.target.value)} />
              </div>

              <div>
                <label className={LBL()}>Tax ID (TIN)</label>
                <input className="app-input" value={form.taxId} onChange={e => set("taxId", e.target.value)} />
              </div>

              <div>
                <label className={LBL()}>Where items come from</label>
                <select className="app-input" value={form.sourceType} onChange={e => set("sourceType", e.target.value)}>
                  {SOURCE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LBL()}>Source details</label>
                <input className="app-input" value={form.sourceDetails} onChange={e => set("sourceDetails", e.target.value)}
                  placeholder="Bought in Dubai…" />
              </div>

              <div className="sm:col-span-2">
                <label className={LBL()}>Notes</label>
                <textarea className="app-textarea w-full" rows={2} value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Trust level, warnings, etc." />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <AsyncButton type="button" variant="secondary" as={Link} to={`/app/suppliers/${id}`} disabled={saving}>
                Cancel
              </AsyncButton>
              {/* AsyncButton — spinner + "Updating…" while save is in flight */}
              <AsyncButton type="submit" loading={saving} loadingText="Updating…" variant="primary">
                Update supplier
              </AsyncButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}