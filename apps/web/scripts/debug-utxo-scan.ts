/**
 * Debug script: Check UTXO registration and scan results
 * 
 * Usage: npx tsx scripts/debug-utxo-scan.ts
 */

import {
  createInMemorySigner,
  getUmbraClient,
  getUserAccountQuerierFunction,
  getClaimableUtxoScannerFunction,
  assertU32,
} from "@umbra-privacy/sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const DEVNET_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";
const INDEXER_ENDPOINT = "https://utxo-indexer.api-devnet.umbraprivacy.com";

// Creator wallet address from logs
const CREATOR_WALLET = "25R8xdYeGvhYNAso5CwqEbx5KnBdnwzXzhp2FHRxdZJh";

async function main() {
  console.log("=== UTXO Scan Debug ===\n");
  console.log("Creator wallet:", CREATOR_WALLET);
  console.log("Indexer:", INDEXER_ENDPOINT);

  // Step 1: Create a signer for the creator wallet (we can't actually sign, but we can query)
  console.log("\n--- Step 1: Creating test signer ---");
  const signer = createInMemorySigner();
  console.log("Test signer address:", signer.address.toString());

  // Step 2: Initialize client
  console.log("\n--- Step 2: Initializing Umbra client ---");
  const client = await getUmbraClient({
    signer,
    network: "devnet",
    rpcUrl: DEVNET_RPC,
    rpcSubscriptionsUrl: DEVNET_WSS,
    indexerApiEndpoint: INDEXER_ENDPOINT,
    deferMasterSeedSignature: true,
  });

  console.log("Client initialized");
  console.log("Has fetchUtxoData:", typeof client.fetchUtxoData);
  console.log("Has fetchMerkleProof:", typeof client.fetchMerkleProof);

  // Step 3: Check creator registration
  console.log("\n--- Step 3: Checking creator registration ---");
  const queryUser = getUserAccountQuerierFunction({ client });
  
  try {
    const creatorAccount = await queryUser(CREATOR_WALLET as any);
    console.log("Creator account state:", creatorAccount.state);
    if (creatorAccount.state === "exists") {
      console.log("  isActiveForAnonymousUsage:", creatorAccount.data.isActiveForAnonymousUsage);
      console.log("  x25519PublicKey:", creatorAccount.data.x25519PublicKey);
      console.log("  generationIndex:", creatorAccount.data.generationIndex);
    }
  } catch (e: any) {
    console.error("Creator account query failed:", e.message);
  }

  // Step 4: Check test signer registration
  console.log("\n--- Step 4: Checking test signer registration ---");
  try {
    const testAccount = await queryUser(signer.address);
    console.log("Test signer account state:", testAccount.state);
    if (testAccount.state === "exists") {
      console.log("  isActiveForAnonymousUsage:", testAccount.data.isActiveForAnonymousUsage);
    }
  } catch (e: any) {
    console.log("Test signer not registered (expected)");
  }

  // Step 5: Scan with test signer
  console.log("\n--- Step 5: Scanning with test signer ---");
  const scan = getClaimableUtxoScannerFunction({ client });
  
  try {
    console.log("Scanning tree 0, starting at index 0...");
    const scanResult = await scan(0n, 0n);
    console.log("Scan complete. Found UTXOs:", scanResult.received.length);
    
    if (scanResult.received.length > 0) {
      console.log("UTXO details:");
      scanResult.received.forEach((utxo, i) => {
        console.log(`  [${i}] treeIndex: ${utxo.treeIndex}, insertionIndex: ${utxo.insertionIndex}`);
        console.log(`      amount: ${utxo.amount?.toString()}`);
        console.log(`      mint: ${utxo.mint?.toString()}`);
      });
    }
  } catch (e: any) {
    console.error("Scan failed:", e.message);
    console.error("Stack:", e.stack);
  }

  // Step 6: Check indexer stats
  console.log("\n--- Step 6: Checking indexer stats ---");
  try {
    const response = await fetch(`${INDEXER_ENDPOINT}/v1/stats`);
    const stats = await response.json();
    console.log("Indexer stats:", JSON.stringify(stats, null, 2));
  } catch (e: any) {
    console.error("Failed to fetch indexer stats:", e.message);
  }

  console.log("\n=== Debug Complete ===");
}

main().catch(e => {
  console.error("Script failed:", e);
  process.exit(1);
});
