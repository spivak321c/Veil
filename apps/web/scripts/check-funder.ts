/**
 * check-funder.ts — Verify funder keypair loads and has sufficient SOL balance
 * Usage: bun run scripts/check-funder.ts
 */
import { config } from "dotenv";
config({ path: ".env" });

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const FUNDER_PATH = process.env.FUNDER_KEYPAIR_PATH ?? path.join(__dirname, "funder.json");

async function main(): Promise<void> {
  // Load keypair
  if (!fs.existsSync(FUNDER_PATH)) {
    console.error(`Funder keypair not found at: ${FUNDER_PATH}`);
    console.error("Place your funder.json in the scripts/ directory.");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(FUNDER_PATH, "utf-8")) as number[];
  const keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  const address = keypair.publicKey.toBase58();

  console.log("Funder address:", address);

  // Check balance
  const connection = new Connection(RPC_URL, "confirmed");
  const balance = await connection.getBalance(keypair.publicKey);
  const sol = balance / LAMPORTS_PER_SOL;

  console.log(`Balance: ${sol} SOL`);

  if (sol < 1) {
    console.warn("\nWARNING: Balance is low. Run:");
    console.warn(`  solana airdrop 2 ${address} --url devnet`);
  } else {
    console.log("Funder is ready.");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
