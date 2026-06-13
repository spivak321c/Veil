import {
  getUmbraClient,
  getPollingTransactionForwarder,
  getPollingComputationMonitor,
} from "@umbra-privacy/sdk";
import type { IUmbraSigner } from "@umbra-privacy/sdk";
import type { MasterSeed } from "@umbra-privacy/sdk/types";
import {
  createBrowserStorageBackend,
  createShardedNullifierStore,
  createShardedUtxoDataStore,
} from "@umbra-privacy/sdk/store-adapters";
import type { Network } from "@umbra-privacy/sdk/constants";

const SOLANA_NETWORK: Network = "devnet";
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SOLANA_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";

const MASTER_SEED_STORAGE_KEY = "veil_umbra_master_seed";

export async function initUmbraClient(wallet: IUmbraSigner) {
  console.log("[client] Initializing Umbra client with RPC:", SOLANA_RPC);

  const transactionForwarder = getPollingTransactionForwarder({
    rpcUrl: SOLANA_RPC,
  });

  const computationMonitor = getPollingComputationMonitor({
    rpcUrl: SOLANA_RPC,
  });

  let cachedSeed: MasterSeed | undefined;
  const masterSeedStorage = {
    load: async () => {
      if (cachedSeed !== undefined) {
        return { exists: true, seed: cachedSeed } as const;
      }
      try {
        const stored = localStorage.getItem(MASTER_SEED_STORAGE_KEY);
        if (stored) {
          const bytes = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
          if (bytes.length === 64) {
            cachedSeed = bytes as unknown as MasterSeed;
            return { exists: true, seed: cachedSeed } as const;
          }
        }
      } catch (e) {
        console.warn("[client] Failed to load master seed from localStorage:", e);
      }
      return { exists: false } as const;
    },
    store: async (seed: MasterSeed) => {
      cachedSeed = seed;
      try {
        const encoded = btoa(String.fromCharCode(...seed));
        localStorage.setItem(MASTER_SEED_STORAGE_KEY, encoded);
        return { success: true } as const;
      } catch (e) {
        console.warn("[client] Failed to store master seed:", e);
        return { success: false, error: String(e) } as const;
      }
    },
  };

  const config = {
    signer: wallet,
    network: SOLANA_NETWORK,
    rpcUrl: SOLANA_RPC,
    rpcSubscriptionsUrl: SOLANA_WSS,
    indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
  };

  const transport = { transactionForwarder, computationMonitor };

  // Phase 1 — bootstrap client (no stores). Derives + caches the master seed.
  const bootstrap = await getUmbraClient(config, { masterSeedStorage, ...transport });

  // Phase 2 — create the standard sharded encrypted stores.
  const backend = createBrowserStorageBackend();
  const nullifierStore = await createShardedNullifierStore(bootstrap, backend);
  const utxoDataStore = await createShardedUtxoDataStore(bootstrap, backend);

  // Phase 3 — final client with stores wired in.
  const client = await getUmbraClient(config, {
    masterSeedStorage,
    utxoDataStore,
    nullifierStore,
    ...transport,
  });

  console.log("[client] Umbra client initialized successfully");
  return client;
}
