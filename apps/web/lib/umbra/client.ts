import {
  getUmbraClient,
  getPollingTransactionForwarder,
  getPollingComputationMonitor,
} from "@umbra-privacy/sdk";
import type { IUmbraSigner } from "@umbra-privacy/sdk/interfaces";

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const DEVNET_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";

export async function initUmbraClient(wallet: IUmbraSigner) {
  console.log("[client] Initializing Umbra client with RPC:", DEVNET_RPC);
  console.log("[client] Using polling-based transaction forwarder (WS fallback only for monitoring)");

  // Use polling-based forwarder — more reliable than WebSocket on devnet
  const transactionForwarder = getPollingTransactionForwarder({
    rpcUrl: DEVNET_RPC,
  });

  // Use polling-based computation monitor as fallback when WS is unreliable
  const computationMonitor = getPollingComputationMonitor({
    rpcUrl: DEVNET_RPC,
  });

  const client = await getUmbraClient(
    {
      signer: wallet,
      network: "devnet",
      rpcUrl: DEVNET_RPC,
      rpcSubscriptionsUrl: DEVNET_WSS,
      indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
      deferMasterSeedSignature: true,
    },
    {
      transactionForwarder,
      computationMonitor,
    }
  );

  // Generate X25519 private key from master seed if not already stored
  // console.log("[client] Checking X25519 private key...");
  // const keyContext = {
  //   signerAddress: client.signer.address.toString(),
  //   domainSeparator: "MasterViewingKey/0",
  //   network: client.network,
  //   protocolVersion: "1.0.0",
  //   algorithmVersion: "1.0.0",
  //   schemeVersion: "1.0.0",
  // } as const;
  // try {
  //   const x25519Key = await client.x25519PrivateKey.load(keyContext).catch(() => null);
  //   if (!x25519Key) {
  //     console.log("[client] X25519 private key not found, generating...");
  //     await client.x25519PrivateKey.generate(keyContext);
  //     console.log("[client] X25519 private key generated and stored");
  //   } else {
  //     console.log("[client] X25519 private key already exists");
  //   }
  // } catch (e: any) {
  //   console.error("[client] Failed to generate X25519 key:", e.message);
  // }

  // console.log("[client] Umbra client initialized successfully with polling forwarder");
  // console.log("[client] Client keys:", Object.keys(client));
  // console.log("[client] Has fetchUtxoData:", typeof client.fetchUtxoData);
  // console.log("[client] Has fetchMerkleProof:", typeof client.fetchMerkleProof);
  // console.log("[client] indexerApiEndpoint:", (client as any).indexerApiEndpoint);
  console.log("[client] Umbra client initialized successfully");
  return client;
}
