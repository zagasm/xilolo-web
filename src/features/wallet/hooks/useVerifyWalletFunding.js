import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyWalletFunding } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";
import {
  getWalletPaymentMethodsQueryKey,
  getWalletSummaryQueryKey,
} from "../queryKeys";

export function useVerifyWalletFunding(options = {}) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;
  const walletScope = user?.id || user?.user_id || token || "anonymous";

  return useMutation({
    mutationFn: (payload) => verifyWalletFunding(payload, token),
    onSuccess: async (...args) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getWalletSummaryQueryKey(walletScope),
        }),
        queryClient.invalidateQueries({
          queryKey: ["wallet-transactions", String(walletScope)],
        }),
        queryClient.invalidateQueries({
          queryKey: getWalletPaymentMethodsQueryKey(walletScope),
        }),
      ]);

      if (onSuccess) {
        await onSuccess(...args);
      }
    },
    ...restOptions,
  });
}
