import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Globe,
  Mail,
  Lock,
  UserX,
  ShieldCheck,
  HelpCircle,
  Headphones,
  FileText,
  Trash,
  LogOut,
  User2,
  UserPen,
  Coins,
  CircleAlert,
  PlusCircle,
  Landmark,
} from "lucide-react";
import Switch from "@mui/material/Switch";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";

const MenuSection = ({ title, children }) => (
  <div className="tw:mb-8">
    <span className="tw:text-[14px] tw:font-medium tw:text-gray-500 tw:mb-4 tw:pl-1">
      {title}
    </span>
    <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3">{children}</div>
  </div>
);

const ItemCard = ({ icon: Icon, label, to, onClick, isRed }) => {
  const Wrapper = to ? Link : "div";

  return (
    <Wrapper
      to={to}
      onClick={onClick}
      className="tw:bg-white tw:w-full tw:rounded-3xl tw:py-3 tw:px-4 tw:flex tw:items-center tw:justify-between tw:hover:shadow-md tw:transition-all tw:cursor-pointer tw:group"
    >
      <div className="tw:flex tw:items-center tw:gap-4">
        {Icon && (
          <Icon
            className={`tw:w-5 tw:h-5 ${
              isRed ? "tw:text-red-500" : "tw:text-gray-700"
            }`}
          />
        )}
        <span
          className={`tw:text-[15px] tw:font-medium ${
            isRed ? "tw:text-red-600" : "tw:text-gray-900"
          }`}
        >
          {label}
        </span>
      </div>
      {!isRed && (
        <svg
          className="tw:w-5 tw:h-5 tw:text-gray-300 group-tw:hover:text-gray-500 tw:transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </Wrapper>
  );
};

const AccountRight = ({ onLogout, onDeactivate }) => {
  const [notifSettings, setNotifSettings] = useState({
    push: false,
    email: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [notifError, setNotifError] = useState("");
  const { user } = useAuth();
  // console.log(user);

  const isOrganizer = user?.is_organiser_verified;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        setNotifError("");
        const token = localStorage.getItem("token");
        const res = await api.get(
          "/api/v1/me/notification-settings",
          authHeaders(token),
        );
        const data = res?.data?.data;
        if (data) {
          setNotifSettings({
            push: !!data.push,
            email: !!data.email,
          });
        }
      } catch (err) {
        console.error("Failed to load notification settings", err);
        setNotifError("Could not load your notification preferences.");
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSetting = async (type) => {
    if (loadingSettings || updatingKey) return;

    const prev = { ...notifSettings };
    const nextValue = !prev[type];
    const nextState = {
      ...prev,
      [type]: nextValue,
    };

    setNotifSettings(nextState);
    setUpdatingKey(type);
    setNotifError("");

    try {
      const token = localStorage.getItem("token");
      await api.put(
        "/api/v1/me/notification-settings",
        {
          push: nextState.push,
          email: nextState.email,
        },
        authHeaders(token),
      );
    } catch (err) {
      console.error("Failed to update notification settings", err);
      setNotifSettings(prev); // revert
      setNotifError("Unable to update. Please try again.");
    } finally {
      setUpdatingKey(null);
    }
  };

  const isPushDisabled =
    loadingSettings || updatingKey === "push" || !!notifError;
  const isEmailDisabled =
    loadingSettings || updatingKey === "email" || !!notifError;

  const security = [
    {
      icon: UserX,
      label: "Blocked Organizers / Users",
      to: "/account/blocked",
    },
    {
      icon: ShieldCheck,
      label: "Two-Factor Authentication",
      to: "/account/security",
    },
  ];
  const events = [{ icon: User2, label: "Mentions Tag", to: "/mentions" }];
  const profile = [
    { icon: UserPen, label: "Edit profile", to: "/profile/edit-profile" },
  ];
  const wallet = [
    { icon: Landmark, label: "Wallet", to: "/account/wallet" },
    { icon: Coins, label: "Crypto Wallet", to: "/account/crypto-wallet" },
    ...(isOrganizer
      ? [
          {
            icon: PlusCircle,
            label: "Payouts",
            to: "/account/payouts",
          },
        ]
      : []),
  ];

  const support = [
    {
      icon: Headphones,
      label: "Community Guidelines",
      to: "/community-guidelines",
    },
    { icon: FileText, label: "Terms of Service", to: "/terms-of-service" },
    { icon: FileText, label: "Privacy Policy", to: "/privacy-policy" },
    {
      icon: CircleAlert,
      label: "Deactivate Account",
      onClick: onDeactivate,
      isRed: false,
    },
  ];

  return (
    <div className="tw:pt-6 tw:md:pt-10 tw:pb-16 tw:w-full">
      {/* Preferences section with inline notification switches */}
      <MenuSection title="Preference">
        {/* Notifications card with Push / Email toggles */}
        <div className="tw:bg-white tw:w-full tw:rounded-3xl tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-3 tw:shadow-sm tw:hover:shadow-md tw:transition-all">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:flex tw:items-center tw:gap-3">
              <Bell className="tw:w-5 tw:h-5 tw:text-gray-700" />
              <div>
                <span className="tw:text-[15px] tw:font-medium tw:text-gray-900">
                  Notifications
                </span>
                <span className="tw:block tw:text-xs tw:text-gray-500">
                  Choose how you want to hear from us.
                </span>
              </div>
            </div>
          </div>

          <div className="tw:mt-1 tw:space-y-2">
            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-sm tw:text-gray-700">
                Push Notifications
              </span>
              <Switch
                checked={notifSettings.push}
                onChange={() => updateSetting("push")}
                disabled={isPushDisabled}
                size="small"
              />
            </div>
            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-sm tw:text-gray-700">
                Email Notifications
              </span>
              <Switch
                checked={notifSettings.email}
                onChange={() => updateSetting("email")}
                disabled={isEmailDisabled}
                size="small"
              />
            </div>
          </div>

          {loadingSettings && (
            <span className="tw:mt-1 tw:text-xs tw:text-gray-400">
              Loading your preferences…
            </span>
          )}
          {notifError && (
            <span className="tw:mt-1 tw:text-xs tw:text-red-500">
              {notifError}
            </span>
          )}
        </div>

        {/* Language stays as a separate item */}
        {/* <ItemCard icon={Globe} label="Language" to="/account/language" /> */}
      </MenuSection>

      {/* Security & Privacy */}
      <MenuSection title="Profile">
        {profile.map((item, index) => (
          <ItemCard key={index} {...item} />
        ))}
      </MenuSection>
      <MenuSection title="Wallet">
        {wallet.map((item, index) => (
          <ItemCard key={index} {...item} />
        ))}
      </MenuSection>
      <MenuSection title="Events">
        {events.map((item, index) => (
          <ItemCard key={index} {...item} />
        ))}
      </MenuSection>
      <MenuSection title="Security & Privacy">
        {security.map((item, index) => (
          <ItemCard key={index} {...item} />
        ))}
      </MenuSection>

      {/* Support */}
      <MenuSection title="Support">
        {support.map((item, index) => (
          <ItemCard key={index} {...item} />
        ))}
      </MenuSection>

      {/* Logout button */}
      <div className="tw:mt-6 tw:mb-8 tw:flex tw:justify-center">
        <button
          style={{ borderRadius: 24 }}
          onClick={onLogout}
          className="tw:flex tw:w-full tw:text-center tw:items-center tw:gap-2 tw:bg-white tw:px-8 tw:py-3 tw:rounded-full tw:shadow-sm tw:hover:shadow-md tw:transition-all"
        >
          <LogOut className="tw:w-5 tw:h-5 tw:text-red-600" />
          <span className="tw:text-[15px] tw:font-bold tw:text-red-600">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
};

export default AccountRight;
