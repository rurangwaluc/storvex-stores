import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import {
  getCashDrawerStatus,
  listCashMovements,
  openCashDrawer,
  closeCashDrawer,
  createCashMovement,
} from "../../services/cashDrawerApi";

const PAGE_SIZE = 10;
const formatMoney = (n) => `Rwf ${Number(n || 0).toLocaleString("en-US")}`;

function normalizeDigits(s) {
  return String(s || "").replace(/[^\d]/g, "");
}

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function strongText() {
  return "text-[var(--color-text)]";
}

function mutedText() {
  return "text-[var(--color-text-muted)]";
}

function softText() {
  return "text-[var(--color-text-muted)]";
}

function pageCard() {
  return "rounded-[28px] bg-[var(--color-card)] shadow-[var(--shadow-card)]";
}

function softPanel() {
  return "rounded-[22px] bg-[var(--color-surface-2)]";
}

function inputClass() {
  return "app-input";
}

function secondaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
}

function primaryBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function successBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-danger)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
}

function StatusBadge({ kind = "neutral", children }) {
  const cls =
    kind === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : kind === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : kind === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        cls
      )}
    >
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow ? (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className={cx("mt-3 text-[1.6rem] font-black tracking-tight sm:text-[1.9rem]", strongText())}>
        {title}
      </h2>
      {subtitle ? <p className={cx("mt-3 text-sm leading-6", mutedText())}>{subtitle}</p> : null}
    </div>
  );
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const iconTone =
    tone === "danger"
      ? "bg-[rgba(219,80,74,0.12)] text-[var(--color-danger)]"
      : tone === "warning"
      ? "bg-[#fff1c9] text-[#b88900]"
      : tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : "bg-[#dff1ff] text-[#4aa8ff]";

  return (
    <article className={cx(pageCard(), "p-5 sm:p-6")}>
      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className={cx(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] shadow-[var(--shadow-soft)]",
            iconTone
          )}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M4 7h16" strokeLinecap="round" />
            <path d="M6 12h12" strokeLinecap="round" />
            <path d="M8 17h8" strokeLinecap="round" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className={cx("text-sm font-semibold", strongText())}>{label}</div>
          <div className={cx("mt-2 text-[1.7rem] font-black leading-tight tracking-[-0.02em]", strongText())}>
            {value}
          </div>
          {note ? <div className={cx("mt-2 text-sm leading-6", mutedText())}>{note}</div> : null}
        </div>
      </div>
    </article>
  );
}

function InfoTile({ label, value, note, tone = "neutral" }) {
  const toneCls =
    tone === "success"
      ? "border border-emerald-200/80 bg-emerald-50/55 dark:border-emerald-500/20 dark:bg-emerald-500/10"
      : tone === "warning"
      ? "border border-amber-200/80 bg-amber-50/55 dark:border-amber-500/20 dark:bg-amber-500/10"
      : tone === "danger"
      ? "border border-rose-200/80 bg-rose-50/55 dark:border-rose-500/20 dark:bg-rose-500/10"
      : "border border-[var(--color-border)] bg-[var(--color-surface-2)]";

  const dotCls =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
      ? "bg-rose-500"
      : "bg-[var(--color-primary)]";

  const labelCls =
    tone === "success"
      ? "text-emerald-700/80 dark:text-emerald-600"
      : tone === "warning"
      ? "text-amber-700/80 dark:text-amber-300"
      : tone === "danger"
      ? "text-rose-700/80 dark:text-rose-300"
      : "text-[var(--color-text-muted)]";

  return (
    <div className={cx("rounded-[22px] p-4 shadow-[var(--shadow-soft)]", toneCls)}>
      <div className="flex items-start gap-3">
        <div className={cx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", dotCls)} />

        <div className="min-w-0 flex-1">
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", labelCls)}>
            {label}
          </div>

          <div className="mt-2 text-xl font-black tracking-tight text-[var(--color-text)]">
            {value}
          </div>

          {note ? (
            <div className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
              {note}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={cx("animate-pulse rounded-[20px] bg-[var(--color-surface-2)]", className)} />;
}

function DrawerSummarySkeleton() {
  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-5 sm:p-6")}>
          <div className="flex items-start gap-4 sm:gap-5">
            <SkeletonBlock className="h-16 w-16 rounded-[20px]" />
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-9 w-28" />
              <SkeletonBlock className="h-4 w-40" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function MovementListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cx(pageCard(), "p-4 sm:p-5")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-4 w-56" />
            </div>
            <SkeletonBlock className="h-8 w-16 rounded-full" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MovementCard({ row }) {
  const isOut = String(row.type || "").toUpperCase() === "OUT";

  return (
    <article
      className={cx(
        pageCard(),
        "border border-[var(--color-border)] p-4 sm:p-5"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cx("text-base font-black tracking-tight", strongText())}>
              {formatMoney(row.amount)}
            </div>
            <StatusBadge kind={isOut ? "danger" : "success"}>
              {isOut ? "Cash out" : "Cash in"}
            </StatusBadge>
          </div>

          <div className={cx("mt-2 text-sm leading-6", mutedText())}>
            {row.note || "No note recorded for this movement."}
          </div>
        </div>

        <div className="text-left lg:text-right">
          <div className={cx("text-xs font-semibold uppercase tracking-[0.18em]", softText())}>
            Recorded
          </div>
          <div className={cx("mt-1 text-sm font-semibold", strongText())}>
            {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Movement type
          </div>
          <div className={cx("mt-2 text-base font-bold", strongText())}>
            {isOut ? "OUT" : "IN"}
          </div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Amount
          </div>
          <div className={cx("mt-2 text-base font-bold", strongText())}>
            {formatMoney(row.amount)}
          </div>
        </div>

        <div className={cx(softPanel(), "p-4")}>
          <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", softText())}>
            Session note
          </div>
          <div className={cx("mt-2 text-sm font-semibold leading-6", strongText())}>
            {row.note || "No note"}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CashDrawer() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");

  const [moveType, setMoveType] = useState("IN");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveNote, setMoveNote] = useState("");

  const [openingBusy, setOpeningBusy] = useState(false);
  const [closingBusy, setClosingBusy] = useState(false);
  const [movementBusy, setMovementBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);

  const isOpen = Boolean(status?.openSession?.id);
  const blockCashSales = Boolean(status?.settings?.blockCashSales ?? true);

  const openingBal = Number(status?.openSession?.openingBalance || 0);
  const expectedBal = Number(status?.openSession?.expectedBalance || 0);

  const netMovement = useMemo(() => {
    return (movements || []).reduce((sum, m) => {
      const amt = Number(m.amount || 0);
      return String(m.type).toUpperCase() === "OUT" ? sum - amt : sum + amt;
    }, 0);
  }, [movements]);

  const inTotal = useMemo(() => {
    return (movements || []).reduce((sum, m) => {
      if (String(m.type).toUpperCase() !== "IN") return sum;
      return sum + Number(m.amount || 0);
    }, 0);
  }, [movements]);

  const outTotal = useMemo(() => {
    return (movements || []).reduce((sum, m) => {
      if (String(m.type).toUpperCase() !== "OUT") return sum;
      return sum + Number(m.amount || 0);
    }, 0);
  }, [movements]);

  const visibleMovements = useMemo(() => {
    return movements.slice(0, visibleCount);
  }, [movements, visibleCount]);

  const hasMore = visibleCount < movements.length;

  async function loadStatus() {
    setLoading(true);
    try {
      const s = await getCashDrawerStatus();
      setStatus(s);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to load drawer status");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements() {
    setMovementsLoading(true);
    try {
      const data = await listCashMovements(100);
      const rows = Array.isArray(data?.movements) ? data.movements : [];
      setMovements(rows);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setMovements([]);
      setVisibleCount(PAGE_SIZE);
    } finally {
      setMovementsLoading(false);
    }
  }

  async function reloadAll() {
    setRefreshBusy(true);
    try {
      await Promise.all([loadStatus(), loadMovements()]);
    } finally {
      setRefreshBusy(false);
    }
  }

  useEffect(() => {
    reloadAll();
  }, []);

  async function onOpen() {
    const x = Number(openingBalance || 0);
    if (!Number.isFinite(x) || x < 0) {
      toast.error("Invalid opening balance");
      return;
    }

    setOpeningBusy(true);
    try {
      await openCashDrawer(x, "");
      toast.success("Drawer opened");
      setOpeningBalance("");
      await reloadAll();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to open drawer");
    } finally {
      setOpeningBusy(false);
    }
  }

  async function onClose() {
    const x = Number(closingBalance);
    if (!Number.isFinite(x) || x < 0) {
      toast.error("Invalid closing balance");
      return;
    }

    setClosingBusy(true);
    try {
      await closeCashDrawer(x, "");
      toast.success("Drawer closed");
      setClosingBalance("");
      await reloadAll();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to close drawer");
    } finally {
      setClosingBusy(false);
    }
  }

  async function onMovement() {
    const amt = Number(moveAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setMovementBusy(true);
    try {
      await createCashMovement(moveType, amt, moveNote || "");
      toast.success("Movement recorded");
      setMoveAmount("");
      setMoveNote("");
      await Promise.all([loadStatus(), loadMovements()]);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to record movement");
    } finally {
      setMovementBusy(false);
    }
  }

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionHeading
            eyebrow="POS"
            title="Cash drawer"
            subtitle="Control opening and closing balances, record manual movements, and protect cash accountability across the active selling session."
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => nav("/app/pos")} className={secondaryBtn()}>
              Back to POS
            </button>

            <AsyncButton loading={refreshBusy} onClick={reloadAll} className={primaryBtn()}>
              Refresh
            </AsyncButton>
          </div>
        </div>

        {loading ? (
          <DrawerSummarySkeleton />
        ) : (
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Drawer status"
              value={isOpen ? "Open" : "Closed"}
              note={blockCashSales ? "Cash sales require open drawer" : "Cash sales allowed even when closed"}
              tone={isOpen ? "success" : "danger"}
            />
            <SummaryCard
              label="Opening balance"
              value={formatMoney(openingBal)}
              note="Opening amount in current session"
            />
            <SummaryCard
              label="Expected balance"
              value={formatMoney(expectedBal)}
              note="Backend-calculated session expectation"
              tone={isOpen ? "warning" : "neutral"}
            />
            <SummaryCard
              label="Net movement"
              value={formatMoney(netMovement)}
              note="Manual IN minus OUT movement"
              tone={netMovement < 0 ? "danger" : netMovement > 0 ? "success" : "neutral"}
            />
          </section>
        )}
      </section>

      {!loading ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <InfoTile
            label="Sales policy"
            value={blockCashSales ? "Open drawer required" : "Flexible cash policy"}
            note="This setting controls whether cash sales are blocked when no drawer session is open."
            tone={blockCashSales ? "warning" : "success"}
          />
          <InfoTile
            label="Cash in"
            value={formatMoney(inTotal)}
            note="Total money manually added into drawer"
            tone="success"
          />
          <InfoTile
            label="Cash out"
            value={formatMoney(outTotal)}
            note="Total money manually removed from drawer"
            tone="danger"
          />
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <section className="space-y-6">
          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className={cx("text-base font-bold", strongText())}>Session control</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  {isOpen
                    ? "Close the drawer with the final counted cash when the selling shift ends."
                    : "Open a drawer session before starting normal cash operations."}
                </div>
              </div>

              <StatusBadge kind={isOpen ? "success" : "danger"}>
                {isOpen ? "Open session" : "No open session"}
              </StatusBadge>
            </div>

            {!isOpen ? (
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-sm font-semibold", strongText())}>Start a new drawer session</div>
                  <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Enter the counted cash available at the beginning of the session.
                  </div>

                  <div className="mt-5">
                    <label className={cx("text-sm font-medium", strongText())}>Opening balance</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      placeholder="0"
                      inputMode="numeric"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(normalizeDigits(e.target.value))}
                    />
                  </div>
                </div>

                <div className={cx(softPanel(), "p-5 flex flex-col justify-between")}>
                  <div>
                    <div className={cx("text-sm font-semibold", strongText())}>What happens next</div>
                    <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                      Cash sales can start immediately once the drawer is open.
                    </div>
                  </div>

                  <div className="mt-5">
                    <AsyncButton loading={openingBusy} onClick={onOpen} className={successBtn()}>
                      Open drawer
                    </AsyncButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-sm font-semibold", strongText())}>Current session</div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile
                      label="Opening balance"
                      value={formatMoney(openingBal)}
                    />
                    <InfoTile
                      label="Expected balance"
                      value={formatMoney(expectedBal)}
                      tone="warning"
                    />
                  </div>
                </div>

                <div className={cx(softPanel(), "p-5")}>
                  <div className={cx("text-sm font-semibold", strongText())}>Close the session</div>
                  <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                    Enter the final counted cash to close and reconcile this session.
                  </div>

                  <div className="mt-5">
                    <label className={cx("text-sm font-medium", strongText())}>Closing balance</label>
                    <input
                      className={cx(inputClass(), "mt-2")}
                      placeholder="0"
                      inputMode="numeric"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(normalizeDigits(e.target.value))}
                    />
                  </div>

                  <div className="mt-5">
                    <AsyncButton loading={closingBusy} onClick={onClose} className={dangerBtn()}>
                      Close drawer
                    </AsyncButton>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className={cx("text-base font-bold", strongText())}>Manual cash movement</div>
                <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                  Record non-sale cash movement such as float top-up, expense withdrawal, or banking transfer.
                </div>
              </div>

              <StatusBadge kind={isOpen ? "success" : "neutral"}>
                {isOpen ? "Ready" : "Drawer closed"}
              </StatusBadge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
              <div>
                <label className={cx("text-sm font-medium", strongText())}>Type</label>
                <select
                  className={cx(inputClass(), "mt-2")}
                  value={moveType}
                  onChange={(e) => setMoveType(e.target.value)}
                  disabled={!isOpen}
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                </select>
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Amount</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="0"
                  inputMode="numeric"
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(normalizeDigits(e.target.value))}
                  disabled={!isOpen}
                />
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Reason / note</label>
                <input
                  className={cx(inputClass(), "mt-2")}
                  placeholder="Why is this cash moving?"
                  value={moveNote}
                  onChange={(e) => setMoveNote(e.target.value)}
                  disabled={!isOpen}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className={cx("text-sm leading-6", mutedText())}>
                {isOpen
                  ? "Use this only for manual drawer events that are not regular sale payments."
                  : "Open a drawer first before recording manual cash movement."}
              </div>

              <AsyncButton
                loading={movementBusy}
                onClick={onMovement}
                className={primaryBtn()}
                disabled={!isOpen}
              >
                Record movement
              </AsyncButton>
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className={cx("text-base font-bold", strongText())}>Operational discipline</div>

            <div className="mt-5 space-y-3">
              <div className={cx(softPanel(), "p-4 text-sm leading-6", mutedText())}>
                Open the drawer before starting cash sales when your policy requires it.
              </div>
              <div className={cx(softPanel(), "p-4 text-sm leading-6", mutedText())}>
                Use manual movement only for non-sale cash events like banking, petty cash, or float adjustment.
              </div>
              <div className={cx(softPanel(), "p-4 text-sm leading-6", mutedText())}>
                Closing balance should match the real counted cash, not a guess.
              </div>
            </div>
          </section>

          <section className={cx(pageCard(), "p-5 sm:p-6")}>
            <div className={cx("text-base font-bold", strongText())}>Quick actions</div>

            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={() => nav("/app/pos")} className={secondaryBtn()}>
                Back to POS
              </button>
              <button type="button" onClick={() => nav("/app/pos/sales")} className={secondaryBtn()}>
                Open sales list
              </button>
              <AsyncButton loading={refreshBusy} onClick={reloadAll} className={primaryBtn()}>
                Refresh drawer
              </AsyncButton>
            </div>
          </section>
        </aside>
      </div>

      <section className={cx(pageCard(), "overflow-hidden")}>
        <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={cx("text-xl font-bold", strongText())}>Movement log</div>
              <div className={cx("mt-2 text-sm leading-6", mutedText())}>
                Review the latest recorded inflows and outflows affecting the drawer.
              </div>
            </div>

            {!movementsLoading ? (
              <StatusBadge kind="neutral">
                {movements.length} movement{movements.length === 1 ? "" : "s"}
              </StatusBadge>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {movementsLoading ? (
            <MovementListSkeleton />
          ) : movements.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
              No cash movements yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {visibleMovements.map((m) => (
                  <MovementCard key={m.id} row={m} />
                ))}
              </div>

              {hasMore ? (
                <div className="mt-5 flex justify-center">
                  <button type="button" onClick={handleLoadMore} className={primaryBtn()}>
                    Load 10 more
                  </button>
                </div>
              ) : (
                <div className={cx("mt-5 text-center text-sm", mutedText())}>
                  All movements loaded
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}