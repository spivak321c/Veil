import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/middleware";
import { claimEventSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ eventId: string }> };

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

    const { eventId } = await context.params;

    const body: unknown = await req.json();
    const parsed = claimEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Find the event
    const event = await prisma.supportEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return NextResponse.json(
        { error: "Event not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify the event belongs to the authenticated creator
    const creator = await prisma.creator.findUnique({
      where: { walletAddress: auth.walletAddress },
    });
    if (!creator || creator.id !== event.creatorId) {
      return NextResponse.json(
        { error: "Not authorized", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await prisma.supportEvent.update({
      where: { id: eventId },
      data: { claimedAt: new Date(parsed.data.claimedAt) },
    });

    return NextResponse.json(
      { data: { ok: true } },
      { status: 200 }
    );
  } catch (e) {
    console.error("[PATCH /api/events/:eventId/claimed] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
