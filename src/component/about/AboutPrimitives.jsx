import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Small editorial primitives shared by the /about sections.
 *
 * Why these exist: the page has one type scale (11 overline / 13 caption /
 * 15 body / 18 lead) repeated across five sections, and the legacy template
 * stylesheet (`#root p { color: inherit }`) outranks emotion classes on a
 * paragraph's `color`. So every copy block is wrapped in a Box that carries the
 * colour, and the <p> inside simply inherits it. That keeps the semantics
 * (<p> for prose, <h2>/<h3> for headings) without fighting the cascade.
 */

export const SECTION_SX = {
  borderTop: "1px solid",
  borderColor: "divider",
  py: { xs: 5.5, md: 10 },
};

/** 11px uppercase, 0.12em, accent-deep — the only eyebrow on the page. */
export function Eyebrow({ children, sx }) {
  return (
    <Typography
      component="span"
      sx={[
        {
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          lineHeight: 1.5,
          textTransform: "uppercase",
          color: "primary.dark",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}

/** Section headline — display face, tight tracking, never a gradient. */
export function SectionTitle({ children, id, sx }) {
  return (
    <Typography
      variant="h2"
      component="h2"
      id={id}
      sx={[
        {
          fontSize: "clamp(28px, 3.2vw, 40px)",
          fontWeight: 700,
          letterSpacing: "-0.028em",
          lineHeight: 1.12,
          color: "text.primary",
          textWrap: "balance",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}

/** 18px standfirst — carries the colour for the <p> it wraps. */
export function Lead({ children, sx }) {
  return (
    <Box sx={{ color: "text.secondary", maxWidth: "62ch" }}>
      <Typography
        component="p"
        sx={[
          { fontSize: 18, lineHeight: 1.6, letterSpacing: "-0.005em" },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Typography>
    </Box>
  );
}

/** 15px running text. */
export function Body({ children, sx }) {
  return (
    <Box sx={{ color: "text.secondary", maxWidth: "62ch" }}>
      <Typography
        component="p"
        sx={[
          { fontSize: 15, lineHeight: 1.7 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Typography>
    </Box>
  );
}

/** 13px caption. */
export function Caption({ children, sx }) {
  return (
    <Box sx={{ color: "text.secondary" }}>
      <Typography
        component="p"
        sx={[
          { fontSize: 13, lineHeight: 1.6 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Typography>
    </Box>
  );
}
