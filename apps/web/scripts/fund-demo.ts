/**
 * fund-demo.ts — Fund all demo wallets with SOL and USDC for testing
 * Usage: bun run scripts/fund-demo.ts
 * 
 * This script:
 * 1. Loads demo wallets from demo-wallets.json
 * 2. Airdrops SOL to each wallet (default: 2 SOL)
 * 3. Mints test USDC to each wallet (default: 1000 USDC)
 */
import { config } from "dotenv";
config({ path: ".env" });

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const FUNDER_PATH = process.env.FUNDER_KEYPAIR_PATH ?? path.join(__dirname, "funder.json");
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

const DEFAULT_SOL_AMOUNT = 2;
const DEFAULT_USDC_AMOUNT = 1000;

interface DemoWallet {
  name: string;
  address: string;
  role: string;
  notes?: string;
}

interface DemoWalletsJson {
  description: string;
  wallets: DemoWallet[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestAirdrop(
  connection: Connection,
  pubkey: PublicKey,
  amountSol: number
): Promise<string> {
  const sig = await connection.requestAirdrop(
    pubkey,
    Math.floor(amountSol * LAMPORTS_PER_SOL)
  );
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

async function mintUsdc(
  connection: Connection,
  funderKeypair: Keypair,
  targetAddress: string,
  amountUsdc: number
): Promise<string> {
  const usdcMint = new PublicKey(USDC_MINT);
  const targetPubkey = new PublicKey(targetAddress);

  const targetTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    funderKeypair,
    usdcMint,
    targetPubkey
  );

  const microUsdc = Math.floor(amountUsdc * 1_000_000);
  
  const sig = await mintTo(
    connection,
    funderKeypair,
    usdcMint,
    targetTokenAccount.address,
    funderKeypair.publicKey,
    microUsdc
  );

  return sig;
}

async function main(): Promise<void> {
  console.log("========================================");
  console.log("Veil Demo Wallet Funding Script");
  console.log("========================================\n");

  // Load demo wallets
  const demoWalletsPath = path.join(__dirname, "demo-wallets.json");
  if (!fs.existsSync(demoWalletsPath)) {
    console.error(`Demo wallets file not found: ${demoWalletsPath}`);
    process.exit(1);
  }

  const demoData: DemoWalletsJson = JSON.parse(fs.readFileSync(demoWalletsPath, "utf-8"));
  
  // Load funder keypair
  if (!fs.existsSync(FUNDER_PATH)) {
    console.error(`Funder keypair not found at: ${FUNDER_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(FUNDER_PATH, "utf-8")) as number[];
  const funderKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));

  const connection = new Connection(RPC_URL, "confirmed");
  
  console.log(`Funder: ${funderKeypair.publicKey.toBase58()}`);
  
  // Check funder balance
  const funderBalance = await connection.getBalance(funderKeypair.publicKey);
  const funderSol = funderBalance / LAMPORTS_PER_SOL;
  console.log(`Funder Balance: ${funderSol} SOL\n`);

  const totalSolNeeded = demoData.wallets.length * DEFAULT_SOL_AMOUNT;
  if (funderSol < totalSolNeeded) {
    console.warn(`⚠️  Warning: Funder may not have enough SOL.`);
    console.warn(`   Required: ~${totalSolNeeded} SOL, Available: ${funderSol} SOL\n`);
  }

  console.log(`Found ${demoData.wallets.length} demo wallets to fund\n`);
  console.log(`Funding each with: ${DEFAULT_SOL_AMOUNT} SOL + ${DEFAULT_USDC_AMOUNT} USDC\n`);
  console.log("========================================\n");

  const results: { wallet: DemoWallet; solTx?: string; usdcTx?: string; error?: string }[] = [];

  for (let i = 0; i < demoData.wallets.length; i++) {
    const wallet = demoData.wallets[i];
    console.log(`[${i + 1}/${demoData.wallets.length}] ${wallet.name} (${wallet.role})`);
    console.log(`  Address: ${wallet.address}`);

    const result: { wallet: DemoWallet; solTx?: string; usdcTx?: string; error?: string } = { wallet };

    try {
      // Fund SOL
      process.stdout.write(`  Airdropping SOL... `);
      const solTx = await requestAirdrop(
        connection,
        new PublicKey(wallet.address),
        DEFAULT_SOL_AMOUNT
      );
      result.solTx = solTx;
      console.log(`✅`);
      console.log(`     Tx: ${solTx.slice(0, 20)}...`);

      // Small delay between operations
      await sleep(1000);

      // Fund USDC
      process.stdout.write(`  Minting USDC... `);
      const usdcTx = await mintUsdc(
        connection,
        funderKeypair,
        wallet.address,
        DEFAULT_USDC_AMOUNT
      );
      result.usdcTx = usdcTx;
      console.log(`✅`);
      console.log(`     Tx: ${usdcTx.slice(0, 20)}...`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.error = errorMsg;
      console.log(`❌ Error: ${errorMsg.slice(0, 100)}`);
    }

    results.push(result);
    console.log();

    // Delay between wallets to avoid rate limiting
    if (i < demoData.wallets.length - 1) {
      await sleep(2000);
    }
  }

  console.log("========================================");
  console.log("Funding Complete!");
  console.log("========================================\n");

  // Summary
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);

  console.log(`Successful: ${successful.length}/${demoData.wallets.length}`);
  console.log(`Failed: ${failed.length}/${demoData.wallets.length}\n`);

  if (failed.length > 0) {
    console.log("Failed wallets:");
    failed.forEach(r => {
      console.log(`  - ${r.wallet.name}: ${r.error?.slice(0, 80)}`);
    });
    console.log();
  }

  // Write results to log file
  const logPath = path.join(__dirname, "fund-demo-results.json");
  fs.writeFileSync(logPath, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    results 
  }, null, 2));
  console.log(`Results logged to: ${logPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
