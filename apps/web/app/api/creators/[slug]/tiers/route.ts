import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { replaceTiersSchema } from "@/lib/validation";
import { getAuthFromRequest } from "@/lib/middleware";
import type { TierPublic } from "@veil/db";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PUT(
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
    const parsed = replaceTiersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Full replacement: delete all existing tiers then create new ones
    await prisma.tier.deleteMany({ where: { creatorId: creator.id } });

    const newTiers = await Promise.all(
      parsed.data.tiers.map((t, i) =>
        prisma.tier.create({
          data: {
            creatorId: creator.id,
            name: t.name,
            amountUsdc: t.amountUsdc,
            description: t.description,
            sortOrder: i,
          },
        })
      )
    );

    const result: TierPublic[] = newTiers.map((t: { id: string; name: string; amountUsdc: number; description: string; sortOrder: number }) => ({
      id: t.id,
      name: t.name,
      amountUsdc: t.amountUsdc,
      description: t.description,
      sortOrder: t.sortOrder,
    }));

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (e) {
    console.error("[PUT /api/creators/:slug/tiers] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
