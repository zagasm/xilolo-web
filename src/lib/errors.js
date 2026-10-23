/**
 * One place that decides what a user is allowed to read.
 *
 * The API now sends friendly sentences for framework failures, but a deploy
 * mismatch (a route that exists in the repo and not on the server) can still
 * return something like:
 *
 *   "The POST method is not supported for route api/v1/contests/x/entries.
 *    Supported methods: GET, HEAD."
 *
 * That is a developer message. It tells the user nothing, and it hands anyone
 * probing the API a map of it. So the client refuses to print anything that
 * looks like framework text and falls back to a sentence a person can act on.
 */
const FRAMEWORK_TEXT =
  /method is not supported|supported methods|sqlstate|undefined method|call to a member|stack trace|vendor[\\/]laravel|no query results|target class|too few arguments|unexpected token|syntax error|HTML response/i;

function firstFieldError(errors) {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }

  return null;
}

export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  const data = err?.response?.data;
  const message = firstFieldError(data?.errors) || data?.message || err?.message;

  if (typeof message !== "string" || !message.trim()) return fallback;
  if (FRAMEWORK_TEXT.test(message)) return fallback;

  return message;
}

/** 405 in particular means client and server disagree about the API — say so plainly. */
export function isMethodMismatch(err) {
  return err?.response?.status === 405;
}
