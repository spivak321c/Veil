import { SignJWT, jwtVerify } from "jose";
import { JWT_COOKIE_NAME } from "./constants";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");

export interface JwtPayload {
  walletAddress: string;
  iat: number;
  exp: number;
}

/** Sign a JWT for the given wallet address. Returns the token string. */
export async function signJwt(walletAddress: string): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  // Parse expiry string like "7d" into seconds
  const seconds = parseExpiry(expiresIn);

  const token = await new SignJWT({ walletAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + seconds)
    .sign(JWT_SECRET);

  return token;
}

/** Verify a JWT and return the payload, or null if invalid/expired. */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/** Build the Set-Cookie header value for the session cookie. */
export function buildSessionCookie(token: string): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  const maxAge = parseExpiry(expiresIn);
  return `${JWT_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/** Build a Set-Cookie header to clear the session. */
export function clearSessionCookie(): string {
  return `${JWT_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // default 7 days
  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;
  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 7 * 86400;
  }
}
