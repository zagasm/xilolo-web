import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Moves radial glow & blobs subtly toward the cursor.
 * Falls back to idle floating if no pointer movement (mobile).
 */
export default function BlurBackdrop() {
  const containerRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 80, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 80, damping: 18, mass: 0.4 });

  // Parallax transforms for different layers
  const glowX = useTransform(sx, (v) => v * 0.08);
  const glowY = useTransform(sy, (v) => v * 0.08);
  const blob1X = useTransform(sx, (v) => v * -0.06);
  const blob1Y = useTransform(sy, (v) => v * 0.05);
  const blob2X = useTransform(sx, (v) => v * 0.05);
  const blob2Y = useTransform(sy, (v) => v * -0.04);
  const blob3X = useTransform(sx, (v) => v * -0.03);
  const blob3Y = useTransform(sy, (v) => v * -0.02);

  useEffect(() => {
    const onMove = (e) => {
      const width = window.innerWidth || 0;
      const height = window.innerHeight || 0;
      const x = e.clientX - width / 2;
      const y = e.clientY - height / 2;
      mx.set(x);
      my.set(y);
    };

    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [mx, my]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="tw:pointer-events-none tw:absolute tw:inset-0 tw:overflow-hidden"
    >
      {/* existing blob layers (animated via CSS keyframes) */}
      <motion.div className="blob blob-1" style={{ x: blob1X, y: blob1Y }} />
      <motion.div className="blob blob-2" style={{ x: blob2X, y: blob2Y }} />
      <motion.div className="blob blob-3" style={{ x: blob3X, y: blob3Y }} />
      {/* Subtle neon accent blob */}
      <motion.div className="blob blob-neon" style={{ x: blob2X, y: blob1Y }} />

      {/* soft vignette / radial glow following cursor */}
      <motion.div
        className="tw:absolute tw:inset-0"
        style={{
          x: glowX,
          y: glowY,
          background:
            "radial-gradient(1200px 600px at 60% -10%, rgba(17,17,17,0.1), transparent 60%)",
        }}
      />
    </div>
  );
}
