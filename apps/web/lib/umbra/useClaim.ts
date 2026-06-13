import { getUmbraRelayer } from "@umbra-privacy/sdk";
import type { Address } from "@solana/kit";
import {
  reconcileWithOnChainState,
  type UtxoDataEntry,
} from "@umbra-privacy/sdk/store";
import {
  getBurnableStealthPoolNoteScannerFunction,
  getReceiverBurnableStealthPoolNoteIntoETABurnerFunction,
} from "@umbra-privacy/sdk/burn";
import { burnReceiverIntoEncryptedProver } from "./zk-prover";
import { useUmbraStore } from "./store";

const BURN_BATCH_SIZE = 1;

// Mirrors the example's claimed-index-store: a local cache of note identifiers
// that have been submitted for burn. This covers the gap between submitting and
// on-chain confirmation, so we don't re-submit notes across sessions.
// Example: lib/claimed-index-store.ts
const BURNT_CACHE_PREFIX = "veil_claimed_";
function burntKey(addr: string): string {
  return `${BURNT_CACHE_PREFIX}${addr}`;
}

function loadBurnt(addr: string): Set<string> {
  try {
    const raw = localStorage.getItem(burntKey(addr));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function addBurnt(addr: string, ids: readonly string[]): void {
  if (ids.length === 0) return;
  const s = loadBurnt(addr);
  for (const id of ids) s.add(id);
  try {
    localStorage.setItem(burntKey(addr), JSON.stringify([...s]));
  } catch { /* best-effort */ }
}

export function useClaim() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const scanAndClaim = async () => {
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

    const signerAddr = client.signer.address;

    console.log("[useClaim] Scanning for STEALTH_POOL_NOTEs...");

    // Step 1: scan to ingest new leaves into the store
    const scan = getBurnableStealthPoolNoteScannerFunction({ client });
    const fresh = await scan();

    // Step 2: query the store for the full set of known notes
    const store = client.utxoDataStore;
    if (!store) {
      throw new Error("utxoDataStore is not available on the client.");
    }

    const entries = await store.query({
      network: client.network,
      signerAddress: signerAddr as Address,
    });

    console.log("[useClaim] Store query returned entries:", entries.length);

    // Step 3: filter to receiver-burnable notes (ETA-source only — ATA-source
    // receiver notes have no burner in V18 yet: see example claim page §pending).
    const receiverEntries = entries.filter(
      (e: UtxoDataEntry) =>
        e.claimType === "etaToStealthPoolReceiverBurnable"
    );

    console.log("[useClaim] Receiver-burnable notes found:", receiverEntries.length, {
      totalStoreEntries: entries.length,
      receiverCount: receiverEntries.length,
    });

    if (receiverEntries.length === 0) return { claimed: 0 };

    // Step 4: reconcile with on-chain nullifier treaps so the local
    // nullifierStore reflects on-chain state.
    const nullifierStore = client.nullifierStore;
    let confirmed = new Set<string>();
    if (nullifierStore) {
      for (const t of fresh.scannedTrees ?? []) {
        try {
          await reconcileWithOnChainState({ client, stealthPoolIndex: BigInt(t.treeIndex) as never });
        } catch (e) {
          console.warn("[useClaim] reconcile failed for tree", t.treeIndex, e);
        }
      }
      try {
        confirmed = (await nullifierStore.filterByState(["confirmed"])) as unknown as Set<string>;
      } catch (e) {
        console.warn("[useClaim] filterByState failed", e);
      }
    }

    // Local burnt cache covers the gap between submitting a burn and the
    // on-chain reconciliation confirming it.
    const localBurnt = loadBurnt(signerAddr);

    const isSpent = (e: UtxoDataEntry): boolean =>
      (e.utxoKey !== undefined && confirmed.has(e.utxoKey)) ||
      localBurnt.has(`${e.treeIndex}:${e.insertionIndex}`);

    const unspentReceiver = receiverEntries.filter((e: UtxoDataEntry) => !isSpent(e));

    console.log("[useClaim] Unspent receiver notes:", unspentReceiver.length, {
      total: receiverEntries.length,
      unspent: unspentReceiver.length,
    });

    if (unspentReceiver.length === 0) {
      console.log("[useClaim] All receiver notes already burnt, nothing to claim.");
      return { claimed: 0 };
    }

    const relayer = getUmbraRelayer({
      apiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
    });

    const errors: string[] = [];
    const newlyBurnt: string[] = [];

    for (let i = 0; i < unspentReceiver.length; i += BURN_BATCH_SIZE) {
      const chunk = unspentReceiver.slice(i, i + BURN_BATCH_SIZE);

      const burner = getReceiverBurnableStealthPoolNoteIntoETABurnerFunction(
        { client },
        {
          fetchBatchMerkleProof: client.fetchBatchMerkleProof!,
          zkProver: burnReceiverIntoEncryptedProver,
          relayer: {
            submitBurn: relayer.submitClaim,
            pollBurnStatus: relayer.pollClaimStatus,
            getRelayerAddress: relayer.getRelayerAddress,
          },
        },
      );

      try {
        const out = await burner(chunk.map((e: UtxoDataEntry) => e.data) as never);

        for (const [, batch] of out.batches) {
          const b = batch as unknown as {
            status: string;
            requestId?: string;
            txSignature?: string;
            callbackSignature?: string;
            failureReason?: string | null;
          };

          if (b.status === "completed" || b.status === "callback_received") {
            console.log("[useClaim] Burn succeeded:", b.requestId);
            for (const e of chunk) {
              newlyBurnt.push(`${e.treeIndex}:${e.insertionIndex}`);
            }
          } else if (b.failureReason?.includes("NullifierAlreadyBurnt")) {
            console.log("[useClaim] Note already burnt (idempotent).");
            for (const e of chunk) {
              newlyBurnt.push(`${e.treeIndex}:${e.insertionIndex}`);
            }
          } else {
            const err = b.failureReason ?? `Burn ${b.status}`;
            errors.push(err);
            console.error("[useClaim] Burn failed:", err);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[useClaim] Burn exception:", msg);
        errors.push(msg);
      }
    }

    // Persist successfully-burnt note ids so subsequent scans skip them.
    addBurnt(signerAddr, newlyBurnt);

    if (errors.length > 0) {
      throw new Error(`Claim failed: ${errors.join("; ")}`);
    }

    return { claimed: unspentReceiver.length };
  };

  return { scanAndClaim };
}
