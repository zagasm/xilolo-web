# Session handover — 2026-09-29 (xilolo-web + media/infra)

Written because the working context that produced it was exhausted. Nothing here
depends on that conversation. Read this, then continue.

---

## 1. Repo state

| Item | Value |
|---|---|
| Repo | `C:\Users\ceo\Desktop\xilolo-web` |
| Branch | `feat/design-revamp` (pushed; `git ls-remote` verified == local HEAD) |
| Gate | `hermes verify --json` GREEN at `hv25` (install 0 / build 0 / readiness 200) |
| App (source of truth) | `C:\Users\ceo\Desktop\xilolo-app` |
| Backend (READ-ONLY, separate CI) | `C:\Users\ceo\Desktop\xilolo backend\xilolo-backend` |
| Media | `C:\Users\ceo\Desktop\xilolo-media` |

**Merge state is confusing and must be checked first.** GitHub's compare said "main is
up to date" while main's *content* was inconsistent (a half-merged tree), which made the
create-event page blank. The only reliable checks are the Actions run for the tip commit
and behaviour on the deployed site. Do NOT infer remote state from a locally-cached ref —
that mistake cost time three times in one session.

---

## 2. IN FLIGHT / LOST — re-dispatch first

An **event-screen parity agent** was running when this session ended. Background
subagents do NOT survive a new session — **re-dispatch it**. Brief:
model `lib/features/presentation/screens/home/screen/details_screen.dart` onto
`src/pages/event/ViewEvent/index.jsx`, cite app `file:line` per change, verify with the
variant grep + the FULL `npm run build` + screenshots at 390/768/1440.

---

## 3. Verified vs unverified (do not confuse these)

**Verified** (seen, not assumed):
- Home feed at 1440: 3-up grid, "Hi Ada", one wallet, teal CTAs with white labels
- Tickets list: app-styled cards, teal "All" pill with white text, status chips
- Colour system: derived from the Flutter source, `#16909C` confirmed in the live CSS
- Gates green at `hv20`–`hv25`; variant guard 0 repo-wide

**Unverified — no screenshots exist for any of these:**
- Ticket receipt (`TicketReceiptScreen.jsx`)
- Organisers rail + `/organizers` page
- Profile page
- Create-event flow (works, but only DOM-snapshot evidence)
- Stream control page (RTMP fix)

**Standing debt:** three agents in a row hit the iteration cap before screenshotting.
Cause: briefs asking for diagnosis + edits + verification inside one 50-call budget.
**Fix the process, not the brief:** tell agents to budget evidence-gathering, edit, then
verify — and treat a report with no build result and no screenshots as unverified.

---

## 4. Needs the founder's decision / approval

1. **VOD/replay retention** — creator picks 7 days / 30 days / **lifetime**. The clock
   runs from **recording completion**, never the scheduled start (that was the bug).
   Needs a per-event retention field + `available_until` from the completion timestamp.
   Backend, separate repo, zero-downtime deploy. *Lifetime = storage grows unbounded.*
2. **Browser go-live infra** — spike verdict: feasible, WHIP currently unreachable.
   Needs an SRS `rtc_server{}` + `vhost>rtc{}` block (WebRTC is off in
   `deploy/media/srs.conf`), two LB forwarding rules, a TLS front (cert already exists
   and is mounted), one env var. **No new hosts, pods, CDN or cost.** The pinned
   `6.0.191` image already has WHIP compiled in (`grep -ac 'rtc/v1/whip' ./objs/srs` = 2).
   Zero-new-port fallback: LiveKit at `:7880/whip` / `:7443/whip` (routes exist, 401).
   Plan: `docs/go-live-from-web-plan.md`. **Do not touch infra without approval.**

---

## 5. Queue (grouped, not ordered)

**Founder requests not yet done:**
- Event screen parity (re-dispatch — see §2)
- Top organizers parity, both surfaces: the home rail *and* `/organizers`
- Root → **sign-in** (not signup) in `src/app.jsx`; visible auth cross-links both ways
- Home feed: organiser name/avatar → `/profile/{hostId}` (no share key exists in
  `EventResource`, so `/organisers/:shareKey` is unreachable from feed data)
- Smart header: greeting + wallet scroll away, All/Live tab row `position: sticky`
- Go-live-from-web feature (spike done, awaiting infra approval)
- VOD: 3-option retention picker in the creator's replay settings

**Older / smaller:**
- Live-tab CTA never screenshotted; mobile "Top up" pill unconfirmed
- Focus ring on dark buttons may be invisible
- Duplicate-wallet fix is a CSS rule (`body:has(...)`) — should be a Navbar prop
- Legal pages carry ~588px tables at 390px
- First load: main chunk is **3,860 kB raw / 1,123.78 kB gzip**. IMPORTANT correction:
  react-player's providers ARE already lazy-split (Vimeo, YouTube, Mux, Twitch, Facebook,
  Wistia, Streamable, DailyMotion, SoundCloud, Vidyard, FilePlayer — 1-9 kB each), so the
  remaining win is `manualChunks`/vendor splitting of app+vendor code, NOT the players.

---

## 6. Gotchas that cost hours — read before touching anything

1. **Brand teal is `#16909C`, derived.** `AppDesignSystem.brandFor(light)` scales the
   `#0EA5B4` seed (sat ×0.88, lightness ×0.92). Components never use the seed.
   `onBrandFor(light)` returns **WHITE**, so labels on teal are white — not ink.
2. **`AppColors.primary` = ink `#111316`; `AppColors.accent` = the teal.** The name
   "primary" means ink in `colors.dart` and teal in `design_system.dart`.
3. **esbuild is a syntax check only.** It does NOT resolve package exports, so the full
   `npm run build` (what CI runs) is the only real check. An invented lucide icon
   (`TextAlignLeft`) broke CI for an hour. Diff icon names against
   `import('lucide-react')` exports (5,471 of them) before use.
4. **Tailwind v4 `tw:` prefix — variant AFTER the prefix.** `tw:md:flex` works;
   `md:tw:flex` is silently dead. `tw:h-[${n}px]` interpolation generates no CSS.
5. **Git path is lowercase `src/app.jsx`.** `git add src/App.jsx` silently adds nothing.
6. **Dev proxy fixed** (`vite.config.js`): it stripped `/api`, so every local API call
   404'd — the cause of the ancient "route v1/login could not be found". Verify with
   `POST http://127.0.0.1:5180/api/v1/login` → 401 (reachable), not 404.
7. **Never trust a cached remote ref.** `git fetch` / `ls-remote` fail silently on this
   network; only a real `git push` output line proves anything. Pushes refuse
   intermittently — retry loop with `eval "$(ssh-agent -s)"; ssh-add ~/.ssh/id_ed25519`
   in the same shell is the pattern that works.
8. **Legacy stylesheet landmines:** all paragraphs greyed, all anchors `#333`, default
   list indent survives (preflight skipped), `html,body{overflow-x:hidden}` masks.
9. **Mobile screenshots need device emulation.** A bare `--window-size=390,844` renders a
   wider layout viewport and photographs a cropped slice of a correct page — this
   produced three false bug reports in one session.
10. **Dead code to avoid mirroring:** `OrganizersSection` and `ProfileScreen` have no call
    sites; the home's live tab is `TopOrganizersScreen()` via `bottom_nav.dart:44`. The
    live organisers section is `suggested_organisers_section.dart` ("Suggested Organisers
    For You"), not `organizers_section.dart`.
11. **Creators must publish into the SRS app `live`.** Ingest is
    `rtmp://ingest.xilolo.com:1935/live` (domain + app name; from
    `config/streaming.php:150`). The front end must read the API's `stream.rtmp_server`,
    never a hardcoded IP.

---

## 7. Useful local setup (already in place)

- Dev server: `http://127.0.0.1:5180` (`npm run dev -- --port 5180 --strictPort`)
- Local `.env` with `VITE_API_URL=/api` (gitignored) — login now works
- Test account: **simplycoding5@gmail.com / 12345678** (note: this account has
  `kyc.status = "failed"`, so the create-event type picker shows the Become-an-Organizer
  gate; fixtures are needed to reach the wizard)
- DEV preview routes (gated on `import.meta.env.DEV`, 404 in prod): `/dev/home-preview`,
  `/dev/tickets-preview`, `/dev/create-event-preview`
- Delegation reports from this session: full agent summaries + live transcripts under
  `C:\Users\ceo\AppData\Local\hermes\profiles\xilolo\cache\delegation\`
