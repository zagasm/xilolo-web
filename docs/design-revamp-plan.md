# Xilolo web — design revamp plan

**Goal:** xilolo.com must read as *the same product* as the Xilolo app — a creators marketplace for live events — with the polish of a global streaming platform and none of the noise.

**Source of truth:** the mobile app. `xilolo-app/lib/core/theme/app_design_system.dart`, `app_palette.dart`, `core/constants/styles.dart`, `core/widget/app_buttons.dart`, and the card widgets under `features/presentation/screens/home/widgets/`. Where this plan and the app disagree, **the app wins**.

**Machine-readable spec:** `DESIGN.md` (repo root, Google `design.md` format, 0 lint errors, WCAG-checked) + generated `src/styles/design-tokens.css`.

---

## 1. What is wrong today

Audited against the live site and the repo:

| # | Problem | Evidence |
|---|---|---|
| 1 | **Wrong accent.** The CSS theme's accent is neon cyan `#00F5FF`; the legacy stylesheet paints coral `#fa6342` everywhere. The app's accent is teal **`#0EA5B4`**. | `src/styles/tailwind.css` `--color-neon`; `src/assets/css/color.css` (~2000 coral selectors) |
| 2 | **Wrong neutrals.** Web uses `#050505` page / `#e5e4e2` "white"; app uses paper `#F3F2F0` + ink `#111316` with `#E5E4E2` as *dark-mode text*. | `@theme` block vs `AppDesignTokens` |
| 3 | **Three display fonts.** Montserrat + Dela Gothic One + League Spartan + a cursive import. The app uses **one** family (Work Sans). | `tailwind.css` lines 1–4, 18–21 |
| 4 | **Too busy in the hero.** One mockup orbited by four floating glass chips + blurred glow backdrops + stat cards. | screenshot of `/` (download / sparkles / layout / chat chips) |
| 5 | **Modal on first paint** (app-download dialog) interrupts the first impression and hurts SEO/first contentful paint. | live site load |
| 6 | **Legacy template residue** — purple/blue leftovers, `main.min.css`, `style-old.css`, bootstrap+react-bootstrap+MUI+Tailwind all present. | `src/assets/css/`, `package.json` |
| 7 | **Accessibility:** white-on-accent buttons measure **2.97:1** (AA needs 4.5:1). The app avoids this by resolving `onAccent` → ink. | design.md lint |
| 8 | **Section reveals** animate from `opacity:0`; content below the fold reads blank until scrolled. | `tailwind.css` `signal-rise` |

---

## 2. Token mapping (old → new)

| Role | Web today | New (from the app) |
|---|---|---|
| Accent fill | `#00F5FF` neon cyan | **`#0EA5B4`** (`primary`) |
| Accent text/link | — | **`#06707D`** (`primaryDeep`, AA on white) |
| Page background | `#050505` / `#e5e4e2` | **`#F3F2F0`** (`paper`) |
| Card surface | — | **`#FFFFFF`** (`paperRaised`) |
| Dark surface | `#0f0a1a` (legacy) | **`#111316`** / **`#1A1D21`** (`ink`, `inkRaised`) |
| Body text | — | `#050505` light / `#E5E4E2` dark |
| Secondary text | — | `#76767C` light / `#7C7C82` dark |
| Strong secondary | — | **`#5C5C62`** (AA on chips) |
| Chip fill | — | `#EFEFF2` light / `#24272B` dark |
| Status | — | success `#16A34A`, warning `#D97706`, danger `#DC2626` |
| Font | Montserrat + Dela Gothic + League Spartan | **Work Sans** (400/600/700/800) |
| Radius | mixed | **12** cards/inputs · **999** pills · **24** sheets · 8 small controls |
| Spacing | ad hoc | 2/4/8/12/**16**/24/32/48/64 (16 = gutter) |
| Depth | blur glows + shadows | **flat**: hairline (10% ink) + surface colour; shadows only on overlays |
| Buttons | mixed | **pill, 50px, accent fill + ink text**; outline = `primaryDeep` text + 64% accent border |

---

## 3. Components to build (the new primitives)

Add to `src/component/ui/` (Tailwind `tw:` prefixed classes, no MUI/Bootstrap in new work):

1. **`Button`** — variants `primary` (accent fill, ink text), `secondary` (paperRaised + accent border, primaryDeep text), `ghost`. Sizes `md` (46) / `lg` (50). Loading + disabled states (disabled = accent @34%).
2. **`Card`** — `rounded-md`, `paperRaised`, hairline border, 16px padding, no shadow. `CardDark` = `inkRaised` + `textPrimaryDark`.
3. **`EventCard`** — the web mirror of the app's card: poster (16:9 or 4:5), `rounded-md`, LIVE badge top-left when live, title (`title`), creator row (avatar 24px pill + name), meta row (date · location), one price/status chip. **One focal element.**
4. **`LiveBadge` / `StatusChip`** — pill, danger fill, white `micro` caps text with a pulsing dot (respect `prefers-reduced-motion`).
5. **`Chip`** — pill, `chipLight`, `caption`, optional icon; filter + category usage.
6. **`SectionHeading`** — eyebrow (`micro` caps, `primaryDeep`) + `h1`/`h2` + optional one-line subcopy, `small` secondary. Standardises every section top.
7. **`Avatar`** / **`CreatorRow`** — 24/32/48px pill images, name + verified tick, follow affordance.
8. **`StatTile`** — `micro` caps label + `h1` value + delta line; replaces the ad-hoc stat cards; used on light and dark surfaces.
9. **`Input` / `Field`** — 48px, radius 8, hairline, accent focus ring; `Field` wraps label (`micro` caps) + input + error.
10. **`Modal` / `Sheet`** — radius 24 top corners, scrim `ink @48%`, the only place shadows appear.
11. **`AppInstallBar`** — the replacement for the on-load modal: a dismissible bottom bar that appears after scroll/engagement (see §5).
12. **`Skeleton`** — one shimmer recipe for cards/rails (the app has shimmer skeletons; match the cadence).

---

## 4. Page-by-page checklist

### Landing (`/`) — `src/component/landing/*`
- [ ] `Nav` — Work Sans, `paper` surface + hairline on scroll, primary CTA pill, "Sign in" ghost. Remove any second accent.
- [ ] `Hero` — **delete the orbiting glass chips** (keep at most **two** floating stat cards: live viewers + revenue). Single soft radial tint, no multi-layer glows. Headline in `display` weight 800; one primary CTA + one secondary "Watch in app".
- [ ] Social proof strip — "Trusted by 2,500+ creators" as a quiet `caption` row with real logo marks, not a badge.
- [ ] `LiveHighlightSection` — becomes the **Live-now rail** using real events (`EventCard` + `LiveBadge`), horizontally scrollable on mobile.
- [ ] `LivePipelineSection` / `ThreeStepSection` — three steps in `Card`s, numbered `micro` caps, one accent per step, no icon soup.
- [ ] `AutomationSection` / `XiloloAiSection` — one feature grid, `SectionHeading` + 6 chips max (the current chip list repeats: "Low-latency streaming … Creator analytics" appears twice — dedupe).
- [ ] Creator/earnings proof — `StatTile` row on the dark surface; this is the marketplace's core promise ("get paid"), so it gets the dark break.
- [ ] `SectionFooterCTA` — one filled primary + one outline; no more than two CTAs per screen.
- [ ] Footer — dark `ink` surface, Work Sans, hairline dividers; keep contact + legal + socials.
- [ ] **SEO/perf:** sections must not start at `opacity:0` on load; animate only on scroll with a fallback that shows content if JS/IntersectionObserver never fires.

### `/event/:id` (deep link) — `src/pages/event/EventDeepLinkPage.jsx`
- [ ] Re-token: `paper` background, `Card` poster, `LiveBadge`, `StatTile` for date/location, primary "Open in app" CTA + App Store/Play (real Apple ID still pending).
- [ ] Keep the existing data flow (`useSharedEventPage`, `normalizeSharedEventResponse`) — this is a styling pass, not a rewrite.
- [ ] Add `EventCard`-based "More from this creator" rail.

### Auth (`/auth/*`) — `src/pages/auth/*`
- [ ] Centred card on `paper`, 48px `Input`s, pill primary button, error states in `danger`; drop legacy bootstrap form styling.

### Browse / Search / Profile / Organizers / Streaming
- [ ] Swap legacy cards for `EventCard`/`CreatorRow`; unify empty states (icon + one line + one CTA); unify loading with `Skeleton`.
- [ ] Remove MUI/Bootstrap surfaces from these routes as each is touched.

### Marketing & static (`/about`, `/contact`, `/marketing/*`, legal)
- [ ] Same tokens; legal pages get a readable 68ch column, `small` body, no accent text.

### Global
- [ ] `index.html` — Work Sans only; remove Dela Gothic/League Spartan/Montserrat/cursive imports; set `theme-color: #0EA5B4`.
- [ ] Delete `src/assets/css/style-old.css`; retire spent rules from `main.min.css` as routes migrate.
- [ ] Favicon/OG images re-cut with the teal accent.

---

## 5. The app-install ask (replacing modal-on-load)

1. Never modal on first paint.
2. Show `AppInstallBar` after either 35% scroll, 20s dwell, or the first "Watch" intent.
3. Deep-link pages (`/event/:id`) may show it immediately above the fold — that traffic already wants the app.
4. Store the dismissal for 14 days; never re-ask in the same session.

---

## 6. Accessibility requirements (non-negotiable)

- All text ≥ 4.5:1 (large/bold ≥ 3:1). Accent is a **fill**, never small text.
- Focus visible everywhere (accent ring, 2px, offset 2px).
- Colour is never the only signal (LIVE badge has text, not just red).
- Respect `prefers-reduced-motion` for every reveal/float; content must be visible without animation.
- Tap targets ≥ 44px; contrast of hairline vs surface ≥ 1.5:1 so edges read on cheap panels.
- Run `npx -y -p @google/design.md designmd lint DESIGN.md` before any design PR — it must stay **0 errors, 0 contrast warnings**.

---

## 7. Execution order & verification

1. **Foundation (done in this pass):** `DESIGN.md`, `src/styles/design-tokens.css`, `@theme` wired to app tokens, Work Sans installed. Verify: `npm run build` + lint 0 errors.
2. **Primitives (§3):** build `src/component/ui/*` with a scratch route (`/design`) showing every component on light + dark. Verify visually at 375/768/1280.
3. **Landing (§4):** revamp section by section against the checklist. Verify: build, screenshot at three widths, contrast lint.
4. **Deep-link + auth:** styling passes on existing logic.
5. **Remaining routes:** migrate to primitives; delete legacy CSS as each lands.
6. **Regression guard:** a visual baseline (screenshots at 375/768/1280) committed so later PRs can be diffed.

**Definition of done for the revamp:** no coral/cyan/purple anywhere, one font, one accent, cards identical in anatomy to the app, hero with a single focal mockup, no on-load modal, 0 lint errors, and every page renders content without JS animation.
