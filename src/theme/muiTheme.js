import { createTheme } from "@mui/material/styles";

/**
 * Xilolo Material UI theme.
 *
 * Why this file exists: MUI is already a dependency (used by the auth forms),
 * but with no theme it renders the stock Material look — 4px radii, Roboto,
 * uppercase buttons, elevation shadows — which reads as a different product
 * next to the app. This theme maps MUI onto the same tokens as DESIGN.md and
 * the Flutter app, so an MUI page and a Tailwind page are visibly one brand.
 *
 * Token source of truth: xilolo-app/lib/core/theme/app_design_system.dart
 * (mirrored in this repo's DESIGN.md and src/styles/tailwind.css).
 *
 * Rules encoded here:
 *  - one type family for UI (Work Sans), one display face for headlines
 *    (Plus Jakarta Sans) — no Roboto;
 *  - flat surfaces: every elevation shadow replaced with 'none', separation is
 *    a 10%-alpha hairline, never a drop shadow;
 *  - the accent is a FILL (#16909C) and its label is white, matching the app;
 *    for accent-coloured TEXT on light surfaces use accentDeep (#06707D);
 *  - pill buttons, 12px cards, no uppercase button labels.
 *
 * NOTE for anyone styling an MUI page: Tailwind utilities are prefixed `tw:`
 * and live in a cascade layer, so they LOSE to MUI's emotion styles on the
 * same property. Style MUI components through the theme (sx / variants), and
 * use `tw:` only for layout wrappers you own.
 */

const INK = "#111316";
const INK_RAISED = "#1A1D21";
const PAPER = "#F3F2F0";
const PAPER_RAISED = "#FFFFFF";
const ACCENT = "#16909C";
const ACCENT_DEEP = "#06707D";
const MUTED = "#76767C";
const MUTED_STRONG = "#5C5C62";
const HAIRLINE = "rgba(17, 19, 22, 0.10)";
const SUCCESS = "#16A34A";
const WARNING = "#D97706";
const DANGER = "#DC2626";

const UI_FONT = '"Work Sans", system-ui, -apple-system, sans-serif';
const DISPLAY_FONT = '"Plus Jakarta Sans", "Work Sans", system-ui, sans-serif';

/* Every elevation resolves to a flat surface. `shadows[0]` still has to be
   'none' because MUI reads index 0 for non-elevated papers. */
const FLAT_SHADOWS = Array.from({ length: 25 }, () => "none");

const muiTheme = createTheme({
  cssVariables: false,
  palette: {
    mode: "light",
    primary: { main: ACCENT, dark: ACCENT_DEEP, contrastText: "#FFFFFF" },
    secondary: { main: INK, contrastText: "#FFFFFF" },
    background: { default: PAPER, paper: PAPER_RAISED },
    text: { primary: INK, secondary: MUTED_STRONG, disabled: MUTED },
    divider: HAIRLINE,
    success: { main: SUCCESS },
    warning: { main: WARNING },
    error: { main: DANGER },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: UI_FONT,
    fontSize: 14,
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0, fontSize: 14 },
    h1: { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.08 },
    h2: { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.12 },
    h3: { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.16 },
    h4: { fontFamily: DISPLAY_FONT, fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.2 },
    h5: { fontFamily: DISPLAY_FONT, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 },
    h6: { fontFamily: DISPLAY_FONT, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 },
    subtitle1: { fontWeight: 600, letterSpacing: "-0.005em" },
    subtitle2: { fontWeight: 600 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.65 },
    caption: { fontSize: 12, lineHeight: 1.5 },
    overline: { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", lineHeight: 1.6 },
  },
  shadows: FLAT_SHADOWS,
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 22,
          paddingBlock: 11,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        sizeLarge: { paddingInline: 26, paddingBlock: 14, fontSize: 15 },
        sizeSmall: { paddingInline: 16, paddingBlock: 8, fontSize: 13 },
        containedPrimary: {
          backgroundColor: ACCENT,
          color: "#FFFFFF",
          "&:hover": { backgroundColor: ACCENT_DEEP },
        },
        containedSecondary: {
          backgroundColor: INK,
          color: "#FFFFFF",
          "&:hover": { backgroundColor: INK_RAISED },
        },
        outlined: {
          borderColor: HAIRLINE,
          color: INK,
          "&:hover": { borderColor: "rgba(17,19,22,0.32)", backgroundColor: "rgba(17,19,22,0.03)" },
        },
        text: { color: INK, "&:hover": { backgroundColor: "rgba(17,19,22,0.04)" } },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: HAIRLINE },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 12, border: `1px solid ${HAIRLINE}`, boxShadow: "none" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: PAPER_RAISED,
          fontSize: 14,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: HAIRLINE },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(17,19,22,0.3)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT, borderWidth: 1.5 },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 13, color: MUTED_STRONG } } },
    MuiDivider: { styleOverrides: { root: { borderColor: HAIRLINE } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 500, fontSize: 12.5, height: 28 },
        outlined: { borderColor: HAIRLINE, backgroundColor: "transparent" },
      },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: {
        root: { color: ACCENT_DEEP, fontWeight: 500, cursor: "pointer" },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: INK, fontSize: 12, borderRadius: 8, padding: "6px 10px" },
      },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          borderTop: `1px solid ${HAIRLINE}`,
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { paddingInline: 0, minHeight: 0 },
        content: { marginBlock: 18, fontWeight: 600 },
      },
    },
    MuiAccordionDetails: { styleOverrides: { root: { padding: 0, paddingBottom: 20 } } },
  },
});

export default muiTheme;
export { ACCENT, ACCENT_DEEP, INK, PAPER, PAPER_RAISED, HAIRLINE };
