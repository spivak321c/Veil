/**
 * fund-usdc.ts — Fund wallets with test USDC on devnet
 * Usage: bun run scripts/fund-usdc.ts <wallet-address> [amount-usdc]
 * 
 * Mints test USDC tokens to the specified wallet address.
 * Requires funder keypair to be the mint authority or have sufficient USDC.
 */
import { config } from "dotenv";
config({ path: ".env" });

import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createMint, createAssociatedTokenAccount, mintTo, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const FUNDER_PATH = process.env.FUNDER_KEYPAIR_PATH ?? path.join(__dirname, "funder.json");
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? "";

// Test USDC mint address on devnet (if not provided via env)
const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: bun run scripts/fund-usdc.ts <wallet-address> [amount-usdc]");
    console.error("  wallet-address: Target wallet address to receive USDC");
    console.error("  amount-usdc: Amount in USDC (default: 100)");
    process.exit(1);
  }

  const targetAddress = args[0]!;
  const amountUsdc = parseFloat(args[1] ?? "100");

  // Load funder keypair
  if (!fs.existsSync(FUNDER_PATH)) {
    console.error(`Funder keypair not found at: ${FUNDER_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(FUNDER_PATH, "utf-8")) as number[];
  const funderKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));

  let targetPubkey: PublicKey;
  try {
    targetPubkey = new PublicKey(targetAddress);
  } catch {
    console.error("Invalid wallet address:", targetAddress);
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const usdcMint = new PublicKey(USDC_MINT || DEVNET_USDC_MINT);

  console.log(`Funding ${amountUsdc} USDC to ${targetAddress}...`);
  console.log(`Using USDC mint: ${usdcMint.toBase58()}`);
  console.log(`Funder: ${funderKeypair.publicKey.toBase58()}`);

  // Get or create the funder's token account
  const funderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    funderKeypair,
    usdcMint,
    funderKeypair.publicKey
  );

  // Get or create the target's token account
  const targetTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    funderKeypair,
    usdcMint,
    targetPubkey
  );

  console.log(`Funder ATA: ${funderTokenAccount.address.toBase58()}`);
  console.log(`Target ATA: ${targetTokenAccount.address.toBase58()}`);

  // Mint USDC to the target (micro-USDC = 6 decimals)
  const microUsdc = Math.floor(amountUsdc * 1_000_000);
  
  try {
    const sig = await mintTo(
      connection,
      funderKeypair,
      usdcMint,
      targetTokenAccount.address,
      funderKeypair.publicKey,
      microUsdc
    );

    console.log(`✅ Minted ${amountUsdc} USDC successfully!`);
    console.log(`Transaction: ${sig}`);
    console.log(`Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  } catch (err) {
    console.error("Mint failed:", err);
    console.error("\nNote: The funder must be the mint authority for the USDC token.");
    console.error("If you're using a different USDC mint, ensure the funder has mint authority.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
