import { api, authHeaders } from "../lib/apiClient";

/**
 * Contests (paid voting) API.
 *
 * Two doors, matching the backend:
 *   - signed in: the vote home, search, a contest by slug
 *   - shared link: one contest by token, for someone with no account yet
 *
 * The client never totals a vote purchase. `getVoteQuote` asks the server.
 */

function unwrap(payload) {
  return payload?.data?.data ?? payload?.data ?? payload ?? null;
}

export async function listContests({ q, category, endingSoon } = {}, token) {
  const response = await api.get("/api/v1/contests", {
    ...authHeaders(token),
    params: {
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
      ...(endingSoon ? { ending_soon: 1 } : {}),
    },
  });

  return { items: unwrap(response) ?? [], meta: response?.data?.meta ?? null };
}

export async function getContestCategories(token) {
  const response = await api.get("/api/v1/contests/categories", authHeaders(token));
  return unwrap(response) ?? [];
}

export async function getContest(slug, token) {
  const response = await api.get(`/api/v1/contests/${encodeURIComponent(slug)}`, authHeaders(token));
  return unwrap(response);
}

export async function getContestEntries(slug, token) {
  const response = await api.get(
    `/api/v1/contests/${encodeURIComponent(slug)}/entries`,
    authHeaders(token)
  );
  return unwrap(response) ?? [];
}

/** Server-computed price for a vote purchase: total, balance, shortfall. */
export async function getVoteQuote(slug, entryId, quantity, token) {
  const response = await api.get(
    `/api/v1/contests/${encodeURIComponent(slug)}/vote-quote`,
    {
      ...authHeaders(token),
      params: { entry_id: entryId, quantity },
    }
  );

  return unwrap(response);
}

/**
 * `idempotencyKey` is what makes a retry safe: the backend hashes it into the
 * vote reference, so a double tap can never charge twice.
 */
export async function castVotes(slug, { entryId, quantity, idempotencyKey }, token) {
  const response = await api.post(
    `/api/v1/contests/${encodeURIComponent(slug)}/votes`,
    {
      entry_id: entryId,
      quantity,
      idempotency_key: idempotencyKey,
    },
    authHeaders(token)
  );

  return unwrap(response);
}

export async function getReceipt(reference) {
  const response = await api.get(`/api/v1/shared/receipts/${encodeURIComponent(reference)}`);
  return unwrap(response);
}

/* ── Shared link (no account) ─────────────────────────────────────────────── */

export async function getSharedContest(token) {
  const response = await api.get(`/api/v1/shared/contests/${encodeURIComponent(token)}`);
  return unwrap(response);
}

export async function getSharedContestEntries(token) {
  const response = await api.get(
    `/api/v1/shared/contests/${encodeURIComponent(token)}/entries`
  );
  return unwrap(response) ?? [];
}

export async function getSharedEntry(token) {
  const response = await api.get(`/api/v1/shared/entries/${encodeURIComponent(token)}`);
  return unwrap(response);
}

/* ── Organiser ────────────────────────────────────────────────────────────── */

export async function listMyContests(token) {
  const response = await api.get("/api/v1/organiser/contests", authHeaders(token));
  return { items: unwrap(response) ?? [], meta: response?.data?.meta ?? null };
}

export async function createContest(payload, token) {
  const response = await api.post("/api/v1/organiser/contests", payload, authHeaders(token));
  return unwrap(response);
}

export async function publishContest(id, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/publish`,
    {},
    authHeaders(token)
  );
  return unwrap(response);
}

export async function getOrganiserContest(id, token) {
  const response = await api.get(`/api/v1/organiser/contests/${id}`, authHeaders(token));
  return unwrap(response);
}

export async function getOrganiserEntries(id, status = "pending", token) {
  const response = await api.get(`/api/v1/organiser/contests/${id}/entries`, {
    ...authHeaders(token),
    params: { status },
  });
  return unwrap(response) ?? [];
}

export async function approveEntry(id, entryId, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/entries/${entryId}/approve`,
    {},
    authHeaders(token)
  );
  return unwrap(response);
}

/**
 * Declining needs a reason (20+ chars) and a second factor — the account
 * password, or a TOTP code when 2FA is on.
 */
export async function declineEntry(id, entryId, { reason, password, code }, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/entries/${entryId}/decline`,
    { reason, password, code },
    authHeaders(token)
  );
  return unwrap(response);
}

export async function getContestEarnings(id, token) {
  const response = await api.get(
    `/api/v1/organiser/contests/${id}/earnings`,
    authHeaders(token)
  );
  return unwrap(response);
}
