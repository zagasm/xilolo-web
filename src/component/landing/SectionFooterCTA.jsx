import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Phone,
  Mail,
  Youtube,
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";

/** Helper */
const col = (title, items) => ({ title, items });

export default function Footer() {
  const links = [
    {
      label: "Privacy Policy",
      url: "/privacy-policy",
    },
    {
      label: "Terms of Service",
      url: "/terms-of-service",
    },
    {
      label: "Community Guidelines",
      url: "/community-guidelines",
    },
  ];

  return (
    <footer className="tw:relative tw:bg-primary tw:border-t tw:border-gray-100 ">
      {/* Top content */}
      <div className="tw:mx-auto tw:max-w-7xl tw:px-5 tw:pt-12 tw:pb-24">
        {/* Brand + grid */}
        <div className="tw:flex tw:flex-col">
          <div className="tw:flex tw:flex-col tw:lg:flex-row tw:items-start tw:md:items-center tw:justify-between tw:gap-6">
            <Link to="/" className="tw:inline-flex tw:items-center tw:gap-3">
              <img
                src="/logo2.png"
                alt="Xilolo"
                className="tw:w-28 tw:rounded-sm"
              />
            </Link>

            {/* Contact + socials */}
            <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:gap-6">
              <div className="tw:space-y-1 tw:text-sm">
                <div className="tw:flex tw:items-center tw:gap-2 text-white">
                  <Phone size={16} className="tw:text-white" />
                  <span>+234 802 379 7265</span>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2 text-white">
                  <Mail size={16} className="tw:text-white" />
                  <span>support@xilolo.com</span>
                </div>
                <span className="tw:not-italic tw:text-white tw:mt-2">
                  16192 Coastal Highway Lewes, <br />
                  Delaware 19958 Sussex County United States
                </span>
              </div>

              <div className="tw:flex tw:items-center tw:gap-3">
                {[
                  {
                    Icon: Facebook,
                    href: "https://web.facebook.com/xilolohq",
                  },
                  {
                    Icon: Twitter,
                    href: "https://x.com/xilolo_hq?s=20",
                  },
                  {
                    Icon: Instagram,
                    href: "https://www.instagram.com/xilolo_hq",
                  },
                  {
                    Icon: Youtube,
                    href: "https://www.youtube.com/@xilolo_hq",
                  },
                  {
                    Icon: FaTiktok,
                    href: "https://www.tiktok.com/@xilolo_hq",
                  },
                ].map(({ Icon, href }, i) => (
                  <motion.a
                    key={i}
                    href={href}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:ring-1 tw:ring-gray-200 tw:hover:ring-white/30 tw:transition"
                    aria-label="social link"
                  >
                    <Icon size={18} className="text-white" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Links grid */}
          <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:lg:grid-cols-5 tw:gap-8">
            {/* Disclaimer column (like the screenshot) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="tw:col-span-1"
            >
              <ul className="tw:mt-3 tw:space-y-2 tw:-ml-8">
                {links.map((it) => (
                  <li key={it.url}>
                    <a
                      href={it.url}
                      className="tw:text-sm text-white tw:hover:text-white tw:transition"
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Back to top + divider */}
          <div className="tw:flex tw:items-center tw:justify-between tw:pt-4">
            <div className="tw:h-px tw:flex-1 tw:bg-gray-200" />
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="tw:ml-4 tw:text-xs tw:font-medium text-white tw:hover:text-white tw:transition"
            >
              Back to the top ↑
            </button>
          </div>
        </div>
      </div>

      <BottomCTA />
    </footer>
  );
}

/** Bottom full-bleed CTA bar */
function BottomCTA() {
  return (
    <div className="tw:relative tw:pb-0">
      {/* Full-bleed wrapper */}
      <div className="tw:absolute tw:left-1/2 tw:right-1/2 tw:bottom-0 tw:-translate-x-1/2 tw:w-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          className="tw:relative"
        >
          {/* Rounded top bar with gradient */}
          <Link
            to="/auth/signup"
            className="tw:block tw:w-full tw:rounded-t-[28px] tw:bg-linear-to-r tw:from-primary tw:to-primary tw:px-6 tw:py-6 tw:sm:py-7 tw:md:py-8 tw:text-center"
          >
            <div className="tw:relative tw:mx-auto tw:max-w-7xl tw:px-5">
              <motion.span
                className="tw:inline-flex tw:items-center tw:gap-3 tw:text-white tw:font-extrabold tw:text-lg tw:sm:text-xl tw:md:text-2xl"
                animate={{ gap: [3, 8, 3] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Get Started Now
                <motion.span
                  animate={{ x: [0, 6, 0] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowRight size={22} />
                </motion.span>
              </motion.span>

              {/* Animated sheen */}
              <motion.span
                aria-hidden
                className="tw:pointer-events-none tw:absolute tw:inset-0 tw:rounded-t-[28px]"
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 45%, transparent 60%)",
                  mixBlendMode: "screen",
                }}
              />
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
