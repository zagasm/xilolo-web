import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PiBookmarkDuotone,
  PiBookOpenText,
  PiHeadset,
  PiLockKey,
  PiMoney,
  PiPower,
  PiProhibitInset,
  PiShieldCheck,
  PiShieldSlash,
  PiWallet,
} from "react-icons/pi";
import { showError, showSuccess } from "../ui/toast";
import { getInitials, hasProfileImage } from "../Organizers/organiser.utils";
import VerificationModal from "./VerificationModal";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import { formatWalletMoney } from "../../features/wallet/walletUtils";
import SubscriptionBadge from "../ui/SubscriptionBadge.jsx";

const QuickActionCard = ({ icon, iconComponent: Icon, label, to, onClick, isRed }) => {
  const Wrapper = to ? Link : "button";

  return (
    <Wrapper
      style={{ borderRadius: 16 }}
      to={to}
      type={to ? undefined : "button"}
      onClick={onClick}
      className="tw:relative tw:flex tw:min-h-20 tw:w-full tw:flex-col tw:items-start tw:justify-between tw:gap-3 tw:overflow-hidden tw:rounded-3xl tw:border tw:border-[#ffffff]/45 tw:bg-[#ffffff]/70 tw:p-3 tw:text-left tw:shadow-[0_18px_50px_rgba(148,163,184,0.18),0_0_18px_rgba(0,245,255,0.04)] tw:backdrop-blur-2xl tw:transition hover:tw:-translate-y-0.5 hover:tw:border-white/60 hover:tw:bg-white/40 hover:tw:shadow-[0_22px_60px_rgba(148,163,184,0.24),0_0_24px_rgba(0,245,255,0.08)] tw:md:min-h-24 tw:md:gap-4 tw:md:rounded-[28px] tw:md:p-4"
    >
      <span className="tw:pointer-events-none tw:absolute tw:inset-x-3 tw:top-0 tw:h-px tw:bg-white/70" />
      <span className="tw:pointer-events-none tw:absolute tw:-right-8 tw:top-3 tw:h-16 tw:w-16 tw:rounded-full tw:bg-white/25 tw:blur-2xl" />

      {icon ? (
        <div className="tw:relative tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-[16px] tw:border tw:border-white/50 tw:bg-white/35 tw:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] tw:backdrop-blur-xl tw:md:h-12 tw:md:w-12 tw:md:rounded-[18px]">
          <img src={icon} alt="" className="tw:size-7 tw:md:size-8 tw:shrink-0" />
        </div>
      ) : Icon ? (
        <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-[16px] tw:border tw:border-white/50 tw:bg-white/35 tw:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] tw:backdrop-blur-xl tw:md:h-12 tw:md:w-12 tw:md:rounded-[18px]">
          <Icon
            className={`tw:size-6 tw:md:size-8 tw:text-primary ${isRed ? "tw:text-red-500" : "tw:text-gray-700"
              }`}
          />
        </span>
      ) : null}

      <span
        className={`tw:relative tw:text-[10px] tw:md:text-sm tw:font-medium tw:leading-4 tw:md:leading-5 ${isRed ? "tw:text-red-600" : "tw:text-gray-900"
          }`}
      >
        {label}
      </span>
    </Wrapper>
  );
};

export default function AccountCenter({ user, onLogout, onDeactivate }) {
  const navigate = useNavigate();
  const { token, setAuth, refreshUser } = useAuth();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const loadSubscriptionStatus = useCallback(async () => {
    if (!token) {
      setSubscriptionStatus(null);
      return null;
    }

    try {
      const res = await api.get("/api/v1/user/subscription", authHeaders(token));
      const payload = res?.data?.data || res?.data || null;
      setSubscriptionStatus(payload);
      return payload;
    } catch (error) {
      console.error("Failed to load subscription status", error);
      return null;
    }
  }, [token]);

  useEffect(() => {
    const onFocus = () => {
      if (!token) return;

      refreshUser();
      loadSubscriptionStatus();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadSubscriptionStatus, refreshUser, token]);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const profileImage = user?.profileUrl;
  const showProfileImage = hasProfileImage(profileImage);
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.username || user?.email || "User";
  const initials = getInitials(fullName);
  const isVerified = user?.email_verified || user?.phone_verified;
  const isOrganizer = user?.is_organiser_verified;
  const profilePath = `/profile/${user.id}`;
  const hasActiveSubscription =
    subscriptionStatus?.has_active_subscription ??
    user?.has_active_subscription ??
    user?.subscription?.isActive ??
    false;
  const subscriptionPrice = Number(subscriptionStatus?.price) || 2500;
  const subscriptionCurrency = subscriptionStatus?.currency || "NGN";
  const formattedSubscriptionPrice = formatWalletMoney(
    subscriptionPrice,
    subscriptionCurrency
  );

  const handleVerificationSuccess = async () => {
    setIsRefreshingProfile(true);
    try {
      const res = await api.get("/api/v1/profile", authHeaders(token));
      setAuth({ user: res?.data?.user, token });
      await refreshUser?.();
      showSuccess("Account verified successfully!");
    } catch (error) {
      console.error(error);
      showError(error?.response?.data?.message || "Failed to refresh profile.");
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const securityItems = [
    {
      iconComponent: PiShieldCheck,
      label: "Two-Factor Authentication",
      to: "/account/security",
    },
    {
      iconComponent: PiShieldSlash,
      label: "Blocked Organizers / Users",
      to: "/account/blocked",
    },
  ];

  const supportItems = [
    ...(hasActiveSubscription
      ? [
        {
          iconComponent: PiHeadset,
          label: "Chat with Xilolo Support",
          to: "/support-chat",
        },
      ]
      : []),
    {
      iconComponent: PiHeadset,
      label: "Community Guidelines",
      to: "/community-guidelines",
    },
    {
      iconComponent: PiBookOpenText,
      label: "Terms of Service",
      to: "/terms-of-service",
    },
    {
      iconComponent: PiLockKey,
      label: "Privacy Policy",
      to: "/privacy-policy",
    },
    {
      iconComponent: PiProhibitInset,
      label: "Deactivate Account",
      onClick: onDeactivate,
      isRed: false,
    },
  ];

  return (
    <>
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-5xl tw:flex-col tw:gap-4 tw:md:gap-6">
        <section className="tw:relative tw:overflow-hidden tw:md:border tw:md:border-white/50 tw:md:bg-[linear-gradient(135deg,rgba(255,255,255,0.54)_0%,rgba(244,248,255,0.36)_46%,rgba(235,242,255,0.46)_100%)] tw:p-0 tw:md:shadow-[0_24px_80px_rgba(148,163,184,0.2),0_0_32px_rgba(0,245,255,0.05)] tw:md:backdrop-blur-3xl tw:md:rounded-[36px] tw:md:p-7">
          <span className="tw:pointer-events-none tw:absolute tw:-left-12 tw:top-6 tw:h-28 tw:w-28 tw:rounded-full tw:bg-white/35 tw:blur-3xl" />
          <span className="tw:pointer-events-none tw:absolute tw:-right-10 tw:bottom-4 tw:h-32 tw:w-32 tw:rounded-full tw:bg-neon/10 tw:blur-3xl" />
          <span className="tw:pointer-events-none tw:absolute tw:inset-x-6 tw:top-0 tw:h-px tw:bg-white/80" />

          <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between tw:md:gap-5">
            <div
              role="link"
              tabIndex={0}
              onClick={() => navigate(profilePath)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(profilePath);
                }
              }}
              className="tw:relative tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-3xl tw:border tw:border-white/45 tw:bg-white/24 tw:p-3 tw:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] tw:backdrop-blur-2xl tw:transition hover:tw:bg-white/32 tw:md:gap-4 tw:md:rounded-[30px] tw:md:p-4"
            >
              <div
                className={`tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:border tw:border-white/55 tw:shadow-[0_8px_20px_rgba(148,163,184,0.18)] tw:md:h-16 tw:md:w-16 ${showProfileImage ? "tw:bg-white/30" : "tw:bg-white/45"
                  }`}
              >
                {showProfileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                ) : (
                  <span className="tw:text-base tw:font-semibold tw:text-primary tw:md:text-lg">
                    {initials}
                  </span>
                )}
              </div>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900 tw:md:text-xl">
                    {fullName}
                  </span>
                  {hasActiveSubscription ? (
                    <SubscriptionBadge className="tw:-ml-1 tw:size-4 tw:md:size-5" />
                  ) : null}
                </div>
                <span className="tw:mt-1 tw:block tw:text-xs tw:font-medium tw:text-gray-500 tw:md:text-sm">
                  View public profile
                </span>
              </div>
            </div>

            <div className="tw:relative tw:flex tw:w-full tw:overflow-hidden tw:rounded-[24px] tw:bg-primary tw:p-4 tw:text-white tw:lg:max-w-md tw:md:rounded-[28px] tw:md:p-5 tw:shadow-[0_18px_52px_rgba(0,0,0,0.24),0_0_28px_rgba(0,245,255,0.12)]">
              <span className="tw:pointer-events-none tw:absolute tw:-right-6 tw:-top-6 tw:h-24 tw:w-24 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />
              <span className="tw:pointer-events-none tw:absolute tw:-left-5 tw:bottom-0 tw:h-20 tw:w-20 tw:rounded-full tw:bg-neon/10 tw:blur-2xl" />
              <SubscriptionBadge className="tw:pointer-events-none tw:absolute tw:-right-4 tw:top-1/2 tw:h-28 tw:w-28 tw:-translate-y-1/2 tw:opacity-[0.12] tw:text-black tw:md:h-36 tw:md:w-36" />

              <div className="tw:relative tw:flex tw:w-full tw:flex-col tw:gap-3">
                <div>
                  <span className="tw:block tw:text-xs tw:font-semibold tw:md:text-sm">
                    Xilolo Verification Badge
                  </span>
                  <span className="tw:mt-1 tw:block tw:text-xs tw:text-white/90 tw:md:text-sm">
                    {hasActiveSubscription
                      ? `Your subscription is active. Review your current plan details and renewal information.`
                      : `Get the Xilolo checkmark for ${formattedSubscriptionPrice} monthly from your wallet.`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/subscription")}
                  style={{ borderRadius: 12 }}
                  className="tw:inline tw:w-40 tw:items-center tw:justify-center tw:bg-white tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-gray-900 tw:transition hover:tw:bg-white/90"
                >
                  <span className="tw:text-primary">
                    {hasActiveSubscription ? "View Subscription" : "Subscribe Now"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {!isVerified ? (
            <div className="tw:mt-5 tw:flex tw:flex-col tw:gap-3 tw:rounded-3xl tw:border tw:border-orange-100 tw:bg-[#FFF4E5] tw:p-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
              <div className="tw:flex tw:items-center tw:gap-3">
                <img src="/images/warning.svg" alt="Warning" />
                <span className="tw:text-xs tw:md:text-sm tw:font-medium tw:text-orange-800">
                  You have not verified your account yet.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(true)}
                style={{ borderRadius: 12 }}
                className="tw:inline-flex tw:items-center tw:justify-center tw:bg-orange-500 tw:px-4 tw:py-3 tw:text-xs tw:font-semibold tw:text-white tw:transition hover:tw:bg-orange-600"
              >
                {isRefreshingProfile ? "Refreshing..." : "Verify Now"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="tw:grid tw:grid-cols-2 tw:gap-3 tw:md:grid-cols-3 tw:md:gap-4">
          <QuickActionCard
            iconComponent={PiBookmarkDuotone}
            label="View Saved Events"
            to="/event/saved-events"
          />
          <QuickActionCard
            iconComponent={PiWallet}
            label="Wallet"
            to="/account/wallet"
          />
          {isOrganizer ? (
            <QuickActionCard
              iconComponent={PiMoney}
              label="Payouts"
              to="/account/payouts"
            />
          ) : null}
          {securityItems.map((item) => (
            <QuickActionCard
              key={item.label}
              iconComponent={item.iconComponent}
              label={item.label}
              to={item.to}
              onClick={item.onClick}
              isRed={item.isRed}
            />
          ))}
          {supportItems.map((item) => (
            <QuickActionCard
              key={item.label}
              iconComponent={item.iconComponent}
              label={item.label}
              to={item.to}
              onClick={item.onClick}
              isRed={item.isRed}
            />
          ))}
          <QuickActionCard
            iconComponent={PiPower}
            label="Logout"
            onClick={onLogout}
            isRed
          />
        </section>
      </div>

      <VerificationModal
        isOpen={isVerifyModalOpen}
        closeModal={() => setIsVerifyModalOpen(false)}
        email={user?.email}
        showError={showError}
        showSuccess={showSuccess}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
}
