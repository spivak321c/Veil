import { getNetworkEncryptionToSharedEncryptionConverterFunction } from "@umbra-privacy/sdk";
import type { Address } from "@solana/kit";
import { useUmbraStore } from "./store";

export function useConvertToShared() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const convertToShared = async (mints: Address[]) => {
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

    const convertFn = getNetworkEncryptionToSharedEncryptionConverterFunction({ client });
    const result = await convertFn(mints);

    const errors: string[] = [];
    for (const [mint, skippedReason] of result.skipped) {
      if (skippedReason === "already_shared") {
        continue;
      }
      const msg = `Skipped conversion for ${mint}: ${skippedReason}`;
      console.warn("[useConvertToShared]", msg);
      errors.push(msg);
    }

    if (result.converted.size === 0 && errors.length > 0) {
      throw new Error(`Balance conversion to shared mode failed: ${errors.join("; ")}. Withdrawal may still work via Arcium MPC.`);
    }

    return result;
  };

  return { convertToShared };
}
