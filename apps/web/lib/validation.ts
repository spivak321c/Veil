import { z } from "zod";

// ---------- Shared enums ----------
export const CategoryEnum = z.enum([
  "MUSIC",
  "ART",
  "WRITING",
  "DEVELOPMENT",
  "GAMING",
  "EDUCATION",
  "OTHER",
]);

// ---------- Auth ----------
export const nonceRequestSchema = z.object({
  walletAddress: z.string().min(32).max(64),
});

export const verifyRequestSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

// ---------- Creator ----------
export const createCreatorSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  category: CategoryEnum,
  tiers: z.array(
    z.object({
      name: z.string().min(1).max(50),
      amountUsdc: z.number().int().min(1_000_000), // min 1 USDC in micro-USDC
      description: z.string().max(300),
    })
  ).default([]),
});

export const updateCreatorSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")).optional(),
  category: CategoryEnum.optional(),
});

export const replaceTiersSchema = z.object({
  tiers: z.array(
    z.object({
      name: z.string().min(1).max(50),
      amountUsdc: z.number().int().min(1_000_000),
      description: z.string().max(300),
    })
  ),
});

// ---------- Events ----------
export const createEventSchema = z.object({
  creatorSlug: z.string().min(1),
  amountUsdc: z.number().int().min(1),
  utxoSignature: z.string().min(1),
});

export const claimEventSchema = z.object({
  claimedAt: z.string().datetime(),
});
