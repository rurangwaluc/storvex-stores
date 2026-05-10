import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import PageSkeleton from "../../components/ui/PageSkeleton";
import { getUserRole } from "../../utils/role";
import {
  createLogoUploadUrl,
  getDocumentSettings,
  getStoreProfile,
  getStoreSetupChecklist,
  updateDocumentSettings,
  updateStoreProfile,
  uploadFileToSignedUrl,
} from "../../services/storeApi";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function textareaClass() {
  return [
    "min-h-[132px] w-full resize-y rounded-[22px]",
    "border border-[var(--color-border)]",
    "bg-[var(--color-surface)]",
    "px-4 py-3.5",
    "text-sm font-bold leading-6 text-[var(--color-text)]",
    "placeholder:text-[var(--color-text-muted)]",
    "outline-none transition",
    "focus:border-[var(--color-primary)]",
    "focus:ring-4 focus:ring-[var(--color-primary-ring)]",
    "disabled:cursor-not-allowed disabled:opacity-70",
  ].join(" ");
}

function fieldLabel() {
  return "mb-1.5 block text-sm font-black text-[var(--color-text)]";
}

function fieldHelp() {
  return "mt-1.5 text-xs font-semibold leading-5 text-[var(--color-text-muted)]";
}

function readOnlyInputState(disabled) {
  return disabled ? "cursor-not-allowed opacity-75" : "";
}

function neutralButton() {
  return "inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 text-sm font-black text-[var(--color-text)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[var(--color-surface-3)] disabled:cursor-not-allowed disabled:opacity-60";
}

const STORE_CATEGORY_OPTIONS = [
  { value: "", label: "Select store category" },
  { value: "ELECTRONICS_RETAIL", label: "Electronics Retail" },
  { value: "PHONE_SHOP", label: "Phone Shop" },
  { value: "LAPTOP_SHOP", label: "Laptop Shop" },
  { value: "ACCESSORIES_SHOP", label: "Accessories Shop" },
  { value: "REPAIR_SHOP", label: "Repair Shop" },
  { value: "MIXED_ELECTRONICS", label: "Mixed Electronics Store" },
];

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "SV";
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

function normalizeHex(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const normalized = raw.startsWith("#") ? raw : `#${raw}`;

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized.toUpperCase();

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const r = normalized[1];
    const g = normalized[2];
    const b = normalized[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return fallback;
}

function statusMeta(status) {
  const map = {
    READY: {
      label: "Ready",
      chip: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
      dot: "bg-[var(--color-primary)]",
    },
    DONE: {
      label: "Done",
      chip: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
      dot: "bg-[var(--color-primary)]",
    },
    ACTIVE: {
      label: "Active",
      chip: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
      dot: "bg-[var(--color-primary)]",
    },
    COMPLETE: {
      label: "Complete",
      chip: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
      dot: "bg-[var(--color-primary)]",
    },
    INFO: {
      label: "Info",
      chip: "bg-[var(--color-surface-2)] text-[var(--color-text)]",
      dot: "bg-[var(--color-text-muted)]",
    },
    REQUIRED: {
      label: "Required",
      chip: "bg-amber-500/10 text-amber-600",
      dot: "bg-amber-500",
    },
    PENDING: {
      label: "Pending",
      chip: "bg-amber-500/10 text-amber-600",
      dot: "bg-amber-500",
    },
    PROCESS: {
      label: "Process",
      chip: "bg-amber-500/10 text-amber-600",
      dot: "bg-amber-500",
    },
    OPTIONAL: {
      label: "Optional",
      chip: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
      dot: "bg-[var(--color-text-muted)]",
    },
    NEUTRAL: {
      label: "Neutral",
      chip: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
      dot: "bg-[var(--color-text-muted)]",
    },
    DANGER: {
      label: "Needs attention",
      chip: "bg-red-500/10 text-red-600",
      dot: "bg-red-500",
    },
  };

  return map[String(status || "").toUpperCase()] || map.NEUTRAL;
}

function StatusPill({ status }) {
  const meta = statusMeta(status);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black",
        meta.chip,
      )}
    >
      {meta.label}
    </span>
  );
}

function ChecklistPill({ done, required }) {
  if (done) return <StatusPill status="DONE" />;
  if (required) return <StatusPill status="REQUIRED" />;
  return <StatusPill status="OPTIONAL" />;
}

function Badge({ children, tone = "neutral" }) {
  const styles = {
    primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-red-500/10 text-red-600",
    neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
    strong: "bg-[var(--color-surface-2)] text-[var(--color-text)]",
  };

  return (
    <span
      className={cx(
        "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-black",
        styles[tone] || styles.neutral,
      )}
    >
      {children}
    </span>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const textClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "danger"
        ? "text-[var(--color-danger)]"
        : "text-[var(--color-text)]";

  const accentClass =
    tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
        ? "bg-[var(--color-danger)]"
        : "bg-[var(--color-primary)]";

  return (
    <article className={cx(pageCard(), "relative overflow-hidden p-5 sm:p-6")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accentClass)} />

      <div className="pl-2">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {label}
        </div>

        <div className={cx("mt-2 text-[1.7rem] font-black tracking-tight", textClass)}>
          {value}
        </div>

        {note ? (
          <div className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
            {note}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="mt-3 text-[1.6rem] font-black tracking-tight text-[var(--color-text)] sm:text-[1.9rem]">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, action = null }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-3xl">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={text} />
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function InfoStat({ label, value, sub }) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </div>

      <div className="mt-2 text-sm font-black leading-6 text-[var(--color-text)]">
        {value || "—"}
      </div>

      {sub ? (
        <div className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function ReadOnlyBanner() {
  return (
    <div className={cx(pageCard(), "p-4")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-black text-[var(--color-text)]">Read-only access</div>

          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
            Managers can review store identity, document numbering, and print branding, but only the owner can save changes.
          </p>
        </div>

        <Badge tone="strong">Manager view</Badge>
      </div>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  help = "",
  rows = 4,
}) {
  return (
    <div>
      <label className={fieldLabel()}>{label}</label>

      <textarea
        rows={rows}
        className={cx(textareaClass(), readOnlyInputState(disabled))}
        value={value}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
      />

      {help ? <p className={fieldHelp()}>{help}</p> : null}
    </div>
  );
}

function PreviewDocument({
  title,
  prefix,
  padding,
  preview,
  terms,
  primaryColor,
  accentColor,
  previewLabel = "Number preview",
  previewFallback = "Not available",
}) {
  return (
    <div className={cx(softPanel(), "p-4")}>
      <div className="overflow-hidden rounded-[22px] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]">
        <div
          className="relative h-24 px-4 py-4"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
              {title}
            </div>

            <div className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
              Brand
            </div>
          </div>

          <div
            className="absolute -bottom-8 left-[-8%] right-[-8%] h-16 rounded-[999px]"
            style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
          />

          <div
            className="absolute -bottom-11 left-[-10%] right-[-10%] h-20 rounded-[999px] blur-md"
            style={{ backgroundColor: `${accentColor}66` }}
          />
        </div>

        <div className="px-4 py-4">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {previewLabel}
          </div>

          <div className="mt-2 break-all text-sm font-black leading-6 text-[var(--color-text)]">
            {preview || previewFallback}
          </div>

          {(prefix || padding) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {prefix ? <Badge tone="strong">{prefix}</Badge> : null}
              {padding ? <Badge tone="strong">{padding} digits</Badge> : null}
            </div>
          ) : null}

          <p className="mt-3 line-clamp-3 text-xs font-semibold leading-6 text-[var(--color-text-muted)]">
            {terms?.trim() || "No terms added yet."}
          </p>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, disabled = false, min = 4, max = 10 }) {
  return (
    <div>
      <label className={fieldLabel()}>{label}</label>

      <input
        className={cx(inputClass(), readOnlyInputState(disabled))}
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

function ColorField({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className={fieldLabel()}>{label}</label>

      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(normalizeHex(e.target.value, value))}
          className="h-12 w-14 cursor-pointer rounded-2xl border border-[var(--color-border)] bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <input
          className={cx(inputClass(), "font-mono uppercase", readOnlyInputState(disabled))}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(normalizeHex(e.target.value, value))}
        />
      </div>
    </div>
  );
}

export default function SettingsGeneral() {
  const role = useMemo(() => getUserRole(), []);
  const isOwner = role === "OWNER";
  const isReadOnly = !isOwner;

  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [documentSettings, setDocumentSettings] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    shopType: "",
    district: "",
    sector: "",
    address: "",
    logoUrl: "",
    logoKey: "",
    receiptHeader: "",
    receiptFooter: "",
    countryCode: "RW",
    currencyCode: "RWF",
    timezone: "Africa/Kigali",
    cashDrawerBlockCashSales: true,
  });

  const [docForm, setDocForm] = useState({
    receiptPrefix: "RCT",
    invoicePrefix: "INV",
    warrantyPrefix: "WAR",
    proformaPrefix: "PRF",
    receiptPadding: 6,
    invoicePadding: 6,
    warrantyPadding: 6,
    proformaPadding: 6,
    invoiceTerms: "",
    warrantyTerms: "",
    proformaTerms: "",
    deliveryNoteTerms: "",
    documentPrimaryColor: "#077DCB",
    documentAccentColor: "#E8EEF5",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedLogoName, setSelectedLogoName] = useState("");

  useEffect(() => {
    let alive = true;

    Promise.allSettled([getStoreProfile(), getStoreSetupChecklist(), getDocumentSettings()])
      .then(([profileRes, checklistRes, docsRes]) => {
        if (!alive) return;

        if (profileRes.status === "fulfilled") {
          const nextProfile = profileRes.value?.profile || null;
          setProfile(nextProfile);

          if (nextProfile) {
            setForm({
              name: nextProfile.name || "",
              email: nextProfile.email || "",
              phone: nextProfile.phone || "",
              shopType: nextProfile.shopType || "",
              district: nextProfile.district || "",
              sector: nextProfile.sector || "",
              address: nextProfile.address || "",
              logoUrl: nextProfile.logoUrl || "",
              logoKey: nextProfile.logoKey || "",
              receiptHeader: nextProfile.receiptHeader || "",
              receiptFooter: nextProfile.receiptFooter || "",
              countryCode: nextProfile.countryCode || "RW",
              currencyCode: nextProfile.currencyCode || "RWF",
              timezone: nextProfile.timezone || "Africa/Kigali",
              cashDrawerBlockCashSales: Boolean(nextProfile.cashDrawerBlockCashSales),
            });
          }
        }

        if (checklistRes.status === "fulfilled") {
          setChecklist(checklistRes.value);
        }

        if (docsRes.status === "fulfilled") {
          const ds = docsRes.value?.documentSettings || null;
          setDocumentSettings(ds);

          if (ds) {
            setDocForm({
              receiptPrefix: ds.receiptPrefix || "RCT",
              invoicePrefix: ds.invoicePrefix || "INV",
              warrantyPrefix: ds.warrantyPrefix || "WAR",
              proformaPrefix: ds.proformaPrefix || "PRF",
              receiptPadding: ds.receiptPadding || 6,
              invoicePadding: ds.invoicePadding || 6,
              warrantyPadding: ds.warrantyPadding || 6,
              proformaPadding: ds.proformaPadding || 6,
              invoiceTerms: ds.invoiceTerms || "",
              warrantyTerms: ds.warrantyTerms || "",
              proformaTerms: ds.proformaTerms || "",
              deliveryNoteTerms: ds.deliveryNoteTerms || "",
              documentPrimaryColor: ds.documentPrimaryColor || "#077DCB",
              documentAccentColor: ds.documentAccentColor || "#E8EEF5",
            });
          }
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!profile) return false;

    return (
      JSON.stringify(form) !==
      JSON.stringify({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        shopType: profile.shopType || "",
        district: profile.district || "",
        sector: profile.sector || "",
        address: profile.address || "",
        logoUrl: profile.logoUrl || "",
        logoKey: profile.logoKey || "",
        receiptHeader: profile.receiptHeader || "",
        receiptFooter: profile.receiptFooter || "",
        countryCode: profile.countryCode || "RW",
        currencyCode: profile.currencyCode || "RWF",
        timezone: profile.timezone || "Africa/Kigali",
        cashDrawerBlockCashSales: Boolean(profile.cashDrawerBlockCashSales),
      })
    );
  }, [form, profile]);

  const docDirty = useMemo(() => {
    if (!documentSettings) return false;

    return (
      JSON.stringify(docForm) !==
      JSON.stringify({
        receiptPrefix: documentSettings.receiptPrefix || "RCT",
        invoicePrefix: documentSettings.invoicePrefix || "INV",
        warrantyPrefix: documentSettings.warrantyPrefix || "WAR",
        proformaPrefix: documentSettings.proformaPrefix || "PRF",
        receiptPadding: documentSettings.receiptPadding || 6,
        invoicePadding: documentSettings.invoicePadding || 6,
        warrantyPadding: documentSettings.warrantyPadding || 6,
        proformaPadding: documentSettings.proformaPadding || 6,
        invoiceTerms: documentSettings.invoiceTerms || "",
        warrantyTerms: documentSettings.warrantyTerms || "",
        proformaTerms: documentSettings.proformaTerms || "",
        deliveryNoteTerms: documentSettings.deliveryNoteTerms || "",
        documentPrimaryColor: documentSettings.documentPrimaryColor || "#077DCB",
        documentAccentColor: documentSettings.documentAccentColor || "#E8EEF5",
      })
    );
  }, [docForm, documentSettings]);

  async function refreshChecklist() {
    const data = await getStoreSetupChecklist();
    setChecklist(data);
  }

  async function onSave() {
    if (isReadOnly) {
      toast.error("Only the owner can update store profile");
      return;
    }

    if (!dirty || saving) return;

    setSaving(true);

    try {
      const data = await updateStoreProfile({
        ...form,
        receiptHeader: form.receiptHeader.trim() || null,
        receiptFooter: form.receiptFooter.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        logoKey: form.logoKey.trim() || null,
      });

      const nextProfile = data?.profile || null;
      setProfile(nextProfile);

      if (nextProfile) {
        setForm({
          name: nextProfile.name || "",
          email: nextProfile.email || "",
          phone: nextProfile.phone || "",
          shopType: nextProfile.shopType || "",
          district: nextProfile.district || "",
          sector: nextProfile.sector || "",
          address: nextProfile.address || "",
          logoUrl: nextProfile.logoUrl || "",
          logoKey: nextProfile.logoKey || "",
          receiptHeader: nextProfile.receiptHeader || "",
          receiptFooter: nextProfile.receiptFooter || "",
          countryCode: nextProfile.countryCode || "RW",
          currencyCode: nextProfile.currencyCode || "RWF",
          timezone: nextProfile.timezone || "Africa/Kigali",
          cashDrawerBlockCashSales: Boolean(nextProfile.cashDrawerBlockCashSales),
        });
      }

      await refreshChecklist();
      toast.success("Store profile updated");
    } catch (err) {
      toast.error(err?.message || "Failed to save store profile");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveDocs() {
    if (isReadOnly) {
      toast.error("Only the owner can update document settings");
      return;
    }

    if (!docDirty || savingDocs) return;

    setSavingDocs(true);

    try {
      const data = await updateDocumentSettings({
        ...docForm,
        receiptPadding: Number(docForm.receiptPadding),
        invoicePadding: Number(docForm.invoicePadding),
        warrantyPadding: Number(docForm.warrantyPadding),
        proformaPadding: Number(docForm.proformaPadding),
      });

      const next = data?.documentSettings || null;
      setDocumentSettings(next);

      if (next) {
        setDocForm({
          receiptPrefix: next.receiptPrefix || "RCT",
          invoicePrefix: next.invoicePrefix || "INV",
          warrantyPrefix: next.warrantyPrefix || "WAR",
          proformaPrefix: next.proformaPrefix || "PRF",
          receiptPadding: next.receiptPadding || 6,
          invoicePadding: next.invoicePadding || 6,
          warrantyPadding: next.warrantyPadding || 6,
          proformaPadding: next.proformaPadding || 6,
          invoiceTerms: next.invoiceTerms || "",
          warrantyTerms: next.warrantyTerms || "",
          proformaTerms: next.proformaTerms || "",
          deliveryNoteTerms: next.deliveryNoteTerms || "",
          documentPrimaryColor: next.documentPrimaryColor || "#077DCB",
          documentAccentColor: next.documentAccentColor || "#E8EEF5",
        });
      }

      toast.success("Document settings updated");
    } catch (err) {
      toast.error(err?.message || "Failed to save document settings");
    } finally {
      setSavingDocs(false);
    }
  }

  async function onLogoSelected(file) {
    if (!file) return;

    if (isReadOnly) {
      toast.error("Only the owner can upload a logo");
      return;
    }

    setSelectedLogoName(file.name || "");
    setUploadingLogo(true);

    try {
      const data = await createLogoUploadUrl({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });

      const upload = data?.upload;

      if (!upload?.uploadUrl || !upload?.publicUrl || !upload?.objectKey) {
        throw new Error("Upload contract is incomplete");
      }

      await uploadFileToSignedUrl(upload.uploadUrl, file, {
        headers: upload.headers || {},
      });

      const updated = await updateStoreProfile({
        logoUrl: upload.publicUrl,
        logoKey: upload.objectKey,
      });

      const nextProfile = updated?.profile || null;
      setProfile(nextProfile);
      setForm((curr) => ({
        ...curr,
        logoUrl: nextProfile?.logoUrl || upload.publicUrl,
        logoKey: nextProfile?.logoKey || upload.objectKey,
      }));

      await refreshChecklist();
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openLogoPicker() {
    if (isReadOnly || uploadingLogo) return;
    fileInputRef.current?.click();
  }

  function updateField(key, value) {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  function updateDocField(key, value) {
    setDocForm((curr) => ({ ...curr, [key]: value }));
  }

  if (loading) {
    return <PageSkeleton titleWidth="w-44" lines={2} showTable={false} />;
  }

  if (!profile) {
    return (
      <div className={cx(pageCard(), "p-5")}>
        <div className="text-base font-black text-[var(--color-text)]">
          Store settings are not available.
        </div>
      </div>
    );
  }

  const readinessPercent = checklist?.readinessPercent || 0;
  const checks = checklist?.checks || [];
  const isOperationallyReady = Boolean(checklist?.isOperationallyReady);

  return (
    <div className="space-y-6">
      {isReadOnly ? <ReadOnlyBanner /> : null}

      <section className="space-y-5">
        <div className={cx(pageCard(), "overflow-hidden")}>
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <SectionHeader
              eyebrow="Overview"
              title="Store settings"
              text="Control store identity, printed document defaults, and operational rules from one clean owner workspace."
            />
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isOperationallyReady ? "primary" : "warning"}>
                {isOperationallyReady ? "Operationally ready" : "Needs attention"}
              </Badge>
              <Badge>{readinessPercent}% complete</Badge>
              <Badge tone="strong">
                {form.currencyCode} • {form.timezone}
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <SummaryCard
                label="Readiness"
                value={`${readinessPercent}%`}
                note={isOperationallyReady ? "Core setup completed" : "Important items still missing"}
                tone={isOperationallyReady ? "neutral" : "warning"}
              />

              <SummaryCard
                label="Documents"
                value={documentSettings ? "Ready" : "Pending"}
                note="Receipts, invoices, delivery notes, proformas, warranties"
                tone={documentSettings ? "neutral" : "warning"}
              />

              <SummaryCard
                label="Cash rule"
                value={form.cashDrawerBlockCashSales ? "Strict" : "Flexible"}
                note="Cash sales when drawer is closed"
                tone={form.cashDrawerBlockCashSales ? "warning" : "neutral"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="Checklist"
              title="Setup checklist"
              subtitle="Track what is still missing before the store is fully ready."
            />
          </div>

          <div className={cx(softPanel(), "px-4 py-3")}>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Checkpoints
            </div>
            <div className="mt-2 text-xl font-black tracking-tight text-[var(--color-text)]">
              {checks.length}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {checks.length ? (
            checks.map((item) => (
              <div key={item.key} className={cx(softPanel(), "p-4")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-[var(--color-text)]">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
                      {item.detail}
                    </div>
                  </div>

                  <ChecklistPill done={item.done} required={item.required} />
                </div>
              </div>
            ))
          ) : (
            <div className={cx(softPanel(), "p-4 text-sm font-semibold text-[var(--color-text-muted)] sm:col-span-2")}>
              No checklist items found.
            </div>
          )}
        </div>
      </section>

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <SectionHeader
          eyebrow="Identity"
          title="Store identity"
          text="This information appears across the workspace and on printed documents."
          action={
            <AsyncButton
              type="button"
              loading={saving}
              disabled={!dirty || isReadOnly}
              onClick={onSave}
            >
              Save profile
            </AsyncButton>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className={cx(softPanel(), "p-5")}>
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[var(--color-surface)] text-lg font-black text-[var(--color-text)] ring-1 ring-[var(--color-border)]">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Store logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    initialsFromName(form.name)
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-base font-black tracking-tight text-[var(--color-text)]">
                    {form.name || "Your store"}
                  </div>

                  <div className="mt-1 truncate text-sm font-semibold text-[var(--color-text-muted)]">
                    {form.email || "store@example.com"}
                  </div>

                  <div className="mt-2 text-xs font-semibold text-[var(--color-text-muted)]">
                    {STORE_CATEGORY_OPTIONS.find((x) => x.value === form.shopType)?.label ||
                      "Store category not set"}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className={fieldLabel()}>Store logo</label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => onLogoSelected(e.target.files?.[0])}
                  className="hidden"
                  disabled={isReadOnly || uploadingLogo}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <AsyncButton
                    type="button"
                    loading={uploadingLogo}
                    onClick={openLogoPicker}
                    disabled={isReadOnly}
                    variant="secondary"
                  >
                    {form.logoUrl ? "Replace logo" : "Upload logo"}
                  </AsyncButton>

                  <div className="min-w-0 text-sm font-semibold text-[var(--color-text-muted)]">
                    {selectedLogoName ? (
                      <span className="truncate">{selectedLogoName}</span>
                    ) : (
                      "PNG, JPEG, or WEBP up to 3MB"
                    )}
                  </div>
                </div>

                <p className={fieldHelp()}>
                  The backend accepts only PNG, JPEG, and WEBP files up to 3MB.
                </p>
              </div>

              <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Operating rule
                </div>

                <label className="mt-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.cashDrawerBlockCashSales)}
                    disabled={isReadOnly}
                    onChange={(e) => updateField("cashDrawerBlockCashSales", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                  />

                  <div>
                    <div className="text-sm font-black text-[var(--color-text)]">
                      Block cash sales when drawer is closed
                    </div>
                    <div className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-muted)]">
                      Recommended for stronger day-end cash discipline.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabel()}>Store name</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.name}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div>
                <label className={fieldLabel()}>Store category</label>
                <select
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.shopType}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("shopType", e.target.value)}
                >
                  {STORE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <p className={fieldHelp()}>
                  Choose the closest category so reporting and setup stay consistent.
                </p>
              </div>

              <div>
                <label className={fieldLabel()}>Email</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.email}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div>
                <label className={fieldLabel()}>Phone</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.phone}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>

              <div>
                <label className={fieldLabel()}>District</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.district}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("district", e.target.value)}
                />
              </div>

              <div>
                <label className={fieldLabel()}>Sector</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.sector}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("sector", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={fieldLabel()}>Address</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.address}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>

              <InfoStat label="Country code" value={form.countryCode} />
              <InfoStat label="Currency code" value={form.currencyCode} />

              <div className="sm:col-span-2">
                <label className={fieldLabel()}>Timezone</label>
                <input
                  className={cx(inputClass(), readOnlyInputState(isReadOnly))}
                  value={form.timezone}
                  disabled={isReadOnly}
                  onChange={(e) => updateField("timezone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="Receipt"
              title="Receipt copy"
              subtitle="Header and footer text used in your receipt experience."
            />
          </div>

          <Badge tone="strong">Receipt experience</Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className={cx(softPanel(), "p-4")}>
            <TextareaField
              label="Receipt header"
              value={form.receiptHeader}
              disabled={isReadOnly}
              onChange={(e) => updateField("receiptHeader", e.target.value)}
              placeholder="Example: Thank you for shopping with us."
              help="Shown near the top of the printed receipt."
              rows={4}
            />
          </div>

          <div className={cx(softPanel(), "p-4")}>
            <TextareaField
              label="Receipt footer"
              value={form.receiptFooter}
              disabled={isReadOnly}
              onChange={(e) => updateField("receiptFooter", e.target.value)}
              placeholder="Example: Goods sold are not returnable without receipt."
              help="Used for policy notes, return rules, or store reminders."
              rows={4}
            />
          </div>
        </div>
      </section>

      <section className={cx(pageCard(), "p-5 sm:p-6")}>
        <SectionHeader
          eyebrow="Branding"
          title="Document branding"
          text="Owner-controlled theme colors applied across invoices, receipts, delivery notes, proformas, and warranties."
          action={
            <AsyncButton
              type="button"
              loading={savingDocs}
              disabled={!docDirty || isReadOnly}
              onClick={onSaveDocs}
            >
              Save document settings
            </AsyncButton>
          }
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ColorField
            label="Primary document color"
            value={docForm.documentPrimaryColor}
            disabled={isReadOnly}
            onChange={(value) => updateDocField("documentPrimaryColor", value)}
          />

          <ColorField
            label="Document accent color"
            value={docForm.documentAccentColor}
            disabled={isReadOnly}
            onChange={(value) => updateDocField("documentAccentColor", value)}
          />
        </div>

        <p className={fieldHelp()}>
          Use one strong owner color and one soft accent. This keeps every document consistent and premium.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={fieldLabel()}>Receipt prefix</label>
            <input
              className={cx(inputClass(), readOnlyInputState(isReadOnly))}
              value={docForm.receiptPrefix}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("receiptPrefix", e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabel()}>Invoice prefix</label>
            <input
              className={cx(inputClass(), readOnlyInputState(isReadOnly))}
              value={docForm.invoicePrefix}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("invoicePrefix", e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabel()}>Warranty prefix</label>
            <input
              className={cx(inputClass(), readOnlyInputState(isReadOnly))}
              value={docForm.warrantyPrefix}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("warrantyPrefix", e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabel()}>Proforma prefix</label>
            <input
              className={cx(inputClass(), readOnlyInputState(isReadOnly))}
              value={docForm.proformaPrefix}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("proformaPrefix", e.target.value)}
            />
          </div>

          <NumberField
            label="Receipt padding"
            value={docForm.receiptPadding}
            disabled={isReadOnly}
            onChange={(e) => updateDocField("receiptPadding", e.target.value)}
          />

          <NumberField
            label="Invoice padding"
            value={docForm.invoicePadding}
            disabled={isReadOnly}
            onChange={(e) => updateDocField("invoicePadding", e.target.value)}
          />

          <NumberField
            label="Warranty padding"
            value={docForm.warrantyPadding}
            disabled={isReadOnly}
            onChange={(e) => updateDocField("warrantyPadding", e.target.value)}
          />

          <NumberField
            label="Proforma padding"
            value={docForm.proformaPadding}
            disabled={isReadOnly}
            onChange={(e) => updateDocField("proformaPadding", e.target.value)}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <PreviewDocument
            title="Receipt"
            prefix={docForm.receiptPrefix}
            padding={docForm.receiptPadding}
            preview={documentSettings?.receiptNumberPreview}
            terms={form.receiptFooter}
            primaryColor={docForm.documentPrimaryColor}
            accentColor={docForm.documentAccentColor}
          />

          <PreviewDocument
            title="Invoice"
            prefix={docForm.invoicePrefix}
            padding={docForm.invoicePadding}
            preview={documentSettings?.invoiceNumberPreview}
            terms={docForm.invoiceTerms}
            primaryColor={docForm.documentPrimaryColor}
            accentColor={docForm.documentAccentColor}
          />

          <PreviewDocument
            title="Delivery Note"
            preview={documentSettings?.deliveryNoteNumberPreview}
            terms={docForm.deliveryNoteTerms}
            primaryColor={docForm.documentPrimaryColor}
            accentColor={docForm.documentAccentColor}
            previewLabel="Document preview"
            previewFallback="Delivery note theme preview"
          />

          <PreviewDocument
            title="Warranty"
            prefix={docForm.warrantyPrefix}
            padding={docForm.warrantyPadding}
            preview={documentSettings?.warrantyNumberPreview}
            terms={docForm.warrantyTerms}
            primaryColor={docForm.documentPrimaryColor}
            accentColor={docForm.documentAccentColor}
          />

          <PreviewDocument
            title="Proforma"
            prefix={docForm.proformaPrefix}
            padding={docForm.proformaPadding}
            preview={documentSettings?.proformaNumberPreview}
            terms={docForm.proformaTerms}
            primaryColor={docForm.documentPrimaryColor}
            accentColor={docForm.documentAccentColor}
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className={cx(softPanel(), "p-4")}>
            <TextareaField
              label="Invoice terms"
              value={docForm.invoiceTerms}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("invoiceTerms", e.target.value)}
              placeholder="Example: Payment due within 7 days from invoice date."
              help="Printed on invoice documents."
              rows={4}
            />
          </div>

          <div className={cx(softPanel(), "p-4")}>
            <TextareaField
              label="Warranty terms"
              value={docForm.warrantyTerms}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("warrantyTerms", e.target.value)}
              placeholder="Example: Warranty void if seal is broken or device is physically damaged."
              help="Printed on warranty documents."
              rows={4}
            />
          </div>

          <div className={cx(softPanel(), "p-4")}>
            <TextareaField
              label="Proforma terms"
              value={docForm.proformaTerms}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("proformaTerms", e.target.value)}
              placeholder="Example: Prices are valid for 3 days from issue date."
              help="Printed on proforma documents."
              rows={4}
            />
          </div>

          <div className={cx(softPanel(), "p-4")}>
            <TextareaField
              label="Delivery note terms"
              value={docForm.deliveryNoteTerms}
              disabled={isReadOnly}
              onChange={(e) => updateDocField("deliveryNoteTerms", e.target.value)}
              placeholder="Example: Please verify all items before signing."
              help="Printed on delivery note documents."
              rows={4}
            />
          </div>
        </div>
      </section>
    </div>
  );
}