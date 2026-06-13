import { getETAIntoATAWithdrawerFunction } from "@umbra-privacy/sdk/withdrawal";
import type { U64 } from "@umbra-privacy/sdk/types";
import type { Address } from "@solana/kit";
import { useUmbraStore } from "./store";

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

    const withdrawFn = getETAIntoATAWithdrawerFunction({ client });

    const result = await withdrawFn(
      client.signer.address as Address,
      USDC_MINT as Address,
      amountMicroUsdc as unknown as U64,
    );

    if (!result.callback || result.callback.status === "finalized") {
      return { signature: result.queueSignature };
    }

    throw new Error(
      "Withdrawal is processing — the on-chain confirmation is taking longer than expected. " +
      "Your funds are safe. Refresh in a moment to see the updated balance."
    );
  };

  return { withdraw };
}
