/**
 * Dev-only airdrop endpoint for testing
 * POST /api/dev/airdrop
 * 
 * Body: { walletAddress: string, amountSol?: number }
 * Returns: { signature: string, newBalance: number }
 * 
 * WARNING: This endpoint only works on devnet and is intended
 * for development/testing purposes only.
 */
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { z } from "zod";

const airdropSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  amountSol: z.number().min(0.1).max(10).default(2),
});

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Safety check: only allow on devnet
  if (NETWORK !== "devnet") {
    return NextResponse.json(
      { error: "Airdrop endpoint only available on devnet", code: "WRONG_NETWORK" },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await req.json();
    const parsed = airdropSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { walletAddress, amountSol } = parsed.data;

    // Validate the wallet address
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address", code: "INVALID_ADDRESS" },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");

    // Request airdrop
    const signature = await connection.requestAirdrop(
      pubkey,
      Math.floor(amountSol * LAMPORTS_PER_SOL)
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");

    // Get new balance
    const newBalance = await connection.getBalance(pubkey);

    return NextResponse.json({
      data: {
        signature,
        newBalance: newBalance / LAMPORTS_PER_SOL,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("[POST /api/dev/airdrop] error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Handle specific Solana errors
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limited by Solana devnet. Try again in a few seconds.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Airdrop failed", code: "AIRDROP_FAILED", details: errorMessage },
      { status: 500 }
    );
  }
}

// Also support GET for checking status
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    data: {
      network: NETWORK,
      available: NETWORK === "devnet",
      endpoint: "POST /api/dev/airdrop",
      body: {
        walletAddress: "string (required) - Solana wallet address",
        amountSol: "number (optional) - Amount of SOL to airdrop (0.1-10, default: 2)"
      }
    }
  });
}
