import React, { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  X,
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
import { api, authHeaders } from "../../lib/apiClient";
import {
  eventStartDate,
  hostName,
  priceText,
} from "../../component/Events/SingleEvent";

const EMPTY_SEARCH_SUGGESTIONS = { people: [], events: [] };

function normalizeNavbarSearchResponse(raw) {
  if (!raw) return EMPTY_SEARCH_SUGGESTIONS;

  const items = Array.isArray(raw) ? raw : raw.data || [];
  const people = [];
  const events = [];

  items.forEach((item) => {
    if (!item || !item.type || !item.data) return;

    if (item.type === "event") {
      events.push(item.data);
      return;
    }

    if (item.type === "organiser" || item.type === "user") {
      people.push(item);
    }
  });

  return { people, events };
}

function getSuggestionPersonName(item) {
  const data = item?.data || {};

  if (item?.type === "organiser") {
    if (typeof data.organiser === "string") return data.organiser;

    if (data.organiser && typeof data.organiser === "object") {
      return (
        data.organiser.organiser ||
        data.organiser.name ||
        data.organiser.userName ||
        data.organiser.email ||
        "Organizer"
      );
    }

    return data.name || data.userName || data.email || "Organizer";
  }

  return data.name || data.firstName || data.userName || data.email || "User";
}

function getSuggestionPersonId(item) {
  const data = item?.data || {};

  if (item?.type === "organiser") {
    if (typeof data.organiser === "object" && data.organiser?.userId) {
      return data.organiser.userId;
    }
    if (typeof data.organiser === "object" && data.organiser?.user_id) {
      return data.organiser.user_id;
    }
    if (typeof data.organiser === "object" && data.organiser?.id) {
      return data.organiser.id;
    }
  }

  return data.userId || data.user_id || data.id || null;
}

function getSuggestionPersonAvatar(item) {
  const data = item?.data || {};

  if (item?.type === "organiser") {
    if (typeof data.organiser === "object") {
      return data.organiser.profileImage || data.organiser.profileUrl || null;
    }

    return data.profileImage || null;
  }

  return data.profileUrl || data.profileImage || null;
}

function getSuggestionEventPoster(event) {
  if (Array.isArray(event?.poster)) {
    return event.poster.find((item) => item?.type === "image" && item?.url)?.url || null;
  }

  return typeof event?.poster === "string" ? event.poster : null;
}

function getSuggestionEventHost(event) {
  return (
    event?.hostName ||
    event?.organiser ||
    event?.organiserName ||
    event?.organizerName ||
    "Xilolo host"
  );
}

function getSuggestionEventMeta(event) {
  const startDate = eventStartDate(event);
  const dateLabel = startDate
    ? startDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : event?.eventDate || event?.event_date || "Date TBA";
  const timeLabel = event?.startTime || event?.start_time || "Time TBA";

  return { dateLabel, timeLabel };
}

function NavbarEventSuggestionRow({ event, onClick }) {
  const poster = getSuggestionEventPoster(event);
  const organiser = hostName(event) || getSuggestionEventHost(event);
  const { dateLabel, timeLabel } = getSuggestionEventMeta(event);

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:flex tw:w-full tw:items-stretch tw:gap-3 tw:rounded-[24px] tw:border tw:border-slate-200 tw:bg-white/95 tw:p-3 tw:text-left tw:shadow-[0_10px_24px_rgba(15,23,42,0.04)] tw:transition tw:hover:border-neon/30 tw:hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
    >
      <div className="tw:w-1 tw:shrink-0 tw:rounded-full tw:bg-neon" />

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:line-clamp-2 tw:text-[15px] tw:font-bold tw:leading-tight tw:text-primary">
          {event?.title || "Untitled event"}
        </div>

        <div className="tw:mt-1 tw:truncate tw:text-xs tw:text-slate-500">
          Organised by {organiser}
        </div>

        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-2 tw:text-[11px] tw:text-slate-500">
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <CalendarDays className="tw:h-3.5 tw:w-3.5" />
            {dateLabel}
          </span>
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <Clock3 className="tw:h-3.5 tw:w-3.5" />
            {timeLabel}
          </span>
        </div>

        <div className="tw:mt-3 tw:text-base tw:font-bold tw:text-[#058C78]">
          {priceText(event)}
        </div>
      </div>

      <div className="tw:h-24 tw:w-24 tw:shrink-0 tw:overflow-hidden tw:rounded-[20px] tw:bg-lightPurple">
        {poster ? (
          <img
            src={poster}
            alt={event?.title || "Event poster"}
            className="tw:h-full tw:w-full tw:object-cover"
          />
        ) : null}
      </div>
    </button>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token } = useAuth();
  const { unreadCount } = useNotifications(token);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState(
    EMPTY_SEARCH_SUGGESTIONS
  );
  const [trendingEvents, setTrendingEvents] = useState([]);

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
  const searchContainerRef = useRef(null);
  const searchOverlayPanelRef = useRef(null);
  const modalSearchInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchTrending = async () => {
      setTrendingLoading(true);

      try {
        const response = await api.get("/api/v1/recommendations/trending/search", {
          ...authHeaders(token),
        });

        if (cancelled) return;

        setTrendingEvents(response?.data?.data ?? []);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setTrendingEvents([]);
        }
      } finally {
        if (!cancelled) {
          setTrendingLoading(false);
        }
      }
    };

    fetchTrending();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const query = desktopSearch.trim();

    if (!query) {
      setSearchLoading(false);
      setSearchError("");
      setSearchSuggestions(EMPTY_SEARCH_SUGGESTIONS);
      return;
    }

    if (query.length < 2) {
      setSearchLoading(false);
      setSearchError("");
      setSearchSuggestions(EMPTY_SEARCH_SUGGESTIONS);
      return;
    }

    let cancelled = false;

    const timerId = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await api.get("/api/v1/search", {
          params: { q: query },
          ...authHeaders(token),
        });

        if (cancelled) return;

        setSearchSuggestions(normalizeNavbarSearchResponse(response?.data));
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setSearchSuggestions(EMPTY_SEARCH_SUGGESTIONS);
        setSearchError("Suggestions are unavailable right now.");
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [desktopSearch, token]);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const inTrigger = searchContainerRef.current?.contains(event.target);
      const inOverlay = searchOverlayPanelRef.current?.contains(event.target);

      if (!inTrigger && !inOverlay) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;

    const timerId = window.setTimeout(() => {
      modalSearchInputRef.current?.focus();
      modalSearchInputRef.current?.select?.();
    }, 20);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isSearchOpen]);

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
    setIsSearchOpen(false);

    if (!term) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleSearchNavigation = (path) => {
    setIsSearchOpen(false);
    navigate(path);
  };

  const closeSearchOverlay = () => {
    setIsSearchOpen(false);
  };

  const trimmedSearch = desktopSearch.trim();
  const eventSuggestions = searchSuggestions.events || [];
  const showingSearchSuggestions = trimmedSearch.length >= 2;

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

          <div ref={searchContainerRef} className="tw:relative tw:hidden tw:lg:block">
            <form
              onSubmit={handleDesktopSearchSubmit}
              className="tw:flex tw:h-10 tw:w-[260px] tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-gray-200 tw:bg-white/90 tw:px-3 tw:shadow-[0_10px_24px_rgba(15,23,42,0.05)] tw:transition focus-within:tw:border-neon/50 focus-within:tw:shadow-[0_0_0_4px_rgba(0,255,209,0.10),0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <Search className="tw:size-4 tw:text-gray-500" />
              <input
                value={desktopSearch}
                onFocus={(event) => {
                  setIsSearchOpen(true);
                  event.target.blur();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsSearchOpen(false);
                  }
                }}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDesktopSearch(nextValue);
                  if (nextValue.trim()) {
                    setIsSearchOpen(true);
                  } else {
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Search events or profiles"
                className="tw:w-full tw:bg-transparent tw:text-sm tw:text-gray-800 tw:outline-none placeholder:tw:text-gray-400"
                readOnly
              />
            </form>

          </div>

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

      <Transition show={isSearchOpen} as={Fragment}>
        <div className="tw:fixed tw:inset-0 tw:z-[120] tw:flex tw:items-center tw:justify-center tw:px-4">
          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:duration-300 tw:ease-out"
            enterFrom="tw:opacity-0"
            enterTo="tw:opacity-100"
            leave="tw:transition tw:duration-200 tw:ease-in"
            leaveFrom="tw:opacity-100"
            leaveTo="tw:opacity-0"
          >
            <div
              className="tw:absolute tw:inset-0 tw:bg-[rgba(5,5,5,0.24)] tw:backdrop-blur-[10px]"
              aria-hidden="true"
              onClick={closeSearchOverlay}
            />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:duration-300 tw:ease-out"
            enterFrom="tw:opacity-0 tw:translate-y-6 tw:scale-[0.97]"
            enterTo="tw:opacity-100 tw:translate-y-0 tw:scale-100"
            leave="tw:transition tw:duration-200 tw:ease-in"
            leaveFrom="tw:opacity-100 tw:translate-y-0 tw:scale-100"
            leaveTo="tw:opacity-0 tw:translate-y-4 tw:scale-[0.98]"
          >
            <div
              ref={searchOverlayPanelRef}
              className="tw:relative tw:z-[121] tw:flex tw:max-h-[min(82vh,820px)] tw:w-full tw:max-w-[760px] tw:flex-col tw:overflow-hidden tw:rounded-[32px] tw:border tw:border-white/80 tw:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,245,243,0.96))] tw:shadow-[0_36px_100px_rgba(5,5,5,0.24),0_0_32px_rgba(0,255,209,0.10)]"
            >
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:border-b tw:border-slate-200/70 tw:px-5 tw:pb-4 tw:pt-5 tw:md:px-6">
                <div className="tw:min-w-0">
                  <div className="tw:text-2xl tw:font-black tw:tracking-[-0.03em] tw:text-primary tw:md:text-[2rem]">
                    Explore Events
                  </div>
                  <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                    {showingSearchSuggestions
                      ? "Search results update as you type."
                      : "Discover trending and newly active events around you."}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeSearchOverlay}
                  className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-slate-500 tw:shadow-[0_10px_24px_rgba(15,23,42,0.08)] tw:transition tw:hover:text-primary"
                  aria-label="Close search"
                >
                  <X className="tw:h-5 tw:w-5" />
                </button>
              </div>

              <div className="tw:px-5 tw:pb-5 tw:pt-4 tw:md:px-6">
                <form
                  onSubmit={handleDesktopSearchSubmit}
                  className="tw:flex tw:h-14 tw:w-full tw:items-center tw:gap-3 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:shadow-[0_12px_28px_rgba(15,23,42,0.06)] tw:transition focus-within:tw:border-neon/50 focus-within:tw:shadow-[0_0_0_4px_rgba(0,255,209,0.10),0_14px_30px_rgba(15,23,42,0.08)]"
                >
                  <Search className="tw:h-5 tw:w-5 tw:text-slate-400" />
                  <input
                    ref={modalSearchInputRef}
                    value={desktopSearch}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        closeSearchOverlay();
                      }
                    }}
                    onChange={(event) => {
                      setDesktopSearch(event.target.value);
                    }}
                    placeholder="Search events, organizers or genres"
                    className="tw:w-full tw:bg-transparent tw:text-sm tw:text-slate-900 tw:outline-none tw:placeholder:text-slate-400 tw:md:text-base"
                  />
                  {desktopSearch ? (
                    <button
                      type="button"
                      onClick={() => setDesktopSearch("")}
                      className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:text-slate-400 tw:transition tw:hover:bg-slate-100 tw:hover:text-primary"
                      aria-label="Clear search"
                    >
                      <X className="tw:h-4 tw:w-4" />
                    </button>
                  ) : null}
                </form>
              </div>

              <div className="tw:flex-1 tw:overflow-y-auto tw:px-5 tw:pb-6 tw:md:px-6">
                <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <div>
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
                      {showingSearchSuggestions ? "Suggested events" : "Trending events"}
                    </div>
                    <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-primary">
                      {showingSearchSuggestions
                        ? searchLoading
                          ? `Looking for “${trimmedSearch}”`
                          : eventSuggestions.length > 0
                            ? `${eventSuggestions.length} event suggestion${eventSuggestions.length === 1 ? "" : "s"}`
                            : `No quick event matches for “${trimmedSearch}”`
                        : "A quick look at events users are actively exploring."}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleSearchNavigation(
                        trimmedSearch
                          ? `/search?q=${encodeURIComponent(trimmedSearch)}`
                          : "/search"
                      )
                    }
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary tw:px-3.5 tw:py-2 tw:text-xs tw:font-semibold tw:text-white tw:shadow-[0_12px_28px_rgba(5,5,5,0.16)] tw:transition tw:hover:bg-primarySecond"
                  >
                    View all
                    <ArrowUpRight className="tw:h-3.5 tw:w-3.5" />
                  </button>
                </div>

                {showingSearchSuggestions && searchLoading ? (
                  <div className="tw:space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`search-${index}`}
                        className="tw:h-32 tw:animate-pulse tw:rounded-[24px] tw:bg-[linear-gradient(180deg,#ffffff_0%,#f3f4f6_100%)]"
                      />
                    ))}
                  </div>
                ) : null}

                {!showingSearchSuggestions &&
                trendingLoading &&
                trendingEvents.length === 0 ? (
                  <div className="tw:space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`trending-${index}`}
                        className="tw:h-32 tw:animate-pulse tw:rounded-[24px] tw:bg-[linear-gradient(180deg,#ffffff_0%,#f3f4f6_100%)]"
                      />
                    ))}
                  </div>
                ) : null}

                {showingSearchSuggestions && !searchLoading && searchError ? (
                  <div className="tw:rounded-[22px] tw:border tw:border-red-100 tw:bg-red-50 tw:px-4 tw:py-4 tw:text-sm tw:text-red-700">
                    {searchError}
                  </div>
                ) : null}

                {showingSearchSuggestions &&
                !searchLoading &&
                !searchError &&
                eventSuggestions.length > 0 ? (
                  <div className="tw:flex tw:flex-col tw:gap-3">
                    {eventSuggestions.slice(0, 6).map((event) => (
                      <NavbarEventSuggestionRow
                        key={event.id}
                        event={event}
                        onClick={() =>
                          handleSearchNavigation(`/event/view/${event.id}`)
                        }
                      />
                    ))}
                  </div>
                ) : null}

                {!showingSearchSuggestions &&
                !trendingLoading &&
                trendingEvents.length > 0 ? (
                  <div className="tw:flex tw:flex-col tw:gap-3">
                    {trendingEvents.slice(0, 6).map((event) => (
                      <NavbarEventSuggestionRow
                        key={event.id}
                        event={event}
                        onClick={() =>
                          handleSearchNavigation(`/event/view/${event.id}`)
                        }
                      />
                    ))}
                  </div>
                ) : null}

                {showingSearchSuggestions &&
                !searchLoading &&
                !searchError &&
                eventSuggestions.length === 0 ? (
                  <div className="tw:rounded-[22px] tw:border tw:border-dashed tw:border-slate-200 tw:bg-white/75 tw:px-4 tw:py-5 tw:text-sm tw:text-slate-500">
                    No fast event matches yet. Open the full search page to see broader results.
                  </div>
                ) : null}

                {!showingSearchSuggestions &&
                !trendingLoading &&
                trendingEvents.length === 0 ? (
                  <div className="tw:rounded-[22px] tw:border tw:border-dashed tw:border-slate-200 tw:bg-white/75 tw:px-4 tw:py-5 tw:text-sm tw:text-slate-500">
                    Trending events are not available right now.
                  </div>
                ) : null}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Transition>

      <MobileNav />
    </>
  );
}
