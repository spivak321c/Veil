/**
 * Test script: Full UTXO flow (create → scan → claim)
 * 
 * Usage: npx tsx scripts/test-utxo-flow.ts
 * 
 * This script:
 * 1. Creates a test UTXO using the NEW SDK format
 * 2. Scans for UTXOs
 * 3. Claims any found UTXOs
 * 
 * Requires: .env.local with NEXT_PUBLIC_SOLANA_RPC_URL, NEXT_PUBLIC_USDC_MINT
 */

import {
  createInMemorySigner,
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  getClaimableUtxoScannerFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getUmbraRelayer,
  getUserAccountQuerierFunction,
} from "@umbra-privacy/sdk";
import {
  getUserRegistrationProver,
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
} from "@umbra-privacy/web-zk-prover";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const DEVNET_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT || "4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7";
const INDEXER_ENDPOINT = "https://utxo-indexer.api-devnet.umbraprivacy.com";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== UTXO Flow Test ===\n");
  console.log("RPC:", DEVNET_RPC);
  console.log("USDC Mint:", USDC_MINT);
  console.log("Indexer:", INDEXER_ENDPOINT);

  // Step 1: Create test signer
  console.log("\n--- Step 1: Creating test signer ---");
  const signer = createInMemorySigner();
  console.log("Signer address:", signer.address.toString());

  // Step 2: Fund with SOL and USDC
  console.log("\n--- Step 2: Funding wallet ---");
  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  // Check SOL balance
  const solBalance = await connection.getBalance(new PublicKey(signer.address.toString()));
  console.log("Current SOL balance:", solBalance / LAMPORTS_PER_SOL);

  if (solBalance < 0.5 * LAMPORTS_PER_SOL) {
    console.log("Airdropping SOL...");
    const airdrop = await connection.requestAirdrop(new PublicKey(signer.address.toString()), 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdrop);
    console.log("Airdrop complete");
  }

  // Check USDC balance
  const usdcMintPk = new PublicKey(USDC_MINT);
  let usdcAta: PublicKey;
  try {
    usdcAta = await getOrCreateAssociatedTokenAccount(
      connection,
      signer as any,
      usdcMintPk,
      new PublicKey(signer.address.toString())
    ).then(ata => ata.address);
    
    const usdcBalance = await connection.getTokenAccountBalance(usdcAta);
    console.log("Current USDC balance:", usdcBalance.value.uiAmountString);
    
    if (Number(usdcBalance.value.amount) < 10_000_000) {
      console.log("Minting 100 USDC for testing...");
      // Need a mint authority - in devnet this might not work
      // Skip if we can't mint
      console.log("WARNING: Cannot auto-mint USDC. Please fund wallet manually.");
    }
  } catch (e: any) {
    console.log("USDC ATA doesn't exist:", e.message);
    console.log("Please fund wallet with USDC manually");
  }

  // Step 3: Initialize Umbra client
  console.log("\n--- Step 3: Initializing Umbra client ---");
  const client = await getUmbraClient({
    signer,
    network: "devnet",
    rpcUrl: DEVNET_RPC,
    rpcSubscriptionsUrl: DEVNET_WSS,
    indexerApiEndpoint: INDEXER_ENDPOINT,
    deferMasterSeedSignature: true,
  });

  console.log("Client initialized");
  console.log("Client has fetchUtxoData:", typeof client.fetchUtxoData);
  console.log("Client has fetchMerkleProof:", typeof client.fetchMerkleProof);

  // Step 4: Register for Umbra
  console.log("\n--- Step 4: Registering for Umbra ---");
  const zkProver = getUserRegistrationProver();
  const register = getUserRegistrationFunction({ client }, { zkProver });
  
  try {
    const regResult = await register({
      confidential: true,
      anonymous: true,
    });
    console.log("Registration complete:", regResult);
  } catch (e: any) {
    if (e.message?.includes("already")) {
      console.log("Already registered (idempotent)");
    } else {
      console.error("Registration failed:", e);
      throw e;
    }
  }

  // Verify registration
  const queryUser = getUserAccountQuerierFunction({ client });
  const userAccount = await queryUser(signer.address);
  console.log("User account state:", userAccount.state);
  if (userAccount.state === "exists") {
    console.log("Anonymous usage enabled:", userAccount.data.isActiveForAnonymousUsage);
  }

  // Step 5: Create a UTXO (send to self for testing)
  console.log("\n--- Step 5: Creating UTXO (send to self) ---");
  const utxoZkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver: utxoZkProver }
  );

  const amount = 1_000_000n; // 1 USDC
  console.log("Creating UTXO with amount:", amount);
  
  try {
    const utxoResult = await createUtxo({
      destinationAddress: signer.address,
      mint: USDC_MINT as any,
      amount,
    });
    console.log("UTXO created:", utxoResult);
  } catch (e: any) {
    console.error("UTXO creation failed:", e.message);
    console.log("This might be due to insufficient USDC balance");
    console.log("Skipping UTXO creation, proceeding to scan...");
  }

  // Step 6: Scan for UTXOs
  console.log("\n--- Step 6: Scanning for UTXOs ---");
  const scan = getClaimableUtxoScannerFunction({ client });
  
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

  // Step 7: Claim UTXOs
  if (scanResult.received.length > 0) {
    console.log("\n--- Step 7: Claiming UTXOs ---");
    const claimZkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
    const relayer = getUmbraRelayer({
      apiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
    });

    const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client },
      { zkProver: claimZkProver, relayer }
    );

    try {
      const claimResult = await claim(scanResult.received);
      console.log("Claim complete:", claimResult);
    } catch (e: any) {
      console.error("Claim failed:", e.message);
    }
  }

  console.log("\n=== Test Complete ===");
}

main().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
