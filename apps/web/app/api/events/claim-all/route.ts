import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/middleware";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { walletAddress: auth.walletAddress },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const now = new Date();

    const result = await prisma.supportEvent.updateMany({
      where: {
        creatorId: creator.id,
        claimedAt: null,
      },
      data: {
        claimedAt: now,
      },
    });

    return NextResponse.json(
      { data: { claimed: result.count } },
      { status: 200 }
    );
  } catch (e) {
    console.error("[POST /api/events/claim-all] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
