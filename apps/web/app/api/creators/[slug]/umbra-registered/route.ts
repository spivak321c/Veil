import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/middleware";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { slug } = await context.params;

    // Verify ownership
    const creator = await prisma.creator.findUnique({ where: { slug } });
    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (creator.walletAddress !== auth.walletAddress) {
      return NextResponse.json(
        { error: "Not authorized", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Idempotent — safe to call multiple times
    await prisma.creator.update({
      where: { slug },
      data: { umbraRegistered: true },
    });

    return NextResponse.json(
      { data: { umbraRegistered: true } },
      { status: 200 }
    );
  } catch (e) {
    console.error("[POST /api/creators/:slug/umbra-registered] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
