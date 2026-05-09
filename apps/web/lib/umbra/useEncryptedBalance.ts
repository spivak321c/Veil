import { getEncryptedBalanceQuerierFunction } from "@umbra-privacy/sdk";
import { useUmbraStore } from "./store";
import type { Address } from "@solana/kit";

/**
 * React hook for querying the encrypted balance.
 * 
 * IMPORTANT: Must be used in a Client Component ("use client").
 * 
 * @returns `getBalance()` → Queries the encrypted balance for USDC. Returns null if unavailable.
 */
export function useEncryptedBalance() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);

  const getBalance = async (): Promise<bigint | null> => {
    if (isInitializing) {
      console.warn("Umbra client is still initializing.");
      return null;
    }
    if (!client) {
      console.warn("Client not initialized. Please connect your wallet.");
      return null;
    }

    const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
    if (!USDC_MINT) throw new Error("USDC_MINT is not configured.");

    try {
      const queryBalances = getEncryptedBalanceQuerierFunction({ client });
      const balances = await queryBalances([USDC_MINT as Address]);
      const result = balances.get(USDC_MINT as Address);

      if (result?.state === "shared") return result.balance;
      return null;
    } catch (err) {
      console.error("Failed to fetch encrypted balance", err);
      return null;
    }
  };

  return { getBalance };
}
