import {
  getClaimableUtxoScannerFunction,
  getUmbraRelayer,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
} from "@umbra-privacy/sdk";
import { getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver } from "@umbra-privacy/web-zk-prover";
import { useUmbraStore } from "./store";

/**
 * React hook for scanning and claiming Umbra UTXOs.
 * 
 * IMPORTANT: Must be used in a Client Component ("use client").
 * 
 * @returns `scanAndClaim()` → Scans for UTXOs and claims them into encrypted balance.
 */
export function useClaim() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const scanAndClaim = async (startTreeIndex: number = 0, startInsertionIndex: number = 0) => {
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

    // Step 1: Scan for UTXOs
    const scan = getClaimableUtxoScannerFunction({ client });
    const { received } = await scan(
      startTreeIndex as unknown as Parameters<typeof scan>[0],
      startInsertionIndex as unknown as Parameters<typeof scan>[1],
    );

    if (received.length === 0) return { claimed: 0 };

    // Step 2: Claim all into encrypted balance
    const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
    const relayer = getUmbraRelayer({
      apiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
    });

    // The claim function deps require zkProver, relayer, and fetchBatchMerkleProof.
    // fetchBatchMerkleProof comes from the client (available when indexerApiEndpoint is set).
    const claimDeps = {
      zkProver,
      relayer,
      ...(client.fetchMerkleProof ? { fetchBatchMerkleProof: client.fetchMerkleProof } : {}),
    } as Parameters<typeof getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction>[1];

    const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client },
      claimDeps,
    );

    await claim(received);

    return { claimed: received.length };
  };

  return { scanAndClaim };
}
