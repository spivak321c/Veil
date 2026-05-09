import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyRequestSchema } from "@/lib/validation";
import { signJwt, buildSessionCookie } from "@/lib/auth";
import nacl from "tweetnacl";
import bs58 from "bs58";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = verifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { walletAddress, signature, nonce } = parsed.data;

    // 1. Look up the nonce
    const storedNonce = await prisma.authNonce.findUnique({
      where: { walletAddress },
    });

    if (!storedNonce || storedNonce.nonce !== nonce) {
      return NextResponse.json(
        { error: "Invalid nonce", code: "INVALID_NONCE" },
        { status: 400 }
      );
    }

    // 2. Check expiry
    if (new Date() > storedNonce.expiresAt) {
      // Clean up expired nonce
      await prisma.authNonce.delete({ where: { walletAddress } });
      return NextResponse.json(
        { error: "Nonce expired", code: "NONCE_EXPIRED" },
        { status: 410 }
      );
    }

    // 3. Reconstruct the message that the frontend signed
    const message = `Sign in to Veil\n\nNonce: ${nonce}\nExpires: ${storedNonce.expiresAt.toISOString()}`;
    const messageBytes = new TextEncoder().encode(message);

    // 4. Verify Ed25519 signature using tweetnacl
    let signatureBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(signature);
    } catch {
      return NextResponse.json(
        { error: "Invalid signature encoding", code: "INVALID_SIGNATURE" },
        { status: 400 }
      );
    }

    let publicKeyBytes: Uint8Array;
    try {
      publicKeyBytes = bs58.decode(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address", code: "INVALID_ADDRESS" },
        { status: 400 }
      );
    }

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Signature verification failed", code: "INVALID_SIGNATURE" },
        { status: 401 }
      );
    }

    // 5. Delete the used nonce
    await prisma.authNonce.delete({ where: { walletAddress } });

    // 6. Sign JWT and set httpOnly cookie
    const token = await signJwt(walletAddress);
    const cookie = buildSessionCookie(token);

    const response = NextResponse.json(
      { data: { token, expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString() } },
      { status: 200 }
    );
    response.headers.set("Set-Cookie", cookie);

    return response;
  } catch (e) {
    console.error("[POST /api/auth/verify] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
