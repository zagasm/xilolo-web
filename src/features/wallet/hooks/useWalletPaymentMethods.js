import { useQuery } from "@tanstack/react-query";
import { getWalletPaymentMethods } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";
import { getWalletPaymentMethodsQueryKey } from "../queryKeys";
import { normalizePaymentMethods } from "../walletUtils";

export function useWalletPaymentMethods(options = {}) {
  const { token, user, isAuthenticated } = useAuth();
  const walletScope = user?.id || user?.user_id || token || "anonymous";

  return useQuery({
    queryKey: getWalletPaymentMethodsQueryKey(walletScope),
    queryFn: async () => {
      const payload = await getWalletPaymentMethods(token);
      return normalizePaymentMethods(payload);
    },
    enabled: options.enabled ?? isAuthenticated,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
