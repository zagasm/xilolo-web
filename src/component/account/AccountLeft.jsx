import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { showError, showSuccess } from "../ui/toast";
import { getInitials, hasProfileImage } from "../Organizers/organiser.utils";
import VerificationModal from "./VerificationModal";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import SubscriptionBadge from "../ui/SubscriptionBadge.jsx";
import { isUserAccountVerified } from "../../lib/userVerification";

const AccountLeft = ({ user }) => {
  const { token, setAuth, refreshUser } = useAuth();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onFocus = () => {
      if (token) refreshUser();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [token, refreshUser]);

  const profileImage = user?.profileUrl;
  const showProfileImage = hasProfileImage(profileImage);
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.username || user?.email || "User";
  const initials = getInitials(fullName);
  const isVerified = isUserAccountVerified(user);
  const hasActiveSubscription = !!(
    user?.subscription?.isActive || user?.has_active_subscription
  );

  const handleVerificationSuccess = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/profile", authHeaders(token));
      setAuth({ user: res?.data?.user, token });
      await refreshUser?.();
      showSuccess("Account verified successfully!");
    } catch (error) {
      console.error(error);
      showError(error?.response?.data?.message || "Failed to refresh profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-4 tw:pt-6 tw:md:pt-10 tw:pb-6">
        {/* 1. Profile Card */}
        <Link
          to={`/profile/${user.id}`}
          className="tw:bg-white tw:rounded-3xl tw:px-3 tw:py-4 tw:flex tw:items-center tw:justify-between tw:shadow-sm tw:hover:shadow-md tw:transition-shadow tw:cursor-pointer"
        >
          <div className="tw:flex tw:items-center tw:gap-4">
            <div
              className={`tw:h-12 tw:w-12 tw:rounded-full tw:overflow-hidden tw:flex tw:items-center tw:justify-center ${showProfileImage ? "" : "tw:bg-lightPurple"
                }`}
            >
              {showProfileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="tw:w-full tw:h-full tw:object-cover"
                />
              ) : (
                <span className="tw:text-primary tw:text-sm tw:font-semibold">
                  {initials}
                </span>
              )}
            </div>
            <div className="tw:flex tw:flex-col">
              <div className="tw:flex tw:items-center tw:gap-0.5">
                <span className="tw:text-[16px] tw:font-bold tw:text-gray-900">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : "User"}
                </span>
                {hasActiveSubscription && (
                  <SubscriptionBadge className="tw:size-5" />
                )}
              </div>
              <span className="tw:text-[10px] tw:md:text-sm tw:text-gray-500">
                {user?.email || "user@example.com"}
              </span>
            </div>
          </div>
          <ChevronRight className="tw:w-5 tw:h-5 tw:text-gray-400" />
        </Link>
        {!hasActiveSubscription && (
          <div
            className={`${user.subscription?.isActive ? "tw:bg-blue-600" : "tw:bg-blue-700"
              } tw:border tw:border-blue-100 tw:rounded-3xl tw:px-3 tw:py-6 tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-4`}
          >
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:shrink-0">
                {user.subscription?.isActive ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="tw:size-8 tw:text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="tw:size-8 tw:text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                {user.subscription?.isActive ? (
                  <span className="tw:text-[12px] tw:font-medium tw:text-white tw:leading-tight">
                    You are now Verified!
                  </span>
                ) : (
                  <div>
                    <span className="tw:text-[12px] tw:font-medium tw:text-white tw:leading-tight">
                      Xilolo Verification Badge
                    </span>
                    <br />
                    <span className="tw:text-[12px] tw:font-medium tw:text-white tw:leading-tight">
                      Get the blue checkmark and unlock premium features
                    </span>
                  </div>
                )}
              </div>
            </div>
            {user.subscription?.isActive ? null : (
              <Link
                to="/subscription"
                style={{ borderRadius: 8 }}
                className="tw:md:w-auto tw:bg-[#FFFFFF] tw:hover:bg-[#FFFFFF]/80 text-dark tw:text-[12px] tw:font-semibold tw:px-4 tw:py-2.5 tw:transition-colors"
              >
                Subscribe Now
              </Link>
            )}
          </div>
        )}

        {/* 3. Verification Warning (Shows ONLY if NOT verified) */}
        {!isVerified && (
          <div className="tw:bg-[#FFF4E5] tw:border tw:border-orange-100 tw:rounded-3xl tw:px-3 tw:py-[11.5px] tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-4">
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:shrink-0">
                <img src="/images/warning.svg" alt="Warning" />
              </div>
              <span className="tw:text-[12px] tw:font-medium tw:text-orange-800 tw:leading-tight">
                You have not verified <br className="tw:hidden tw:md:block" />{" "}
                your account yet.
              </span>
            </div>
            <button
              onClick={() => setIsVerifyModalOpen(true)}
              style={{ borderRadius: 8 }}
              className="tw:md:w-auto tw:bg-orange-500 tw:hover:bg-orange-600 tw:text-white tw:text-[9px] tw:font-semibold tw:px-4 tw:py-2.5 tw:transition-colors"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* 4. Quick Stats Grid */}
        <div className="row g-3">
          <div className="col-6">
            <Link
              to={`/profile/${user.id}`}
              className="tw:bg-white tw:rounded-3xl tw:p-4 tw:h-24 tw:flex tw:items-center tw:gap-3 tw:shadow-sm tw:hover:shadow-md tw:transition-all"
            >
              <img src="/images/camera.svg" alt="" />
              <span className="tw:text-[10px] tw:md:text-sm tw:font-medium tw:text-gray-900 tw:leading-tight">
                View My Events
              </span>
            </Link>
          </div>

          <div className="col-6">
            <Link
              to="/event/saved-events"
              className="tw:bg-white tw:rounded-3xl tw:p-4 tw:h-24 tw:flex tw:items-center tw:gap-3 tw:shadow-sm tw:hover:shadow-md tw:transition-all"
            >
              <img src="/images/saveIcon.svg" alt="" />
              <span className="tw:text-[10px] tw:md:text-sm tw:font-medium tw:text-gray-900 tw:leading-tight">
                View Saved Events
              </span>
            </Link>
          </div>

          <div className="col-6">
            <Link
              to="/me/organisers"
              className="tw:bg-white tw:rounded-3xl tw:p-4 tw:h-24 tw:flex tw:items-center tw:gap-3 tw:shadow-sm tw:hover:shadow-md tw:transition-all"
            >
              <img src="/images/following.svg" alt="" />
              <span className="tw:text-[10px] tw:md:text-sm tw:font-medium tw:text-gray-900 tw:leading-tight">
                Organizers I Follow
              </span>
            </Link>
          </div>

          <div className="col-6">
            <Link
              to="/me/organisers/followers"
              className="tw:bg-white tw:rounded-3xl tw:p-4 tw:h-24 tw:flex tw:items-center tw:gap-3 tw:shadow-sm tw:hover:shadow-md tw:transition-all"
            >
              <img src="/images/followers.svg" alt="" />
              <span className="tw:text-[10px] tw:md:text-sm tw:font-medium tw:text-gray-900 tw:leading-tight">
                My Followers
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- MODAL INJECTION --- */}
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
};

export default AccountLeft;
