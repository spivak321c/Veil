import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nonceRequestSchema } from "@/lib/validation";
import { randomBytes } from "crypto";
import { NONCE_EXPIRES_MINUTES } from "@/lib/constants";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const parsed = nonceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { walletAddress } = parsed.data;
    const nonce = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + NONCE_EXPIRES_MINUTES * 60 * 1000);

    // Upsert — one nonce per wallet at a time
    await prisma.authNonce.upsert({
      where: { walletAddress },
      update: { nonce, expiresAt },
      create: { walletAddress, nonce, expiresAt },
    });

    return NextResponse.json(
      { nonce, expiresAt: expiresAt.toISOString() },
      { status: 200 }
    );
  } catch (e) {
    console.error("[POST /api/auth/nonce] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
