const PENDING_PURCHASE_KEY = "xilolo:user-wallet:pending-purchase";
const LAST_FUNDING_KEY = "xilolo:user-wallet:last-funding";

function safeRead(key) {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
}

function safeWrite(key, value) {
  if (typeof window === "undefined") return;

  try {
    if (value == null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // ignore persistence failures
  }
}

export function loadPendingWalletPurchase() {
  return safeRead(PENDING_PURCHASE_KEY);
}

export function persistPendingWalletPurchase(value) {
  safeWrite(PENDING_PURCHASE_KEY, value);
}

export function loadLastWalletFunding() {
  return safeRead(LAST_FUNDING_KEY);
}

export function persistLastWalletFunding(value) {
  safeWrite(LAST_FUNDING_KEY, value);
}

export function clearWalletFlowStorage() {
  safeWrite(PENDING_PURCHASE_KEY, null);
  safeWrite(LAST_FUNDING_KEY, null);
}
