import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, type JwtPayload } from "./auth";
import { JWT_COOKIE_NAME } from "./constants";

export interface AuthenticatedRequest extends NextRequest {
  auth: JwtPayload;
}

/**
 * Extracts and verifies the JWT from the session cookie.
 * Returns the payload if valid, or null if missing/invalid.
 */
export async function getAuthFromRequest(
  req: NextRequest
): Promise<JwtPayload | null> {
  const cookie = req.cookies.get(JWT_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyJwt(cookie.value);
}

/**
 * Higher-order function that wraps a route handler with auth check.
 * Passes the verified JwtPayload as the second argument.
 */
export function withAuth(
  handler: (
    req: NextRequest,
    auth: JwtPayload,
    context?: Record<string, unknown>
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context?: Record<string, unknown>
  ): Promise<NextResponse> => {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    return handler(req, auth, context);
  };
}
