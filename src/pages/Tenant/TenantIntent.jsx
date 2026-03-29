import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/apiClient";
import { getOrCreateDeviceId } from "../../utils/deviceId";
import AuthShell from "../../components/auth/AuthShell";
import AsyncButton from "../../components/ui/AsyncButton";

const SHOP_TYPE_OPTIONS = [
  { value: "ELECTRONICS_RETAIL", label: "Electronics Retail" },
  { value: "PHONE_SHOP", label: "Phone Shop" },
  { value: "LAPTOP_SHOP", label: "Laptop Shop" },
  { value: "ACCESSORIES_SHOP", label: "Accessories Shop" },
  { value: "REPAIR_SHOP", label: "Repair Shop" },
  { value: "MIXED_ELECTRONICS", label: "Mixed Electronics" },
];

function normalizePhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("07") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.startsWith("2507") && digits.length === 12) return digits;
  return digits;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function saveOnboardingState(next) {
  localStorage.setItem("storvex_onboarding", JSON.stringify(next));

  localStorage.setItem("storvex_intentId", next.intentId || "");
  localStorage.setItem("storvex_ownerPhone", next.phone || "");
  localStorage.setItem("storvex_ownerEmail", next.email || "");
  localStorage.setItem("storvex_storeName", next.storeName || "");
  localStorage.setItem("storvex_ownerName", next.ownerName || "");
  localStorage.setItem("storvex_shopType", next.shopType || "");
  localStorage.setItem("storvex_district", next.district || "");
  localStorage.setItem("storvex_sector", next.sector || "");
  localStorage.setItem("storvex_address", next.address || "");
  localStorage.setItem("storvex_emailVerified", "false");
  localStorage.setItem("storvex_phoneVerified", "false");
  localStorage.removeItem("storvex_signupMode");
  localStorage.removeItem("storvex_planKey");
}

function readPreviousOnboarding() {
  try {
    const raw = localStorage.getItem("storvex_onboarding");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function TenantIntent() {
  const nav = useNavigate();
  const previous = useMemo(() => readPreviousOnboarding(), []);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    storeName: previous?.storeName || "",
    ownerName: previous?.ownerName || "",
    email: previous?.email || "",
    phone: previous?.phone || "",
    shopType: previous?.shopType || "ELECTRONICS_RETAIL",
    district: previous?.district || "",
    sector: previous?.sector || "",
    address: previous?.address || "",
  });

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function validate() {
    const storeName = String(form.storeName || "").trim();
    const ownerName = String(form.ownerName || "").trim();
    const email = normalizeEmail(form.email);
    const phone = normalizePhone(form.phone);

    if (!storeName) {
      toast.error("Store name is required");
      return false;
    }

    if (storeName.length < 2) {
      toast.error("Store name is too short");
      return false;
    }

    if (!ownerName) {
      toast.error("Owner name is required");
      return false;
    }

    if (ownerName.length < 2) {
      toast.error("Owner name is too short");
      return false;
    }

    if (!email) {
      toast.error("Email is required");
      return false;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      toast.error("Enter a valid email address");
      return false;
    }

    if (!phone) {
      toast.error("Phone number is required");
      return false;
    }

    if (phone.length < 10) {
      toast.error("Enter a valid phone number");
      return false;
    }

    if (!form.shopType) {
      toast.error("Select a store category");
      return false;
    }

    return true;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();

      const payload = {
        storeName: String(form.storeName || "").trim(),
        ownerName: String(form.ownerName || "").trim(),
        email: normalizeEmail(form.email),
        phone: normalizePhone(form.phone),
        shopType: String(form.shopType || "").trim() || undefined,
        district: String(form.district || "").trim() || undefined,
        sector: String(form.sector || "").trim() || undefined,
        address: String(form.address || "").trim() || undefined,
        deviceId,
      };

      const data = await apiFetch("/auth/owner-intent", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const onboardingState = {
        intentId: data?.intentId || "",
        storeName: payload.storeName,
        ownerName: payload.ownerName,
        email: payload.email,
        phone: payload.phone,
        shopType: payload.shopType || "",
        district: payload.district || "",
        sector: payload.sector || "",
        address: payload.address || "",
        emailVerified: false,
        phoneVerified: false,
      };

      saveOnboardingState(onboardingState);

      toast.success("Store account started");
      nav("/verify-otp");
    } catch (err) {
      toast.error(err?.message || "Failed to create store");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Create store account"
      title="Start your store setup"
      subtitle="Create the store identity first, then verify email and phone before activation."
      sideTitle="A strong onboarding start builds trust"
      sideBody="This first step should feel clean and serious. It creates the store identity that billing, login, receipts, and operations will use."
      sideItems={[
        {
          title: "Store identity",
          body: "Store name, owner details, and category are captured before activation.",
        },
        {
          title: "Location",
          body: "District, sector, and address help make the business profile operationally complete.",
        },
        {
          title: "Next step",
          body: "After this, verify email and phone, then choose trial or paid activation.",
        },
      ]}
      footer={
        <div className="text-sm text-[rgb(var(--text-muted))]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[rgb(var(--text))] underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </div>
      }
      compact
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Store name
            </label>
            <input
              className="app-input"
              value={form.storeName}
              onChange={(e) => setField("storeName", e.target.value)}
              placeholder="e.g. Kigali Tech House"
              autoComplete="organization"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Owner name
            </label>
            <input
              className="app-input"
              value={form.ownerName}
              onChange={(e) => setField("ownerName", e.target.value)}
              placeholder="e.g. Jean Luc Rurangwa"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Email
            </label>
            <input
              type="email"
              className="app-input"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="owner@store.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Phone
            </label>
            <input
              className="app-input"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="078xxxxxxx or 25078xxxxxxx"
              autoComplete="tel"
              required
            />
            <div className="mt-1 text-xs text-[rgb(var(--text-soft))]">
              Use the owner phone number that can receive verification and payment requests.
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Store category
            </label>
            <select
              className="app-input"
              value={form.shopType}
              onChange={(e) => setField("shopType", e.target.value)}
              required
            >
              {SHOP_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              District
            </label>
            <input
              className="app-input"
              value={form.district}
              onChange={(e) => setField("district", e.target.value)}
              placeholder="e.g. Gasabo"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Sector
            </label>
            <input
              className="app-input"
              value={form.sector}
              onChange={(e) => setField("sector", e.target.value)}
              placeholder="e.g. Kimihurura"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Address
            </label>
            <input
              className="app-input"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Store address"
            />
          </div>
        </div>

        <AsyncButton type="submit" loading={loading} className="w-full">
          Continue to verification
        </AsyncButton>
      </form>
    </AuthShell>
  );
}