import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimSponsoredTicket, purchaseTicketWithWallet } from "../../../api/walletApi";
import { useAuth } from "../../../pages/auth/AuthContext";
import { WALLET_SUMMARY_QUERY_KEY } from "../queryKeys";

export function usePurchaseTicketWithWallet(options = {}) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: (payload) => purchaseTicketWithWallet(payload, token),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: WALLET_SUMMARY_QUERY_KEY });

      if (onSuccess) {
        await onSuccess(...args);
      }
    },
    ...restOptions,
  });
}

export function useClaimSponsoredTicket(options = {}) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: (eventId) => claimSponsoredTicket(eventId, token),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: WALLET_SUMMARY_QUERY_KEY });

      if (onSuccess) {
        await onSuccess(...args);
      }
    },
    ...restOptions,
  });
}
