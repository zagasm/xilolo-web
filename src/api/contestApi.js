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

/** Upload contest artwork before saving, so the organiser sees the real card. */
export async function uploadContestCover(file, token) {
  const form = new FormData();
  form.append("cover", file);

  const response = await api.post("/api/v1/organiser/contests/cover", form, {
    ...authHeaders(token),
    headers: {
      ...(authHeaders(token).headers || {}),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
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

/** Everything needed to watch a contest: funnel, throughput, top five, earnings. */
export async function getContestDashboard(id, token) {
  const response = await api.get(
    `/api/v1/organiser/contests/${id}/dashboard`,
    authHeaders(token)
  );
  return unwrap(response);
}

/**
 * Votes per day for the console chart. Mirrors the app's
 * `OrganiserContestService.voteTrend` (organiser_contest_service.dart:128).
 * The API returns a dense series — every day in the window, zeros included.
 */
export async function getContestVoteTrend(id, token, days = 30) {
  const response = await api.get(`/api/v1/organiser/contests/${id}/vote-trend`, {
    ...authHeaders(token),
    params: { days },
  });
  const data = unwrap(response) ?? {};
  return Array.isArray(data.series) ? data.series : [];
}

/** End entries now. The lifecycle action, not a deadline edit. */
export async function closeContestEntries(id, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/close-entries`,
    {},
    authHeaders(token)
  );
  return unwrap(response);
}

/** End voting now. Irreversible — prizes are settled after this. */
export async function closeContestVoting(id, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/close-voting`,
    {},
    authHeaders(token)
  );
  return unwrap(response);
}

/** Approve a queue in one go. Approval is cheap and reversible on purpose. */
export async function bulkApproveEntries(id, entryIds, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/entries/bulk-approve`,
    { entry_ids: entryIds },
    authHeaders(token)
  );
  const data = unwrap(response) ?? {};
  return Number(data.approved || 0);
}

/** Forward-only: the API refuses a close time earlier than the current one. */
export async function extendVoting(id, votingCloseAt, reason, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/extend-voting`,
    { voting_close_at: votingCloseAt, reason },
    authHeaders(token)
  );
  return unwrap(response);
}

export async function disqualifyEntry(id, entryId, { reason, password, code }, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/entries/${entryId}/disqualify`,
    { reason, password, code },
    authHeaders(token)
  );
  return unwrap(response);
}

/**
 * Ask to take part in a contest. Lands as `pending` — the organiser approves.
 * Organiser-defined fields go in `answers`, keyed by field key.
 */
export async function submitEntry(slug, payload, token) {
  const response = await api.post(
    `/api/v1/contests/${slug}/entries`,
    payload,
    authHeaders(token)
  );
  return unwrap(response);
}

/** Contestant photo — already cropped to a square in the browser. */
export async function uploadEntryPhoto(slug, blob, token) {
  const form = new FormData();
  form.append("photo", blob, "contestant.jpg");

  const response = await api.post(`/api/v1/contests/${slug}/entries/photo`, form, {
    ...authHeaders(token),
    headers: {
      ...(authHeaders(token).headers || {}),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}

/**
 * Delete a contest. Allowed only while it has taken no votes — the API refuses
 * the moment a single vote exists, because people paid into it.
 */
export async function deleteContest(id, token) {
  const response = await api.delete(`/api/v1/organiser/contests/${id}`, authHeaders(token));
  return unwrap(response);
}

/**
 * Disqualify everyone below a line — `mode: "rank"` (places >= value) or
 * `mode: "votes"` (fewer than value votes). Needs the organiser's second factor.
 */
export async function disqualifyBelow(id, payload, token) {
  const response = await api.post(
    `/api/v1/organiser/contests/${id}/disqualify-below`,
    payload,
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
