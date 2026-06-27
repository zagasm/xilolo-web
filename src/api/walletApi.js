import { api, authHeaders } from "../lib/apiClient";

function unwrap(payload) {
  return payload?.data?.data ?? payload?.data ?? payload ?? null;
}

export async function getWalletSummary(token) {
  const response = await api.get("/api/v1/user-wallet", authHeaders(token));
  return unwrap(response);
}

export async function getWalletTransactions(filters = {}, token) {
  const response = await api.get("/api/v1/user-wallet/transactions", {
    ...authHeaders(token),
    params: filters,
  });

  return unwrap(response);
}

export async function getWalletPaymentMethods(token) {
  const response = await api.get(
    "/api/v1/user-wallet/payment-methods",
    authHeaders(token)
  );

  return unwrap(response);
}

export async function initializeWalletFunding(payload, token) {
  const response = await api.post(
    "/api/v1/user-wallet/fundings/initialize",
    payload,
    authHeaders(token)
  );

  return unwrap(response);
}

export async function verifyWalletFunding(payload, token) {
  const response = await api.post(
    "/api/v1/user-wallet/fundings/verify",
    payload,
    authHeaders(token)
  );

  return unwrap(response);
}

export async function purchaseTicketWithWallet(payload, token) {
  const response = await api.post(
    "/api/v1/user-wallet/tickets/purchase",
    payload,
    authHeaders(token)
  );

  return unwrap(response);
}

export async function claimSponsoredTicket(eventId, token) {
  const response = await api.post(
    `/api/v1/events/${eventId}/sponsored-tickets/claim`,
    {},
    authHeaders(token)
  );

  return unwrap(response);
}
