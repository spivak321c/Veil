import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/middleware";
import type { CreatorFull, TierPublic, SupportEventPublic } from "@veil/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
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
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get aggregate stats — sequential to avoid exhausting Neon's 15-connection pool
    const totalSupportEvents = await prisma.supportEvent.count({
      where: { creatorId: creator.id },
    });
    const claimedEvents = await prisma.supportEvent.count({
      where: { creatorId: creator.id, claimedAt: { not: null } },
    });
    const totalVolumeResult = await prisma.supportEvent.aggregate({
      where: { creatorId: creator.id, claimedAt: { not: null } },
      _sum: { amountUsdc: true },
    });
    const recentEvents = await prisma.supportEvent.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const pendingEvents = totalSupportEvents - claimedEvents;
    const totalVolumeUsdc = totalVolumeResult._sum.amountUsdc ?? 0;

    const recentEventsMapped: SupportEventPublic[] = recentEvents.map((e: { 
      id: string; 
      amountUsdc: number; 
      message: string | null;
      isMessagePublic: boolean;
      utxoSignature: string | null; 
      claimedAt: Date | null; 
      createdAt: Date;
    }) => ({
      id: e.id,
      amountUsdc: e.amountUsdc,
      message: e.message,
      isMessagePublic: e.isMessagePublic,
      utxoSignature: e.utxoSignature,
      claimedAt: e.claimedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    }));

    const result: CreatorFull = {
      id: creator.id,
      slug: creator.slug,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      category: creator.category,
      umbraRegistered: creator.umbraRegistered,
      walletAddress: creator.walletAddress,
      createdAt: creator.createdAt.toISOString(),
      tiers: creator.tiers.map((t: { id: string; name: string; amountUsdc: number; description: string; sortOrder: number }): TierPublic => ({
        id: t.id,
        name: t.name,
        amountUsdc: t.amountUsdc,
        description: t.description,
        sortOrder: t.sortOrder,
      })),
      stats: {
        totalSupportEvents,
        claimedEvents,
        pendingEvents,
        totalVolumeUsdc,
        recentEvents: recentEventsMapped,
      },
    };

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (e) {
    console.error("[GET /api/dashboard] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
