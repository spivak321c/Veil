/**
 * seed-creators.ts — Seed the database with test creators for the explore page
 * Usage: bun run scripts/seed-creators.ts
 * Requires DATABASE_URL to be set in .env.local
 */
import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient } from "../node_modules/.prisma/client";

const prisma = new PrismaClient();

const SEED_CREATORS = [
  {
    walletAddress: "DevSeed1111111111111111111111111111111111111",
    slug: "0xdesigner",
    displayName: "0xDesigner",
    bio: "Visualizing the decentralized web. Creating UI/UX concepts for the next generation of privacy-first applications.",
    category: "ART" as const,
    umbraRegistered: true,
    tiers: [
      { name: "Supporter", amountUsdc: 5_000_000, description: "Buy me a coffee", sortOrder: 0 },
      { name: "Patron", amountUsdc: 25_000_000, description: "Monthly design supporter", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed2222222222222222222222222222222222222",
    slug: "alice-dev",
    displayName: "Alice Dev",
    bio: "Building open source ZK infrastructure. Core contributor to privacy tooling on Solana.",
    category: "DEVELOPMENT" as const,
    umbraRegistered: true,
    tiers: [
      { name: "Coffee", amountUsdc: 3_000_000, description: "Keep me caffeinated", sortOrder: 0 },
      { name: "Sponsor", amountUsdc: 50_000_000, description: "Sponsor a feature", sortOrder: 1 },
      { name: "Enterprise", amountUsdc: 200_000_000, description: "Priority support & features", sortOrder: 2 },
    ],
  },
  {
    walletAddress: "DevSeed3333333333333333333333333333333333333",
    slug: "beats-by-bob",
    displayName: "Beats By Bob",
    bio: "Lo-Fi cryptography beats to code to. Producing ambient music for the builder community.",
    category: "MUSIC" as const,
    umbraRegistered: true,
    tiers: [
      { name: "Listener", amountUsdc: 2_000_000, description: "Thanks for listening", sortOrder: 0 },
      { name: "Fan", amountUsdc: 10_000_000, description: "Early access to new tracks", sortOrder: 1 },
      { name: "Producer", amountUsdc: 100_000_000, description: "Custom beat request", sortOrder: 2 },
    ],
  },
];

async function main(): Promise<void> {
  console.log("Seeding creators...");

  for (const data of SEED_CREATORS) {
    const { tiers, ...creatorData } = data;

    const existing = await prisma.creator.findUnique({
      where: { slug: creatorData.slug },
    });

    if (existing) {
      console.log(`  Skipping "${creatorData.slug}" (already exists)`);
      continue;
    }

    await prisma.creator.create({
      data: {
        ...creatorData,
        tiers: {
          create: tiers,
        },
      },
    });

    console.log(`  Created "${creatorData.slug}"`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
