import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, SystemProgram, Transaction, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const FUNDER_KEYPAIR_PATH = process.env.FUNDER_KEYPAIR_PATH ?? "./scripts/funder.json";

const SOL_AMOUNT = 2; // SOL to send
const LAMPORTS_PER_SOL = 1_000_000_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    let targetPubkey: PublicKey;
    try {
      targetPubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Load funder keypair
    if (!fs.existsSync(FUNDER_KEYPAIR_PATH)) {
      console.error(`Funder keypair not found at: ${FUNDER_KEYPAIR_PATH}`);
      return NextResponse.json(
        { error: "Funder keypair not configured on server" },
        { status: 500 }
      );
    }

    const raw = JSON.parse(fs.readFileSync(FUNDER_KEYPAIR_PATH, "utf-8")) as number[];
    const funderKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
    const funderPubkey = funderKeypair.publicKey;

    const connection = new Connection(RPC_URL, "confirmed");

    // Check funder balance
    const funderBalance = await connection.getBalance(funderPubkey);
    const minFunderBalance = (SOL_AMOUNT + 0.001) * LAMPORTS_PER_SOL; // + fee buffer

    if (funderBalance < minFunderBalance) {
      return NextResponse.json(
        { error: "Funder wallet is low on SOL. Please contact the team to top it up." },
        { status: 500 }
      );
    }

    // Transfer SOL from funder to target
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: funderPubkey,
        toPubkey: targetPubkey,
        lamports: SOL_AMOUNT * LAMPORTS_PER_SOL,
      })
    );

    const sig = await connection.sendTransaction(transaction, [funderKeypair]);
    await connection.confirmTransaction(sig, "confirmed");

    return NextResponse.json({
      data: {
        solAmount: SOL_AMOUNT,
        signature: sig,
        explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      },
    });
  } catch (err: unknown) {
    console.error("[DEVNET FAUCET] Error:", err);

    const message = err instanceof Error ? err.message : "Failed to fund wallet";

    if (message.includes("429") || message.includes("too many requests")) {
      return NextResponse.json(
        { error: "Rate limited. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
