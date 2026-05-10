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

  const scanAndClaim = async (startTreeIndex: bigint = 0n, startInsertionIndex: bigint = 0n) => {
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

    // Removed Step 0 debug block because api.devnet.solana.com frequently throws 503s here

    // Step 1: Scan for UTXOs
    console.log("[useClaim] Scanning for UTXOs...");
    console.log("[useClaim] Client signer address:", client.signer.address.toString());
    console.log("[useClaim] Client has fetchUtxoData:", typeof client.fetchUtxoData === "function");
    console.log("[useClaim] Client has fetchMerkleProof:", typeof client.fetchMerkleProof === "function");
    console.log("[useClaim] Scan params - treeIndex:", startTreeIndex, "insertionIndex:", startInsertionIndex);

    // Diagnostic: check raw indexer stats
    try {
      const rawResponse = await fetch("https://utxo-indexer.api-devnet.umbraprivacy.com/v1/stats");
      const statsText = await rawResponse.text();
      console.log("[useClaim] Raw indexer stats response:", statsText);
    } catch (e: unknown) {
      console.error("[useClaim] Failed to fetch indexer stats:", e instanceof Error ? e.message : e);
    }

    const scan = getClaimableUtxoScannerFunction({ client });
    const scanResult = await scan(
      BigInt(startTreeIndex) as any,
      BigInt(startInsertionIndex) as any,
    );

    // ScannedUtxoResult has 4 buckets:
    //   selfBurnable       — self-deposited from encrypted balance (ETA)
    //   received           — receiver-claimable from encrypted balance (ETA)
    //   publicSelfBurnable — self-deposited from public ATA
    //   publicReceived     — receiver-claimable from public ATA ← patrons use this path
    //
    // Our send flow uses getPublicBalanceToReceiverClaimableUtxoCreatorFunction (public ATA source),
    // so patron UTXOs land in publicReceived — NOT in received.
    const { selfBurnable, received, publicSelfBurnable, publicReceived } = scanResult;

    console.log("[useClaim] Scan complete. Buckets:", {
      selfBurnable: selfBurnable.length,
      received: received.length,
      publicSelfBurnable: publicSelfBurnable.length,
      publicReceived: publicReceived.length,
    });

    // Claim receiver-claimable UTXOs from both ETA-funded and public-ATA-funded paths.
    const allReceived = [...received, ...publicReceived];
    console.log("[useClaim] Total receiver-claimable UTXOs to claim:", allReceived.length);

    if (allReceived.length === 0) return { claimed: 0 };

    // Step 2: Claim all into encrypted balance
    const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
    const relayer = getUmbraRelayer({
      apiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
    });

    // fetchBatchMerkleProof comes from the client when indexerApiEndpoint is set.
    const claimDeps = {
      zkProver,
      relayer,
      ...(client.fetchBatchMerkleProof ? { fetchBatchMerkleProof: client.fetchBatchMerkleProof } : {}),
    } as Parameters<typeof getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction>[1];

    const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client },
      claimDeps,
    );

    await claim(allReceived);

    return { claimed: allReceived.length };
  };

  return { scanAndClaim };
}
