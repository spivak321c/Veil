import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateCreatorSchema } from "@/lib/validation";
import { getAuthFromRequest } from "@/lib/middleware";
import type { CreatorPublic, TierPublic } from "@veil/db";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = await context.params;

    const creator = await prisma.creator.findUnique({
      where: { slug },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (e) {
    console.error("[GET /api/creators/:slug] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
        { error: "Not authorized to edit this profile", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body: unknown = await req.json();
    const parsed = updateCreatorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.displayName !== undefined) updateData.displayName = parsed.data.displayName;
    if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;
    if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl || null;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;

    const updated = await prisma.creator.update({
      where: { slug },
      data: updateData,
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });

    const totalSupportEvents = await prisma.supportEvent.count({
      where: { creatorId: updated.id },
    });

    const result: CreatorPublic = {
      id: updated.id,
      slug: updated.slug,
      displayName: updated.displayName,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      category: updated.category,
      umbraRegistered: updated.umbraRegistered,
      walletAddress: updated.walletAddress,
      tiers: updated.tiers.map((t: { id: string; name: string; amountUsdc: number; description: string; sortOrder: number }): TierPublic => ({
        id: t.id,
        name: t.name,
        amountUsdc: t.amountUsdc,
        description: t.description,
        sortOrder: t.sortOrder,
      })),
      stats: { totalSupportEvents },
    };

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (e) {
    console.error("[PATCH /api/creators/:slug] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
