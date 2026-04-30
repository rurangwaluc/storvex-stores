import { apiFetch, getActiveBranchId } from "./apiClient";

const CASH_DRAWER_BASE = "/cash-drawer";

export const CASH_MOVEMENT_TYPES = {
  IN: "IN",
  OUT: "OUT",
};

export const CASH_MOVEMENT_REASONS = {
  FLOAT: "FLOAT",
  WITHDRAWAL: "WITHDRAWAL",
  DEPOSIT: "DEPOSIT",
  EXPENSE: "EXPENSE",
  OTHER: "OTHER",
};

export const CASH_MOVEMENT_TYPE_OPTIONS = [
  {
    value: CASH_MOVEMENT_TYPES.IN,
    label: "Money in",
    description: "Cash added to the active branch drawer.",
  },
  {
    value: CASH_MOVEMENT_TYPES.OUT,
    label: "Money out",
    description: "Cash removed from the active branch drawer.",
  },
];

export const CASH_MOVEMENT_REASON_OPTIONS = [
  {
    value: CASH_MOVEMENT_REASONS.FLOAT,
    label: "Opening float",
    description: "Cash added as working float.",
  },
  {
    value: CASH_MOVEMENT_REASONS.DEPOSIT,
    label: "Deposit",
    description: "Cash received or deposited into the drawer.",
  },
  {
    value: CASH_MOVEMENT_REASONS.WITHDRAWAL,
    label: "Withdrawal",
    description: "Cash removed from the drawer.",
  },
  {
    value: CASH_MOVEMENT_REASONS.EXPENSE,
    label: "Expense",
    description: "Cash used for an operating expense.",
  },
  {
    value: CASH_MOVEMENT_REASONS.OTHER,
    label: "Other",
    description: "Other manual cash movement.",
  },
];

function cleanString(value) {
  const s = String(value || "").trim();
  return s || "";
}

function cleanObject(obj) {
  const out = {};

  for (const [key, value] of Object.entries(obj || {})) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }

  return out;
}

function withBranchOptions(options = {}) {
  const branchId =
    cleanString(options.branchId) ||
    cleanString(options.activeBranchId) ||
    cleanString(getActiveBranchId());

  return {
    ...options,
    branchId,
  };
}

function normalizeAmount(value, fallback = 0) {
  const n = Number(value);

  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;

  return Math.round(n);
}

function normalizePositiveAmount(value, fallback = 0) {
  const n = normalizeAmount(value, fallback);
  return n > 0 ? n : fallback;
}

function normalizeMovementType(value) {
  const v = cleanString(value).toUpperCase();

  if (v === CASH_MOVEMENT_TYPES.IN) return CASH_MOVEMENT_TYPES.IN;
  if (v === CASH_MOVEMENT_TYPES.OUT) return CASH_MOVEMENT_TYPES.OUT;

  return "";
}

function normalizeMovementReason(value, type) {
  const v = cleanString(value).toUpperCase();

  if (Object.values(CASH_MOVEMENT_REASONS).includes(v)) return v;

  if (type === CASH_MOVEMENT_TYPES.IN) return CASH_MOVEMENT_REASONS.DEPOSIT;
  if (type === CASH_MOVEMENT_TYPES.OUT) return CASH_MOVEMENT_REASONS.WITHDRAWAL;

  return CASH_MOVEMENT_REASONS.OTHER;
}

function normalizeOpenDrawerPayload(payload = {}) {
  return cleanObject({
    openingCash: normalizeAmount(
      payload.openingCash ?? payload.openingBalance ?? payload.amount,
      0,
    ),
  });
}

function normalizeCloseDrawerPayload(payload = {}) {
  return cleanObject({
    countedCash: normalizeAmount(
      payload.countedCash ?? payload.closingCash ?? payload.closingBalance,
      0,
    ),
    note: cleanString(payload.note),
  });
}

function normalizeMovementPayload(payload = {}) {
  const type = normalizeMovementType(payload.type);
  const reason = normalizeMovementReason(payload.reason, type);

  return cleanObject({
    type,
    reason,
    amount: normalizePositiveAmount(payload.amount, 0),
    note: cleanString(payload.note),
  });
}

function buildMovementsQuery(params = {}) {
  return cleanObject({
    limit: params.limit,
    branchId: cleanString(params.branchId),
  });
}

/**
 * Get active branch drawer status.
 *
 * Backend returns:
 * {
 *   branch,
 *   settings: { blockCashSales },
 *   openSession
 * }
 */
export function getCashDrawerStatus(params = {}, options = {}) {
  return apiFetch(`${CASH_DRAWER_BASE}/status`, {
    method: "GET",
    query: cleanObject({
      branchId: cleanString(params.branchId),
    }),
    ...withBranchOptions(options),
  });
}

/**
 * Open drawer for active branch.
 */
export function openCashDrawer(payload = {}, options = {}) {
  return apiFetch(`${CASH_DRAWER_BASE}/open`, {
    method: "POST",
    body: normalizeOpenDrawerPayload(payload),
    ...withBranchOptions(options),
  });
}

/**
 * Close drawer for active branch.
 */
export function closeCashDrawer(payload = {}, options = {}) {
  return apiFetch(`${CASH_DRAWER_BASE}/close`, {
    method: "POST",
    body: normalizeCloseDrawerPayload(payload),
    ...withBranchOptions(options),
  });
}

/**
 * Get manual movements for the active branch open session.
 */
export function getCashDrawerMovements(params = {}, options = {}) {
  return apiFetch(`${CASH_DRAWER_BASE}/movements`, {
    method: "GET",
    query: buildMovementsQuery(params),
    ...withBranchOptions(options),
  });
}

export function listCashMovements(params = {}, options = {}) {
  return getCashDrawerMovements(params, options);
}

/**
 * Record manual cash movement.
 *
 * Money in:
 * {
 *   type: "IN",
 *   reason: "DEPOSIT",
 *   amount: 10000,
 *   note: "..."
 * }
 *
 * Money out:
 * {
 *   type: "OUT",
 *   reason: "WITHDRAWAL",
 *   amount: 5000,
 *   note: "..."
 * }
 */
export function recordCashDrawerMovement(payload = {}, options = {}) {
  const body = normalizeMovementPayload(payload);

  if (!body.type) {
    return Promise.reject(new Error("Movement type must be IN or OUT"));
  }

  if (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0) {
    return Promise.reject(new Error("Movement amount must be greater than 0"));
  }

  return apiFetch(`${CASH_DRAWER_BASE}/movements`, {
    method: "POST",
    body,
    ...withBranchOptions(options),
  });
}

export function isDrawerOpen(statusPayload) {
  return Boolean(statusPayload?.openSession?.id);
}

export function drawerBlocksCashSales(statusPayload) {
  return Boolean(statusPayload?.settings?.blockCashSales);
}

export function getOpenSessionId(statusPayload) {
  return cleanString(statusPayload?.openSession?.id);
}

export function getDrawerBranchId(statusPayload) {
  return (
    cleanString(statusPayload?.openSession?.branchId) ||
    cleanString(statusPayload?.branch?.id)
  );
}

export function getMovementTypeLabel(type) {
  const normalized = normalizeMovementType(type);
  const found = CASH_MOVEMENT_TYPE_OPTIONS.find((option) => option.value === normalized);

  return found?.label || cleanString(type) || "Unknown";
}

export function getMovementReasonLabel(reason) {
  const normalized = cleanString(reason).toUpperCase();
  const found = CASH_MOVEMENT_REASON_OPTIONS.find((option) => option.value === normalized);

  return found?.label || cleanString(reason) || "Unknown";
}

export function createCashMovement(payload = {}, options = {}) {
  return recordCashDrawerMovement(payload, options);
}



export const cashDrawerApi = {
  CASH_MOVEMENT_TYPES,
  CASH_MOVEMENT_REASONS,
  CASH_MOVEMENT_TYPE_OPTIONS,
  CASH_MOVEMENT_REASON_OPTIONS,

  getCashDrawerStatus,
  openCashDrawer,
  closeCashDrawer,
  getCashDrawerMovements,
  listCashMovements,
  recordCashDrawerMovement,
  createCashMovement,

  isDrawerOpen,
  drawerBlocksCashSales,
  getOpenSessionId,
  getDrawerBranchId,
  getMovementTypeLabel,
  getMovementReasonLabel,
};

export default cashDrawerApi;