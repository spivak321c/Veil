import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createEventSchema } from "@/lib/validation";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    console.log("[POST /api/events] Received body:", JSON.stringify(body, null, 2));
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[POST /api/events] Validation errors:", parsed.error.errors);
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { creatorSlug, amountUsdc, utxoSignature, message, isMessagePublic } = parsed.data;

    // Find creator by slug
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
    });
    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check for duplicate utxoSignature
    if (utxoSignature) {
      const existing = await prisma.supportEvent.findFirst({
        where: { utxoSignature },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Duplicate event", code: "DUPLICATE_EVENT" },
          { status: 409 }
        );
      }
    }

    const event = await prisma.supportEvent.create({
      data: {
        creatorId: creator.id,
        amountUsdc,
        message: message ?? null,
        isMessagePublic: isMessagePublic ?? true,
        utxoSignature,
      },
    });

    return NextResponse.json(
      { data: { eventId: event.id } },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/events] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
