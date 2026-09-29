---
version: alpha
name: Xilolo
description: A creators marketplace and live-events platform. Calm, confident, premium; the mobile app is the reference implementation and this file is its web translation.
colors:
  primary: "#0EA5B4"
  primaryDeep: "#06707D"
  ink: "#111316"
  inkRaised: "#1A1D21"
  paper: "#F3F2F0"
  paperRaised: "#FFFFFF"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  textPrimaryLight: "#050505"
  textPrimaryDark: "#E5E4E2"
  textSecondaryLight: "#76767C"
  textSecondaryStrongLight: "#5C5C62"
  textSecondaryDark: "#7C7C82"
  textLabelLight: "#9AA0AA"
  textLabelDark: "#666666"
  chipLight: "#EFEFF2"
  chipDark: "#24272B"
  innerLight: "#E9E9EC"
  innerDark: "#2B2F34"
  faintLight: "#C4C4CC"
  faintDark: "#444444"
  hairlineLight: "#E5E4E2"
  hairlineDark: "#2A2A2E"
typography:
  display:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h2:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
  micro:
    fontFamily: Work Sans
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  sheet: 24px
  pill: 999px
spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: 50px
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paperRaised}"
    rounded: "{rounded.pill}"
    height: 50px
  button-outline:
    backgroundColor: "{colors.paperRaised}"
    textColor: "{colors.primaryDeep}"
    rounded: "{rounded.pill}"
    height: 46px
    padding: 14px
  card:
    backgroundColor: "{colors.paperRaised}"
    textColor: "{colors.textPrimaryLight}"
    rounded: "{rounded.md}"
    padding: 16px
  card-dark:
    backgroundColor: "{colors.inkRaised}"
    textColor: "{colors.textPrimaryDark}"
    rounded: "{rounded.md}"
    padding: 16px
  chip:
    backgroundColor: "{colors.chipLight}"
    textColor: "{colors.textSecondaryStrongLight}"
    rounded: "{rounded.pill}"
    padding: 8px
  live-badge:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paperRaised}"
    rounded: "{rounded.pill}"
    padding: 4px
  input:
    backgroundColor: "{colors.paperRaised}"
    textColor: "{colors.textPrimaryLight}"
    rounded: "{rounded.sm}"
    height: 48px
    padding: 14px
---

## Overview

Xilolo is a **creators marketplace**: creators sell tickets, go live, get paid; audiences discover events and watch in the app. The brand is calm and premium rather than loud — quiet surfaces, one accent, generous space, no visual shouting.

The **mobile app is the reference implementation** (`xilolo-app`, `lib/core/theme/app_design_system.dart` + `app_palette.dart`). The web must read as the same product in a different form factor, not a separate brand. Where this file and the app disagree, the app wins and this file is wrong.

Two brightnesses are first-class. `paper` (#F3F2F0) is the default light surface; `ink` (#111316) is the dark surface used for live/on-air moments and the footer. The accent is tuned per brightness the way the app does it: **less saturated and darker on light, slightly lighter on dark**, so it never glares.

## Colors

- **Primary (#0EA5B4):** the single accent. Buttons, active states, links, live affordances, focus rings. Never more than one accent element per visual group.
- **Ink (#111316) / Ink Raised (#1A1D21):** dark surfaces and the app's "on-air" mode. Dark sections are a *deliberate break*, not the default.
- **Paper (#F3F2F0) / Paper Raised (#FFFFFF):** page background and card surfaces. Cards sit on `paperRaised` over a `paper` page — the contrast is intentionally subtle, separated by a hairline, not a shadow.
- **Success / Warning / Danger:** status only. Danger also backs the LIVE badge, which is the one place a saturated colour is allowed to shout.
- **Retired:** neon cyan `#00F5FF`, coral `#fa6342`, purple `#8000ff` / `#7750f8`, blue `#3ca9fc`, and the legacy `#0f0a1a` page background. These are template residue — do not reintroduce them.

Every text/background pair must clear WCAG AA (4.5:1). Three pairings were measured as failures and are now fixed in the tokens above:

- **Primary buttons use `ink` text on the accent, not white.** White on #0EA5B4 is only **2.97:1**; ink on #0EA5B4 is **6.27:1**. This is not a workaround — it is what the app already does: `AppDesignSystem.onAccentFor` resolves to ink on the light-mode brand. Match it.
- **Accent-coloured text on light surfaces uses `primaryDeep` (#06707D), never `primary`.** #0EA5B4 on white is 2.97:1; #06707D is **5.8:1**. `primary` is for fills, `primaryDeep` is for text, links and icons.
- **Chip/meta text uses `textSecondaryStrongLight` (#5C5C62)**, not #76767C, which reaches only 3.93:1 on the chip fill.

`primary` may appear as a fill behind ink text, as a border, or as a large icon — never as body copy on white.

## Typography

One family: **Work Sans**, the app's live font. No second display face, no cursive, no condensed — the app carries hierarchy with weight and size, and so does the web.

- Weight carries hierarchy: 800 display, 700 h1/h2 and section titles, 600 card titles, 400 body. Avoid 300 and anything under 12px.
- Headings tighten slightly (`-0.01em`, display `-0.02em`); body stays at default tracking.
- `micro` (11px, 500, +0.06em, uppercase) is the only all-caps style — eyebrow labels like `LIVE VIEWERS`, `TICKETS SOLD`.
- Body copy maxes at ~68ch. Long marketing paragraphs get `small` at 14px, not 16px.

## Layout

- Mobile-first. Gutters 16px; container max-width 1200px; content columns capped at ~1200px with side padding that grows to 24/32px on desktop.
- Section rhythm: 32px inside a block, 64px between blocks (48px on mobile). Whitespace is the primary tool for "premium" — when in doubt, remove an element rather than shrink spacing.
- Grid: 12 columns on desktop; feature grids are 3-up (or 2-up on tablet), card rails scroll horizontally on mobile.
- Cards: image/poster on top with `rounded.md`, then 16px padding, title (`title`), meta (`caption`), and at most one price/status chip. **One focal element per card.**
- Breakpoints follow the app's implicit scale: 480 / 768 / 1024 / 1280.

## Elevation & Depth

**Flat by default.** Depth comes from surface colour and a 1px hairline, exactly as in the app:

- No drop shadows on cards, buttons, or nav. `elevation: 0` is the app's default and the web matches it.
- Hairline = the ink/text colour at 10% alpha (light) or the light text colour at 10% (dark).
- The only permitted shadows are on true overlays (modal, bottom sheet, dropdown) and they stay tight: `0 8px 24px rgba(17,19,22,.12)`.
- Blur-heavy glow backdrops are **removed**. A single soft radial tint behind the hero is the maximum.

## Shapes

- Cards and inputs: `rounded.md` (12px) — the app's dominant radius (211 uses).
- Buttons, chips, badges, avatars, icon pills: `rounded.pill` (999px).
- Sheets and modals: `rounded.sheet` (24px) top corners.
- Larger 16/20px radii are reserved for media/hero surfaces; 8px for dense inputs and small controls only.
- Never mix radii inside one component group.

## Components

- **button-primary** — pill, accent fill, white text, 50px tap height, weight 600. One per view. Hover darkens toward `ink`, never brightens to a neon.
- **button-outline** — transparent with a 64% accent border and accent text; the secondary action (e.g. "Watch in app").
- **card / card-dark** — 12px radius, 16px padding, hairline border, no shadow. Dark variant for live rows and on-air collections.
- **chip** — pill, `chipLight`, `caption` type. Filters, categories, feature tags.
- **live-badge** — pill, danger fill, white `micro` text. The only shouting element; never more than a few per viewport.
- **input** — 48px height, 8px radius, paperRaised fill, hairline border, accent focus ring.

## Do's and Don'ts

- **Do** use one accent per group, hairlines over shadows, and the app's radius scale.
- **Do** let live/on-air content use the dark surface — that's where energy belongs.
- **Do** keep card anatomy identical to the app: poster, 16px padding, title, meta, one chip.
- **Don't** reintroduce `#00F5FF`, `#fa6342`, purples or the old `#0f0a1a` background.
- **Don't** add a second display font, cursive accents, or more than one all-caps style.
- **Don't** stack floating widgets, glow backdrops, and badges around a mockup — the hero gets **one** mockup and at most **two** floating stat cards.
- **Don't** use accent colour for body text (contrast) or shadows for depth (the app doesn't).
- **Don't** show a modal on first paint; earn the app-install ask after engagement.
