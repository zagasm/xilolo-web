# Go live from the web — spike report + build plan

**Status:** spike complete (throwaway experiment, nothing deployed; no repo code changed except this doc).
**Date:** 2026-09-29 · **Scope:** creators/organisers start a stream *in the browser* from xilolo.com, pick camera + mic,
go live, and watch comments/viewer count while live (reply + pin), plus a chooser for "want to use StreamYard or OBS?"
that shows the RTMP server + key (that path already exists and works).
**Viewers must never be able to publish.**

---

## 1. Feasibility verdict — the riskiest unknown, answered

### Verdict: **a browser CANNOT publish to our SRS plane today. It is a media-plane config change plus two LB forwarding rules — no new hosts, no new pods, no CDN change.**

WHIP is the right mechanism (SRS 5.0+ implements it, library-free, one `POST` of an SDP offer).
The pinned image **is** WHIP-capable; the *running configuration* and the *load balancer* are not.

| # | Question | Evidence | Result |
|---|---|---|---|
| 1 | Does the pinned image contain WHIP? | `kubectl exec srs-origin -c srs -- grep -ac 'rtc/v1/whip' ./objs/srs` → `2`; `grep -ac 'rtc_server'` → `13`; `./objs/srs -v` → `6.0.191` | **Yes — compiled in.** Enabling is config-only. |
| 2 | Is RTC enabled in the running config? | `deploy/media/srs.conf` has `listen 1935`, `http_api {1985}`, `http_server {8080}`, `hls`, `http_remux`, `http_hooks`, `dvr` — **no `rtc_server {}` block and no `vhost > rtc {}` block** | **No. WebRTC/WHIP is off.** |
| 3 | Does the WHIP route answer through the ingest LB? | from a real Chrome: `POST http://ingest.xilolo.com:8080/rtc/v1/whip/?app=live&stream=TEST-WEBSPIKE-001` → **HTTP 404 `Not Found`**; `POST http://ingest.xilolo.com/rtc/v1/whip/...` → **HTTP 404** | **Route does not exist.** |
| 4 | Is the SRS HTTP API (which serves `/rtc/v1/whip/`) publicly reachable? | `ingest.xilolo.com:1985/api/v1/versions` from the browser → `TypeError: Failed to fetch`; TCP connect 1985 → closed. In-cluster it is alive: `127.0.0.1:1985/api/v1/versions` → `{"version":"6.0.191"}` | **Not published by the LB** (`srs-ingest-lb.yaml` exposes 1935, 8080, 8081, 443, 80 only). |
| 5 | Is the WebRTC media port open? | TCP 8000 → closed; `srs-deployment.yaml` declares containerPorts 1935/8080/1985 only | **No RTC media port.** |
| 6 | Is there any HTTP/TLS port that could carry WHIP today? | `https://ingest.xilolo.com:8081/rtc/v1/whip/` → fetch failed (8081 is **plain HTTP** behind nginx); `https://ingest.xilolo.com:443/rtc/v1/whip/` → fetch failed (443 is **RTMPS**: nginx `stream{}` terminates TLS and forwards to RTMP 1935) | **No.** |
| 7 | Does the ingest path actually work today (control)? | ffmpeg `rtmp://ingest.xilolo.com:1935/live/TEST-WHIP-SPIKE-001` → SRS API shows `active=True`, 1280x720, 3 clients; HLS `http://ingest.xilolo.com:8081/live/TEST-WHIP-SPIKE-001.m3u8` → 200 with `EXTINF` segments; CDN `https://studios1.b-cdn.net/live/...m3u8` → 200; `ffprobe` decoded **h264 1280x720 30fps + aac**; `GET :8080/live/KEY.flv` → 200 `video/x-flv`, 447 KB in 5 s, body starts `FLV\x01` | **RTMP ingest + HLS + HTTP-FLV all healthy.** The plane is fine; only WHIP is missing. |
| 8 | Will the browser send codecs SRS's RTC→RTMP bridge needs? | Chrome `RTCRtpSender.getCapabilities`: video `VP8, rtx, H264, AV1, VP9, red, ulpfec`; audio `opus, red, G722, PCMU, PCMA, CN, telephone-event`; with `setCodecPreferences` the local SDP offered **H264 + Opus** | **Yes** — H264 must be forced (see §6.3). |
| 9 | Is TLS ready for a WHIP-over-TLS endpoint? | `openssl s_client -connect ingest.xilolo.com:443 -servername ingest.xilolo.com` → `CN=ingest.xilolo.com`, `SAN DNS:ingest.xilolo.com`, Let's Encrypt, valid to **2026-12-19** | **Yes** — the cert is already in the pod as the `srs-tls` secret and already mounted into the nginx container. |

**Supporting evidence from our own docs:** `xilolo-media/docs/mobile-live-streaming-integration.md:91` and `:498`
already record `| WHIP | not served (empty) |`. And the backend has been *waiting* for it:
`xilolo-backend/config/streaming.php:185` has `'whip' => env('STREAM_WHIP_INGEST', '')` — commented
"Null/empty when the media server does not expose WHIP".

---

## 2. The infra change (exactly what, and why)

Everything below is **once-and-forget**: one config block in one ConfigMap, two forwarding rules on the
**existing** `xilolo-media-ingest` LB, no new pods, no new host, no CDN change, no extra cost beyond the LB's
existing $12/mo (DO LBs take extra forwarding rules for free). Certificates already exist and auto-renew through
SRS's own ACME HTTP-01 path on port 80.

### 2.1 SRS config — `xilolo-media/deploy/media/srs.conf` (source of truth, applied by `deploy-srs.sh`)

```srs
# WHIP ingest: the browser's WebRTC publisher lands here.
rtc_server {
    enabled     on;
    listen      8000;                # UDP + TCP ICE
    candidate   174.138.106.93;      # the srs-ingest LB's public IP, so ICE hands the
                                     # browser a candidate that is routable from the internet
}

vhost __defaultVhost__ {
    rtc {
        enabled     on;
        rtmp_to_rtc off;
        rtc_to_rtmp on;   # REQUIRED. Bridges the RTC publisher into RTMP so HLS packaging,
                          # the ABR transcode workers, the on_publish hook and recording all
                          # keep working unchanged. Without it a WHIP publish is invisible to
                          # every existing part of the plane.
    }
}
```

Why `rtc_to_rtmp on` is the important line: it means **WHIP publishing inherits the whole existing pipeline** —
orchestrator `on_publish` → backend flips the event to `STATUS_LIVE` → ValKey job → RunPod NVENC ladder →
Bunny CDN → recorder. No new pipeline, no new hook, no new worker code.

SRS already has `http_api { crossdomain on; }`, so the WHIP preflight/CORS for xilolo.com is handled.

### 2.2 LB + Service — `xilolo-media/deploy/media/srs-ingest-lb.yaml`

```yaml
    # WHIP media (ICE/SRTP). DigitalOcean LBs accept UDP forwarding rules.
    - { name: rtc-udp, port: 8000, targetPort: rtc-udp, protocol: UDP }
    - { name: rtc-tcp, port: 8000, targetPort: rtc-tcp, protocol: TCP }
    # WHIP signalling, TLS. Served by the nginx already in the pod.
    - { name: whip, port: 8443, targetPort: whip, protocol: TCP }
```
plus in `srs-deployment.yaml`: `rtc-udp`/`rtc-tcp` container ports on the `srs` container, and `whip: 8443` on the
`rtmps-proxy` (nginx) container — the same container that already terminates RTMPS and already has `/etc/nginx/tls`.

### 2.3 The signalling hop (why nginx, and why TLS is mandatory)

SRS serves WHIP on its **HTTP API port 1985** (`/rtc/v1/whip/?app=live&stream=<key>`), which is deliberately
cluster-internal. Two facts decide the shape:

* **TLS is mandatory, not optional.** xilolo.com is HTTPS; a browser will hard-block a `fetch()` to a `http://`
  subresource as mixed content, regardless of what we do server-side. So the creator-facing WHIP URL must be
  `https://`.
* **443 is taken by RTMPS.** `srs-ingest-lb.yaml` forwards 443 → nginx `stream{}` → SRS 1935 for OBS creators.
  We must not disturb that.

Recommended (smallest, reversible, certs already mounted) — add to the nginx `http{}` in
`deploy/media/rtmps-proxy.conf`:

```nginx
    server {
        listen              8443 ssl;
        ssl_certificate     /etc/nginx/tls/tls.crt;     # already CN=ingest.xilolo.com
        ssl_certificate_key /etc/nginx/tls/tls.key;
        ssl_protocols       TLSv1.2 TLSv1.3;

        location /rtc/ {
            proxy_pass       http://127.0.0.1:1985;     # SRS API, same pod netns
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            client_max_body_size 1m;                    # SDP offers are a few KB
        }
    }
```

Creator-facing result: **`https://ingest.xilolo.com:8443/rtc/v1/whip/?app=live&stream=<key>`**.

Optional Phase 2 (nicer, single creator-facing port): multiplex 443 with `ssl_preread` in the nginx `stream{}` —
browsers send ALPN (`h2`/`http/1.1`) so route those to the TLS `http{}` above, and route ALPN-less traffic
(RTMPS clients like OBS) to SRS 1935 exactly as today. That gives creators **one** host:port for both web and
OBS streaming, which matters because 443 is the port most likely to survive Nigerian carrier firewalls on mobile.
Do this only after 8443 is proven.

### 2.4 Backend switch-on (one env var, no code)

```
STREAM_WHIP_INGEST=https://ingest.xilolo.com:8443/rtc/v1/whip/?app=live&stream=
```
The API already returns WHIP credentials the moment that is non-empty — see §5. No controller change needed.

### 2.5 Rollout checklist (media plane is live: do this in a window)

1. `deploy-srs.sh` (config) → confirm `GET /api/v1/raw` shows the `rtc_server` block and the pod is Ready.
2. Add the LB rules; wait for the DO LB to program them.
3. Verify media, in order: `curl -X POST https://ingest.xilolo.com:8443/rtc/v1/whip/?app=live&stream=probe`
   (expect a WHIP error about the SDP, **not** a 404) → UDP 8000 reachable from outside → then a real browser publish.
4. Set `STREAM_WHIP_INGEST`; smoke-test `POST /events/{id}/streams/start` returns `credentials.whip.url`.
5. Confirm the publish makes the event go live (hook path) and the ABR master appears.
6. Rollback = remove the two config additions and the env var; nothing else in the plane is touched.

---

## 3. Screens to build (web repo)

Reuse the existing visual language: teal `#16909C` with white labels, ink `#111316` fills with white text, light text
`#050505 / #76767C / #9AA0AA / #C4C4CC`, hairlines, radius 12/999, flat. Tailwind v4: variant **after** the `tw:`
prefix (`tw:md:flex`, never `md:tw:flex`).

* **S1 · Source picker + preview.** `Camera` and `Microphone` `<select>`s fed by
  `navigator.mediaDevices.enumerateDevices()` (filter `videoinput` / `audioinput`), a `Refresh` action,
  a muted `getUserMedia` preview, and a live state badge (idle → connecting → live → stopped). Warn when a track
  disappears (`devicechange`) or permission is denied, with a "how to allow camera in your browser" hint.
* **S2 · The "how do you want to stream?" chooser.** Two cards, before the picker:
  **"Stream from this browser"** (the WHIP flow) and **"Want to stream on StreamYard or OBS?"** → the existing
  RTMP card (server + key + copy buttons + the OBS step list at `EventStreamControlPage.jsx:1142` and `:1351`),
  plus one line of copy for StreamYard ("paste the same server + key into StreamYard's *Add destination → RTMP*").
  This is the founder's explicit requirement and it is mostly *extraction*, not new UI.
* **S3 · Live dashboard (creator).** While publishing: own preview, elapsed time, **viewer count**, and the comment
  list with **reply**, **pin**, and **unpin**; a pinned comment rendered above the feed; a "Stop streaming" action
  that closes the peer connection *and* calls `POST /events/{id}/streams/end`.
  Layout: preview + stats in the main column, comments in a right rail (stacked under the preview below `tw:lg`).
* **S4 · Watch-page comments (viewers).** Same feed for viewers using the same endpoints, but with **no** publish
  affordance anywhere in the DOM.

---

## 4. Role gate — creators/organisers only

* Publishing is only offered on `EventStreamControlPage` (`/stream/:eventId`), which is already the owner's control
  surface — the page resolves the event via the creator/view API and the backend endpoints it uses
  (`events/{eventId}/streams*`, `stream/details`) are `auth:sanctum` + owner-scoped.
* The gate must be **server-side first**: the stream key and the WHIP URL are only ever returned by
  `GET /events/{id}/streams` and `POST .../streams/start` to the owner. A viewer's web session must never receive a
  WHIP URL or a stream key — that is the actual control, not the UI.
* Client-side: hide S1–S3 entirely for non-owners (no camera permission prompt at all for viewers — do not call
  `getUserMedia` until the creator has chosen "stream from this browser"), and keep the watch page free of any
  publish code path.
* Same rule for comments: `pin`/`unpin` are organiser-only server-side (`PIN_FORBIDDEN`, 403 — verified), so the
  web can show the pin button on the dashboard and let the API enforce it.

---

## 5. What exists already vs what must be built

### 5.1 Reuse as-is (server-side, verified)

| Capability | Where | Note |
|---|---|---|
| WHIP credentials in the API | `xilolo-backend/app/Http/Controllers/V1/Stream/EventStreamController.php:311` (`store`) and `:462` (`start`) → `credentials.whip = {url, stream_key}` | Already implemented, gated on `config('streaming.ingest.whip')`. **Only the env var is missing.** |
| WHIP config slot | `xilolo-backend/config/streaming.php:185` `'whip' => env('STREAM_WHIP_INGEST','')` | |
| RTMP server + key (OBS/StreamYard path) | `config/streaming.php:150` (`rtmp://ingest.xilolo.com:1935/live`) → `stream.rtmp_server` / `stream_key` | Just fixed; the web resolver is `EventStreamControlPage.jsx:55-88` (never hardcode it — see the comment at `:34-44`). |
| Start / go-live / end | `routes/api/v1/Users/Event/stream.php:42-64` (`streams.start`, `streams.go-live`, `streams.show`, `streams.end`) | |
| **Live comments CRUD** | `xilolo-backend/routes/api/v1/Users/Event/live.php:12-29`: `GET/POST comments`, `PATCH/DELETE comments/{id}` | Throttles: `live-polling` 20/min, `live-comments-write` 6/min, `live-actions`. |
| **Comment pin / unpin** | same file `:23-29` → `LiveCommentController::pin` (`:169`), `::unpin` (`:206`) | Organiser-only, 403 `PIN_FORBIDDEN`. |
| **Realtime comment events** | `app/Events/LiveCommentCreated.php:23`, `LiveCommentPinned.php:23`, `LiveCommentUnpinned.php:23` → `PrivateChannel('live-event.'.$eventId)` = wire name `private-live-event.{id}` | Broadcast from `LiveCommentController.php:97` (create), `:188` (pin) — `->toOthers()` so the author does not get an echo. |
| **Viewer count** | `live.php:34` → `LiveViewerController::count` (`:68`) → `{viewer_count}`; `LiveViewerService::count()` (`app/Services/LiveStream/LiveViewerService.php:137`) counts `EventLiveSession` rows with `left_at = null` and `last_seen_at >= now-75s`, excluding the event owner | Needs a heartbeat: `POST viewers/join` / `viewers/leave` (`live.php:46-51`). |
| Viewer list | `live.php:37` `viewers/list` → `{viewer_count, viewers[]}` | |
| **Organiser analytics** | `live.php:41` `viewers/analytics` → `EventViewerAnalyticsController::organiser` (`:17`) | 403 unless `event.user_id === auth()->id()`; returns current / total-unique / peak counts. |
| Likes | `live.php:53-63` | Optional for v1 of the dashboard. |

### 5.2 Must be built

1. **Media plane**: §2 (config + 2 LB rules + TLS front + one env var). Nothing else.
2. **Web: the WHIP publisher module** — `getUserMedia` with the picked `deviceId`s, `RTCPeerConnection` with
   `setCodecPreferences` forcing **H.264 + Opus**, non-trickle ICE (wait for `iceGatheringState === 'complete'`),
   `POST` the offer with `Content-Type: application/sdp`, `setRemoteDescription(answer)`, and teardown via `DELETE`
   on the URL from the WHIP `Location` header. ~150 lines, no new dependency.
3. **Web: the live dashboard** (S3) + the chooser (S2) + the viewer-side comment feed (S4).
4. **Web: a realtime client for the comments channel.** ⚠️ The web today has `pusher-js` wired to **Pusher SaaS**
   (`src/lib/realtimePusher.js:1-35`, `authEndpoint /api/v1/realtime/pusher/auth`, `VITE_PUSHER_KEY`/`_CLUSTER`),
   while the mobile app subscribes to **self-hosted Reverb** (`live_comment_realtime_service.dart:171`
   `private-live-event.` + `:174` `/reverb/app`, auth handshake at `:466-490`). `laravel-echo` ^2.3.4 is already a
   web dependency. **Decide the web's realtime transport before starting S3/S4** (see §6.5) — the polling fallback
   (`GET comments`, 20/min) is fine for a first cut.
5. **Heartbeat**: call `viewers/join` on entering the watch/dashboard page and `viewers/leave` on unload, or the
   75-second window will under-count.
6. **No backend work is required for comments/pin/viewer-count/analytics** — this is the good news from the spike.

### 5.3 The Flutter app is the reference implementation for S3/S4

`lib/features/event/widgets/player/live_chat_overlay.dart` (feed + pin + reply UI),
`lib/features/event/data/service/live_comment_realtime_service.dart`,
`lib/features/event/data/model/live_chat/*` (message/comment/viewer models).
Note the app publishes with a **native RTMP SDK** (`lib/features/streaming/providers/broadcaster_provider.dart`,
`stream_rtmp_helper.dart`) — there is **no WHIP client anywhere in the app**, so nothing browser-side can be copied;
the spike page is the only reference.

---

## 6. Risks

1. **UDP through a DO LB is the real unknown.** TCP passthrough rules are proven on this LB; UDP 8000 is not.
   Verify with a UDP probe before promising the feature; if UDP via the LB misbehaves, the fallback is a dedicated
   small host/IP for RTC or TURN (see 6.2). Budget a half-day for this, not zero.
2. **Strict NATs need TURN.** SRS WHIP with a single public candidate works for most clients but not symmetric-NAT
   users. The plane already runs LiveKit with TURN (5349/TCP, 3478/UDP) — either front SRS's RTC with a TURN relay
   or, if the LB UDP path fights us, **reuse LiveKit as the WebRTC ingest** (see 6.6).
3. **Codec negotiation.** SRS's `rtc_to_rtmp` bridge needs **H.264 video + Opus audio**. Chrome happily offers
   VP8/VP9/AV1 first, so the page must call `setCodecPreferences` (the spike did, and the SDP came out H264+Opus).
   Without this the stream connects and then produces no RTMP/HLS output — a confusing failure mode to debug.
4. **Keyframe/GOP alignment.** The ABR ladder assumes one 2 s keyframe grid and `hls_wait_keyframe on`. Force a
   ~2 s browser GOP (`-g`-equivalent) or the ladder will look stuttery. Also cap the source at 720p/1080p and
   ~2.5 Mbps: browser H264 encoding scales with the creator's laptop, not our GPU budget.
5. **Realtime transport split (§5.2.4).** Web = Pusher SaaS, app = self-hosted Reverb. Building the dashboard on
   the wrong one means a second rewrite. Polling works as a stopgap; decide deliberately.
6. **LiveKit is already a WHIP ingest we could use today.** `POST http://165.245.201.201:7880/whip` and
   `https://165.245.201.201:7443/whip` both answer **401 `invalid authorization token`** (i.e. the route *exists*),
   and LiveKit's UDP range 7882-7883 is already open on its own LB — **zero new infra**. Cost: the creator becomes a
   LiveKit participant and the feed has to be egressed/composited back into SRS (the plane already has a
   composer/egress path), i.e. more moving parts and more latency than SRS's one-hop WHIP. Flagged as the fallback,
   not the recommendation. *(Not tested end-to-end — it would need a minted prod LiveKit token, which this spike
   deliberately did not do.)*
7. **"Newest publisher wins" eviction is intentional but surprising.** The orchestrator (`EVICT_STALE_PUBLISHER=1`)
   disconnects a holder when a second publish arrives for a key. So a creator streaming from OBS who then clicks
   "go live from this browser" will have OBS kicked. Show a confirmation in S2 if a stream is already publishing.
8. **`app` must be `live`.** A WHIP URL built without `app=live` lands in `__defaultApp__` and plays nowhere —
   exactly the class of bug already burned into `EventStreamControlPage.jsx:34-44`. The backend already returns the
   full URL, so read it, never build it in the frontend.
9. **SRS is a single replica with `Recreate` strategy** (`srs-deployment.yaml:14-16`). Every WHIP publisher and every
   OBS publisher share one pod; a rollover disconnects both. Already true today; WHIP does not make it worse but the
   dashboard should handle "stream dropped" gracefully (auto-reconnect or clear error + retry).
10. **Permission/UX traps**: HTTPS is required for `getUserMedia` (fine on xilolo.com), camera prompts must be
    preceded by an explanation, and mobile browsers (especially iOS Safari) can suspend a tab that goes to the
    background — warn creators to keep the tab foregrounded.

---

## 7. Spike artifacts (throwaway — deliberately outside both repos, not committed)

`C:\Users\ceo\whip-spike\`
* `index.html` — webcam+mic publisher: device pickers (`enumerateDevices` → `videoinput`/`audioinput`),
  muted preview, `setCodecPreferences(H264+Opus)`, non-trickle ICE, WHIP `POST`, `Location`/`DELETE` teardown,
  HLS playback verification, and a `?auto=1` headless self-test that posts every step to `/log`.
* `serve.py` — dependency-free harness that serves the page and collects the log (how a headless run is evidence).
* `kill-spike-chrome.ps1` — kills only the spike's Chrome (matched on the spike profile dir), never the user's.
* `spike-ui.png` — screenshot: pickers populated (camera `fake_device_0`, mic `Fake Default Audio Input`) + preview.
* `browser-log.jsonl`, `flv2.bin`, `p1.txt`/`p2.txt` — raw evidence behind §1.

Re-run the headless proof (fake camera/mic, whole flow, ~70 s because of the closed-port timeouts):
```bash
cd /c/Users/ceo/whip-spike && python serve.py --fresh &      # http://127.0.0.1:8788
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --user-data-dir="C:/Users/ceo/whip-spike/chrome-profile" \
  --use-fake-device-for-media-stream --use-fake-ui-for-media-stream \
  --autoplay-policy=no-user-gesture-required \
  "http://127.0.0.1:8788/index.html?auto=1"
cat browser-log.jsonl
```
Result of that run: device enumeration ✅, capture `640x480@20` with **real pixels arriving**
(canvas mean-luminance sd 8.8–26 across 5 sampled frames) ✅, H264+Opus negotiated ✅, WHIP `POST` → **404** ❌,
HLS origin read → 200 ✅, publisher stopped and all tracks ended ✅.

**Test streams used and stopped:** `TEST-WHIP-SPIKE-001` (1280x720, HLS verified + frozen at segment 80 after stop)
and `TEST-WHIP-SPIKE-002` (HTTP-FLV verified: `200`, `video/x-flv`, 447 KB/5 s, `FLV\x01` magic).
Final state checked after the runs: `active publishers: NONE`, no ffmpeg processes, playlists frozen.

---

## 8. What the spike could NOT determine

* **SRS's WHIP route behaviour with RTC enabled.** It cannot be enabled on the live plane (read-only spike), and this
  workstation has no Docker/WSL/podman, so no local SRS could be run. The claim "the endpoint is on 1985 and a POST
  succeeds once the block is added" rests on SRS's own documented behaviour **plus** the binary containing the
  `rtc/v1/whip` route — it has **not** been executed end-to-end. Verify with the step-3 probes in §2.5 before
  promising a date.
* **UDP 8000 forwarding through the DigitalOcean LB** — untested (rule does not exist yet).
* **LiveKit-as-WHIP-ingest end to end** — only the 401 (route exists) was verified; no publish was attempted, by
  choice, because it needs a minted production token.
* **Real-device (not fake-device) camera behaviour** and browser-encode quality mapping into the existing ABR ladder.
* **The web repo's realtime transport decision** (§5.2.4) — needs a call from whoever owns the backend's broadcasting
  config (`BROADCAST_CONNECTION` currently defaults to `null`; both a Reverb connection block and a
  `/api/v1/realtime/pusher/auth` route exist, so the answer likely lives in the deployed env, which was not read).
