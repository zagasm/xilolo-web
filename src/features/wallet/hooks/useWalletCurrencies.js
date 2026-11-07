import { useQuery } from "@tanstack/react-query";
import { getWalletCurrencies } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";

/**
 * The currencies a payer may enter an amount in, straight from the API array.
 * Defaults to naira if the endpoint is unavailable, so the form never blocks on it.
 */
export function useWalletCurrencies(options = {}) {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["wallet", "currencies", token ? "auth" : "anon"],
    queryFn: () => getWalletCurrencies(token),
    enabled: options.enabled ?? isAuthenticated,
    staleTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  });
}
