import { getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction } from "@umbra-privacy/sdk";
import type { U64 } from "@umbra-privacy/sdk/types";
import type { Address } from "@solana/kit";
import { useUmbraStore } from "./store";

/**
 * React hook for withdrawing from encrypted balance to the creator's public ATA.
 *
 * IMPORTANT: Must be used in a Client Component ("use client").
 *
 * This moves funds from the Umbra shielded pool (ETA) back to the creator's
 * standard Solana token account (ATA), making them visible in Solflare/Phantom.
 *
 * @returns `withdraw(amount)` → Withdraws `amount` micro-USDC to the connected wallet's ATA.
 */
export function useWithdraw() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const withdraw = async (amountMicroUsdc: bigint): Promise<{ signature: string }> => {
    if (isInitializing) {
      throw new Error("Umbra client is still initializing. Please wait...");
    }
    if (!client) {
      if (initError) {
        throw new Error(
          `Umbra client failed to initialize: ${initError}. Please reconnect your wallet and try again.`
        );
      }
      throw new Error("Client not initialized. Please connect your wallet.");
    }

    const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
    if (!USDC_MINT) throw new Error("USDC_MINT is not configured.");

    const withdrawFn = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });

    const result = await withdrawFn(
      client.signer.address as Address,
      USDC_MINT as Address,
      amountMicroUsdc as U64,
    );

    if (result.callbackStatus === "timed-out") {
      throw new Error(
        "Withdrawal is processing — the on-chain confirmation is taking longer than expected. " +
        "Your funds are safe. Refresh in a moment to see the updated balance."
      );
    }

    if (result.callbackStatus === "pruned") {
      throw new Error(
        "The MPC callback was dropped. Please try withdrawing again."
      );
    }

    return { signature: result.queueSignature };
  };

  return { withdraw };
}
