// src/component/landing/Nav.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../pages/auth/AuthContext";

export default function Nav() {
  const { user, token } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName =
    user?.display_name ||
    user?.full_name ||
    user?.name ||
    user?.username ||
    "Creator";

  const avatarUrl =
    user?.avatar || user?.avatar_url || user?.profile_photo_url || user?.image;

  const initials =
    displayName && typeof displayName === "string"
      ? displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
      : "U";

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    // { to: "/ads", label: "Run Ads" },
    { to: "/contact", label: "Contact" },
  ];

  const linkBase =
    "tw:text-xs tw:md:text-sm tw:font-medium tw:transition tw:pb-0.5 text-dark";
  const activeLink =
    "tw:text-primary tw:border-b tw:border-primary tw:pb-[3px]";
  const inactiveLink =
    "tw:text-slate-700 tw:hover:text-primary tw:border-b tw:border-transparent";

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="tw:md:fixed tw:top-0 tw:left-0 tw:right-0 tw:z-40 tw:overflow-x-hidden">
      <div className="tw:mx-auto tw:max-w-7xl tw:px-5 tw:py-3 tw:md:py-4">
        <motion.div
          className="tw:flex tw:items-center tw:justify-between tw:rounded-2xl tw:border tw:border-[#efe7dd] tw:bg-[#e5e4e2] tw:backdrop-blur-xl tw:px-4 tw:md:px-6 tw:py-1.5 tw:md:py-2.5"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          {/* Left: Logo */}
          <Link
            to="/"
            className="tw:inline-flex tw:items-center tw:gap-2 tw:shrink-0"
          >
            <motion.img
              src="/logo.png"
              alt="Xilolo"
              className="tw:w-16 tw:md:w-28 tw:rounded-sm"
              initial={{ rotate: -6, scale: 0.9, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 160,
                damping: 14,
                delay: 0.05,
              }}
              whileHover={{ rotate: 2, scale: 1.02 }}
            />
          </Link>

          {/* Center: nav links (desktop) */}
          <div className="tw:hidden tw:md:flex tw:items-center tw:gap-6">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeLink : inactiveLink}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right: auth / profile + mobile trigger */}
          <div className="tw:flex tw:items-center tw:gap-2">
            {/* Desktop auth / profile */}
            <div className="tw:hidden tw:md:block">
              {token ? (
                <Link
                  to="/feed"
                  className="tw:flex tw:items-center tw:gap-3 tw:rounded-full tw:bg-white/70 tw:px-3.5 tw:py-1.5 tw:text-xs tw:md:text-sm tw:border tw:border-slate-200/70 tw:shadow-[0_10px_30px_rgba(15,23,42,0.12)] tw:hover:bg-white tw:transition text-dark"
                >
                  <div className="tw:flex tw:items-center tw:gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="tw:h-8 tw:w-8 tw:rounded-full tw:object-cover tw:border tw:border-slate-200/70"
                      />
                    ) : (
                      <div className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-[11px] tw:font-semibold tw:text-primary">
                        {initials}
                      </div>
                    )}
                    <span className="tw:max-w-[140px] tw:truncate tw:text-[13px] tw:font-medium">
                      {displayName}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/auth/signin"
                  className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-3xl tw:bg-linear-to-br tw:from-primary tw:to-primarySecond tw:px-5 tw:py-2.5 tw:text-sm tw:font-medium text-white tw:shadow-[0_14px_40px_rgba(0,0,0,0.3)] tw:hover:opacity-95 tw:transition"
                >
                  Sign in
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-slate-200/70 tw:bg-white/80 tw:p-1.5 tw:text-slate-800 tw:shadow-[0_10px_30px_rgba(15,23,42,0.12)] tw:md:hidden"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? (
                <X className="tw:w-5 tw:h-5" />
              ) : (
                <Menu className="tw:w-5 tw:h-5" />
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile glassmorphic menu */}
      {menuOpen && (
        <div
          className="tw:fixed tw:inset-0 tw:z-50 tw:bg-black/20 tw:backdrop-blur-md tw:md:hidden"
          onClick={closeMenu}
        >
          <div
            className="tw:absolute tw:top-4 tw:left-4 tw:right-4 tw:rounded-2xl tw:border tw:border-[#efe7dd] tw:bg-[#e5e4e2] tw:shadow-[0_18px_50px_rgba(15,23,42,0.28)] tw:p-4 tw:space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
              <button
                type="button"
                onClick={closeMenu}
                className="tw:inline-flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-slate-700 tw:border tw:border-slate-200"
              >
                <X className="tw:w-4 tw:h-4" />
              </button>
            </div>

            <nav className="tw:flex tw:flex-col tw:gap-1.5">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `tw:flex tw:items-center tw:justify-between tw:rounded-xl tw:px-3 tw:py-2 ${isActive
                      ? "tw:bg-primary/10 tw:text-primary"
                      : "tw:text-slate-800 tw:hover:bg-slate-100/70"
                    }`
                  }
                >
                  <span className="tw:text-sm tw:font-medium">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="tw:pt-2 tw:border-t tw:border-slate-100 tw:mt-2">
              {token ? (
                <Link
                  to="/feed"
                  onClick={closeMenu}
                  className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-white tw:px-3 tw:py-2 tw:text-xs tw:text-slate-800 tw:border tw:border-slate-200 tw:shadow-[0_10px_30px_rgba(15,23,42,0.14)]"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="tw:h-8 tw:w-8 tw:rounded-full tw:object-cover tw:border tw:border-slate-200/70"
                    />
                  ) : (
                    <div className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-[11px] tw:font-semibold tw:text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="tw:flex tw:flex-col tw:text-left">
                    <span className="tw:text-[13px] tw:font-medium">
                      {displayName}
                    </span>
                    <span className="tw:text-[11px] tw:text-slate-500">
                      Go to feed
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/auth/signin"
                  onClick={closeMenu}
                  className="tw:inline-flex tw:w-full tw:items-center tw:justify-center tw:rounded-xl tw:bg-linear-to-br tw:from-primary tw:to-primarySecond tw:px-4 tw:py-2.5 tw:text-sm tw:font-medium text-white tw:shadow-[0_14px_40px_rgba(0,0,0,0.3)]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
