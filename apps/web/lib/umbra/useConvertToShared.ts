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

    for (const [, skippedReason] of result.skipped) {
      if (skippedReason !== "already_shared") {
        console.warn("[useConvertToShared] Skipped conversion for a mint:", skippedReason);
      }
    }

    return result;
  };

  return { convertToShared };
}
