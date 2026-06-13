import { getEncryptedBalanceQuerierFunction } from "@umbra-privacy/sdk/query";
import { useUmbraStore } from "./store";
import type { Address } from "@solana/kit";

export type AccountState = "shared" | "mxe" | "none";

export function useEncryptedBalance() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);

  const getBalance = async (): Promise<{ balance: bigint | null; state: AccountState }> => {
    if (isInitializing) {
      console.warn("Umbra client is still initializing.");
      return { balance: null, state: "none" };
    }
    if (!client) {
      console.warn("Client not initialized. Please connect your wallet.");
      return { balance: null, state: "none" };
    }

    const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
    if (!USDC_MINT) throw new Error("USDC_MINT is not configured.");

    try {
      const queryBalances = getEncryptedBalanceQuerierFunction({ client });
      const balances = await queryBalances([USDC_MINT as Address]);
      const result = balances.get(USDC_MINT as Address);

      console.log("[useEncryptedBalance] balance query result:", result);

      if (!result) return { balance: null, state: "none" };

      if (result.state === "shared") return { balance: result.balance, state: "shared" };

      if (result.state === "mxe") {
        console.warn("[useEncryptedBalance] Balance is in MXE mode — not yet decryptable client-side.");
        return { balance: null, state: "mxe" };
      }

      console.warn("[useEncryptedBalance] Unexpected balance state:", result.state);
      return { balance: null, state: "none" };
    } catch (err) {
      console.error("Failed to fetch encrypted balance", err);
      return { balance: null, state: "none" };
    }
  };

  return { getBalance };
}
