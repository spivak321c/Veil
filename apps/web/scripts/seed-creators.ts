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
    tiers: [
      { name: "Listener", amountUsdc: 2_000_000, description: "Thanks for listening", sortOrder: 0 },
      { name: "Fan", amountUsdc: 10_000_000, description: "Early access to new tracks", sortOrder: 1 },
      { name: "Producer", amountUsdc: 100_000_000, description: "Custom beat request", sortOrder: 2 },
    ],
  },
  {
    walletAddress: "DevSeed4444444444444444444444444444444444444",
    slug: "neon-canvas",
    displayName: "Neon Canvas",
    bio: "Pixel artist exploring synthwave landscapes and retro-futuristic cityscapes. Commissions open for album art and NFT collections.",
    category: "ART" as const,
    tiers: [
      { name: "Tip Jar", amountUsdc: 1_000_000, description: "Leave a small tip", sortOrder: 0 },
      { name: "Art Lover", amountUsdc: 15_000_000, description: "Monthly wallpaper pack", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed5555555555555555555555555555555555555",
    slug: "cipher-codes",
    displayName: "Cipher Codes",
    bio: "Teaching Rust and Solana development. Weekly tutorials on Anchor, ZK proofs, and building privacy-preserving dApps.",
    category: "EDUCATION" as const,
    tiers: [
      { name: "Student", amountUsdc: 5_000_000, description: "Access to written tutorials", sortOrder: 0 },
      { name: "Scholar", amountUsdc: 20_000_000, description: "Live coding sessions + source code", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed6666666666666666666666666666666666666",
    slug: "lyra-writes",
    displayName: "Lyra Writes",
    bio: "Sci-fi and fantasy novelist. Currently serializing a cyberpunk novella about AI rights and digital identity on Solana.",
    category: "WRITING" as const,
    tiers: [
      { name: "Reader", amountUsdc: 3_000_000, description: "Early chapter access", sortOrder: 0 },
      { name: "Patron", amountUsdc: 10_000_000, description: "Character name in next book", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed7777777777777777777777777777777777777",
    slug: "pixel-wizard",
    displayName: "PixelWizard",
    bio: "Indie game developer crafting a privacy-themed RPG for Solana browser. All sprites hand-drawn, all code open source.",
    category: "GAMING" as const,
    tiers: [
      { name: "Backer", amountUsdc: 5_000_000, description: "Devlog access + beta key", sortOrder: 0 },
      { name: "Game Master", amountUsdc: 25_000_000, description: "Name an NPC in the game", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed8888888888888888888888888888888888888",
    slug: "solar-sound",
    displayName: "Solar Sound",
    bio: "Ambient electronic producer making generative music from on-chain data. Every track is a unique snapshot of the Solana blockchain.",
    category: "MUSIC" as const,
    tiers: [
      { name: "Listener", amountUsdc: 2_000_000, description: "Stream all tracks", sortOrder: 0 },
      { name: "Collector", amountUsdc: 15_000_000, description: "Download lossless WAV files", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed9999999999999999999999999999999999999",
    slug: "zk-knit",
    displayName: "ZK Knit",
    bio: "Crocheting zero-knowledge amigurumi. I make plushie circuit boards and validation node dolls. Custom orders for dev conferences.",
    category: "OTHER" as const,
    tiers: [
      { name: "Yarn Sponsor", amountUsdc: 10_000_000, description: "Sponsor materials for next piece", sortOrder: 0 },
      { name: "Collector", amountUsdc: 50_000_000, description: "Custom amigurumi shipped to you", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed1010101010101010101010101010101010101",
    slug: "terra-code",
    displayName: "Terra Code",
    bio: "Rust backend engineer building DeFi infrastructure. Core contributor to liquid staking and MEV-resistant DEX designs.",
    category: "DEVELOPMENT" as const,
    tiers: [
      { name: "Coffee", amountUsdc: 3_000_000, description: "Keep me caffeinated", sortOrder: 0 },
      { name: "Reviewer", amountUsdc: 30_000_000, description: "PR review + architecture feedback", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed1110111011101110111011101110111011101",
    slug: "maya-makes",
    displayName: "Maya Makes",
    bio: "Digital illustrator and comic artist. Drawing a weekly webcomic about life as a woman in web3. Bright colors, big feelings.",
    category: "ART" as const,
    tiers: [
      { name: "Fan", amountUsdc: 3_000_000, description: "Ad-free comic access", sortOrder: 0 },
      { name: "Supporter", amountUsdc: 12_000_000, description: "Monthly print-quality wallpaper", sortOrder: 1 },
    ],
  },
  {
    walletAddress: "DevSeed1212121212121212121212121212121212121",
    slug: "dao-voices",
    displayName: "DAO Voices",
    bio: "On-chain governance researcher. Breaking down DAO proposals, voting patterns, and treasury analytics into digestible threads.",
    category: "EDUCATION" as const,
    tiers: [
      { name: "Follower", amountUsdc: 2_000_000, description: "Early access to research threads", sortOrder: 0 },
      { name: "Scholar", amountUsdc: 20_000_000, description: "Full reports + data exports", sortOrder: 1 },
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
