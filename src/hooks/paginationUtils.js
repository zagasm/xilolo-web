/**
 * Pure pagination helpers for the event feeds. No React, no axios, no
 * `import.meta` — so `node --test` can exercise them directly, the same way
 * `pages/Organizers/organiserVerificationUtils.js` is tested.
 *
 * Why this file exists at all: /api/v1/events/all/get returns
 *
 *   "meta": { "path": "...", "per_page": [20,20], "next_cursor": ["eyJ…","eyJ…"],
 *             "prev_cursor": [null,null], "count": 20, "type": "all", "filters_used": [] }
 *
 * — no `current_page`, no `last_page`, no `total` — plus `links.next` carrying a
 * `?cursor=` URL. The previous implementation assumed the page-number shape,
 * defaulted `last_page` to 1, and therefore evaluated completion as `1 >= 1`:
 * permanently true, so the feed silently stopped at the first 20 events.
 *
 * Measured against production 2026-09-30: the advertised cursor currently
 * returns HTTP 500 when played back, and the ordering is non-deterministic (five
 * identical requests → five different sequences, `?page=2` overlapping page 1 by
 * 13 of 20) — so `dedupeEvents` is not hypothetical, it is load-bearing.
 */

/** `next_cursor` arrives as an array of cursors, one per feed section. */
export function firstUsableString(value) {
  if (Array.isArray(value)) {
    return value.find((v) => typeof v === "string" && v.trim()) || null;
  }
  return typeof value === "string" && value.trim() ? value : null;
}

/** A cursor is preferred; `links.next` is the fallback for a rebuilt payload. */
export function readNextPageParam(payload) {
  const meta = payload?.meta || {};
  const links = payload?.links || {};

  const cursor =
    firstUsableString(meta.next_cursor) ||
    (() => {
      const link = firstUsableString(links.next) || firstUsableString(meta.next);
      if (!link) return null;
      try {
        return new URL(link).searchParams.get("cursor");
      } catch {
        return null;
      }
    })();

  if (cursor) return { cursor };

  const current = Number(meta.current_page);
  const last = Number(meta.last_page);
  if (Number.isFinite(current) && Number.isFinite(last) && last > current) {
    return { page: current + 1 };
  }

  return null;
}

function eventKey(event) {
  return event?.id || event?.event_id || event?.shareable_link || null;
}

/** Same event delivered on two pages must render once. */
export function dedupeEvents(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = eventKey(item);
    if (!key) {
      out.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
