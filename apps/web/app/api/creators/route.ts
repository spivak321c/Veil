import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCreatorSchema } from "@/lib/validation";
import { getAuthFromRequest } from "@/lib/middleware";
import type { CreatorPublic, TierPublic, Category } from "@veil/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const parsed = createCreatorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { slug, displayName, bio, avatarUrl, category, tiers } = parsed.data;

    // Check if slug is taken
    const existing = await prisma.creator.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already taken", code: "SLUG_CONFLICT" },
        { status: 409 }
      );
    }

    // Check if wallet already has a creator profile
    const existingWallet = await prisma.creator.findUnique({
      where: { walletAddress: auth.walletAddress },
    });
    if (existingWallet) {
      return NextResponse.json(
        { error: "Wallet already has a creator profile", code: "WALLET_CONFLICT" },
        { status: 409 }
      );
    }

    const creator = await prisma.creator.create({
      data: {
        walletAddress: auth.walletAddress,
        slug,
        displayName,
        bio,
        avatarUrl: avatarUrl || null,
        category,
        tiers: {
          create: tiers.map((t, i) => ({
            name: t.name,
            amountUsdc: t.amountUsdc,
            description: t.description,
            sortOrder: i,
          })),
        },
      },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });

    // Count support events
    const totalSupportEvents = await prisma.supportEvent.count({
      where: { creatorId: creator.id },
    });

    const result: CreatorPublic = {
      id: creator.id,
      slug: creator.slug,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      category: creator.category,
      umbraRegistered: creator.umbraRegistered,
      walletAddress: creator.walletAddress,
      tiers: creator.tiers.map((t: { id: string; name: string; amountUsdc: number; description: string; sortOrder: number }): TierPublic => ({
        id: t.id,
        name: t.name,
        amountUsdc: t.amountUsdc,
        description: t.description,
        sortOrder: t.sortOrder,
      })),
      stats: { totalSupportEvents },
    };

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/creators] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where = category && category !== "ALL"
      ? { category: category as any }
      : {};

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        include: { tiers: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.creator.count({ where }),
    ]);

    // Batch count support events for all creators
    const creatorIds = creators.map((c: { id: string }) => c.id);
    const eventCounts = await prisma.supportEvent.groupBy({
      by: ["creatorId"],
      where: { creatorId: { in: creatorIds } },
      _count: { id: true },
    });

    const countMap = new Map(
      eventCounts.map((ec: { creatorId: string; _count: { id: number } }) => [ec.creatorId, ec._count.id])
    );

    const data: CreatorPublic[] = creators.map((creator: { 
      id: string; 
      slug: string; 
      displayName: string; 
      bio: string; 
      avatarUrl: string | null; 
      category: Category; 
      umbraRegistered: boolean; 
      walletAddress: string;
      tiers: { id: string; name: string; amountUsdc: number; description: string; sortOrder: number }[];
    }) => ({
      id: creator.id,
      slug: creator.slug,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      category: creator.category as Category,
      umbraRegistered: creator.umbraRegistered,
      walletAddress: creator.walletAddress,
      tiers: creator.tiers.map((t: { id: string; name: string; amountUsdc: number; description: string; sortOrder: number }): TierPublic => ({
        id: t.id,
        name: t.name,
        amountUsdc: t.amountUsdc,
        description: t.description,
        sortOrder: t.sortOrder,
      })),
      stats: {
        totalSupportEvents: countMap.get(creator.id) ?? 0,
      },
    }));

    return NextResponse.json({ data, total }, { status: 200 });
  } catch (e) {
    console.error("[GET /api/creators] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
