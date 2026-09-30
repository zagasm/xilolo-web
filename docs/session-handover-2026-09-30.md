# Session handover — 2026-09-30 (xilolo-web, continuation of 2026-09-29)

Written to be self-contained: read `session-handover-2026-09-29.md` first, then this.
This session closed the verification gap that 09-29 left open and fixed three defects
it found.

---

## 1. Repo state (verified against the remote, not a cached ref)

| Item | Value |
|---|---|
| Repo | `C:\Users\ceo\Desktop\xilolo-web` |
| Branch | `feat/design-revamp` @ **`195a5d4`** — `git ls-remote` returns the same SHA |
| vs `origin/main` | **4 ahead / 10 behind**; `git merge-tree --write-tree HEAD origin/main` = **CLEAN** (no conflicts) |
| `origin/main` | `c0e63d8` = "Merge pull request #110 from zagasm/feat/design-revamp" + one hand-edit `7f5c6bb` |
| Gate | `npm run build` **green** (3,863.39 kB raw / 1,124.24 kB gzip main chunk); `node --test src/pages/Organizers/__tests__/organiserVerificationFlow.test.js` **8/8**; variant guard **0** |
| App (source of truth) | `C:\Users\ceo\Desktop\xilolo-app` |
| Backend (READ-ONLY) | `C:\Users\ceo\Desktop\xilolo backend\xilolo-backend` |

**Unmerged onto main:** `9cf422a` (organisers parity), `82d8e42` (stream-control RTMP),
`f4aee07` (event-screen parity — the agent the 09-29 doc said to re-dispatch had
actually FINISHED and pushed), `195a5d4` (this session's fixes). A PR merges cleanly.

`7f5c6bb` is the founder's own one-line `TextAlignLeft → AlignLeft` fix pushed straight
to main; our branch fixed the same thing in `de8f9d9`, so the merge is a no-op there.

---

## 2. What this session changed (`195a5d4`)

Three defects, all the same shape: **a declaration that resolved to nothing, so the
element rendered empty instead of failing loudly.**

1. **Sign-in step buttons were unreadable when disabled** — `SigninPage.jsx`
   `.continue-btn` / `.signin-btn` set `color: white` unconditionally while the
   unfilled fill is `#E6E6E6` (≈1.1:1). Now `rgba(17,19,22,0.38)`. Verified in the
   **production bundle**, 1440 + 390.
2. **Theme tokens never resolved for hand-written CSS** — `styles/tailwind.css` now
   aliases every `@theme` token back to the `--color-*` names that `Homestyle.css`,
   `tickets.css` and tailwind.css's own rules read (Tailwind v4 with `prefix(tw)`
   emits `--tw-color-*`). Before: the pinned All/Live row had **no fill**, so feed
   posters scrolled visibly *through* it, and `html`/`:root` painted nothing.
3. **A FAILED KYC rendered as "under review" forever** — `Profile/ViewProfile/index.jsx`
   only tested `!isKycVerified`. Now branches on `user.kyc.status === "failed"`:
   rose badge, the reviewer's `failureReason`, "Not approved", and a **Try again** CTA
   into `/become-an-organiser`. Regression test added; fixture at
   `/dev/profile-preview?screen=own-kyc-failed`.

---

## 3. Verification ledger — what is now PROVEN (and how)

Every surface below was loaded against the dev server with **seeded auth** (`token` +
`userdata` in localStorage), **real device emulation** (`Emulation.setDeviceMetricsOverride`
+ touch + iPhone UA), and **console/exception/network capture**. Zero console errors
and zero failed requests (in one run) across all of them.

| Surface | Evidence |
|---|---|
| Root (logged out) | `/` renders the email-first login card, "Don't have an account? **Sign up**" cross-link |
| Home feed 1440/390 | "Hi Abraham 👋", ONE wallet, All/Live tabs, 3-up grid, "From ₦70,000.00", teal CTAs with white labels, "Ticket Purchased" vs "Buy Ticket" state |
| Sticky tab row | after scrolling the real container (`.home-feed`) 700px: `barTop === shellTop` (96), `.home-tabbar` computes `rgb(243,242,240)`, `position: sticky`, z 20 |
| Tickets 1440/390 | All pill `rgb(22,144,156)` + white label, "EXPIRED"/"PAUSED" chips, code/status/price columns |
| Ticket receipt 1440/390 | poster, QR, event details, Organizer link, payment details, ACTIVE/WALLET |
| /organizers 1440/390 | 20 organisers, podium 2-1-3 with trophy + medals, 20 Follow buttons, ranked rows |
| Profile 1440 | "Profile" + Edit pill; the KYC card (see §2.3) |
| Event detail 1440/390 | DATE & TIME, TICKET PRICE, pills; EVENT SCHEDULE → ACCESS WINDOW → HOSTED BY → COUNTDOWN → ABOUT THIS EVENT; live event shows "Live"/"Watch" bottom bar |
| Stream control | renders OBS setup, `hardcodedIp: false` (no stale IP anywhere) |
| Select-event-type | "Become an Organizer" gate for a non-verified account (correct) |
| Fixture harnesses | `/dev/event-preview` shows SPONSORED TICKETS + EVENT MANUAL etc.; `/dev/profile-preview?screen=own-kyc(-failed)` |

**Still unverified (needs a fixture this account cannot reach):**
- Create-event **wizard steps** — the test account has `kyc = failed`, so it stops at
  the become-an-organizer gate. `/dev/create-event-preview?step=1|2|3` exists for this.
- Stream control with **real RTMP values** — requires an account that owns an event
  (this one owns 0). Code is verified: no literal remains, `resolveRtmpServer()` reads
  `credentials.rtmp.server` / `stream.rtmp_server` / `rtmp_link` and strips an
  appended key.
- The one-time **purchase prompt** on event detail is by design (`localStorage`
  `xilolo:event-ticket-prompt-seen:<eventId>`), but it covers the middle sections in a
  fresh profile — seed that key before screenshotting event pages.

---

## 4. New tooling (reusable)

`C:\Users\ceo\_verify_sweep.mjs` — auth-seeded CDP sweep: per-case viewport + mobile
emulation, localStorage seeding (`lsExtra` also suppresses the ticket prompt), per-case
probe JS (async supported), viewport + full-page PNGs, console/exception/HTTP-failure
capture, and **results flushed to disk after every case** (a Chrome renderer crash used
to lose the whole run — it cost two runs before this was fixed).

```
node _verify_sweep.mjs <cases.json> <token.txt> <userdata.json> <outdir>
# env: VERIFY_BASE=http://127.0.0.1:5180 (dev) | :5181 (production bundle preview)
```

- The `/dev/*` preview routes are `import.meta.env.DEV`-gated, so they 404 in a
  production build — use 5180 for those.
- `npx vite preview --port 5181` serves `dist/` **and inherits the `/api` proxy**, which
  is the fastest way to verify the real bundle. It reports `0.0.0.0`/connection-refused
  for the first ~5s while it boots.
- **A locally-built bundle is NOT a data-complete environment:** CI passes both
  `VITE_API_URL` and `VITE_API_BASE_URL`; the local `.env` sets only `VITE_API_URL`, so
  API-backed lists come back empty in `vite preview`. Verdict: verify *data* on 5180,
  verify *the built artifact* on 5181.
- Chrome CDP + `npx esbuild <file>` are the loop. `esbuild` needs no `--loader` for
  `.jsx` files (it infers); passing `--loader=jsx` with a file argument errors out.

## 5. Queue (unchanged items first)

**Waiting on the founder's decision — do not start without approval**
1. **VOD/replay retention** — 7 days / 30 days / lifetime, clock from *recording
   completion* (not scheduled start). Needs a per-event retention field +
   `available_until`. Backend, separate repo, zero-downtime.
2. **Browser go-live infra** — WHIP. Needs an SRS `rtc_server{}` + `vhost>rtc{}` block
   (WebRTC is off in `deploy/media/srs.conf`), 2 LB forwarding rules, a TLS front (cert
   already mounted), 1 env var. No new hosts/pods/CDN/cost. Plan:
   `docs/go-live-from-web-plan.md`. **Scope clarified by the founder 2026-09-30 — read §9
   before planning it: it is not only "go live", it is go live + watch + comments +
   moderation, all from the web, while viewers stay app-only.**

**Ready to do**
- **First-load bundle: 3,863 kB raw / 1,124 kB gzip, one chunk, no route-level
  splitting.** `vite.config.js` currently has `manualChunks: undefined`. The win is
  `manualChunks`/vendor splitting plus (bigger) `React.lazy` per route. Players are
  already split.
- `/dev/create-event-preview?step=1|2|3` screenshots to close §3's first gap.
- Minor: `index.html:57` still pins `<body style="background:#e5e4e2">` — a legacy
  colour that is *darker* than the app's paper `#F3F2F0`; it shows wherever the app
  shell does not cover the canvas. Should become `var(--color-paper)`.
- Minor: the mobile home hero blur (`img.home-hero-media__blur`) is 398.72px wide at a
  390px viewport (≈4.4px overhang each side), masked by `html,body{overflow-x:hidden}`.
  No horizontal scroll occurs (docSW === 390) — cosmetic only.
- Minor: the sign-in card has a faint rectangle around the disabled Continue button
  (≈8px taller than the button) that reads as a ghost element.

---

## 6. Gotchas added this session — read before touching CSS or JSX here

12. **Tailwind v4's `prefix(tw)` renames theme variables.** `@theme { --color-paper }`
    compiles to `--tw-color-paper`, and utilities reference that. Hand-written CSS
    reading `var(--color-paper)` therefore resolves to **nothing** — and because a
    var() that names an undefined property invalidates the *whole declaration at
    computed-value time* (it does **not** fall back to the previous cascade value), the
    rule silently renders as empty rather than erroring. `tailwind.css` now carries a
    `:root` alias block for all 29 tokens; add new tokens there too.
13. **Unlayered legacy CSS beats `@layer utilities` regardless of specificity.** That is
    why `div a{color:#050505}` (assets/css) made an ink pill's label near-black on an
    `<a>` even though `tw:text-white` was applied. The escape hatch in this repo is the
    important suffix: `tw:text-white!` (see `ProfileHeader.jsx:364`). Only `<a>` is
    affected by that particular rule; buttons are fine.
14. **This repo mixes CRLF source files with LF.** The `patch` tool fails to match
    multi-line blocks in CRLF files (`Could not find a match`), while single-line
    matches work. For multi-line edits use Python with `open(..., newline="")` and join
    replacement lines with `\r\n`.
15. **Do not trust a locally-built bundle for data.** See §4.
16. Chrome headless will happily run for minutes on a page with a live video player and
    then die — always flush sweep results per case.

---

## 7. Skill updates made from this session

- `scripts/verify-sweep.mjs` (new) — the harness above, packaged. Run it instead of writing
  another CDP driver.
- `references/verification-harness.md` (new) — run recipe, the "data on :5180 / built artifact on
  :5181" rule, the login-field (`input`, not `email`) and ticket-prompt gotchas.
- `references/design-token-css-traps.md` §2 — "anchors lose their colour, root cause not pinned
  down" is now **pinned**: an unlayered `div a{color:#050505}` beats `@layer utilities`
  regardless of specificity; fix is `tw:text-white!`.
- `references/tailwind-prefix-cascade-traps.md` §"The `--tw-` variable rename" — recorded as
  FIXED by the alias block, with the before/after measurements and the instruction to add new
  tokens to the alias block.
- ⚠️ `SKILL.md` is **at its 100,000-character limit** — a patch that only adds text is rejected
  outright. Put new material in `references/` (auto-listed in `linked_files`) or make the edit
  net-neutral. Worth a deliberate compaction pass before the next big addition.

---

## 8. Home feed pagination — investigated 2026-09-30, front end fixed, backend bug open

**Answer to "is the home feed paginated?" — no, on neither surface, and the API's paging is
broken.** Three findings, all measured against production:

1. **The web had dead scaffolding.** `usePaginatedEvents` (and its two consumers, `Home` and
   `SingleEvent`) computed completion as `meta.current_page >= meta.last_page`. The live payload
   has **no `current_page`, no `last_page`, no `total`** — the hook fabricated `last_page: 1`, so
   that test was `1 >= 1`, permanently true. `isDone` was therefore true on the first render, the
   load-more sentinel was never rendered, and `loadNext()` never fired. The feed was capped at the
   first 20 events with no indication any more existed. **Fixed** — see §2's commit and below.
2. **The advertised cursor does not work.** `meta.next_cursor` is an ARRAY (`["eyJ…","eyJ…"]`) and
   `links.next` carries a `?cursor=…` URL, but passing that cursor back returns **HTTP 500
   "Server Error"** — reproduced on `api.xilolo.com` directly in every encoding (raw, `quote`,
   `quote_plus`, with and without `per_page`). This is a **backend bug** in the events feed.
3. **The ordering is non-deterministic, so offset paging can never be correct either.** Five
   identical `GET /api/v1/events/all/get` calls returned **five different sequences** (the first
   five ids agreed; from position ~6 the sets diverged). Consequently `?page=2` overlapped page 1
   by **13 of 20 items** — page 2 is not "the next 20", it is a second random draw. The query
   needs a deterministic tiebreaker (e.g. `ORDER BY priority_marked_at DESC, id DESC`).

Payload shape to code against (this endpoint only):
```json
"meta": { "path": "...", "per_page": [20,20], "next_cursor": ["eyJ…","eyJ…"],
          "prev_cursor": [null,null], "count": 20, "type": "all", "filters_used": [] }
```

**What the web does now** (`src/hooks/usePaginatedEvents.js` rewritten):
- reads the pagination it is actually given — cursor first (array/scalar/`links.next`), the
  `current_page`/`last_page` shape as a fallback for endpoints that still use it — instead of
  inventing page 2;
- **dedupes by event id** across pages, so the proven 13/20 server-side overlap cannot render the
  same event twice;
- treats a **failed next-page request as terminal, not as a feed error**: the loaded events stay
  on screen, no error card, no retry storm, one `console.warn`, no repeat attempts that session.
  Verified in-browser: sentinel present → scroll → exactly **one** `?cursor=` request → 500 →
  caught → sentinel withdrawn, `errorBlocks: 0`, feed unchanged. **It therefore starts paginating
  by itself the moment the backend cursor is repaired — no further front-end change;**
- owns `hasNextPage` / `isDone` so neither consumer can compute it wrong again.

**Parity:** the Flutter app does not paginate this feed at all (no cursor / page / loadMore /
hasMore anywhere in its home provider) — it renders the same first page. A 20-item first page is
thus parity; claiming the feed was *complete* was not, and that is what was fixed. **The
founder's call is what matters here: if he wants the web feed to show more than 20 events, that
requires the backend fix above first.**

---

## 9. Go-live from the web — founder's clarified scope (2026-09-30)

His words: organisers must **go live from the web**, **watch their live stream**, **read comments**,
and **perform any activities** from the web — **viewers still log in and watch in the app only**.

So the web surface is an *organiser/operator* console, not a viewer surface. That maps onto what
already exists:

| Layer | Status |
|---|---|
| Publish from browser (WHIP) | **missing** — needs the infra in §5.2 (SRS `rtc_server{}` + `vhost>rtc{}`, 2 LB rules, TLS front, 1 env var). No new hosts/pods/CDN/cost |
| Go live / pause / resume / end + OBS credentials | exists — `/event/stream/:eventId` (`EventStreamControlPage`), RTMP fix in `82d8e42` |
| Read/post live comments | **API ready, no web UI.** `GET|POST /api/v1/events/{eventId}/live/comments` → 200, returns `body`, `parent_id`, `is_reply`, `author_role`, `is_event_organizer`, `likes_count`, `replies_count`, `is_pinned`, `pinned_at`/`pinned_by`, `user`, and its own `meta` (`per_page`, `next_cursor` scalar, `is_full`) |
| Realtime delivery | **plumbing present** — `POST /api/v1/realtime/pusher/auth` exists (405 on GET); channel name is `private-live-event.{eventId}`; the web already has `src/lib/realtimePusher.js` + `sessionRealtime.js` (used for forced-logout and support chat) to reuse |
| Host moderation / pinning | **API-ready** — `can_moderate_live_chat` / `can_pin_live_comments` are parsed by the app; `is_pinned`/`pinned_by` come back on each comment. UI missing |
| Watch own stream on web | HLS playback — the same source the app's `live_hls_player.dart` plays; the web has react-player + `video-player.css`. Must be organiser-only, **never** a public viewer route |
| Viewers on the web | must NOT be built (app-only, logged in) |

The app is the source of truth for the behaviour of all of this:
`lib/features/event/widgets/player/live_chat_overlay.dart`, `live_chat_reverb_client.dart`,
`live_comment_api_service.dart`, and `lib/features/presentation/screens/home/screen/livestream_screen.dart`.

---

## 10. Founder's 09-30 follow-ups: desktop distribution + the count rule

**a. Desktop event detail was one 560px column.** On a 1440 screen that wasted ~880px
of width and ran 1568px tall. From `md` up the sections now flow into two balanced
newspaper columns (`md:columns-2`, `md:gap-x-8`, `md:max-w-[1040px]`), with the hero still
full width and each section wrapped in `break-inside-avoid` so nothing is cut mid-section.
**CSS multicol was chosen deliberately over a main+sidebar grid: it preserves DOM order
exactly, so the app-parity section order is untouched on phones**, where the columns collapse
to one. Measured: desktop `docH` 1568 → **1138** (−27%; fits without scrolling on any window
≥1150px tall), 0 elements past the viewport; **mobile `docH` 1623 → 1623, unchanged.**

**b. The "under 1,000" count rule.** `src/utils/countFormat.js` is now the single
implementation (999 → "999", 1,240 → "1.2K", 1,250,000 → "1.3M"; `toFixed(1)` ROUNDS, so it is
never "1.25M"). It was copy-pasted in three places and missing where it mattered:
- **The report was about production, not this branch.** The deployed bundle still renders the
  old top-organizers cards with `{tickets_total ?? 0}` + a "Tickets Sold" label, raw. That code
  is **gone from this branch** — `9cf422a` replaced those cards with the app's design (followers
  only, compacted), and `9cf422a` is one of the unmerged commits. Verified by grepping the
  deployed `/assets/index-BwR4Xlrg.js`: it contains `tickets_total)??0` + `"Tickets Sold"`, and
  the current tree contains neither. **Merging fixes what he is looking at.**
- Raw counts that WERE in this branch and are now fixed: the profile hero copy rows
  (`Tickets Sold (1240)` → `(1.2K)`, `Events (12)`), and `AboutPanel`'s Social snapshot rows
  (Followers, Tickets Sold).
- `ProfileHeader` still re-exports `formatCount` so the old import path keeps working.

**Open question for the founder:** the app shows NO ticket-sold stat on top organisers, so
parity removed those chips. He asked for the *rule* to apply — does he want the chips restored
with `1.2K` formatting, or is their absence fine? Not decided; do not guess.

---

## 11. VOD retention (lifetime) — plan, backend repo, awaiting a go-ahead

The backend is closer than expected: `replay_expires_at` already exists and **NULL already means
"never expires" in the read paths** (`CleanupExpiredReplays.php:74,77` uses
`where('replay_expires_at', '<', now())`, which SQL never matches on NULL; `Event.php:875` guards
with `$this->replay_expires_at &&`; `EventReplayService`/`RecordingService`/`StreamReplayService`
already branch on `whereNull`). `MediaRecordingController.php:96,125` already does
`$forMinutes > 0 ? $availableAt->addMinutes($forMinutes) : null` — i.e. the "no expiry" idiom
exists in the codebase.

What is missing is only the **per-event choice**. Today three write sites all hardcode the same
global default: `ProcessAdaptiveRecording.php:316`, `SyncRecordingToStorage.php:319`,
`StreamReplayService.php:179` → `now()->addDays(config('streaming.recording.retention_days', 30))`
(`config/streaming.php:230`, `STREAM_RETENTION_DAYS`). Those jobs run when the recording is
processed — which is the "recording completion" clock he asked for, not the scheduled start.

Proposed change (additive, zero-downtime):
1. migration: `events.replay_retention_days` nullable smallint — NULL = inherit the platform
   default, `0` = **lifetime**, `n` = n days. Reuses the existing `> 0 ? … : null` idiom.
2. accept 7 / 30 / lifetime on event create+update (and the replay-settings endpoint).
3. the three write sites read the event's choice instead of the global config.
4. expose `replay.retention` alongside the existing `replay.expires_at` in `EventResource`
   (`:379`) so the web picker and the "available until" copy can render.
5. nullable column, no backfill (NULL preserves today's behaviour) → safe deploy.
6. test that a lifetime replay is not deleted by `CleanupExpiredReplays`.
