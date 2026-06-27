import React, { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  PlusSquare,
  Search,
  Bell,
  Ticket,
  Star,
  UserCircle2,
  LogOut,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { useAuth } from "../auth/AuthContext";
import MobileNav from "./MobileNav";
import {
  getInitials,
  hasProfileImage,
} from "../../component/Organizers/organiser.utils";
import WalletBalanceChip from "../../features/wallet/components/WalletBalanceChip";
import useNotifications from "../../component/Notification/useNotifications";
import SubscriptionBadge from "../../component/ui/SubscriptionBadge";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token } = useAuth();
  const { unreadCount } = useNotifications(token);
  const [desktopSearch, setDesktopSearch] = useState("");

  const profileImage = user?.profileUrl;
  const hasImage = hasProfileImage(profileImage);
  const nameForInitials =
    user?.firstName || user?.username || user?.organiser || user?.email || "User";
  const initials = getInitials(
    user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : nameForInitials
  );

  const hoverTimeoutRef = useRef(null);
  const profileButtonRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const nav = [
    { name: "Home", to: "/feed", icon: HomeIcon },
    { name: "Tickets", to: "/tickets", icon: Ticket },
    { name: "Create Event", to: "/event/select-event-type", icon: PlusSquare },
    { name: "Organizers", to: "/organizers", icon: Star },
  ];

  const profilePath = user?.id ? `/profile/${user.id}` : "/account";
  const hasActiveSubscription = !!(
    user?.has_active_subscription ||
    user?.hostHasActiveSubscription ||
    user?.subscription?.isActive ||
    user?.hostPlan?.id
  );

  const triggerBounce = (target) => {
    const root = document.querySelector(`[data-bounce-page="${target}"]`);
    if (!root?.animate) return;

    root.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-8px) scale(1.01)" },
        { transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    );
  };

  const handleMenuNavigation = (targetPath, targetKey, closeMenu) => {
    const isSameProfile = targetKey === "profile" && location.pathname === profilePath;
    const isSameAccount =
      targetKey === "account" && location.pathname.startsWith("/account");

    if (isSameProfile || isSameAccount) {
      closeMenu?.();
      triggerBounce(targetKey);
      return;
    }

    closeMenu?.();
    navigate(targetPath);
  };

  const handleDesktopSearchSubmit = (event) => {
    event.preventDefault();
    const term = desktopSearch.trim();
    if (!term) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <div className="tw:flex tw:w-full tw:h-[74px] tw:bg-white tw:border-b tw:border-gray-200 tw:px-4 tw:md:px-6 tw:lg:px-7 tw:items-center tw:justify-between tw:fixed tw:z-999 tw:top-0">
        <Link to="/feed" className="tw:flex tw:items-center tw:gap-4 tw:md:gap-5">
          <img
            src={"/logo.png"}
            alt="Xilolo Logo"
            className="tw:w-20 tw:md:w-24 tw:lg:w-40 tw:-ml-2 tw:md:-ml-3 tw:object-contain"
          />
        </Link>

        <div className="tw:hidden tw:md:flex tw:md:justify-center tw:gap-8 tw:lg:gap-10 tw:mr-8 tw:lg:mr-12">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.to}
                className="tw:flex tw:flex-col tw:items-center tw:gap-0.5"
              >
                <Icon
                  className={`tw:size-5 ${active ? "tw:text-black" : "tw:text-gray-500"}`}
                  fill={active ? "black" : "none"}
                />
                <span
                  className={`tw:text-[11px] ${
                    active ? "tw:text-black tw:font-semibold" : "tw:text-gray-500"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="tw:flex tw:items-center tw:gap-3 tw:md:gap-3.5">
          <Link
            to="/xilolo-ai"
            className={[
              "xilolo-ai-nav-button tw:hidden tw:lg:inline-flex tw:h-10 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3.5 tw:text-sm tw:font-extrabold tw:shadow-[0_10px_26px_rgba(17,17,17,0.18)] tw:transition tw:hover:-translate-y-0.5",
              location.pathname === "/xilolo-ai"
                ? "tw:border-primary tw:bg-primary text-white"
                : "tw:border-gray-200 tw:bg-white tw:text-primary",
            ].join(" ")}
            aria-label="Open Xilolo AI"
          >
            <Sparkles className="tw:size-4" />
            <span>Xilolo AI</span>
          </Link>

          <form
            onSubmit={handleDesktopSearchSubmit}
            className="tw:hidden tw:lg:flex tw:h-10 tw:w-[220px] tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:px-3"
          >
            <Search className="tw:size-4 tw:text-gray-500" />
            <input
              value={desktopSearch}
              onChange={(event) => setDesktopSearch(event.target.value)}
              placeholder="Search Xilolo"
              className="tw:w-full tw:bg-transparent tw:text-sm tw:text-gray-800 tw:outline-none placeholder:tw:text-gray-400"
            />
          </form>

          {isAuthenticated ? <WalletBalanceChip /> : null}

          <Link to={"/notifications"} className="tw:relative tw:cursor-pointer">
            <Bell className="tw:size-5 tw:text-gray-700" />
            {unreadCount > 0 && (
              <span className="tw:absolute tw:-right-2 tw:-top-2 tw:flex tw:min-w-[18px] tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:px-1 tw:text-[10px] tw:font-semibold tw:leading-[18px] tw:text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Popover className="tw:relative">
              {({ open, close }) => (
                <div
                  className="tw:relative"
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      window.clearTimeout(hoverTimeoutRef.current);
                    }
                    if (!open) {
                      profileButtonRef.current?.click();
                    }
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = window.setTimeout(() => {
                      close();
                    }, 90);
                  }}
                >
                  <Popover.Button
                    ref={profileButtonRef}
                    className="tw:size-9 tw:md:size-10 tw:rounded-full rounded-circle tw:overflow-hidden tw:cursor-pointer tw:outline-none tw:ring-0"
                  >
                    {hasImage ? (
                      <img
                        src={profileImage}
                        className="tw:w-full tw:h-full tw:object-cover"
                        alt="Profile"
                      />
                    ) : (
                      <span className="tw:flex tw:items-center tw:justify-center tw:h-full tw:w-full tw:bg-lightPurple tw:text-primary tw:text-sm tw:font-semibold">
                        {initials}
                      </span>
                    )}
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="tw:transition tw:duration-150 tw:ease-out"
                    enterFrom="tw:opacity-0 tw:translate-y-1 tw:scale-95"
                    enterTo="tw:opacity-100 tw:translate-y-0 tw:scale-100"
                    leave="tw:transition tw:duration-100 tw:ease-in"
                    leaveFrom="tw:opacity-100 tw:translate-y-0 tw:scale-100"
                    leaveTo="tw:opacity-0 tw:translate-y-1 tw:scale-95"
                  >
                    <Popover.Panel className="tw:absolute tw:right-0 tw:top-[calc(100%+12px)] tw:z-50 tw:w-56 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
                      <div className="tw:mb-2 tw:min-w-0 tw:border-b tw:border-slate-100 tw:px-3 tw:pb-2">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <div className="tw:min-w-0 tw:text-sm tw:font-semibold tw:text-slate-900 tw:truncate">
                            {user?.name ||
                              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                              "Your account"}
                          </div>
                          {hasActiveSubscription ? (
                            <SubscriptionBadge className="tw:-ml-1 tw:size-3" />
                          ) : null}
                        </div>
                        <div
                          className="tw:max-w-full tw:truncate tw:text-xs tw:text-slate-500"
                          title={user?.email || "Signed in"}
                        >
                          {user?.email || "Signed in"}
                        </div>
                        {hasActiveSubscription ? (
                          <div className="tw:mt-1 tw:text-[11px] tw:font-medium tw:text-slate-500">
                            Subscription active
                          </div>
                        ) : null}
                      </div>

                      <div className="tw:flex tw:flex-col tw:gap-1">
                        <Popover.Button
                          as="button"
                          type="button"
                          onClick={() =>
                            handleMenuNavigation(profilePath, "profile", close)
                          }
                          className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:font-medium tw:text-slate-700 tw:transition tw:hover:bg-slate-50"
                        >
                          <UserCircle2 className="tw:size-4" />
                          <span>View Profile</span>
                        </Popover.Button>

                        <Popover.Button
                          as="button"
                          type="button"
                          onClick={() =>
                            handleMenuNavigation("/account", "account", close)
                          }
                          className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:font-medium tw:text-slate-700 tw:transition tw:hover:bg-slate-50"
                        >
                          <LayoutGrid className="tw:size-4" />
                          <span>Account Center</span>
                        </Popover.Button>

                        <Popover.Button
                          as="button"
                          type="button"
                          onClick={() => {
                            close();
                            logout?.();
                            navigate("/auth/signin");
                          }}
                          className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:font-medium tw:text-red-600 tw:transition tw:hover:bg-red-50"
                        >
                          <LogOut className="tw:size-4" />
                          <span>Logout</span>
                        </Popover.Button>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </div>
              )}
            </Popover>
          ) : (
            <Link
              to="/auth/signin"
              className="tw:size-9 tw:md:size-10 tw:rounded-full tw:overflow-hidden tw:cursor-pointer"
            >
              <span className="tw:flex tw:items-center tw:justify-center tw:h-full tw:w-full tw:bg-lightPurple tw:text-primary tw:text-sm tw:font-semibold">
                {initials}
              </span>
            </Link>
          )}
        </div>
      </div>

      <MobileNav />
    </>
  );
}
