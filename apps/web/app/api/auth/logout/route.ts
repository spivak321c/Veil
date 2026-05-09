import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json(
    { data: { ok: true } },
    { status: 200 }
  );
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
