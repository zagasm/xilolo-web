function normalizeWalletScope(scope) {
  if (scope == null || scope === "") {
    return "anonymous";
  }

  return String(scope);
}

export function getWalletSummaryQueryKey(scope) {
  return ["wallet-summary", normalizeWalletScope(scope)];
}

export function getWalletPaymentMethodsQueryKey(scope) {
  return ["wallet-payment-methods", normalizeWalletScope(scope)];
}

export function getWalletTransactionsQueryKey(scope, filters = {}) {
  return ["wallet-transactions", normalizeWalletScope(scope), filters];
}
