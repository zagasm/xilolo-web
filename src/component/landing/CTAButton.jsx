import React from "react";
import { Link } from "react-router-dom";
import { CircleArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CTAButton({ to = "/auth/signup", label = "Get Started" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <Link
        to={to}
        className="tw:group tw:relative tw:inline-flex tw:items-center tw:gap-3 tw:rounded-full tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:px-6 tw:py-3 text-white tw:font-semibold tw:shadow-[0_22px_55px_rgba(0,0,0,0.28),0_0_22px_rgba(0,245,255,0.16)] tw:ring-1 tw:ring-neon/10 tw:transition tw:will-change-transform tw:hover:shadow-[0_24px_60px_rgba(0,0,0,0.32),0_0_30px_rgba(0,245,255,0.22)]"
      >
        {label}
        <span className="tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15 tw:backdrop-blur">
          <CircleArrowRight size={18} />
        </span>
        <span className="shine" />
      </Link>
    </motion.div>
  );
}
