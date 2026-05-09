/**
 * airdrop-sol.ts — Airdrop SOL to a wallet on devnet
 * Usage: bun run scripts/airdrop-sol.ts <wallet-address> [amount-sol]
 */
import { config } from "dotenv";
config({ path: ".env" });

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: bun run scripts/airdrop-sol.ts <wallet-address> [amount-sol]");
    process.exit(1);
  }

  const address = args[0]!;
  const amountSol = parseFloat(args[1] ?? "2");

  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(address);
  } catch {
    console.error("Invalid wallet address:", address);
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, "confirmed");

  console.log(`Airdropping ${amountSol} SOL to ${address}...`);

  const sig = await connection.requestAirdrop(
    pubkey,
    Math.floor(amountSol * LAMPORTS_PER_SOL)
  );

  await connection.confirmTransaction(sig, "confirmed");

  const balance = await connection.getBalance(pubkey);
  console.log(`Done. New balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

main().catch((err) => {
  console.error("Airdrop error:", err);
  process.exit(1);
});
