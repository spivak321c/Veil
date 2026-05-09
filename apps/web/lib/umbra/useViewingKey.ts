import {
  getMonthlyViewingKeyDeriver,
  getYearlyViewingKeyDeriver,
} from "@umbra-privacy/sdk";
import { useUmbraStore } from "./store";
import type { Address } from "@solana/kit";

/**
 * React hook for deriving Umbra viewing keys.
 * 
 * IMPORTANT: Must be used in a Client Component ("use client").
 * 
 * @returns `deriveMonthly()` and `deriveYearly()` functions to generate viewing keys.
 */
export function useViewingKey() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const checkClient = () => {
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
  };

  const deriveMonthly = async (year: bigint, month: bigint): Promise<string> => {
    checkClient();
    const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
    if (!USDC_MINT) throw new Error("USDC_MINT is not configured.");

    const derive = getMonthlyViewingKeyDeriver({ client });
    const key = await derive(
      USDC_MINT as Address,
      year as unknown as Parameters<typeof derive>[1],
      month as unknown as Parameters<typeof derive>[2],
    );
    return key.toString();
  };

  const deriveYearly = async (year: bigint): Promise<string> => {
    checkClient();
    const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
    if (!USDC_MINT) throw new Error("USDC_MINT is not configured.");

    const derive = getYearlyViewingKeyDeriver({ client });
    const key = await derive(
      USDC_MINT as Address,
      year as unknown as Parameters<typeof derive>[1],
    );
    return key.toString();
  };

  return { deriveMonthly, deriveYearly };
}
