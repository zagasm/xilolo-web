import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { initializeWalletFunding } from "../../../api/walletApi";
import { useWalletPaymentMethods } from "../../../features/wallet/hooks/useWalletPaymentMethods";
import { useWalletFundingQuote } from "../../../features/wallet/hooks/useWalletFundingQuote";
import { useWalletSummary } from "../../../features/wallet/hooks/useWalletSummary";
import { useWalletCurrencies } from "../../../features/wallet/hooks/useWalletCurrencies";
import {
  getApiErrorMessage,
  getDefaultWalletProvider,
  getWalletBalanceAmount,
  groupWalletPaymentMethods,
} from "../../../features/wallet/walletUtils";
import { formatForeign, formatNaira } from "../../../features/wallet/paymentMethodPresentation";
import PaymentMark from "../../../features/wallet/components/PaymentMark";
import { showError, showSuccess } from "../../../component/ui/toast";
import { useAuth } from "../../auth/AuthContext";

// Presets per currency. Naira is the wallet's own currency; the others are a convenience.
const PRESETS = {
  NGN: [2000, 5000, 10000, 25000],
  USD: [10, 25, 50, 100],
};
const FALLBACK_PRESETS = [2000, 5000, 10000, 25000];

function normalizeAmount(value) {
  const digits = String(value ?? "").replace(/[^\d.]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value, currency, symbol) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${symbol}0`;

  if (String(currency).toUpperCase() === "NGN") return formatNaira(numeric);

  return `${symbol}${numeric.toLocaleString("en-NG", {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FundWalletPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [amount, setAmount] = useState("5000");
  const [currency, setCurrency] = useState("");
  const [provider, setProvider] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: methods = [], isLoading: methodsLoading, isError: methodsError } =
    useWalletPaymentMethods();
  const { data: wallet } = useWalletSummary();
  const { data: currencyData } = useWalletCurrencies();

  const numericAmount = normalizeAmount(amount);
  const balance = getWalletBalanceAmount(wallet);
  const currencies = currencyData?.currencies ?? [];
  const baseCurrency = currencyData?.base ?? "NGN";
  const activeCurrency =
    currencies.find((item) => item.code === currency) ||
    currencies.find((item) => item.code === (currencyData?.default || "NGN")) ||
    { code: baseCurrency, symbol: "₦", decimals: 2 };

  useEffect(() => {
    if (!currency && currencyData?.default) setCurrency(currencyData.default);
  }, [currency, currencyData?.default]);

  // Switching currency must carry the *value*, not the digits: ₦5,000 stays worth $3.65.
  // Rates come from the API array, so the client does one division and no FX of its own.
  const switchCurrency = (nextCode) => {
    const from = currencies.find((item) => item.code === activeCurrency.code);
    const to = currencies.find((item) => item.code === nextCode);

    if (from && to && numericAmount > 0 && Number(from.rate_ngn) > 0) {
      const converted = (numericAmount * Number(from.rate_ngn)) / Number(to.rate_ngn);
      setAmount(String(Math.round(converted * 100) / 100));
    }

    setCurrency(nextCode);
  };

  const groups = useMemo(() => groupWalletPaymentMethods(methods), [methods]);
  const flatMethods = useMemo(() => groups.flatMap((group) => group.methods), [groups]);

  useEffect(() => {
    if (!provider && flatMethods.length) {
      setProvider(getDefaultWalletProvider(flatMethods));
    }
  }, [flatMethods, provider]);

  const selectedMethod = flatMethods.find((method) => method.value === provider);

  const {
    data: quote,
    isFetching: quoteLoading,
    error: quoteError,
  } = useWalletFundingQuote({
    provider,
    amount: numericAmount,
    currency: activeCurrency.code,
  });

  const quoteReady = Boolean(quote) && quote?.provider === provider;
  const minimum = Number(quote?.minimum_input_amount ?? quote?.minimum_amount ?? 100);
  const belowFloor = quoteReady
    ? quote.meets_minimum === false
    : numericAmount > 0 && numericAmount < minimum;

  const presets = PRESETS[activeCurrency.code] || FALLBACK_PRESETS;
  const chargeCurrency = String(quote?.charge_currency || "").toUpperCase();
  const chargedInForeign = quoteReady && chargeCurrency && chargeCurrency !== baseCurrency;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!provider) return showError("Choose how you want to pay.");
    if (numericAmount <= 0) return showError("Enter an amount to continue.");
    if (belowFloor) {
      return showError(
        `${selectedMethod?.label || "This method"} needs at least ${money(
          minimum,
          activeCurrency.code,
          activeCurrency.symbol
        )}.`
      );
    }

    try {
      setSubmitting(true);
      const payload = await initializeWalletFunding(
        { provider, amount: numericAmount, currency: activeCurrency.code },
        token
      );

      if (payload?.authorization_url) {
        try {
          window.sessionStorage.setItem(
            "xilolo:pending-wallet-funding",
            JSON.stringify({
              reference: payload.reference,
              provider: payload.provider || provider,
              amount: numericAmount,
              currency: activeCurrency.code,
            })
          );
        } catch (_error) {
          // Storage blocked; most rails still return the reference to the callback URL.
        }

        showSuccess("Taking you to the secure checkout…");
        window.location.href = payload.authorization_url;
        return;
      }

      showError("Unable to start this payment. Try another method.");
    } catch (error) {
      showError(getApiErrorMessage(error, "Failed to start wallet funding."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tw:min-h-screen tw:bg-paper tw:pb-28 tw:pt-24 tw:font-sans tw:md:pt-28">
      <div className="tw:mx-auto tw:w-full tw:max-w-4xl tw:px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="tw:mb-6! tw:inline-flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium tw:text-muted-strong tw:hover:text-ink"
        >
          <ChevronLeft className="tw:h-4 tw:w-4" />
          Back
        </button>

        <div className="tw:mb-6">
          <h1 className="tw:text-[28px] tw:font-semibold tw:leading-tight tw:tracking-[-0.02em] tw:text-ink tw:md:text-[32px]">
            Fund your wallet
          </h1>
          <p className="tw:mt-1 tw:text-sm tw:text-muted">
            {Number.isFinite(balance) && balance > 0
              ? `Balance ${formatNaira(balance)}`
              : "Add money once, spend it on tickets, votes and events."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-[1.2fr_0.8fr]">
          <div className="tw:flex tw:flex-col tw:gap-4">
            {/* ── Amount + currency ───────────────────────────────────── */}
            <section
              className="tw:bg-white tw:p-5 tw:md:p-6"
              style={{ borderRadius: 22, border: "1px solid rgba(17,19,22,0.08)" }}
            >
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                <span className="tw:text-[12px] tw:font-medium tw:text-muted">Amount</span>

                {currencies.length > 1 ? (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:bg-chip tw:p-1" style={{ borderRadius: 999 }}>
                    {currencies.map((item) => {
                      const active = item.code === activeCurrency.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => switchCurrency(item.code)}
                          className={`tw:rounded-full tw:px-3 tw:py-1 tw:text-[12px] tw:font-semibold tw:transition ${
                            active ? "tw:bg-white tw:text-ink tw:shadow-sm" : "tw:text-muted-strong"
                          }`}
                        >
                          {item.symbol} {item.code}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="tw:mt-3 tw:flex tw:items-center tw:gap-1.5">
                <span className="tw:text-[28px] tw:font-semibold tw:text-muted tw:md:text-[34px]">
                  {activeCurrency.symbol}
                </span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  aria-label={`Amount to add in ${activeCurrency.code}`}
                  className="tw:w-full tw:border-0 tw:bg-transparent tw:p-0 tw:text-[34px] tw:font-semibold tw:tabular-nums tw:tracking-[-0.02em] tw:text-ink tw:outline-none tw:placeholder:text-faint tw:focus:outline-none tw:md:text-[40px]"
                />
              </div>

              {activeCurrency.code !== baseCurrency && quoteReady ? (
                <p className="tw:mt-1 tw:text-[13px] tw:text-muted">
                  ≈ {formatNaira(quote.ngn_equivalent)}
                </p>
              ) : null}

              <div className="tw:mt-4 tw:grid tw:grid-cols-4 tw:gap-2">
                {presets.map((preset) => {
                  const active = Number(numericAmount) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={`tw:rounded-full tw:px-2 tw:py-1.5 tw:text-center tw:text-[12.5px] tw:font-semibold tw:transition ${
                        active
                          ? "tw:bg-ink tw:text-white"
                          : "tw:bg-chip tw:text-ink tw:hover:bg-inner"
                      }`}
                    >
                      {money(preset, activeCurrency.code, activeCurrency.symbol)}
                    </button>
                  );
                })}
              </div>

              {belowFloor ? (
                <p className="tw:mt-3! tw:text-[13px] tw:text-danger">
                  {selectedMethod?.label || "This method"} needs at least{" "}
                  {money(minimum, activeCurrency.code, activeCurrency.symbol)}.
                </p>
              ) : null}
            </section>

            {/* ── Methods ─────────────────────────────────────────────── */}
            <section
              className="tw:bg-white tw:p-5 tw:md:p-6"
              style={{ borderRadius: 22, border: "1px solid rgba(17,19,22,0.08)" }}
            >
              {methodsLoading ? (
                <div className="tw:space-y-2">
                  {[0, 1, 2].map((key) => (
                    <div key={key} className="tw:h-[64px] tw:animate-pulse tw:bg-chip" style={{ borderRadius: 16 }} />
                  ))}
                </div>
              ) : null}

              {methodsError || (!methodsLoading && !groups.length) ? (
                <p className="tw:text-sm tw:text-muted">
                  No payment method is available right now. Please try again shortly.
                </p>
              ) : null}

              {groups.map((group, groupIndex) => (
                <div key={group.code} className={groupIndex ? "tw:mt-5" : ""}>
                  <div className="tw:mb-1.5 tw:text-[10.5px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-muted">
                    {group.label}
                  </div>

                  <div className="tw:flex tw:flex-col">
                    {group.methods.map((method) => {
                      const active = provider === method.value;
                      const floor = Number(method.metadata?.min_amount || 0);
                      const note = method.metadata?.description || method.metadata?.fee_note || "";

                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setProvider(method.value)}
                          aria-pressed={active}
                          className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-1 tw:py-3 tw:text-left tw:transition ${
                            active ? "" : "tw:opacity-90 tw:hover:opacity-100"
                          }`}
                          style={{
                            borderBottom:
                              method === group.methods[group.methods.length - 1]
                                ? "none"
                                : "1px solid rgba(17,19,22,0.06)",
                          }}
                        >
                          <PaymentMark mark={method.metadata?.mark} label={method.label} />

                          <span className="tw:min-w-0 tw:flex-1">
                            <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-ink">
                              {method.label}
                            </span>
                            <span className="tw:mt-0.5 tw:line-clamp-2 tw:block tw:text-[12.5px] tw:text-muted">
                              {note}
                            </span>
                          </span>

                          <span
                            className={`tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border-2 tw:transition ${
                              active ? "tw:border-accent tw:bg-accent" : "tw:border-faint"
                            }`}
                          >
                            {active ? <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-white" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>

          {/* ── Pay panel ───────────────────────────────────────────────── */}
          <aside className="tw:lg:sticky tw:lg:top-28">
            <div
              className="tw:bg-white tw:p-5 tw:shadow-[0_16px_36px_-28px_rgba(17,19,22,0.45)]"
              style={{ borderRadius: 22, border: "1px solid rgba(17,19,22,0.08)" }}
            >
              <span className="tw:block tw:text-[12px] tw:font-medium tw:text-muted">
                You&apos;ll pay
              </span>

              <div className="tw:mt-1 tw:text-[30px] tw:font-semibold tw:tabular-nums tw:tracking-[-0.02em] tw:text-ink">
                {quoteLoading && !quoteReady ? (
                  <span className="tw:inline-block tw:h-7 tw:w-28 tw:animate-pulse tw:rounded tw:bg-chip" />
                ) : chargedInForeign ? (
                  formatForeign(quote.charge_amount, chargeCurrency)
                ) : (
                  money(quoteReady ? quote.total_charge_amount : numericAmount || 0, baseCurrency, "₦")
                )}
              </div>

              <p className="tw:mt-1.5! tw:text-[12.5px] tw:leading-snug tw:text-muted">
                {quoteLoading && !quoteReady
                  ? "Confirming the rate…"
                  : chargedInForeign
                    ? `Card charged in ${chargeCurrency}. ${formatNaira(quote.wallet_credit_amount)} lands in your wallet.`
                    : `${formatNaira(quoteReady ? quote.wallet_credit_amount : numericAmount || 0)} lands in your wallet.${
                        quoteReady && activeCurrency.code !== baseCurrency
                          ? ` You typed ${money(numericAmount, activeCurrency.code, activeCurrency.symbol)}.`
                          : ""
                      }`}
              </p>

              <button
                type="submit"
                disabled={
                  submitting ||
                  methodsLoading ||
                  !provider ||
                  numericAmount <= 0 ||
                  belowFloor ||
                  (quoteLoading && !quoteReady)
                }
                className="tw:mt-5! tw:inline-flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:bg-ink tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:hover:bg-ink-raised tw:disabled:cursor-not-allowed tw:disabled:opacity-45"
                style={{ borderRadius: 14 }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="tw:h-4 tw:w-4 tw:animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>Continue with {selectedMethod?.label || "payment"}</>
                )}
              </button>

              <p className="tw:mt-3! tw:flex tw:items-start tw:gap-1.5 tw:text-[11.5px] tw:leading-snug tw:text-muted">
                <ShieldCheck className="tw:mt-px tw:h-3.5 tw:w-3.5 tw:shrink-0" />
                Final amount and any provider fee are shown on the secure checkout page.
              </p>

              {quoteError && !belowFloor ? (
                <p className="tw:mt-2! tw:text-[12px] tw:text-danger">
                  {getApiErrorMessage(quoteError, "Could not price this amount.")}
                </p>
              ) : null}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
