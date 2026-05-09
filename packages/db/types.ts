// THIS FILE IS THE CONTRACT BETWEEN FRONTEND AND BACKEND.
// Any change requires updating both agents.

export type Category =
  | "MUSIC"
  | "ART"
  | "WRITING"
  | "DEVELOPMENT"
  | "GAMING"
  | "EDUCATION"
  | "OTHER";

// Returned by GET /api/creators/:slug (public, no sensitive data)
export interface CreatorPublic {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  category: Category;
  umbraRegistered: boolean;
  walletAddress: string;
  tiers: TierPublic[];
  stats: {
    totalSupportEvents: number;
  };
}

// Returned by GET /api/dashboard (creator only, more data)
export interface CreatorFull extends CreatorPublic {
  createdAt: string;
  stats: {
    totalSupportEvents: number;
    claimedEvents: number;
    pendingEvents: number;
    totalVolumeUsdc: number;
    recentEvents: SupportEventPublic[];
  };
}

export interface TierPublic {
  id: string;
  name: string;
  amountUsdc: number;
  description: string;
  sortOrder: number;
}

// INTENTIONALLY MINIMAL — no patron wallet address stored
export interface SupportEventPublic {
  id: string;
  amountUsdc: number;
  utxoSignature: string | null;
  claimedAt: string | null;
  createdAt: string;
}

// Standard API error shape — all error responses match this
export interface ApiError {
  error: string;
  code: string;
}

// Standard API success wrapper
export interface ApiSuccess<T> {
  data: T;
}
