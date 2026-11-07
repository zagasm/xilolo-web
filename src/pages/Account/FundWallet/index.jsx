import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  Info,
  Landmark,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { initializeWalletFunding } from "../../../api/walletApi";
import { useWalletPaymentMethods } from "../../../features/wallet/hooks/useWalletPaymentMethods";
import { useWalletFundingQuote } from "../../../features/wallet/hooks/useWalletFundingQuote";
import { useWalletSummary } from "../../../features/wallet/hooks/useWalletSummary";
import {
  getApiErrorMessage,
  getDefaultWalletProvider,
  getWalletBalanceAmount,
  getWalletCurrencyCode,
  groupWalletPaymentMethods,
} from "../../../features/wallet/walletUtils";
import {
  formatForeign,
  formatNaira,
  getGroupAccent,
  getGroupIcon,
} from "../../../features/wallet/paymentMethodPresentation";
import { showError, showSuccess } from "../../../component/ui/toast";
import { useAuth } from "../../auth/AuthContext";

const PRESETS = [2000, 5000, 10000, 25000];

function normalizeAmount(value) {
  const digits = String(value ?? "").replace(/[^\d.]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FundWalletPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [amount, setAmount] = useState(5000);
  const [provider, setProvider] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: methods = [], isLoading: methodsLoading, isError: methodsError } =
    useWalletPaymentMethods();

  const { data: wallet } = useWalletSummary();
  const balance = getWalletBalanceAmount(wallet);
  const currency = getWalletCurrencyCode(wallet);

  const groups = useMemo(() => groupWalletPaymentMethods(methods), [methods]);
  const flatMethods = useMemo(
    () => groups.flatMap((group) => group.methods),
    [groups]
  );

  useEffect(() => {
    if (!provider && flatMethods.length) {
      setProvider(getDefaultWalletProvider(flatMethods));
    }
  }, [flatMethods, provider]);

  const selectedMethod = flatMethods.find((method) => method.value === provider);
  const selectedGroup = groups.find((group) =>
    group.methods.some((method) => method.value === provider)
  );
  const selectedAccent = getGroupAccent(selectedGroup?.accent);

  const numericAmount = normalizeAmount(amount);
  const {
    data: quote,
    isFetching: quoteLoading,
    isError: quoteError,
    error: quoteErrorObject,
  } = useWalletFundingQuote({ provider, amount: numericAmount });

  const quoteReady = Boolean(quote) && quote?.provider === provider;
  const minimumAmount = Number(quote?.minimum_amount || 100);
  const amountTooSmall = numericAmount > 0 && numericAmount < minimumAmount;
  // Between selecting a rail and its price arriving (an FX conversion takes a beat), show a
  // shimmer instead of a zero. A stale "₦0 fee" reads as a broken page, not as loading.
  const quotePending = numericAmount > 0 && !amountTooSmall && !quoteReady;
  const chargedInForeignCurrency =
    quoteReady &&
    String(quote?.charge_currency || "").toUpperCase() !==
      String(quote?.currency || "NGN").toUpperCase();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!provider) {
      showError("Choose how you want to pay.");
      return;
    }

    if (numericAmount <= 0) {
      showError("Enter an amount to continue.");
      return;
    }

    if (amountTooSmall) {
      showError(`The minimum top-up is ${formatNaira(minimumAmount)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = await initializeWalletFunding(
        { provider, amount: numericAmount },
        token
      );

      if (payload?.authorization_url) {
        // The vendor sends the payer back to /wallet/funding/callback without our reference,
        // so keep it here for the return screen to verify against.
        try {
          window.sessionStorage.setItem(
            "xilolo:pending-wallet-funding",
            JSON.stringify({
              reference: payload.reference,
              provider: payload.provider || provider,
              amount: numericAmount,
            })
          );
        } catch (_error) {
          // Private mode / storage disabled - verification still works when the vendor
          // returns a reference in the URL.
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
      <div className="tw:mx-auto tw:w-full tw:max-w-5xl tw:px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="tw:mb-5! tw:inline-flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium tw:text-muted-strong tw:hover:text-ink"
        >
          <ChevronLeft className="tw:h-4 tw:w-4" />
          Back
        </button>

        {/* A plain <div>, not <header>: legacy unlayered CSS in style.css styles every
            bare <header> (white background, 30px padding) and would paint a band behind
            the title. */}
        <div className="tw:mb-6 tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4">
          <div>
            <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.22em] tw:text-muted">
              Wallet
            </span>
            <h1 className="tw:mt-1.5 tw:text-[30px] tw:font-semibold tw:leading-tight tw:tracking-[-0.02em] tw:text-ink tw:md:text-[36px]">
              Fund your wallet
            </h1>
            <p className="tw:mt-1.5 tw:max-w-md tw:text-sm tw:text-muted-strong">
              Top up once and pay for tickets, votes and events without leaving the app.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="tw:grid tw:grid-cols-1 tw:items-start tw:gap-5 tw:lg:grid-cols-[1.25fr_0.75fr]"
        >
          <div className="tw:flex tw:flex-col tw:gap-5">
            {/* ── Amount ───────────────────────────────────────────────── */}
            <section
              className="tw:bg-white tw:p-5 tw:shadow-[0_1px_2px_rgba(17,19,22,0.04)] tw:md:p-6"
              style={{ borderRadius: 24, border: "1px solid rgba(17,19,22,0.08)" }}
            >
              <div className="tw:flex tw:items-center tw:justify-between">
                <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-muted">
                  How much are you adding?
                </span>
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-amber-50 tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-amber-700">
                  <Sparkles className="tw:h-3 tw:w-3" />
                  {quote?.bonus_percent ? `+${quote.bonus_percent}% bonus` : "Bonus credit"}
                </span>
              </div>

              <div className="tw:mt-4 tw:flex tw:items-center tw:gap-2">
                <span className="tw:text-[26px] tw:font-semibold tw:text-muted tw:md:text-[32px]">
                  ₦
                </span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  aria-label="Amount to add in naira"
                  className="tw:w-full tw:border-0 tw:bg-transparent tw:p-0 tw:text-[34px] tw:font-semibold tw:tabular-nums tw:tracking-[-0.02em] tw:text-ink tw:outline-none tw:placeholder:text-faint tw:focus:outline-none tw:md:text-[42px]"
                />
              </div>

              <div className="tw:mt-4 tw:grid tw:grid-cols-4 tw:gap-2">
                              {PRESETS.map((preset) => {
                  const active = Number(numericAmount) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={`tw:truncate tw:rounded-full tw:px-2 tw:py-1.5 tw:text-center tw:text-[12.5px] tw:font-semibold tw:transition ${
                        active
                          ? "tw:bg-ink tw:text-white"
                          : "tw:bg-chip tw:text-ink tw:hover:bg-inner"
                      }`}
                    >
                      {formatNaira(preset)}
                    </button>
                  );
                })}
              </div>

              {amountTooSmall ? (
                <p className="tw:mt-3! tw:text-[13px] tw:font-medium tw:text-danger">
                  Minimum top-up is {formatNaira(minimumAmount)}.
                </p>
              ) : null}
            </section>

            {/* ── Payment doors ────────────────────────────────────────── */}
            <section
              className="tw:bg-white tw:p-5 tw:shadow-[0_1px_2px_rgba(17,19,22,0.04)] tw:md:p-6"
              style={{ borderRadius: 24, border: "1px solid rgba(17,19,22,0.08)" }}
            >
              <div className="tw:flex tw:items-center tw:justify-between">
                <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-muted">
                  How do you want to pay?
                </span>
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:text-muted">
                  <ShieldCheck className="tw:h-3.5 tw:w-3.5" />
                  Secure checkout
                </span>
              </div>

              {methodsLoading ? (
                <div className="tw:mt-4 tw:space-y-3">
                  {[0, 1, 2].map((key) => (
                    <div
                      key={key}
                      className="tw:h-[74px] tw:animate-pulse tw:bg-chip"
                      style={{ borderRadius: 18 }}
                    />
                  ))}
                </div>
              ) : null}

              {methodsError ? (
                <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-sm tw:text-amber-800">
                  We could not load the payment methods. Refresh the page and try again.
                </div>
              ) : null}

              {!methodsLoading && !methodsError && !groups.length ? (
                <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-sm tw:text-amber-800">
                  No payment method is available right now. Please try again shortly.
                </div>
              ) : null}

              <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-5">
                {groups.map((group) => {
                  const Icon = getGroupIcon(group.icon);
                  const accent = getGroupAccent(group.accent);

                  return (
                    <div key={group.code}>
                      <div className="tw:flex tw:items-start tw:gap-3">
                        <span
                          className={`tw:inline-flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center ${accent.tile}`}
                          style={{ borderRadius: 12 }}
                        >
                          <Icon className="tw:h-4.5 tw:w-4.5" />
                        </span>
                        <div className="tw:min-w-0">
                          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                            <span className="tw:text-[15px] tw:font-semibold tw:text-ink">
                              {group.label}
                            </span>
                            {group.badge ? (
                              <span
                                className={`tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] ${accent.chip}`}
                              >
                                {group.badge}
                              </span>
                            ) : null}
                          </div>
                          {group.description ? (
                            <p className="tw:mt-0.5 tw:text-[13px] tw:leading-snug tw:text-muted">
                              {group.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
                        {group.methods.map((method) => {
                          const active = provider === method.value;
                          const feeNote = method.metadata?.fee_note;
                          const chargedIn = method.metadata?.currencies?.join(" · ");
                          const assets = method.metadata?.assets?.join(" · ");

                          return (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => setProvider(method.value)}
                              aria-pressed={active}
                              className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:border tw:px-4 tw:py-3 tw:text-left tw:transition ${
                                active
                                  ? accent.selected
                                  : "tw:border-hairline tw:bg-white tw:hover:border-faint tw:hover:bg-paper"
                              }`}
                              style={{ borderRadius: 18 }}
                            >
                              <span
                                className={`tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border-2 tw:transition ${
                                  active ? `tw:border-transparent ${accent.dot}` : "tw:border-faint"
                                }`}
                              >
                                {active ? (
                                  <BadgeCheck className="tw:h-3.5 tw:w-3.5 tw:text-white" />
                                ) : null}
                              </span>

                              <span className="tw:min-w-0 tw:flex-1">
                                <span className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                                  <span className="tw:text-[14px] tw:font-semibold tw:text-ink">
                                    {method.label}
                                  </span>
                                  {chargedIn ? (
                                    <span className="tw:rounded-full tw:bg-chip tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-muted-strong">
                                      {chargedIn}
                                    </span>
                                  ) : null}
                                  {assets ? (
                                    <span className="tw:rounded-full tw:bg-chip tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-muted-strong">
                                      {assets}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="tw:mt-0.5 tw:block tw:text-[12.5px] tw:leading-snug tw:text-muted">
                                  {method.metadata?.description || feeNote || "Pay securely."}
                                </span>
                              </span>

                              <ArrowRight
                                className={`tw:h-4 tw:w-4 tw:shrink-0 ${
                                  active ? accent.text : "tw:text-faint"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Summary ─────────────────────────────────────────────────── */}
          <aside className="tw:lg:sticky tw:lg:top-28">
            <div
              className="tw:overflow-hidden tw:bg-white tw:shadow-[0_18px_40px_-24px_rgba(17,19,22,0.35)]"
              style={{ borderRadius: 24, border: "1px solid rgba(17,19,22,0.08)" }}
            >
              <div className="tw:border-b tw:border-hairline tw:px-5 tw:py-4">
                <div className="tw:flex tw:items-center tw:justify-between">
                  <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-muted">
                    Summary
                  </span>
                  {Number.isFinite(balance) && balance > 0 ? (
                    <span className="tw:text-[11px] tw:font-medium tw:text-muted">
                      Balance{" "}
                      <span className="tw:font-semibold tw:tabular-nums tw:text-ink">
                        {formatNaira(balance)}
                      </span>{" "}
                      {currency}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="tw:px-5 tw:py-4">
                <div className="tw:flex tw:items-baseline tw:justify-between">
                  <span className="tw:text-sm tw:text-muted-strong">You add</span>
                  <span className="tw:text-lg tw:font-semibold tw:tabular-nums tw:text-ink">
                    {formatNaira(numericAmount || 0)}
                  </span>
                </div>

                <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2.5 tw:text-sm">
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span className="tw:text-muted-strong">
                      Bonus credit
                      {quote?.bonus_percent ? (
                        <span className="tw:ml-1 tw:text-[11px] tw:font-semibold tw:text-amber-700">
                          {quote.bonus_percent}%
                        </span>
                      ) : null}
                    </span>
                    <span className="tw:font-medium tw:tabular-nums tw:text-success">
                      {quotePending ? (
                        <span className="tw:inline-block tw:h-3.5 tw:w-14 tw:animate-pulse tw:rounded tw:bg-chip" />
                      ) : (
                        <>+{formatNaira(quoteReady ? quote.bonus_amount : 0)}</>
                      )}
                    </span>
                  </div>

                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span className="tw:text-muted-strong">Wallet credit</span>
                    <span className="tw:font-semibold tw:tabular-nums tw:text-ink">
                      {quotePending ? (
                        <span className="tw:inline-block tw:h-4 tw:w-20 tw:animate-pulse tw:rounded tw:bg-chip" />
                      ) : (
                        formatNaira(quoteReady ? quote.wallet_credit_amount : numericAmount || 0)
                      )}
                    </span>
                  </div>

                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span className="tw:text-muted-strong">Payment fee</span>
                    <span className="tw:font-medium tw:tabular-nums tw:text-ink">
                      {quotePending || (quoteLoading && !quoteReady) ? (
                        <span className="tw:inline-block tw:h-3.5 tw:w-12 tw:animate-pulse tw:rounded tw:bg-chip" />
                      ) : (
                        formatNaira(quoteReady ? quote.fee_amount : 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="tw:my-3.5 tw:h-px tw:bg-hairline" />

                <div className="tw:flex tw:items-baseline tw:justify-between">
                  <span className="tw:text-sm tw:font-medium tw:text-ink">Total charged</span>
                  <span className="tw:text-xl tw:font-semibold tw:tabular-nums tw:text-ink">
                    {quotePending ? (
                      <span className="tw:inline-block tw:h-5 tw:w-24 tw:animate-pulse tw:rounded tw:bg-chip" />
                    ) : chargedInForeignCurrency ? (
                      formatForeign(quote.charge_amount, quote.charge_currency)
                    ) : (
                      formatNaira(quoteReady ? quote.total_charge_amount : numericAmount || 0)
                    )}
                  </span>
                </div>

                {chargedInForeignCurrency ? (
                  <p className="tw:mt-3! tw:rounded-xl tw:bg-sky-50 tw:px-3 tw:py-2 tw:text-[12px] tw:leading-snug tw:text-sky-800">
                    Your card is charged in US dollars at checkout.{" "}
                    {quote?.fx_rate
                      ? `Rate ₦${Number(quote.fx_rate).toLocaleString()}/$1.`
                      : ""}{" "}
                    {formatNaira(quote.total_charge_amount)} lands in your wallet.
                  </p>
                ) : null}

                {quoteError && !amountTooSmall ? (
                  <p className="tw:mt-3! tw:text-[12.5px] tw:text-danger">
                    {getApiErrorMessage(quoteErrorObject, "Could not price this amount.")}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    methodsLoading ||
                    !provider ||
                    numericAmount <= 0 ||
                    amountTooSmall ||
                    quotePending
                  }
                  className="tw:mt-6! tw:inline-flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:bg-ink tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:hover:bg-ink-raised tw:disabled:cursor-not-allowed tw:disabled:opacity-45"
                  style={{ borderRadius: 16 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="tw:h-4 tw:w-4 tw:animate-spin" />
                      Starting checkout…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="tw:h-4 tw:w-4" />
                    </>
                  )}
                </button>

                <p className="tw:mt-3! tw:flex tw:items-start tw:gap-1.5 tw:text-[11.5px] tw:leading-snug tw:text-muted">
                  <ShieldCheck className="tw:mt-px tw:h-3.5 tw:w-3.5 tw:shrink-0" />
                  You will finish on{" "}
                  {selectedMethod?.label || "the provider"}
                  &apos;s secure page. Xilolo never sees your card or wallet keys.
                </p>
              </div>
            </div>

            <div
              className="tw:mt-4 tw:flex tw:items-start tw:gap-2.5 tw:bg-white tw:px-4 tw:py-3.5"
              style={{ borderRadius: 18, border: "1px dashed rgba(17,19,22,0.14)" }}
            >
              <Info className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0 tw:text-muted" />
              <p className="tw:text-[12px] tw:leading-snug tw:text-muted-strong">
                {selectedMethod?.metadata?.fee_note || (
                  <>
                    The payment fee is charged by the provider on top of your top-up. It is
                    shown before you pay.
                  </>
                )}
              </p>
            </div>
          </aside>
        </form>

        <div className="tw:mt-8 tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-x-6 tw:gap-y-2 tw:text-[11.5px] tw:font-medium tw:text-muted">
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <Landmark className="tw:h-3.5 tw:w-3.5" /> Naira rails settle instantly
          </span>
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <ShieldCheck className="tw:h-3.5 tw:w-3.5" /> Verified by signed webhooks
          </span>
        </div>
      </div>
    </div>
  );
}
