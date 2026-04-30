import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  activateSupplier,
  deactivateSupplier,
  getSupplierById,
  listSupplierSupplies,
} from "../../services/suppliersApi";

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

function Pill({ tone = "neutral", children }) {
  const cls =
    tone === "danger"
      ? "bg-[rgba(219,80,74,0.14)] text-[var(--color-danger)]"
      : tone === "warning"
      ? "bg-[#ff9f43] text-[#402100]"
      : tone === "success"
      ? "bg-[#7cfcc6] text-[#0b3b2e]"
      : "bg-[var(--color-surface)] text-[var(--color-text-muted)]";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      {children}
    </span>
  );
}

function Section({ title, right, children }) {
  return (
    <section className={cx(shell(), "overflow-hidden")}>
      <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className={cx("text-base font-black tracking-tight", strongText())}>{title}</h2>
          {right}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function fmtMoney(n) {
  return `RWF ${Number(n || 0).toLocaleString()}`;
}

function idTypeLabel(t) {
  if (t === "NATIONAL_ID") return "National ID";
  if (t === "PASSPORT") return "Passport";
  return t || "—";
}

function sourceTypeLabel(v) {
  const map = {
    BOUGHT: "Bought",
    GIFT: "Gift",
    TRADE_IN: "Trade-in",
    CONSIGNMENT: "Consignment",
    OTHER: "Other",
  };
  return map[String(v || "").toUpperCase()] || "—";
}

function SkeletonLine({ className = "" }) {
  return <div className={cx("animate-pulse rounded-full bg-[var(--color-surface)]", className)} />;
}

function EmptyState({ title, text }) {
  return (
    <div className={cx(panel(), "px-5 py-10 text-center")}>
      <div className={cx("text-sm font-semibold", strongText())}>{title}</div>
      <div className={cx("mt-1 text-xs leading-5", mutedText())}>{text}</div>
    </div>
  );
}

export default function SupplierView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);

  const [suppliesLoading, setSuppliesLoading] = useState(true);
  const [supplies, setSupplies] = useState([]);

  const totals = useMemo(() => {
    const rows = Array.isArray(supplies) ? supplies : [];
    const totalCost = rows.reduce((sum, s) => sum + Number(s.totalCost || 0), 0);
    const totalSell = rows.reduce((sum, s) => sum + Number(s.totalSell || 0), 0);
    return { totalCost, totalSell };
  }, [supplies]);

  async function loadSupplier() {
    setLoading(true);
    try {
      const s = await getSupplierById(String(id));
      setSupplier(s);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load supplier");
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupplies() {
    setSuppliesLoading(true);
    try {
      const data = await listSupplierSupplies(String(id));
      setSupplies(Array.isArray(data?.supplies) ? data.supplies : []);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load deliveries");
      setSupplies([]);
    } finally {
      setSuppliesLoading(false);
    }
  }

  useEffect(() => {
    void loadSupplier();
    void loadSupplies();
  }, [id]);

  async function toggleActive() {
    try {
      if (!supplier) return;

      if (supplier.isActive) {
        await deactivateSupplier(supplier.id);
        toast.success("Supplier hidden");
      } else {
        await activateSupplier(supplier.id);
        toast.success("Supplier shown");
      }

      await Promise.all([loadSupplier(), loadSupplies()]);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Action failed");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <section className={cx(shell(), "overflow-hidden")}>
          <div className="px-5 py-5 sm:px-6">
            <SkeletonLine className="h-8 w-56" />
            <SkeletonLine className="mt-3 h-4 w-72" />
          </div>
        </section>
      </div>
    );
  }

  if (!supplier) return <p className={mutedText()}>Supplier not found.</p>;

  return (
    <div className="space-y-6">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={cx("text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
                  {supplier.name}
                </h1>
                {supplier.isActive ? <Pill tone="success">Active</Pill> : <Pill tone="warning">Hidden</Pill>}
                {supplier.verifiedAt ? <Pill tone="info">Verified</Pill> : null}
              </div>

              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                ID: <span className={strongText()}>{idTypeLabel(supplier.idType)}</span> •{" "}
                <span className={strongText()}>{supplier.idNumber}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => nav("/app/suppliers")}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
              >
                Back
              </button>

              <Link
                to={`/app/suppliers/${supplier.id}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90"
              >
                Edit
              </Link>

              <Link
                to={`/app/suppliers/${supplier.id}/supplies/new`}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Add delivery
              </Link>

              <button
                type="button"
                onClick={toggleActive}
                className={cx(
                  "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition hover:opacity-95",
                  supplier.isActive ? "bg-[var(--color-danger)]" : "bg-emerald-600"
                )}
              >
                {supplier.isActive ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Contact">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Phone</span>
              <span className={strongText()}>{supplier.phone || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Email</span>
              <span className={strongText()}>{supplier.email || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Address</span>
              <span className={strongText()}>{supplier.address || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Company</span>
              <span className={strongText()}>{supplier.companyName || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Tax ID</span>
              <span className={strongText()}>{supplier.taxId || "—"}</span>
            </div>
          </div>
        </Section>

        <Section title="Safety info">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Source type</span>
              <span className={strongText()}>{sourceTypeLabel(supplier.sourceType)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className={mutedText()}>Source details</span>
              <span className={strongText()}>{supplier.sourceDetails || "—"}</span>
            </div>
            <div className="pt-2">
              <div className={cx("text-xs", mutedText())}>Notes</div>
              <div className={cx("mt-1 text-sm leading-6 whitespace-pre-wrap", strongText())}>
                {supplier.notes || "—"}
              </div>
            </div>
          </div>
        </Section>
      </div>

      <Section
        title="Deliveries"
        right={
          <AsyncButton
            type="button"
            loading={suppliesLoading}
            loadingText="Refreshing..."
            variant="secondary"
            onClick={loadSupplies}
          >
            Refresh
          </AsyncButton>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={cx(panel(), "p-4")}>
            <div className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
              Total deliveries
            </div>
            <div className={cx("mt-2 text-xl font-black tracking-tight", strongText())}>{supplies.length}</div>
          </div>

          <div className={cx(panel(), "p-4")}>
            <div className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
              Total buy cost
            </div>
            <div className={cx("mt-2 text-xl font-black tracking-tight", strongText())}>
              {fmtMoney(totals.totalCost)}
            </div>
          </div>

          <div className={cx(panel(), "p-4")}>
            <div className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
              Total sell value
            </div>
            <div className={cx("mt-2 text-xl font-black tracking-tight", strongText())}>
              {fmtMoney(totals.totalSell)}
            </div>
          </div>
        </div>

        <div className="mt-5">
          {suppliesLoading ? (
            <div className={mutedText()}>Loading...</div>
          ) : supplies.length === 0 ? (
            <EmptyState
              title="No deliveries yet"
              text="This supplier does not have any recorded deliveries yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className={cx("p-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                      Date
                    </th>
                    <th className={cx("p-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                      Type
                    </th>
                    <th className={cx("p-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                      Items
                    </th>
                    <th className={cx("p-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                      Buy total
                    </th>
                    <th className={cx("p-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em]", mutedText())}>
                      Sell total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {supplies.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--color-border)]">
                      <td className={cx("p-3 text-sm", strongText())}>{new Date(s.createdAt).toLocaleString()}</td>
                      <td className={cx("p-3 text-sm", strongText())}>{sourceTypeLabel(s.sourceType)}</td>
                      <td className={cx("p-3 text-center text-sm", strongText())}>{s.itemsCount || 0}</td>
                      <td className={cx("p-3 text-right text-sm", strongText())}>{fmtMoney(s.totalCost)}</td>
                      <td className={cx("p-3 text-right text-sm", strongText())}>{fmtMoney(s.totalSell)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className={cx("mt-3 text-xs", mutedText())}>
                Deliveries help you prove where products came from and how stock entered the system.
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}