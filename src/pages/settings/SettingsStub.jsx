import { useEffect } from "react";

function titleItems(title) {
  if (title === "User roles") {
    return [
      "Role permissions for every staff category",
      "Access rules per page and feature",
      "Sensitive action restrictions and approvals",
    ];
  }

  if (title === "Billing plans") {
    return [
      "Current subscription plan and renewal state",
      "Invoices, receipts, and billing history",
      "Upgrade, downgrade, and usage controls",
    ];
  }

  if (title === "Login & security") {
    return [
      "Password and authentication rules",
      "Signed-in sessions and trusted devices",
      "Security activity and access review",
    ];
  }

  if (title === "Audit logs") {
    return [
      "Track important operational actions",
      "See who changed what and when",
      "Export logs for review and compliance",
    ];
  }

  return ["Configured features", "Access controls", "System history"];
}

export default function SettingsStub({ title = "Coming soon" }) {
  useEffect(() => {
    document.title = `${title} • Storvex`;
  }, [title]);

  const items = titleItems(title);

  return (
    <div className="app-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-[rgb(var(--text))]">{title}</div>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            This section is prepared and will be enabled next.
          </p>
        </div>

        <span className="badge-neutral">Coming soon</span>
      </div>

      <div className="mt-5 border-t border-[rgb(var(--border))] pt-5">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-muted))] p-4">
          <div className="text-sm font-medium text-[rgb(var(--text))]">What will live here</div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--text-muted))]">
            {items.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}