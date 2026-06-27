import { useQuery } from "@tanstack/react-query";
import { getWalletTransactions } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";
import { getWalletTransactionsQueryKey } from "../queryKeys";
import { normalizeWalletTransactionsResponse } from "../walletUtils";

export function useWalletTransactions(filters = {}, options = {}) {
  const { token, user, isAuthenticated } = useAuth();
  const walletScope = user?.id || user?.user_id || token || "anonymous";

  return useQuery({
    queryKey: getWalletTransactionsQueryKey(walletScope, filters),
    queryFn: async () => {
      const payload = await getWalletTransactions(filters, token);
      return normalizeWalletTransactionsResponse(payload);
    },
    enabled: options.enabled ?? isAuthenticated,
    retry: 1,
    ...options,
  });
}
