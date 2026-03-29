import { Link } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";

export default function LandingPage() {
  return (
    <AuthShell
      eyebrow="Storvex for retail stores"
      title="Run your store with control, not guesswork."
      subtitle="Point of sale, inventory, credit tracking, receipts, warranty, and staff accountability in one professional system built for real operations."
      sideTitle="Built for owners who want fewer leaks and clearer control"
      sideBody="Storvex is designed to make daily operations visible, measurable, and professional. It helps owners reduce stock leakage, track credit properly, and print business-grade documents."
      sideItems={[
        {
          title: "Track what matters",
          body: "Sales, stock, credit, cash drawer activity, and staff actions are all visible in one place.",
        },
        {
          title: "Operate professionally",
          body: "Use branded receipts, invoices, and warranty documents that make the store look serious and trustworthy.",
        },
        {
          title: "Start with full access",
          body: "Every new store starts with a 30-day full trial so setup and daily operations can begin immediately.",
        },
        {
          title: "Designed for real store work",
          body: "Fast workflows, clean dashboards, and controls that make sense for daily retail operations.",
        },
      ]}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/signup" className="btn-primary">
            Create store account
          </Link>
          <Link to="/login" className="btn-secondary">
            Log in
          </Link>
        </div>
      }
      compact
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[rgb(var(--border))] p-4">
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--text-soft))]">POS</div>
          <div className="mt-2 text-sm font-medium text-[rgb(var(--text))]">
            Faster selling with cleaner records
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] p-4">
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--text-soft))]">Inventory</div>
          <div className="mt-2 text-sm font-medium text-[rgb(var(--text))]">
            Know what is in stock and what is leaking
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] p-4">
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--text-soft))]">Documents</div>
          <div className="mt-2 text-sm font-medium text-[rgb(var(--text))]">
            Print receipts, invoices, and warranty records
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4">
        <div className="text-sm font-medium text-[rgb(var(--text))]">What happens next</div>
        <ol className="mt-3 space-y-2 text-sm text-[rgb(var(--text-muted))]">
          <li>1. Create your store account</li>
          <li>2. Verify email and phone</li>
          <li>3. Start your 30-day full trial</li>
          <li>4. Complete store setup and begin selling</li>
        </ol>
      </div>
    </AuthShell>
  );
}