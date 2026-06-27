import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimSponsoredTicket, purchaseTicketWithWallet } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";
import { getWalletSummaryQueryKey } from "../queryKeys";

export function usePurchaseTicketWithWallet(options = {}) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;
  const walletScope = user?.id || user?.user_id || token || "anonymous";

  return useMutation({
    mutationFn: (payload) => purchaseTicketWithWallet(payload, token),
    onSuccess: async (...args) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getWalletSummaryQueryKey(walletScope),
        }),
        queryClient.invalidateQueries({
          queryKey: ["wallet-transactions", String(walletScope)],
        }),
      ]);

      if (onSuccess) {
        await onSuccess(...args);
      }
    },
    ...restOptions,
  });
}

export function useClaimSponsoredTicket(options = {}) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;
  const walletScope = user?.id || user?.user_id || token || "anonymous";

  return useMutation({
    mutationFn: (eventId) => claimSponsoredTicket(eventId, token),
    onSuccess: async (...args) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getWalletSummaryQueryKey(walletScope),
        }),
        queryClient.invalidateQueries({
          queryKey: ["wallet-transactions", String(walletScope)],
        }),
      ]);

      if (onSuccess) {
        await onSuccess(...args);
      }
    },
    ...restOptions,
  });
}
