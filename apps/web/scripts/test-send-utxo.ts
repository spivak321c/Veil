/**
 * Test script: Send UTXO using SDK v4 new format
 * 
 * Usage: bun run scripts/test-send-utxo.ts
 * 
 * This creates a proper UTXO that getClaimableUtxoScannerFunction can find.
 * Requires: .env.local with NEXT_PUBLIC_SOLANA_RPC_URL, NEXT_PUBLIC_USDC_MINT
 * Requires: funder.json keypair with SOL and USDC
 */

import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  getUserAccountQuerierFunction,
  createSignerFromPrivateKeyBytes,
} from "@umbra-privacy/sdk";
import {
  getUserRegistrationProver,
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
} from "@umbra-privacy/web-zk-prover";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const DEVNET_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT || "4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7";
const INDEXER_ENDPOINT = "https://utxo-indexer.api-devnet.umbraprivacy.com";

// Creator wallet that should receive the UTXO
const CREATOR_WALLET = "25R8xdYeGvhYNAso5CwqEbx5KnBdnwzXzhp2FHRxdZJh";

async function main() {
  console.log("=== Test Send UTXO (SDK v4 Format) ===\n");
  console.log("Creator wallet:", CREATOR_WALLET);
  console.log("USDC Mint:", USDC_MINT);

  // Step 1: Load funder keypair
  console.log("\n--- Step 1: Loading funder keypair ---");
  const funderPath = path.resolve(process.cwd(), "scripts/funder.json");
  if (!fs.existsSync(funderPath)) {
    console.error("funder.json not found at:", funderPath);
    console.log("Please create it first: solana-keygen new -o scripts/funder.json");
    process.exit(1);
  }

  const funderSecret = JSON.parse(fs.readFileSync(funderPath, "utf-8"));
  const funderKeypair = Keypair.fromSecretKey(new Uint8Array(funderSecret));
  console.log("Funder address:", funderKeypair.publicKey.toString());

  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  // Check SOL balance
  const solBalance = await connection.getBalance(funderKeypair.publicKey);
  console.log("Funder SOL balance:", solBalance / LAMPORTS_PER_SOL);

  if (solBalance < 0.5 * LAMPORTS_PER_SOL) {
    console.log("Airdropping SOL to funder...");
    const airdrop = await connection.requestAirdrop(funderKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdrop);
    console.log("Airdrop complete");
  }

  // Check USDC balance
  const usdcMintPk = new PublicKey(USDC_MINT);
  let funderUsdcAta: PublicKey;
  try {
    funderUsdcAta = (await getOrCreateAssociatedTokenAccount(
      connection,
      funderKeypair,
      usdcMintPk,
      funderKeypair.publicKey
    )).address;
    
    const usdcBalance = await connection.getTokenAccountBalance(funderUsdcAta);
    console.log("Funder USDC balance:", usdcBalance.value.uiAmountString);
    
    if (Number(usdcBalance.value.amount) < 10_000_000) {
      console.log("\nWARNING: Funder has insufficient USDC balance < 10.0 USDC");
      console.log("Please fund the funder wallet with devnet USDC from:");
      console.log("https://faucet.umbraprivacy.com");
      console.log("\nContinuing anyway to check registration status...\n");
    }
  } catch (e: any) {
    console.log("USDC ATA doesn't exist:", e.message);
    console.log("Creating ATA...");
    funderUsdcAta = (await getOrCreateAssociatedTokenAccount(
      connection,
      funderKeypair,
      usdcMintPk,
      funderKeypair.publicKey
    )).address;
  }

  // Step 2: Create SDK signer from funder private key bytes
  console.log("\n--- Step 2: Creating SDK signer ---");
  const funderSecretKey = funderKeypair.secretKey;
  const signer = await createSignerFromPrivateKeyBytes(new Uint8Array(funderSecretKey));
  console.log("SDK signer address:", signer.address.toString());

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
  console.log("Has fetchUtxoData:", typeof (client as any).fetchUtxoData);
  console.log("Has fetchMerkleProof:", typeof (client as any).fetchMerkleProof);

  // Step 4: Register funder for Umbra
  console.log("\n--- Step 4: Registering funder for Umbra ---");
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

  // Verify funder registration
  const queryUser = getUserAccountQuerierFunction({ client });
  const funderAccount = await queryUser(signer.address);
  console.log("Funder account state:", funderAccount.state);
  if (funderAccount.state === "exists") {
    console.log("  Anonymous usage enabled:", funderAccount.data.isActiveForAnonymousUsage);
  }

  // Step 5: Check creator registration
  console.log("\n--- Step 5: Checking creator registration ---");
  try {
    const creatorAccount = await queryUser(CREATOR_WALLET as any);
    console.log("Creator account state:", creatorAccount.state);
    if (creatorAccount.state === "exists") {
      console.log("  Anonymous usage enabled:", creatorAccount.data.isActiveForAnonymousUsage);
    }
  } catch (e: any) {
    console.error("Creator not registered:", e.message);
    console.log("Creator must register with Umbra before receiving UTXOs");
  }

  // Step 6: Create UTXO to creator
  console.log("\n--- Step 6: Creating UTXO to creator ---");
  const utxoZkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver: utxoZkProver }
  );

  const amount = 1_000_000n; // 1 USDC
  console.log("Creating UTXO with amount:", amount, "to:", CREATOR_WALLET);
  
  try {
    const utxoResult = await createUtxo({
      destinationAddress: CREATOR_WALLET as any,
      mint: USDC_MINT as any,
      amount,
    });
    console.log("UTXO created successfully!");
    console.log("Result:", JSON.stringify(utxoResult, null, 2));
    
    if (utxoResult.createUtxoSignature) {
      console.log("\n=== UTXO Transaction Signature ===");
      console.log(utxoResult.createUtxoSignature);
      console.log(`\nView on Solana Explorer: https://solscan.io/tx/${utxoResult.createUtxoSignature}?cluster=devnet`);
    }
  } catch (e: any) {
    console.error("UTXO creation failed:", e.message);
    console.error("Stack:", e.stack);
  }

  console.log("\n=== Test Complete ===");
  console.log("\nNext steps:");
  console.log("1. Wait 30 seconds for indexer to process");
  console.log("2. Go to creator dashboard and click 'Claim'");
  console.log("3. The scanner should now find the UTXO");
}

main().catch(e => {
  console.error("Script failed:", e);
  process.exit(1);
});
