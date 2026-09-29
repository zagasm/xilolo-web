// src/component/landing/Nav.jsx
//
// Xilolo navigation — rebuilt to DESIGN.md.
//
// Template tells that were removed:
//   - the logo rotated/sprang on hover            → the mark sits still
//   - gradient buttons (from-primary to-primarySecond) → flat accent fill, pill
//   - depth from shadow-[0_14px_40px_rgba(0,0,0,0.3)]  → surface + hairline
//   - hardcoded text-slate-700 / #efe7dd / #e5e4e2   → design tokens
//   - no account menu at all (just a link to /feed)   → real account dropdown
//   - "mobile menu" was a floating card              → full-height drawer + bottom bar
//
// Structure: sticky surface that earns a hairline on scroll · Home · Explore
// mega-menu · About · Contact · search · account · one primary CTA. On phones:
// top bar + drawer, plus an app-style bottom bar (Home / Search / Live / Profile).
//
// Every destination below EXISTS in App.jsx — no invented links.
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  Compass,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Settings,
  Sparkles,
  Ticket,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../pages/auth/AuthContext";
import { Button } from "../ui";

const SIMPLE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

/* Mega-menu groups — ONLY real capabilities, and described in the product's own
   words. Corrections from the founder (2026-09-29):
     • "Advertise" removed — advertising is not offered yet.
     • "Creator channel" removed — an account already IS the channel.
     • "Signal Deck" removed — that feature does not exist.
     • "Become an organizer" is "Host your first event" — that is how we say it.
   Do not add a menu entry for a feature that does not ship. */
const EXPLORE_GROUPS = [
  {
    heading: "Watch",
    items: [
      { to: "/feed", label: "Live & upcoming", desc: "Happening now", icon: Radio },
      { to: "/search", label: "Discover", desc: "Discover events", icon: Compass },
      { to: "/tickets", label: "My tickets", desc: "Your bookings", icon: Ticket },
    ],
  },
  {
    heading: "Host",
    items: [
      { to: "/become-an-organiser", label: "Host your first event", desc: "Sell tickets, go live", icon: Users },
      { to: "/me/organisers", label: "My events", desc: "Manage your events", icon: LayoutDashboard },
      { to: "/xilolo-ai", label: "Xilolo AI", desc: "Plan and promote", icon: Sparkles },
    ],
  },
];

export default function Nav({ defaultExploreOpen = false, defaultDrawerOpen = false }) {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const reduce = useReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(defaultExploreOpen);
  const [menuOpen, setMenuOpen] = useState(defaultDrawerOpen);
  const [accountOpen, setAccountOpen] = useState(false);

  const accountRef = useRef(null);
  const exploreRef = useRef(null);
  const closeTimer = useRef(null);
  const drawerRef = useRef(null);

  const displayName =
    user?.display_name || user?.full_name || user?.name || user?.username || "Creator";
  const avatarUrl = user?.avatar || user?.avatar_url || user?.profile_photo_url || user?.image;
  const initials =
    typeof displayName === "string" && displayName.trim()
      ? displayName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join("")
      : "U";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menus when the route actually CHANGES. The first render must not count:
     the dev showcase (/design?menu=…) mounts with a menu deliberately open, and a
     naive effect closed it on mount before it could ever be seen. */
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    setMenuOpen(false);
    setExploreOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  /* Click-outside + Escape close the mega-menu and account menu. */
  useEffect(() => {
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setAccountOpen(false);
      setExploreOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  /* Hover intent: a small close delay stops the menu flickering on diagonal moves. */
  const openExplore = () => {
    window.clearTimeout(closeTimer.current);
    setExploreOpen(true);
  };
  const scheduleCloseExplore = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setExploreOpen(false), 140);
  };


  const accountItems = [
    { to: "/feed", label: "Your feed", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/account", label: "Settings", icon: Settings },
  ];

  const linkClass = ({ isActive }) =>
    [
      "tw:relative tw:text-sm tw:font-medium tw:transition-colors",
      "tw:after:absolute tw:after:-bottom-1.5 tw:after:left-0 tw:after:h-0.5 tw:after:rounded-pill tw:after:bg-accent tw:after:transition-all",
      isActive
        ? "tw:text-accent-deep tw:after:w-full"
        : "tw:text-ink tw:after:w-0 tw:hover:text-accent-deep tw:hover:after:w-full",
    ].join(" ");

  const mobileTab = ({ isActive }) =>
    `tw:flex tw:flex-col tw:items-center tw:gap-0.5 tw:py-2 tw:text-[10px] tw:font-medium tw:transition-colors ${
      isActive ? "tw:text-accent-deep" : "tw:text-muted"
    }`;

  return (
    <>
      <header className="tw:fixed tw:inset-x-0 tw:top-0 tw:z-40">
        <div
          className={`tw:transition-colors tw:duration-200 ${
            scrolled
              ? "tw:border-b tw:border-hairline tw:bg-paper-raised/85 tw:backdrop-blur-xl"
              : "tw:border-b tw:border-transparent tw:bg-transparent"
          }`}
        >
          <div className="tw:mx-auto tw:flex tw:h-16 tw:w-full tw:max-w-[1200px] tw:items-center tw:justify-between tw:gap-4 tw:px-4 tw:md:h-[72px] tw:md:px-8">
            <Link to="/" className="tw:flex tw:shrink-0 tw:items-center" aria-label="Xilolo home">
              <img src="/logo.png" alt="Xilolo" className="tw:h-7 tw:w-auto tw:md:h-8" />
            </Link>

            {/* Desktop links + Explore */}
            <nav className="tw:hidden tw:items-center tw:gap-7 tw:md:flex" aria-label="Main">
              <NavLink to="/" end className={linkClass}>
                Home
              </NavLink>

              <div
                className="tw:relative"
                ref={exploreRef}
                onMouseEnter={openExplore}
                onMouseLeave={scheduleCloseExplore}
              >
                <button
                  type="button"
                  onClick={() => setExploreOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={exploreOpen}
                  className={`tw:relative tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium tw:transition-colors ${
                    exploreOpen ? "tw:text-accent-deep" : "tw:text-ink tw:hover:text-accent-deep"
                  }`}
                >
                  Explore
                  <ChevronDown
                    className={`tw:size-4 tw:transition-transform ${exploreOpen ? "tw:rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {exploreOpen && (
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="tw:fixed tw:left-1/2 tw:top-[72px] tw:z-40 tw:w-[720px] tw:max-w-[calc(100vw-2rem)] tw:-translate-x-1/2 tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:shadow-[0_8px_24px_rgba(17,19,22,0.12)]"
                    >
                      <div className="tw:grid tw:gap-2 tw:md:grid-cols-[1.15fr_1.15fr_248px]">
                        {EXPLORE_GROUPS.map((group) => (
                          <div key={group.heading} className="tw:flex tw:flex-col tw:gap-0.5">
                            <p className="tw:px-3 tw:pb-1 tw:pt-2 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
                              {group.heading}
                            </p>
                            {group.items.map(({ to, label, desc, icon: Icon }) => (
                              <Link
                                key={to}
                                to={to}
                                className="tw:group tw:flex tw:items-start tw:gap-3 tw:rounded-control tw:px-3 tw:py-2.5 tw:transition-colors tw:hover:bg-chip"
                              >
                                <span className="tw:mt-0.5 tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-accent-soft tw:text-accent-deep">
                                  <Icon className="tw:size-4" aria-hidden="true" />
                                </span>
                                <span className="tw:flex tw:min-w-0 tw:flex-col">
                                  <span className="tw:text-sm tw:font-semibold tw:text-ink">{label}</span>
                                  <span className="tw:text-xs tw:text-muted">{desc}</span>
                                </span>
                              </Link>
                            ))}
                          </div>
                        ))}

                        <Link
                          to="/become-an-organiser"
                          className="tw:group tw:relative tw:flex tw:flex-col tw:justify-end tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:min-h-[208px] tw:p-4"
                        >
                          <img
                            src="/images/photos/livemusic.jpg"
                            alt=""
                            className="tw:absolute tw:inset-0 tw:size-full tw:object-cover tw:transition-transform tw:duration-500 tw:group-hover:scale-105"
                          />
                          <div className="tw:absolute tw:inset-0 tw:bg-gradient-to-t tw:from-ink/88 tw:via-ink/40 tw:to-transparent" />
                          <div className="tw:relative">
                            <p className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-paper-raised/70">
                              Start here
                            </p>
                            <p className="tw:mt-1 tw:font-display tw:text-base tw:font-bold tw:text-paper-raised">
                              Host your first event
                            </p>
                            <p className="tw:mt-1 tw:text-xs tw:text-paper-raised/80">
                              Tickets, streaming and payouts in one place.
                            </p>
                          </div>
                        </Link>
                      </div>
                      <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:rounded-control tw:border tw:border-hairline tw:bg-paper tw:px-3.5 tw:py-3">
                        <span className="tw:text-xs tw:text-muted">
                          Selling tickets? Your first event takes minutes.
                        </span>
                        <Link
                          to="/become-an-organiser"
                          className="tw:text-xs tw:font-semibold tw:text-accent-deep tw:hover:underline"
                        >
                          Start now →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink to="/about" className={linkClass}>
                About
              </NavLink>
              <NavLink to="/contact" className={linkClass}>
                Contact
              </NavLink>
            </nav>


            {/* Right cluster */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:hidden tw:items-center tw:gap-2 tw:md:flex">
                {token ? (
                  <div className="tw:relative" ref={accountRef}>
                    <button
                      type="button"
                      onClick={() => setAccountOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={accountOpen}
                      className="tw:flex tw:items-center tw:gap-2 tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:py-1 tw:pl-1 tw:pr-2.5 tw:transition-colors tw:hover:border-accent/40 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent tw:focus-visible:ring-offset-2"
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="tw:size-8 tw:rounded-pill tw:object-cover" />
                      ) : (
                        <span className="tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-pill tw:bg-accent-soft tw:text-[11px] tw:font-semibold tw:text-accent-deep">
                          {initials}
                        </span>
                      )}
                      <span className="tw:max-w-[110px] tw:truncate tw:text-[13px] tw:font-medium">
                        {displayName}
                      </span>
                      <ChevronDown
                        className={`tw:size-4 tw:text-muted tw:transition-transform ${accountOpen ? "tw:rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {accountOpen && (
                        <motion.div
                          role="menu"
                          initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="tw:absolute tw:right-0 tw:mt-2 tw:w-60 tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:py-1.5 tw:shadow-[0_8px_24px_rgba(17,19,22,0.12)]"
                        >
                          <div className="tw:border-b tw:border-hairline tw:px-3.5 tw:pb-2.5 tw:pt-2">
                            <p className="tw:truncate tw:text-sm tw:font-semibold">{displayName}</p>
                            {user?.email ? (
                              <p className="tw:truncate tw:text-xs tw:text-muted">{user.email}</p>
                            ) : null}
                          </div>
                          {accountItems.map(({ to, label, icon: Icon }) => (
                            <Link
                              key={to}
                              to={to}
                              role="menuitem"
                              className="tw:flex tw:items-center tw:gap-2.5 tw:px-3.5 tw:py-2 tw:text-sm tw:text-ink tw:transition-colors tw:hover:bg-chip"
                            >
                              <Icon className="tw:size-4 tw:text-muted" aria-hidden="true" />
                              {label}
                            </Link>
                          ))}
                          <div className="tw:mt-1 tw:border-t tw:border-hairline tw:pt-1">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setAccountOpen(false);
                                logout?.();
                              }}
                              className="tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:px-3.5 tw:py-2 tw:text-sm tw:text-danger tw:transition-colors tw:hover:bg-danger/8"
                            >
                              <LogOut className="tw:size-4" aria-hidden="true" />
                              Log out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Button as={Link} to="/auth/signin" variant="ghost" size="md">
                      Log in
                    </Button>
                    <Button as={Link} to="/auth/signup" variant="primary" size="md">
                      Get started
                    </Button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
                className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:text-ink tw:transition-colors tw:hover:border-accent/40 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent tw:md:hidden"
              >
                <Menu className="tw:size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {menuOpen && (
            <div className="tw:fixed tw:inset-0 tw:z-50 tw:md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="tw:absolute tw:inset-0 tw:bg-ink/48"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                ref={drawerRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                initial={reduce ? false : { x: "100%" }}
                animate={{ x: 0 }}
                exit={reduce ? undefined : { x: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="tw:absolute tw:right-0 tw:top-0 tw:flex tw:h-full tw:w-[88%] tw:max-w-sm tw:flex-col tw:bg-paper-raised tw:outline-none"
              >
                <div className="tw:flex tw:h-16 tw:items-center tw:justify-between tw:border-b tw:border-hairline tw:px-4">
                  <img src="/logo.png" alt="Xilolo" className="tw:h-6 tw:w-auto" />
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-hairline tw:text-ink"
                  >
                    <X className="tw:size-4" />
                  </button>
                </div>


                <nav className="tw:flex tw:flex-1 tw:flex-col tw:gap-0.5 tw:overflow-y-auto tw:p-4" aria-label="Mobile">
                  {SIMPLE_LINKS.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `tw:flex tw:items-center tw:justify-between tw:rounded-control tw:px-3.5 tw:py-3 tw:text-base tw:font-medium tw:transition-colors ${
                          isActive ? "tw:bg-accent-soft tw:text-accent-deep" : "tw:text-ink tw:hover:bg-chip"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  {EXPLORE_GROUPS.map((group) => (
                    <div key={group.heading} className="tw:mt-2">
                      <p className="tw:px-3.5 tw:pb-1 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
                        {group.heading}
                      </p>
                      {group.items.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="tw:flex tw:items-center tw:gap-3 tw:rounded-control tw:px-3.5 tw:py-2.5 tw:text-sm tw:font-medium tw:text-ink tw:transition-colors tw:hover:bg-chip"
                        >
                          <Icon className="tw:size-4 tw:text-muted" aria-hidden="true" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  ))}

                  {token
                    ? accountItems.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="tw:flex tw:items-center tw:gap-3 tw:rounded-control tw:px-3.5 tw:py-2.5 tw:text-sm tw:font-medium tw:text-ink tw:transition-colors tw:hover:bg-chip"
                        >
                          <Icon className="tw:size-4 tw:text-muted" aria-hidden="true" />
                          {label}
                        </Link>
                      ))
                    : null}
                </nav>

                <div className="tw:flex tw:flex-col tw:gap-2 tw:border-t tw:border-hairline tw:p-4">
                  {token ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMenuOpen(false);
                        logout?.();
                      }}
                    >
                      <LogOut className="tw:size-4" />
                      Log out
                    </Button>
                  ) : (
                    <>
                      <Button as={Link} to="/auth/signup">
                        Get started
                      </Button>
                      <Button as={Link} to="/auth/signin" variant="secondary">
                        Log in
                      </Button>
                    </>
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile bottom bar — app-like, and the reason the drawer can stay calm ──
          Hidden while the drawer is open: at z-30 it would otherwise sit under the
          z-50 scrim but still read through it, colliding with the drawer's CTA area. */}
      <nav
        aria-label="Quick navigation"
        className={`tw:fixed tw:bottom-0 tw:inset-x-0 tw:z-30 tw:border-t tw:border-hairline tw:bg-paper-raised/95 tw:backdrop-blur-xl tw:md:hidden ${
          menuOpen ? "tw:hidden" : "tw:flex"
        }`}
      >
        <NavLink to="/" end className={mobileTab}>
          <Home className="tw:size-5" aria-hidden="true" />
          Home
        </NavLink>
        <NavLink to="/tickets" className={mobileTab}>
          <Ticket className="tw:size-5" aria-hidden="true" />
          Tickets
        </NavLink>
        <NavLink to="/feed" className={mobileTab}>
          <Radio className="tw:size-5" aria-hidden="true" />
          Live
        </NavLink>
        <NavLink to={token ? "/profile" : "/auth/signin"} className={mobileTab}>
          <User className="tw:size-5" aria-hidden="true" />
          {token ? "Profile" : "Log in"}
        </NavLink>
      </nav>
    </>
  );
}
