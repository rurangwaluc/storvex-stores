// src/pages/repairs/RepairCreate.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import { listCustomers } from "../../services/customersApi";
import { createRepair } from "../../services/repairsApi";

// ─── style helpers (matching app patterns exactly) ────────────────────────────

function cx(...xs) { return xs.filter(Boolean).join(" "); }
const strong  = () => "text-[var(--color-text)]";
const muted   = () => "text-[var(--color-text-muted)]";
const card    = () => "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
const panel   = () => "rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-2)]";
const input   = () => "app-input";

const primaryBtn  = (d=false) => cx("inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95", d && "cursor-not-allowed opacity-60");
const secondaryBtn= (d=false) => cx("inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90", d && "cursor-not-allowed opacity-60");

function FieldLabel({ children, required = false }) {
  return (
    <label className={cx("mb-1.5 block text-sm font-medium", strong())}>
      {children}
      {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
    </label>
  );
}

function FieldHelp({ children }) {
  return <p className={cx("mt-1.5 text-xs leading-5", muted())}>{children}</p>;
}

// ─── form ─────────────────────────────────────────────────────────────────────

const EMPTY = { customerId: "", device: "", serial: "", issue: "", warrantyEnd: "" };

export default function RepairCreate() {
  const navigate = useNavigate();

  const [customers,        setCustomers]        = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [form,             setForm]             = useState(EMPTY);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoadingCustomers(true);
        const data = await listCustomers();
        if (!alive) return;
        // listCustomers may return an array or { customers: [] }
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.customers) ? data.customers
          : [];
        setCustomers(list.filter((c) => c.isActive !== false));
      } catch (err) {
        if (!alive) return;
        toast.error(err?.message || "Failed to load customers");
        setCustomers([]);
      } finally {
        if (alive) setLoadingCustomers(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const device = String(form.device || "").trim();
    const issue  = String(form.issue  || "").trim();

    if (!form.customerId) { toast.error("Select a customer");        return; }
    if (!device)          { toast.error("Device name is required");  return; }
    if (!issue)           { toast.error("Issue description required"); return; }

    setSaving(true);
    try {
      await createRepair({
        customerId:  form.customerId,
        device,
        serial:      String(form.serial || "").trim() || null,
        issue,
        warrantyEnd: form.warrantyEnd || null,
      });
      toast.success("Repair logged successfully");
      navigate("/app/repairs");
    } catch (err) {
      toast.error(err?.message || "Failed to create repair");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", muted())}>Operations</div>
          <h1 className={cx("mt-2 text-[1.7rem] font-black tracking-tight", strong())}>New repair</h1>
          <p className={cx("mt-2 text-sm leading-6", muted())}>Log a device repair intake. You can assign a technician and update the status from the repairs list.</p>
        </div>
        <Link to="/app/repairs" className={secondaryBtn()}>Back to repairs</Link>
      </div>

      {/* form card */}
      <div className={cx(card(), "p-5 sm:p-6")}>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* customer */}
          <div>
            <FieldLabel required>Customer</FieldLabel>
            <select
              className={input()}
              value={form.customerId}
              onChange={(e) => setField("customerId", e.target.value)}
              disabled={loadingCustomers || saving}
              required
            >
              <option value="">
                {loadingCustomers ? "Loading customers…" : "Select customer"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` — ${c.phone}` : ""}
                </option>
              ))}
            </select>
            <FieldHelp>Only active customers appear here. Create a new customer first if needed.</FieldHelp>
          </div>

          {/* device + serial */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel required>Device</FieldLabel>
              <input
                className={input()}
                placeholder="e.g. Samsung Galaxy A54"
                value={form.device}
                onChange={(e) => setField("device", e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div>
              <FieldLabel>Serial / IMEI</FieldLabel>
              <input
                className={input()}
                placeholder="Optional"
                value={form.serial}
                onChange={(e) => setField("serial", e.target.value)}
                disabled={saving}
              />
              <FieldHelp>Helps uniquely identify the device in case of disputes.</FieldHelp>
            </div>
          </div>

          {/* issue */}
          <div>
            <FieldLabel required>Issue description</FieldLabel>
            <textarea
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-ring)] min-h-[100px] resize-y"
              placeholder="Describe the fault or complaint reported by the customer…"
              value={form.issue}
              onChange={(e) => setField("issue", e.target.value)}
              disabled={saving}
              required
            />
          </div>

          {/* warranty end */}
          <div className="max-w-xs">
            <FieldLabel>Warranty end date</FieldLabel>
            <input
              type="date"
              className={input()}
              value={form.warrantyEnd}
              onChange={(e) => setField("warrantyEnd", e.target.value)}
              disabled={saving}
            />
            <FieldHelp>Leave blank if no warranty applies to this device.</FieldHelp>
          </div>

          {/* info panel */}
          <div className={cx(panel(), "p-4 text-sm leading-6", muted())}>
            The repair is logged with status <span className={cx("font-semibold", strong())}>Received</span>. Assign a technician and update the status from the repairs list.
          </div>

          {/* actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Link to="/app/repairs" className={secondaryBtn(saving)}>Cancel</Link>
            <AsyncButton type="submit" loading={saving} className={primaryBtn(saving)}>
              Log repair
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  );
}