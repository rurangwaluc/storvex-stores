import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AsyncButton from "../../components/ui/AsyncButton";
import TableSkeleton from "../../components/ui/TableSkeleton";

import {
  getCashDrawerStatus,
  listCashMovements,
  openCashDrawer,
  closeCashDrawer,
  createCashMovement,
} from "../../services/cashDrawerApi";

const formatMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function normalizeDigits(s) {
  return String(s || "").replace(/[^\d]/g, "");
}

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
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

function shell() {
  return "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-elevated))]";
}

function inputClass() {
  return "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:placeholder:text-[rgb(var(--text-soft))] dark:focus:border-[rgb(var(--text-soft))] dark:focus:ring-[rgb(var(--border))]";
}

function secondaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:opacity-60 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--text))] dark:hover:bg-[rgb(var(--bg-muted))]";
}

function primaryBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-[rgb(var(--text))] dark:text-[rgb(var(--bg-elevated))] dark:hover:opacity-90";
}

function successBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60";
}

function dangerBtn() {
  return "inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60";
}

function StatusBadge({ kind = "neutral", children }) {
  const cls =
    kind === "danger"
      ? "badge-danger"
      : kind === "warning"
      ? "badge-warning"
      : kind === "success"
      ? "badge-success"
      : "badge-neutral";

  return <span className={cls}>{children}</span>;
}

function SummaryCard({ label, value, note, tone = "neutral" }) {
  const accent =
    tone === "danger"
      ? "bg-rose-500"
      : tone === "warning"
      ? "bg-amber-500"
      : tone === "success"
      ? "bg-emerald-500"
      : "bg-stone-900 dark:bg-[rgb(var(--text))]";

  return (
    <div className={cx(shell(), "relative overflow-hidden p-4")}>
      <div className={cx("absolute left-0 top-0 h-full w-1.5", accent)} />
      <div className="pl-2">
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", softText())}>
          {label}
        </div>
        <div className={cx("mt-2 text-2xl font-semibold", strongText())}>{value}</div>
        {note ? <div className={cx("mt-1 text-sm", mutedText())}>{note}</div> : null}
      </div>
    </div>
  );
}

export default function CashDrawer() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movements, setMovements] = useState([]);

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
      setMovements(Array.isArray(data?.movements) ? data.movements : []);
    } catch (e) {
      console.error(e);
      setMovements([]);
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

  return (
    <div className="space-y-5">
      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-5 dark:border-[rgb(var(--border))]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className={cx("text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                POS
              </div>
              <h1 className={cx("mt-2 text-3xl font-semibold tracking-tight", strongText())}>
                Cash drawer
              </h1>
              <p className={cx("mt-2 text-sm leading-6", mutedText())}>
                Control opening and closing balances, record manual cash movement,
                and monitor the active session in one place.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => nav("/app/pos")}
                className={secondaryBtn()}
              >
                Back to POS
              </button>

              <AsyncButton
                loading={refreshBusy}
                onClick={reloadAll}
                className={primaryBtn()}
              >
                Refresh
              </AsyncButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cx(shell(), "p-4 animate-pulse")}>
                    <div className="h-3 w-24 rounded bg-stone-200" />
                    <div className="mt-3 h-7 w-32 rounded bg-stone-200" />
                    <div className="mt-2 h-4 w-40 rounded bg-stone-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <SummaryCard
                label="Drawer status"
                value={isOpen ? "Open" : "Closed"}
                note={blockCashSales ? "Cash sales blocked when closed" : "Cash sales allowed when closed"}
                tone={isOpen ? "success" : "danger"}
              />
              <SummaryCard
                label="Opening balance"
                value={formatMoney(openingBal)}
                note="Opening amount for current session"
              />
              <SummaryCard
                label="Session expected"
                value={formatMoney(expectedBal)}
                note="Expected balance from backend session"
                tone={isOpen ? "warning" : "neutral"}
              />
              <SummaryCard
                label="Net movement"
                value={formatMoney(netMovement)}
                note="IN minus OUT for loaded movements"
                tone={netMovement < 0 ? "danger" : netMovement > 0 ? "success" : "neutral"}
              />
            </>
          )}
        </div>

        {!loading ? (
          <div className="grid grid-cols-1 gap-3 border-t border-stone-200 px-5 py-4 sm:grid-cols-3 dark:border-[rgb(var(--border))]">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              <div className={cx("text-xs font-medium uppercase tracking-[0.14em]", softText())}>
                Sales policy
              </div>
              <div className={cx("mt-2 text-sm font-medium", strongText())}>
                {blockCashSales ? "Cash sales require open drawer" : "Cash sales do not require open drawer"}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              <div className={cx("text-xs font-medium uppercase tracking-[0.14em]", softText())}>
                Cash in
              </div>
              <div className={cx("mt-2 text-lg font-semibold", strongText())}>
                {formatMoney(inTotal)}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              <div className={cx("text-xs font-medium uppercase tracking-[0.14em]", softText())}>
                Cash out
              </div>
              <div className={cx("mt-2 text-lg font-semibold", strongText())}>
                {formatMoney(outTotal)}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className={cx(shell(), "p-5")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Session control</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                {isOpen
                  ? "Close the session with the final counted cash."
                  : "Open a new cash session before starting cash operations."}
              </p>
            </div>

            <StatusBadge kind={isOpen ? "success" : "danger"}>
              {isOpen ? "Open session" : "No open session"}
            </StatusBadge>
          </div>

          {!isOpen ? (
            <div className="mt-5 space-y-4">
              <div>
                <label className={cx("text-sm font-medium", strongText())}>Opening balance</label>
                <input
                  className={cx(inputClass(), "mt-1")}
                  placeholder="0"
                  inputMode="numeric"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(normalizeDigits(e.target.value))}
                />
              </div>

              <AsyncButton
                loading={openingBusy}
                onClick={onOpen}
                className={successBtn()}
              >
                Open drawer
              </AsyncButton>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
                <div className={cx("text-sm", mutedText())}>Current session</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className={softText()}>Opening balance</div>
                    <div className={cx("mt-1 text-base font-semibold", strongText())}>
                      {formatMoney(openingBal)}
                    </div>
                  </div>
                  <div>
                    <div className={softText()}>Expected balance</div>
                    <div className={cx("mt-1 text-base font-semibold", strongText())}>
                      {formatMoney(expectedBal)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className={cx("text-sm font-medium", strongText())}>Closing balance</label>
                <input
                  className={cx(inputClass(), "mt-1")}
                  placeholder="0"
                  inputMode="numeric"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(normalizeDigits(e.target.value))}
                />
              </div>

              <AsyncButton
                loading={closingBusy}
                onClick={onClose}
                className={dangerBtn()}
              >
                Close drawer
              </AsyncButton>
            </div>
          )}
        </div>

        <div className={cx(shell(), "p-5")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Manual cash movement</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Record money added to or removed from the drawer.
              </p>
            </div>

            <StatusBadge kind={isOpen ? "success" : "neutral"}>
              {isOpen ? "Ready" : "Drawer closed"}
            </StatusBadge>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={cx("text-sm font-medium", strongText())}>Type</label>
              <select
                className={cx(inputClass(), "mt-1")}
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
                className={cx(inputClass(), "mt-1")}
                placeholder="0"
                inputMode="numeric"
                value={moveAmount}
                onChange={(e) => setMoveAmount(normalizeDigits(e.target.value))}
                disabled={!isOpen}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={cx("text-sm font-medium", strongText())}>Note</label>
              <input
                className={cx(inputClass(), "mt-1")}
                placeholder="Reason for this movement"
                value={moveNote}
                onChange={(e) => setMoveNote(e.target.value)}
                disabled={!isOpen}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className={cx("text-sm", mutedText())}>
              {isOpen
                ? "Only use manual movement for non-sale cash events."
                : "Open the drawer first to record movement."}
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
        </div>
      </section>

      <section className={cx(shell(), "overflow-hidden")}>
        <div className="border-b border-stone-200 px-5 py-4 dark:border-[rgb(var(--border))]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={cx("text-lg font-semibold", strongText())}>Movement log</h2>
              <p className={cx("mt-1 text-sm", mutedText())}>
                Review the latest drawer inflows and outflows.
              </p>
            </div>

            <AsyncButton
              loading={movementsLoading}
              onClick={loadMovements}
              className={secondaryBtn()}
            >
              Refresh log
            </AsyncButton>
          </div>
        </div>

        {movementsLoading ? (
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <TableSkeleton rows={6} cols={4} />
              </tbody>
            </table>
          </div>
        ) : movements.length === 0 ? (
          <div className={cx("px-5 py-10 text-center text-sm", mutedText())}>
            No cash movements yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-stone-200 bg-stone-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg-muted))]">
                <tr>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                    Date
                  </th>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                    Type
                  </th>
                  <th className={cx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                    Amount
                  </th>
                  <th className={cx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]", softText())}>
                    Note
                  </th>
                </tr>
              </thead>

              <tbody>
                {movements.map((m) => {
                  const isOut = String(m.type).toUpperCase() === "OUT";
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-stone-200 last:border-b-0 dark:border-[rgb(var(--border))]"
                    >
                      <td className={cx("px-4 py-4 text-sm", mutedText())}>
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge kind={isOut ? "danger" : "success"}>
                          {m.type}
                        </StatusBadge>
                      </td>
                      <td className={cx("px-4 py-4 text-right text-sm font-semibold", strongText())}>
                        {formatMoney(m.amount)}
                      </td>
                      <td className={cx("px-4 py-4 text-sm", mutedText())}>
                        {m.note || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={cx("px-5 py-3 text-xs", softText())}>
              Tip: IN adds money to drawer. OUT removes money from drawer.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}