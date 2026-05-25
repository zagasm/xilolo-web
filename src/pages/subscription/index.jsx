import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  MessageSquareMore,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showSuccess } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import {
  formatWalletMoney,
  getApiErrorCode,
  getApiErrorMessage,
} from "../../features/wallet/walletUtils";
import WalletFundingRequiredModal from "../../features/wallet/components/WalletFundingRequiredModal";
import FundWalletModal from "../../features/wallet/components/FundWalletModal";
import SubscriptionBadge from "../../component/ui/SubscriptionBadge.jsx";

const SUBSCRIPTION_BENEFITS = [
  {
    title: "Verified Badge Display",
    description: "Show your verified Xilolo badge across your profile and live activity.",
    icon: BadgeCheck,
  },
  {
    title: "Priority Live Visibility",
    description: "Stand out more clearly in live chats and event interactions.",
    icon: MessageSquareMore,
  },
  {
    title: "Premium Event Access",
    description: "Access subscriber-only streams, replays, and event features when available.",
    icon: ShieldCheck,
  },
  {
    title: "Xilolo AI Beta",
    description: "Use the Xilolo AI beta for account, event, ticket, wallet, and streaming help.",
    icon: Sparkles,
  },
  {
    title: "Early Feature Access",
    description: "Try selected new Xilolo tools before they roll out widely.",
    icon: CalendarClock,
  },
  {
    title: "Creator Ecosystem Support",
    description: "Help fund better creator, event, and community tools on Xilolo.",
    icon: Star,
  },
];

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function capitalizeWords(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDaysUntil(value) {
  if (!value) return null;

  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return null;

  return (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const { token, user, setAuth, refreshUser } = useAuth();

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [fundingRequiredOpen, setFundingRequiredOpen] = useState(false);
  const [fundingRequiredDetails, setFundingRequiredDetails] = useState(null);
  const [fundWalletOpen, setFundWalletOpen] = useState(false);

  const loadSubscriptionStatus = useCallback(async () => {
    if (!token) {
      setSubscriptionStatus(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const res = await api.get("/api/v1/user/subscription", authHeaders(token));
      const payload = res?.data?.data || res?.data || null;
      setSubscriptionStatus(payload);
      return payload;
    } catch (error) {
      console.error("Failed to load subscription status", error);
      showError("Unable to load subscription details right now.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/auth/signin", { replace: true });
      return;
    }

    loadSubscriptionStatus();
  }, [loadSubscriptionStatus, navigate, token]);

  const subscriptionPrice = Number(subscriptionStatus?.price) || 2500;
  const subscriptionCurrency = subscriptionStatus?.currency || "NGN";
  const formattedSubscriptionPrice = formatWalletMoney(
    subscriptionPrice,
    subscriptionCurrency
  );
  const hasActiveSubscription = !!(
    subscriptionStatus?.has_active_subscription ||
    user?.has_active_subscription ||
    user?.subscription?.isActive
  );
  const currentSubscription =
    subscriptionStatus?.subscription || subscriptionStatus?.latest_subscription || null;
  const currentPlanName =
    currentSubscription?.plan?.name || "Verification Badge";
  const currentPlanCode =
    currentSubscription?.plan?.code ||
    currentSubscription?.meta?.badge ||
    "Verification_badge";
  const daysUntilPeriodEnd = getDaysUntil(currentSubscription?.current_period_end);
  const canRenewSubscription =
    hasActiveSubscription &&
    String(currentSubscription?.status || "").toLowerCase() === "active" &&
    daysUntilPeriodEnd !== null &&
    daysUntilPeriodEnd <= 10;

  const statusItems = useMemo(
    () => [
      {
        label: "Status",
        value: capitalizeWords(currentSubscription?.status || "inactive"),
      },
      {
        label: "Billing interval",
        value: capitalizeWords(currentSubscription?.billing_interval || "monthly"),
      },
      {
        label: "Current period start",
        value: formatDateTime(currentSubscription?.current_period_start),
      },
      {
        label: "Current period end",
        value: formatDateTime(currentSubscription?.current_period_end),
      },
      {
        label: "Last payment",
        value: formatDateTime(currentSubscription?.last_payment_at),
      },
      {
        label: "Source",
        value: capitalizeWords(currentSubscription?.source || "wallet"),
      },
    ],
    [currentSubscription]
  );

  const markLocalSubscriptionAsActive = useCallback(
    (nextStatus = null) => {
      if (!user) return;

      setAuth({
        user: {
          ...user,
          has_active_subscription: true,
          subscription: {
            ...user?.subscription,
            ...(nextStatus?.subscription || {}),
            isActive: true,
            current_period_end:
              nextStatus?.subscription?.current_period_end ||
              user?.subscription?.current_period_end,
          },
        },
        token,
      });
    },
    [setAuth, token, user]
  );

  const handleInitializeSubscription = async () => {
    if (!token || initializing || hasActiveSubscription) return;

    setInitializing(true);

    try {
      const res = await api.post(
        "/api/v1/user/subscription/subscribe-wallet",
        null,
        authHeaders(token)
      );

      const payload = res?.data?.data || {};
      const message =
        res?.data?.message || "Verification badge subscription activated successfully.";

      setSubscriptionStatus((previous) => ({
        ...(previous || {}),
        ...payload,
        has_active_subscription: true,
        subscription: {
          ...(previous?.subscription || {}),
          ...(payload?.subscription || {}),
        },
      }));
      markLocalSubscriptionAsActive(payload);
      showSuccess(message);

      await Promise.all([refreshUser?.(), loadSubscriptionStatus()]);
    } catch (error) {
      const status = error?.response?.status;
      const code = getApiErrorCode(error);
      const message = getApiErrorMessage(
        error,
        "Unable to initialize your subscription right now."
      );
      const details = error?.response?.data?.data || {};

      if (
        status === 422 &&
        (code === "INSUFFICIENT_BALANCE" ||
          message === "Insufficient balance. Please fund your wallet.")
      ) {
        setFundingRequiredDetails({
          wallet_balance: details?.wallet_balance || 0,
          required_amount: details?.required_amount || subscriptionPrice,
          deficit_amount: details?.deficit_amount || 0,
        });
        setFundingRequiredOpen(true);
        showError("Insufficient balance. Please fund your wallet.");
        return;
      }

      showError(message);
      console.error("Verification badge subscription error:", error);
    } finally {
      setInitializing(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!token || renewing || !canRenewSubscription) return;

    setRenewing(true);

    try {
      const res = await api.post(
        "/api/v1/user/subscription/renew-wallet",
        null,
        authHeaders(token)
      );

      const payload = res?.data?.data || {};
      const message =
        res?.data?.message ||
        "Xilolo badge subscription renewed from wallet.";

      setSubscriptionStatus((previous) => ({
        ...(previous || {}),
        ...payload,
        has_active_subscription: true,
        subscription: {
          ...(previous?.subscription || {}),
          ...(payload?.subscription || {}),
        },
      }));
      markLocalSubscriptionAsActive(payload);
      showSuccess(message);

      await Promise.all([refreshUser?.(), loadSubscriptionStatus()]);
    } catch (error) {
      const status = error?.response?.status;
      const code = getApiErrorCode(error);
      const message = getApiErrorMessage(
        error,
        "Unable to renew your subscription right now."
      );
      const details = error?.response?.data?.data || {};

      if (
        status === 422 &&
        (code === "INSUFFICIENT_BALANCE" ||
          message === "Insufficient balance. Please fund your wallet.")
      ) {
        setFundingRequiredDetails({
          wallet_balance: details?.wallet_balance || 0,
          required_amount: details?.required_amount || subscriptionPrice,
          deficit_amount: details?.deficit_amount || 0,
        });
        setFundingRequiredOpen(true);
        showError("Insufficient balance. Please fund your wallet.");
        return;
      }

      showError(message);
      console.error("Verification badge renewal error:", error);
    } finally {
      setRenewing(false);
    }
  };

  return (
    <>
      <div className="tw:min-h-screen tw:bg-[#f5f5f7] tw:px-4 tw:pb-20 tw:pt-24 tw:text-slate-900 tw:md:px-6 tw:md:pt-28">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-6xl tw:flex-col tw:gap-6">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <Link
              to="/account"
              className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-slate-700 hover:tw:text-slate-900"
            >
              <ArrowLeft className="tw:h-4 tw:w-4" />
              Back to account
            </Link>
          </div>

          <section className="tw:relative tw:overflow-hidden tw:rounded-4xl tw:bg-primary tw:p-6 tw:text-white tw:shadow-[0_24px_80px_rgba(15,23,42,0.18)] tw:md:p-8">
            <span className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-top-10 tw:h-40 tw:w-40 tw:rounded-full tw:bg-white/10 tw:blur-3xl" />
            <span className="tw:pointer-events-none tw:absolute tw:-left-8 tw:bottom-0 tw:h-32 tw:w-32 tw:rounded-full tw:bg-white/10 tw:blur-3xl" />
            <div className="tw:relative tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <div>
                <div className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/15 tw:bg-white/10 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em]">
                  <SubscriptionBadge className="tw:h-4 tw:w-4 tw:text-white" />
                  Verification Badge Subscription
                </div>
                <span className="tw:block tw:mt-4 tw:text-3xl tw:font-semibold tw:leading-tight tw:md:text-5xl">
                  Keep your Xilolo badge active every month.
                </span>
                <span className="tw:block tw:mt-3 tw:max-w-2xl tw:text-sm tw:text-white/85 tw:md:text-base">
                  Manage your monthly badge subscription, unlock subscriber benefits,
                  and get beta access to Xilolo AI while your plan is active.
                </span>
              </div>

              <div className="tw:rounded-[28px] tw:border tw:border-white/15 tw:bg-white/10 tw:p-5 tw:backdrop-blur">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                  <div>
                    <div className="tw:text-sm tw:text-white/70">Subscription amount</div>
                    <div className="tw:mt-1 tw:text-3xl tw:font-semibold">
                      {formattedSubscriptionPrice}
                    </div>
                    <div className="tw:mt-1 tw:text-sm tw:text-white/70">
                      Monthly billing from your wallet balance.
                    </div>
                  </div>
                  {hasActiveSubscription ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-emerald-500/20 tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-emerald-50">
                      <CheckCircle2 className="tw:h-4 tw:w-4" />
                      Active
                    </span>
                  ) : (
                    <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-white/10 tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-white">
                      Inactive
                    </span>
                  )}
                </div>

                <button
                style={{
                  borderRadius: 24,
                  marginTop: 24
                }}
                  type="button"
                  onClick={handleInitializeSubscription}
                  disabled={loading || initializing || hasActiveSubscription}
                  className="tw:mt-6 tw:inline-flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-white tw:px-5 tw:text-sm tw:font-semibold tw:text-primary tw:transition hover:tw:bg-white/90 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                >
                  <Wallet className="tw:h-4 tw:w-4" />
                  <span>
                    {hasActiveSubscription
                      ? "Subscription already active"
                      : initializing
                        ? "Initializing subscription..."
                        : "Start monthly subscription"}
                  </span>
                </button>

                {canRenewSubscription ? (
                  <button
                    style={{
                      borderRadius: 24,
                      marginTop: 12,
                    }}
                    type="button"
                    onClick={handleRenewSubscription}
                    disabled={loading || renewing}
                    className="tw:inline-flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-white/25 tw:bg-white/10 tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition hover:tw:bg-white/15 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  >
                    <RefreshCw className="tw:h-4 tw:w-4" />
                    <span>{renewing ? "Renewing..." : "Renew subscription"}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="tw:rounded-4xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Sparkles className="tw:h-5 tw:w-5 tw:text-primary" />
                <span className="tw:block tw:text-xl tw:font-semibold tw:text-slate-900">
                  Membership benefits
                </span>
              </div>

              <div className="tw:mt-5 tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
                {SUBSCRIPTION_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4"
                    >
                      <div className="tw:flex tw:items-start tw:gap-3">
                        <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/10 tw:text-primary">
                          <Icon className="tw:h-5 tw:w-5" />
                        </span>
                        <div>
                          <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                            {benefit.title}
                          </div>
                          <span className="tw:mt-1 tw:text-sm tw:leading-6 tw:text-slate-600">
                            {benefit.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="tw:space-y-6">
              <section className="tw:rounded-4xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <CreditCard className="tw:h-5 tw:w-5 tw:text-primary" />
                  <span className="tw:text-xl tw:font-semibold tw:text-slate-900">
                    Subscription details
                  </span>
                </div>

                {loading ? (
                  <div className="tw:mt-5 tw:space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="tw:h-14 tw:animate-pulse tw:rounded-2xl tw:bg-slate-100"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="tw:mt-5 tw:space-y-3">
                    {statusItems.map((item) => (
                      <div
                        key={item.label}
                        className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4"
                      >
                        <span className="tw:text-sm tw:text-slate-500">{item.label}</span>
                        <span className="tw:max-w-[60%] tw:text-right tw:text-sm tw:font-medium tw:text-slate-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>

      <WalletFundingRequiredModal
        open={fundingRequiredOpen}
        onClose={() => setFundingRequiredOpen(false)}
        details={fundingRequiredDetails}
        formatAmount={(amount) =>
          formatWalletMoney(amount, subscriptionCurrency)
        }
        title="Wallet funding required"
        description="Your wallet balance is not enough to subscribe to the Xilolo badge right now."
        requiredAmountLabel="Subscription amount"
        onFundWallet={() => {
          setFundingRequiredOpen(false);
          setFundWalletOpen(true);
        }}
      />
      <FundWalletModal
        open={fundWalletOpen}
        onClose={() => setFundWalletOpen(false)}
        prefilledAmount={fundingRequiredDetails?.deficit_amount || ""}
        source="Verification_badge_subscription"
      />
    </>
  );
}
