import {
  getClaimableUtxoScannerFunction,
  getUmbraRelayer,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
} from "@umbra-privacy/sdk";
import { getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver } from "@umbra-privacy/web-zk-prover";
import { useUmbraStore } from "./store";

// Module-level in-memory cache for the ZK assets (.zkey + .wasm).
// The SDK's default load/store are no-ops — it re-downloads the .zkey from
// CloudFront on every prove() call (~100MB). ERR_HTTP2_PROTOCOL_ERROR happens
// when CloudFront resets the stream mid-download on slow connections.
// Caching the bytes in memory means the download only happens once per
// browser session; subsequent prove() calls skip the fetch entirely.
type ZkAssetData = { zkey: Uint8Array; wasm: Uint8Array };
const zkAssetCache = new Map<string, ZkAssetData>();

const zkAssetLoader = async (context: { type: string; variant?: string }) => {
  const key = `${context.type}:${context.variant}`;
  const cached = zkAssetCache.get(key);
  if (cached) return { exists: true as const, data: cached };
  return { exists: false as const };
};

const zkAssetStorer = async (data: ZkAssetData, context: { type: string; variant?: string }) => {
  const key = `${context.type}:${context.variant}`;
  zkAssetCache.set(key, data);
  return { success: true as const };
};

// The prover object itself is also cached so we don't reconstruct it on every claim.
let cachedZkProver: ReturnType<typeof getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver> | null = null;
function getOrCreateZkProver() {
  if (!cachedZkProver) {
    cachedZkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver({
      load: zkAssetLoader,
      store: zkAssetStorer,
    });
  }
  return cachedZkProver;
}

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
    const zkProver = getOrCreateZkProver();
    const relayer = getUmbraRelayer({
      apiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
    });

    // fetchBatchMerkleProof comes from the client when indexerApiEndpoint is set.
    const claimDeps = {
      zkProver,
      relayer,
      ...(client.fetchBatchMerkleProof ? { fetchBatchMerkleProof: client.fetchBatchMerkleProof } : {}),
      // Relayer polling: check every 5s, give up after 35 minutes.
      // Observed: relayer endpoint reachable after ~1200s (20 min) on devnet.
      // SDK default is 3s poll / 2min timeout — far too short.
      pollingIntervalMs: 5000,
      timeoutMs: 35 * 60 * 1000,
    } as Parameters<typeof getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction>[1];

    const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client },
      claimDeps,
    );

    // Hard wall-clock timeout: must be longer than the relayer polling timeout above.
    // Set to 40 minutes to give the 35-minute relayer window room to complete
    // before the wall clock fires.
    const CLAIM_WALL_TIMEOUT_MS = 40 * 60 * 1000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Claim timed out after 40 minutes. The relayer may be unresponsive — please try again.")),
        CLAIM_WALL_TIMEOUT_MS,
      )
    );

    const result = await Promise.race([claim(allReceived), timeoutPromise]);

    // The SDK returns status: "timed_out" | "failed" | "completed" — it does NOT
    // throw on non-success. Surface failures explicitly so the catch block fires.
    if (result && typeof result === "object" && "status" in result) {
      const status = (result as { status: string }).status;
      if (status === "timed_out") {
        throw new Error(
          "Claim timed out waiting for the relayer to confirm. Your UTXOs may still be processing — check your balance in a few minutes before retrying."
        );
      }
      if (status === "failed") {
        const reason = (result as { failureReason?: string }).failureReason;
        throw new Error(`Claim failed: ${reason ?? "unknown relayer error"}`);
      }
    }

    return { claimed: allReceived.length };
  };

  return { scanAndClaim };
}
