import { Link } from "react-router-dom";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function shell() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function card() {
  return "rounded-[24px] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:hover:border-[rgb(var(--border-strong))]";
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

function summaryAccent(tone) {
  if (tone === "success") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  if (tone === "info") return "bg-sky-500";
  return "bg-stone-900 dark:bg-[rgb(var(--text))]";
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", summaryAccent(tone))} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
        <div className={cx("mt-1 text-sm", mutedText())}>{note}</div>
      </div>
    </div>
  );
}

function DocIcon({ type }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" };

  switch (type) {
    case "receipt":
      return (
        <svg {...common}>
          <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "invoice":
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M15 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3V7zm11 3h3l2 2v5h-5v-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="7.5" cy="18" r="1.5" fill="currentColor" />
          <circle cx="17.5" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );
    case "proforma":
      return (
        <svg {...common}>
          <path d="M7 3h10v18H7z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8h6M9 12h6M9 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "warranty":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9.5 12.5l1.7 1.7 3.8-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

const DOCUMENT_SECTIONS = [
  {
    title: "Receipts",
    path: "/app/documents/receipts",
    createPath: null,
    createLabel: null,
    type: "receipt",
    note: "Sales payment records and branded receipt previews.",
    badge: "High volume",
  },
  {
    title: "Invoices",
    path: "/app/documents/invoices",
    createPath: null,
    createLabel: null,
    type: "invoice",
    note: "Formal billing documents with owner branding and terms.",
    badge: "Financial",
  },
  {
    title: "Delivery Notes",
    path: "/app/documents/delivery-notes",
    createPath: "/app/documents/delivery-notes/create",
    createLabel: "Create",
    type: "delivery",
    note: "Goods handover confirmation with branded print layout.",
    badge: "Logistics",
  },
  {
    title: "Proformas",
    path: "/app/documents/proformas",
    createPath: "/app/documents/proformas/create",
    createLabel: "Create",
    type: "proforma",
    note: "Preliminary quotations before final billing.",
    badge: "Pre-sale",
  },
  {
    title: "Warranties",
    path: "/app/documents/warranties",
    createPath: "/app/documents/warranties/create",
    createLabel: "Create",
    type: "warranty",
    note: "After-sales warranty certificates and coverage records.",
    badge: "After-sales",
  },
];

export default function DocumentsHome() {
  return (
    <div className="space-y-5">
      <section className={cx(shell(), "relative overflow-hidden p-5 md:p-6")}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 opacity-[0.03] dark:from-white dark:via-white dark:to-white dark:opacity-[0.04]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
              Unified workspace
            </div>

            <h1 className={cx("mt-2 text-2xl font-semibold tracking-tight md:text-3xl", strongText())}>
              Document Center
            </h1>

            <p className={cx("mt-3 max-w-3xl text-sm leading-6 md:text-[15px]", mutedText())}>
              One premium home for receipts, invoices, delivery notes, proformas, and warranties.
              Preview the real branded renderer, verify terms, and move through business documents
              without jumping between disconnected pages.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/app/documents/receipts"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]"
            >
              Open Receipts
            </Link>

            <Link
              to="/app/documents/invoices"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]"
            >
              Open Invoices
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard
            label="Document flow"
            value="Unified"
            note="One place for all operational documents"
            tone="success"
          />
          <SummaryCard
            label="Branding"
            value="Live"
            note="Print colors and terms come from General Settings"
            tone="info"
          />
          <SummaryCard
            label="Owner control"
            value="Tight"
            note="Professional output with centralized standards"
            tone="warning"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DOCUMENT_SECTIONS.map((item) => (
          <div key={item.path} className={cx(card(), "group block p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 transition group-hover:bg-stone-100 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))] dark:text-[rgb(var(--text))] dark:group-hover:bg-[rgb(var(--bg-muted))]">
                <DocIcon type={item.type} />
              </div>

              <span className="badge-neutral">{item.badge}</span>
            </div>

            <h2 className={cx("mt-5 text-lg font-semibold", strongText())}>{item.title}</h2>
            <p className={cx("mt-2 text-sm leading-6", mutedText())}>{item.note}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to={item.path}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))]"
              >
                Open Section
              </Link>

              {item.createPath && item.createLabel ? (
                <Link
                  to={item.createPath}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]"
                >
                  {item.createLabel}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className={cx(shell(), "p-5 md:p-6")}>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className={cx("text-lg font-semibold", strongText())}>Why this matters</div>
            <p className={cx("mt-2 text-sm leading-6", mutedText())}>
              Real stores do not think in frontend modules. They think in proof, billing, delivery,
              and after-sales accountability. Document Center turns those proof points into one
              trusted operational layer.
            </p>
          </div>

          <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
            <div className={cx("text-sm font-semibold", strongText())}>Quick access</div>
            <div className="mt-3 grid gap-2">
              <Link to="/app/documents/delivery-notes" className="text-sm text-stone-700 hover:underline dark:text-[rgb(var(--text-muted))]">
                Delivery Notes
              </Link>
              <Link to="/app/documents/proformas" className="text-sm text-stone-700 hover:underline dark:text-[rgb(var(--text-muted))]">
                Proformas
              </Link>
              <Link to="/app/documents/warranties" className="text-sm text-stone-700 hover:underline dark:text-[rgb(var(--text-muted))]">
                Warranties
              </Link>
              <Link to="/app/documents/proformas/create" className="text-sm text-stone-700 hover:underline dark:text-[rgb(var(--text-muted))]">
                Create Proforma
              </Link>
              <Link to="/app/documents/warranties/create" className="text-sm text-stone-700 hover:underline dark:text-[rgb(var(--text-muted))]">
                Create Warranty
              </Link>
              <Link to="/app/documents/delivery-notes/create" className="text-sm text-stone-700 hover:underline dark:text-[rgb(var(--text-muted))]">
                Create Delivery Note
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}