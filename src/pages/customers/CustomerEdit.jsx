// src/pages/customers/CustomerEdit.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full rewrite. Replaced bare `input`/`btn-primary` with app-input + AsyncButton.
// Added full field set (tinNumber, idNumber, address, notes, whatsappOptIn),
// animate-pulse skeleton while loading, error banner, and design system tokens.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getCustomer, updateCustomer } from "../../services/customersApi";
import AsyncButton from "../../components/ui/AsyncButton";
import { cn }      from "../../lib/cn";

// ─── design tokens ────────────────────────────────────────────────────────────
const S    = () => "text-[var(--color-text)]";
const M    = () => "text-[var(--color-text-muted)]";
const CARD = () => "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const PNL  = () => "rounded-[22px] bg-[var(--color-surface-2)]";
const LBL  = () => cn("mb-1.5 block text-sm font-medium", S());
const HINT = () => cn("mt-1.5 text-xs leading-5", M());
const REQ  = () => "text-[var(--color-danger)]";

// ─── Loading skeleton ─────────────────────────────────────────────────────────
// animate-pulse blocks while fetching the customer — no stale stone-* tokens
function FormSkeleton() {
  return (
    <div className={cn(CARD(), "p-5 sm:p-6")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={i === 0 || i === 4 || i === 5 ? "sm:col-span-2" : ""}>
            <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
            <div className="mt-2 h-11 w-full animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <div className="h-11 w-24 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
        <div className="h-11 w-32 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
      </div>
    </div>
  );
}

export default function CustomerEdit() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    name:          "",
    phone:         "",
    email:         "",
    address:       "",
    tinNumber:     "",
    idNumber:      "",
    notes:         "",
    whatsappOptIn: false,
  });

  function set(k, v) { setForm(c => ({ ...c, [k]: v })); }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const c = await getCustomer(id);
        if (cancelled) return;
        setForm({
          name:          String(c?.name          || ""),
          phone:         String(c?.phone         || ""),
          email:         String(c?.email         || ""),
          address:       String(c?.address       || ""),
          tinNumber:     String(c?.tinNumber     || ""),
          idNumber:      String(c?.idNumber      || ""),
          notes:         String(c?.notes         || ""),
          whatsappOptIn: Boolean(c?.whatsappOptIn),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || "Failed to load customer");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim())  { toast.error("Customer name is required");  return; }
    if (!form.phone.trim()) { toast.error("Phone number is required"); return; }

    setSaving(true);
    setError("");
    try {
      await updateCustomer(id, {
        name:          form.name.trim(),
        phone:         form.phone.trim(),
        email:         form.email.trim()     || null,
        address:       form.address.trim()   || null,
        tinNumber:     form.tinNumber.trim() || null,
        idNumber:      form.idNumber.trim()  || null,
        notes:         form.notes.trim()     || null,
        whatsappOptIn: form.whatsappOptIn,
      });
      toast.success("Customer updated");
      navigate("/app/customers");
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Failed to update customer";
      setError(msg);
      toast.error(msg);
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
              <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", M())}>CRM</div>
              <h1 className={cn("mt-3 text-[1.6rem] font-black tracking-tight", S())}>Edit customer</h1>
              <p className={cn("mt-2 text-sm leading-6", M())}>
                Update contact details, identifiers, and preferences.
              </p>
            </div>
            <div className="shrink-0">
              <AsyncButton variant="secondary" as={Link} to="/app/customers">
                ← Back
              </AsyncButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form — skeleton while loading ── */}
      {loading ? <FormSkeleton /> : (
        <div className={cn(CARD(), "p-5 sm:p-6")}>
          {error && (
            <div className="mb-5 rounded-2xl border border-[var(--color-danger)] bg-[rgba(219,80,74,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LBL()}>Customer name <span className={REQ()}>*</span></label>
                <input className="app-input" value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Full name" required />
              </div>

              <div>
                <label className={LBL()}>Phone <span className={REQ()}>*</span></label>
                <input className="app-input" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="07x xxx xxxx" required />
              </div>

              <div>
                <label className={LBL()}>Email</label>
                <input className="app-input" type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="email@example.com" />
              </div>

              <div>
                <label className={LBL()}>TIN number</label>
                <input className="app-input" value={form.tinNumber} onChange={e => set("tinNumber", e.target.value)}
                  placeholder="Tax / VAT number" />
              </div>

              <div>
                <label className={LBL()}>ID number</label>
                <input className="app-input" value={form.idNumber} onChange={e => set("idNumber", e.target.value)}
                  placeholder="National ID / Passport" />
              </div>

              <div className="sm:col-span-2">
                <label className={LBL()}>Address</label>
                <input className="app-input" value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="Physical address" />
              </div>

              <div className="sm:col-span-2">
                <label className={LBL()}>Notes</label>
                <textarea className="app-textarea w-full" rows={3} value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Internal notes about this customer…" />
              </div>

              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className={cn(
                    "relative h-6 w-11 rounded-full transition",
                    form.whatsappOptIn ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-2)]"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-card)] shadow transition-transform",
                      form.whatsappOptIn ? "translate-x-5" : "translate-x-0.5"
                    )} />
                    <input type="checkbox" className="sr-only" checked={form.whatsappOptIn}
                      onChange={e => set("whatsappOptIn", e.target.checked)} />
                  </div>
                  <span className={cn("text-sm font-medium", S())}>WhatsApp opt-in</span>
                </label>
                <p className={HINT()}>Customer agrees to receive WhatsApp messages from this store.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <AsyncButton type="button" variant="secondary" as={Link} to="/app/customers" disabled={saving}>
                Cancel
              </AsyncButton>
              {/* AsyncButton — spinner + "Saving…" while update is in flight */}
              <AsyncButton type="submit" loading={saving} loadingText="Saving…" variant="primary">
                Save changes
              </AsyncButton>
            </div>
          </form>
        </div>
      )}
    </div>
    );
  
  
}