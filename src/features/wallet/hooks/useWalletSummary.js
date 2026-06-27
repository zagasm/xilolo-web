import { useQuery } from "@tanstack/react-query";
import { getWalletSummary } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";
import { getWalletSummaryQueryKey } from "../queryKeys";

export function useWalletSummary(options = {}) {
  const { token, user, isAuthenticated } = useAuth();
  const walletScope = user?.id || user?.user_id || token || "anonymous";

  return useQuery({
    queryKey: getWalletSummaryQueryKey(walletScope),
    queryFn: () => getWalletSummary(token),
    enabled: options.enabled ?? isAuthenticated,
    retry: 1,
    ...options,
  });
}
