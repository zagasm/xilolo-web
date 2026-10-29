import { getContest } from "../../api/contestApi";

/**
 * Contest sharing — mirrors the app's ContestShareHelper
 * (`lib/features/contest/utils/contest_share_helper.dart`, commit fd9b1bc).
 *
 * One deliberate divergence: the app shares the canonical
 * `https://xilolo.com/vote/{slug}`, but the web's contest reads require a
 * signed-in account (`routes/api/v1/contests.php` — only `/shared/contests/{token}`
 * is anonymous). A link that dead-ends on a sign-in wall is a worse share than
 * one that opens the contest, so the web prefers the unguessable share token
 * when the payload carries one, and falls back to the canonical slug link.
 */

export const CONTEST_ORIGIN = "https://xilolo.com";

export function canonicalContestLink(slug) {
  return `${CONTEST_ORIGIN}/vote/${slug}`;
}

export function sharedContestLink(shareToken) {
  return `${CONTEST_ORIGIN}/v/${shareToken}`;
}

export function contestShareText({ title, url }) {
  const clean = (title || "").trim();
  const subject = clean || "this contest";
  return `Vote for your favourite in ${subject} on Xilolo: ${url}`;
}

/**
 * Opens the system share sheet, exactly like the app. Falls back to the
 * clipboard when the platform has no share sheet, when the payload has no link
 * yet, or when the sheet refuses the payload.
 *
 * @returns {"shared"|"copied"|"cancelled"|"none"}
 */
export async function shareContest({ title, slug, shareToken, token }) {
  let url = shareToken ? sharedContestLink(shareToken) : "";
  const trimmedSlug = (slug || "").trim();

  // A list row carries no share token. Ask for it once, on click, so a link
  // sent from the feed still opens for someone who has no account.
  if (!url && trimmedSlug) {
    try {
      const detail = await getContest(trimmedSlug, token);
      if (detail?.share_token) url = sharedContestLink(detail.share_token);
    } catch {
      // Signed out or offline: the canonical link is still better than nothing.
    }
  }

  if (!url && trimmedSlug) url = canonicalContestLink(trimmedSlug);
  if (!url) return "none";

  const payload = {
    title: (title || "").trim() || "Xilolo contest",
    text: contestShareText({ title, url }),
    url,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
      // NotAllowedError (no user gesture / unsupported payload) → copy instead.
    }
  }

  await copyContestLink(url);
  return "copied";
}

export async function copyContestLink(url) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  // Older browsers on http origins have no async clipboard.
  const field = document.createElement("textarea");
  field.value = url;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  document.body.removeChild(field);
}
