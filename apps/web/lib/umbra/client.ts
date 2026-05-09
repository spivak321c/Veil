import { getUmbraClient } from "@umbra-privacy/sdk";
import type { IUmbraSigner } from "@umbra-privacy/sdk/interfaces";

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const DEVNET_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";

export async function initUmbraClient(wallet: IUmbraSigner) {
  console.log("[client] Initializing Umbra client with RPC:", DEVNET_RPC);

  const client = await getUmbraClient({
    signer: wallet,
    network: "devnet",
    rpcUrl: DEVNET_RPC,
    rpcSubscriptionsUrl: DEVNET_WSS,
    indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
    deferMasterSeedSignature: true,
  });

  console.log("[client] Umbra client initialized successfully");
  return client;
}
