import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getWalletFundingQuote } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";

/**
 * Server-priced preview of a top-up. Creates nothing - no funding row, no checkout session.
 *
 * Every number the summary shows comes from this endpoint (bonus, fee, wallet credit, and the
 * currency the buyer is actually charged in), so the preview can never disagree with the charge.
 */
export function useWalletFundingQuote({ provider, amount, enabled = true }) {
  const { token, isAuthenticated } = useAuth();
  const numericAmount = Number(amount);
  const usable =
    Boolean(provider) && Number.isFinite(numericAmount) && numericAmount > 0;

  return useQuery({
    queryKey: ["wallet", "funding-quote", token ? "auth" : "anon", provider, numericAmount],
    queryFn: () => getWalletFundingQuote({ provider, amount: numericAmount }, token),
    enabled: enabled && usable && isAuthenticated,
    staleTime: 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}
