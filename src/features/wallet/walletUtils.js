const DEFAULT_CURRENCY = "NGN";

function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getApiErrorCode(error) {
  return (
    error?.response?.data?.code ||
    error?.response?.data?.error_code ||
    error?.response?.data?.data?.code ||
    ""
  );
}

export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function getWalletCurrencyCode(summary) {
  const currency = summary?.currency;

  if (typeof currency === "string" && currency.trim()) {
    return currency.trim().toUpperCase();
  }

  if (currency?.code) {
    return String(currency.code).toUpperCase();
  }

  return DEFAULT_CURRENCY;
}

export function getWalletBalanceAmount(summary) {
  return toFiniteNumber(
    summary?.available_balance ??
      summary?.balance ??
      summary?.wallet_balance ??
      summary?.current_balance ??
      summary?.amount ??
      0
  );
}

export function formatWalletMoney(amount, currencyCode = DEFAULT_CURRENCY) {
  const numeric = toFiniteNumber(amount, 0);

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode || DEFAULT_CURRENCY,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (_error) {
    return `${currencyCode || DEFAULT_CURRENCY} ${numeric.toLocaleString(
      "en-NG",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }
}

export function normalizeWalletTransactions(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  return [];
}

export function normalizeWalletTransactionsResponse(payload) {
  const items = normalizeWalletTransactions(payload);

  const metaSource =
    payload?.meta ||
    payload?.pagination ||
    payload?.links ||
    payload ||
    {};

  const currentPage = Number(
    payload?.current_page ??
      payload?.meta?.current_page ??
      payload?.pagination?.current_page ??
      1
  );
  const lastPage = Number(
    payload?.last_page ??
      payload?.meta?.last_page ??
      payload?.pagination?.last_page ??
      1
  );
  const perPage = Number(
    payload?.per_page ??
      payload?.meta?.per_page ??
      payload?.pagination?.per_page ??
      items.length ??
      0
  );
  const total = Number(
    payload?.total ??
      payload?.meta?.total ??
      payload?.pagination?.total ??
      items.length ??
      0
  );

  return {
    items,
    meta: {
      currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
      lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
      perPage: Number.isFinite(perPage) && perPage > 0 ? perPage : items.length,
      total: Number.isFinite(total) && total >= 0 ? total : items.length,
      raw: metaSource,
    },
  };
}

function prettifyProviderLabel(value = "") {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizePaymentMethods(payload) {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.methods)
      ? payload.methods
      : Array.isArray(payload?.payment_methods)
        ? payload.payment_methods
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

  return rawList
    .map((item) => {
      if (typeof item === "string") {
        return {
          value: item,
          label: prettifyProviderLabel(item),
          disabled: false,
        };
      }

      const value =
        item?.provider || item?.code || item?.slug || item?.id || item?.name;

      if (!value) return null;

      return {
        value: String(value),
        label: item?.label || item?.title || item?.name || prettifyProviderLabel(value),
        disabled: item?.enabled === false || item?.is_enabled === false,
        raw: item,
      };
    })
    .filter(Boolean);
}

export function getDefaultWalletProvider(methods = []) {
  const enabledMethods = methods.filter((method) => !method.disabled);

  return (
    enabledMethods.find(
      (method) => String(method.value).toLowerCase() === "paystack"
    )?.value ||
    enabledMethods[0]?.value ||
    ""
  );
}

export function getFundingRequiredDetails(error) {
  return error?.response?.data?.data || null;
}
