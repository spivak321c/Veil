# AGENTS.md — Veil Patronage
**For AI agents and developers building this project.**  
**Read this file first. Read it entirely. Then read PRD.md.**

---




## What We Are Building

**Veil** is a privacy-first creator patronage app on **Solana Devnet**. Fans support creators using the **Umbra Mixer** — a ZK-proof + Merkle-tree system that severs the on-chain link between sender and receiver. Creators can generate **viewing keys** to prove aggregate revenue without revealing individual patrons.

**This is a devnet demo.** All transactions run on `https://api.devnet.solana.com`. The `funder.json` keypair in `scripts/` is used to airdrop SOL and mint test USDC to demo wallets. No real funds are involved.

This is NOT a DeFi app. This is NOT a token platform. This is a web application that uses two Umbra SDK primitives:
1. `getPublicBalanceToReceiverClaimableUtxoCreatorFunction` — anonymous patron sends test USDC
2. `getMonthlyViewingKeyDeriver` / `getYearlyViewingKeyDeriver` — creator proves revenue

Everything else is a standard Next.js web app with a PostgreSQL database.

---

## Agent Roles

This project is split across two parallel agents. If you are operating solo, complete tasks in the listed order. If running in parallel, respect the ownership boundaries below.

### Agent A — Backend & API
**Owns:** Everything under `apps/web/app/api/`, `packages/db/`, `lib/auth.ts`, `lib/db.ts`, `lib/validation.ts`, `lib/middleware.ts`, **`scripts/`** (all devnet funding scripts)

**Does NOT touch:**
- `app/(pages)/` directories (UI pages)
- `components/` directory
- `lib/umbra/` SDK hooks (those are client-only)

**Primary stack:** Prisma, Zod, JWT (jose library), Next.js Route Handlers, @solana/web3.js (scripts only)

---

### Agent B — Frontend & SDK Integration
**Owns:** `app/(pages)/`, `components/`, `lib/umbra/`, `styles/`

**Does NOT touch:**
- `app/api/` route handlers
- `packages/db/schema.prisma`
- `lib/auth.ts` (JWT signing logic)

**Primary stack:** React, Tailwind, Zustand, @umbra-privacy/sdk, @solana/wallet-adapter-react

---

## Repository Bootstrap (Agent A does this first)

```bash
# 1. Create workspace
bun create-turbo@latest veil --package-manager bun
cd veil

# 2. Remove example apps, scaffold ours
rm -rf apps/docs apps/web
mkdir -p apps/web packages/db

# 3. Init Next.js 14
cd apps/web
bun create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# 4. Init DB package
cd ../../packages/db
bun init
bun add prisma @prisma/client
bun prisma init

# 5. Install root dependencies
cd ../..
bun add -w -D typescript @types/node turbo

# 6. Web app dependencies
cd apps/web
bun add @umbra-privacy/sdk @umbra-privacy/web-zk-prover
bun add @solana/wallet-adapter-react @solana/wallet-adapter-base @solana/wallet-adapter-phantom @solana/wallet-adapter-solflare @solana/web3.js
bun add zustand zod jose tweetnacl @solana/spl-token
bun add canvas-confetti
bun add -D @types/canvas-confetti
```

---

## Shared Type Contract

**Both agents depend on this. Neither agent changes these types without notifying the other.**

File: `packages/db/types.ts`

```typescript
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
  walletAddress: string;   // needed by patron to send UTXO to creator
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
  amountUsdc: number;      // micro-USDC
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
```

---

## API Contract (Backend → Frontend)

Agent A implements these. Agent B consumes them. Do not deviate from these signatures.

```
POST   /api/auth/nonce           → { nonce: string, expiresAt: string }
POST   /api/auth/verify          → sets httpOnly cookie "veil_session"
POST   /api/auth/logout          → clears cookie

POST   /api/creators             → { data: CreatorPublic }
GET    /api/creators             → { data: CreatorPublic[], total: number }
GET    /api/creators/:slug       → { data: CreatorPublic }
PATCH  /api/creators/:slug       → { data: CreatorPublic }
PUT    /api/creators/:slug/tiers → { data: TierPublic[] }
POST   /api/creators/:slug/umbra-registered → { data: { umbraRegistered: true } }

POST   /api/events               → { data: { eventId: string } }
PATCH  /api/events/:id/claimed   → { data: { ok: true } }

GET    /api/dashboard            → { data: CreatorFull }
```

All error responses: HTTP 4xx/5xx + `{ error: string, code: string }`

All success responses: HTTP 2xx + `{ data: T }`

---

## Environment Variables

Both agents need `.env.local`. Copy `.env.example` and fill in:

```bash
# Solana — DEVNET ONLY
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_WSS_URL=wss://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Devnet USDC mint — confirm from Umbra devnet pool registry before using
# GET https://utxo-indexer.api-devnet.umbraprivacy.com/v1/stats
NEXT_PUBLIC_USDC_MINT=<devnet-usdc-mint>

# Database (Agent A provides)
DATABASE_URL=postgresql://...

# Auth (Agent A provides)
JWT_SECRET=<run: openssl rand -hex 32>
JWT_EXPIRES_IN=7d

# Funder keypair — server-side only, NEVER NEXT_PUBLIC_ prefixed
FUNDER_KEYPAIR_PATH=./scripts/funder.json

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### funder.json setup (run once, Agent A)
```bash
# 1. Place funder.json in scripts/ (provided by team)
# 2. Verify it loads and has balance:
tsx scripts/check-funder.ts

# 3. Top up funder from Solana devnet faucet if low:
solana airdrop 2 <funder-address> --url devnet

# 4. Confirm demo-wallets.json exists:
# scripts/demo-wallets.json — gitignored, add test wallet addresses
```

> **Both files are gitignored.** Never commit `scripts/funder.json` or `scripts/demo-wallets.json`. Confirm with `git status scripts/` before every push to remote.

---

## Coding Conventions

### TypeScript
- **Strict mode on.** No `any`. Use `unknown` + type narrowing.
- No `as` casts except when interfacing with external libraries that don't have good types.
- Always type function return values explicitly.
- Use `bigint` for all token amounts (Umbra SDK uses bigint). Convert to string only for display.

### File naming
- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Route handlers: `route.ts` (Next.js convention)
- Constants: `SCREAMING_SNAKE_CASE` for values, exported from `lib/constants.ts`

### API Routes (Agent A)
Every route handler follows this pattern exactly:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";    // for protected routes
import { z } from "zod";

const schema = z.object({ ... });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    // ... handler logic
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/...] error:", e);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
```

### React Components (Agent B)
- Always Client Components for anything that uses wallet or Umbra SDK: `"use client";` at top
- Server Components for pages that just fetch and display creator profiles
- Never put SDK logic directly in a page file — always in a hook in `lib/umbra/`
- Error boundaries around every SDK-touching section

### Umbra SDK Rules (Agent B — CRITICAL)
1. **Never call SDK functions in Server Components.** They require browser + wallet.
2. **Always check `client !== null`** before calling any SDK function.
3. **Always await both transactions.** The SDK's dual-instruction pattern means two on-chain txs. Never fire and forget.
4. **Always handle `callbackStatus: "timed-out"`** — show the user a pending state, not an error.
5. **Never store private keys.** The SDK signs through the wallet adapter only.
6. **Token amounts are `bigint`.** Never use `number` for on-chain amounts. 1 USDC = `1_000_000n`.
7. **Always pass `network: "devnet"`** in `getUmbraClient()`. Passing `"mainnet"` will point at the wrong program ID and fail silently with account-not-found errors.
8. **Phantom must be switched to devnet.** The UI must detect if the connected wallet is on mainnet and show a clear warning: "Please switch Phantom to Devnet in Settings → Developer Settings → Testnet Mode."

---

## Git Workflow

### Branch naming
```
main              → production-ready only, deployed to Vercel
develop           → integration branch, both agents merge here daily
feat/agent-a/...  → Agent A's feature branches
feat/agent-b/...  → Agent B's feature branches
fix/...           → bug fixes from either agent
```

### Commit format
```
feat(api): add POST /api/creators route with Zod validation
feat(ui): implement SendFlow modal with 4-step state machine
fix(umbra): handle MPC timeout in useSendUtxo hook
chore(db): add migration for SupportEvent.claimedAt field
```

### Daily sync protocol
1. Both agents push their branches to `develop` by EOD each day
2. Resolve conflicts in the shared type file (`packages/db/types.ts`) together
3. Run `bun build` on `develop` — zero type errors required before next day

---

## Daily Checkpoints (10 Days)

These are the integration gates. Both agents must verify the checkpoint before moving forward.

### Day 1 Checkpoint
- [ ] Next.js app boots: `bun dev` returns 200 on `localhost:3000`
- [ ] Prisma connected: `bun prisma db push` succeeds with 0 errors
- [ ] `GET /api/auth/nonce` returns `{ nonce, expiresAt }` with valid data
- [ ] Tailwind tokens render correctly: visit `/` — background should be `#0a0a0f`
- [ ] `tsx scripts/check-funder.ts` shows funder address + ≥ 2 SOL balance
- [ ] Devnet banner component renders in dev mode

### Day 2 Checkpoint
- [ ] Phantom wallet connects in browser **on devnet** (check wallet shows "Devnet" badge)
- [ ] `UmbraProvider` initializes client after wallet connect (no console errors)
- [ ] `GET /api/creators/test-creator` returns 404 (DB is empty, that's correct)
- [ ] `POST /api/creators` returns 201 with test payload
- [ ] `tsx scripts/airdrop-sol.ts <test-wallet> 2` succeeds

### Day 3 Checkpoint
- [ ] Full onboarding flow completes: wallet connect → profile form → tiers → Umbra register
- [ ] Creator appears in DB after onboard: `SELECT * FROM "Creator";`
- [ ] `umbraRegistered` is `true` in DB after SDK register completes
- [ ] `/c/[slug]` renders correctly for the onboarded creator

### Day 4 Checkpoint
- [ ] `/dashboard` renders with real stat data
- [ ] Encrypted balance displays (may show 0 — that's fine)
- [ ] Auth middleware blocks `/api/dashboard` without valid JWT cookie

### Day 5 Checkpoint ⚠️ CRITICAL — SDK on mainnet
- [ ] Patron flow: open creator page → connect wallet → pick tier → send UTXO
- [ ] SDK `createUtxo` call succeeds (check Solana explorer for the tx)
- [ ] `POST /api/events` records the event in DB
- [ ] No patron wallet address appears in DB

### Day 6 Checkpoint
- [ ] Creator claims UTXOs: scan finds the Day 5 test UTXO
- [ ] Claim tx succeeds (check Solana explorer)
- [ ] Encrypted balance reflects claimed amount
- [ ] `SupportEvent.claimedAt` set in DB

### Day 7 Checkpoint
- [ ] Viewing key generates without error for current month
- [ ] Key downloads as valid JSON `.veil-key` file
- [ ] Yearly key also generates correctly

### Day 8 Checkpoint
- [ ] `/explore` shows at least 3 seeded creators
- [ ] Category filter works
- [ ] Landing page renders with hero, feature sections, CTA

### Day 9 Checkpoint
- [ ] Settings page saves profile changes correctly
- [ ] All SDK error states show user-friendly messages (force errors in dev)
- [ ] Wallet disconnect mid-flow shows graceful error, not white screen
- [ ] Responsive: test at 375px, 768px, 1280px viewports

### Day 10 Checkpoint
- [ ] `bun build` passes with zero TypeScript errors
- [ ] App deployed to Vercel: production URL works
- [ ] Full end-to-end demo flow works on production URL
- [ ] README.md complete per hackathon requirements
- [ ] GitHub repo is public

---

## Critical Implementation Details

### Wallet-Signature Authentication
Use `tweetnacl` to verify Ed25519 signatures. The sign message format must be:
```
Sign in to Veil\n\nNonce: {nonce}\nExpires: {expiresAt}
```
The frontend signs this exact string using `wallet.signMessage(Buffer.from(message))`.

### Umbra Registration — Idempotent
`getUserRegistrationFunction` is idempotent — safe to call multiple times. But it triggers a wallet signature prompt. Only call it during the explicit onboarding step, never on page load.

### UTXO Scanning — Stateful
The first scan starts from tree index 0, insertion index 0. For returning creators, store the last scanned index in localStorage and resume from there. Otherwise every scan re-scans the entire tree (can be slow as the tree fills up).

```typescript
// lib/umbra/scanState.ts
const SCAN_KEY = (address: string) => `veil_scan_${address}`;

export function getLastScanIndex(address: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(SCAN_KEY(address)) || "0", 10);
}

export function setLastScanIndex(address: string, index: number) {
  localStorage.setItem(SCAN_KEY(address), index.toString());
}
```

### MPC Latency UX
Arcium MPC processing takes 5-15 seconds. The SDK awaits the callback before returning. The UI MUST:
1. Show an explicit "Waiting for Arcium MPC..." state
2. Never let the user navigate away during this wait (show a blocking modal or locked button)
3. Handle `callbackStatus: "timed-out"` with: "Almost there — your payment is confirmed on-chain. The final step is processing. Refresh in a minute."

### Fee Display
Always show the estimated protocol fee BEFORE the user confirms:
```typescript
// Show in SendFlow step 1:
const fee = estimateFee(amountUsdc);  // from lib/constants.ts
const netAmount = amountUsdc - fee;
// "Creator receives: ~X USDC (after 0.21% network fee)"
```

### `creator.walletAddress` is Public
The creator's Solana wallet address must be returned by `GET /api/creators/:slug` because the patron needs it to call the SDK. This is intentional — the creator's wallet address is already public on Solana. Only the patron's identity is hidden.

### Encrypted Balance — Shared Mode Only
The app only supports Shared mode encrypted balances (not MXE). Registration with `confidential: true` sets Shared mode. This allows the creator to query their own balance client-side without a separate API call.

---

## SDK Error Codes Reference (Agent B must handle all of these)

```typescript
// From @umbra-privacy/sdk:

// Registration
RegistrationError

// Deposit (patron send) - not used for UTXO flow, but keep for reference
EncryptedDepositError

// Withdrawal - not used in MVP
EncryptedWithdrawalError

// Query
QueryError

// Check callbackStatus field on all results:
// "finalized" - success
// "pruned"    - MPC callback dropped, tx needs to be resubmitted (rare)
// "timed-out" - show pending state, user can retry
```

---

## What NOT to Build (Scope Enforcement)

If a feature is not in this list, do not build it, even if it seems like a good idea:

**In scope:**
- Patron sends USDC anonymously via Umbra Mixer
- Creator claims UTXOs into encrypted balance
- Creator views encrypted balance
- Viewing key generation (monthly + yearly)
- Creator profile + tiers management
- Explore page with category filter
- Landing page

**Out of scope (do not implement):**
- Custom tokens or "Veil Shares"
- Token swaps of any kind
- Recurring/automated payments
- Patron dashboard or history
- Social features (comments, likes)
- Creator verification or KYC
- Multiple supported tokens beyond USDC (USDT/wSOL kept as future extension only)
- Email notifications
- Mobile app
- WebSocket live updates (polling is fine for MVP)

---

## Deployment Checklist

### Vercel (Frontend + API Routes)
```bash
# In Vercel dashboard:
# 1. Connect GitHub repo
# 2. Set root directory: apps/web
# 3. Add all env vars from .env.local
# 4. Build command: cd ../.. && bun build --filter=web
# 5. Output directory: .next

# Critical: Set Node.js version to 20.x in Vercel settings
# (Umbra SDK ZK prover requires Node 20+)
```

### Supabase (Database)
```bash
# 1. Create project at supabase.com
# 2. Copy connection string to DATABASE_URL
# 3. Run migration:
bun prisma migrate deploy
# 4. Run seed (if seed.ts created on Day 8):
bun prisma db seed
```

### Pre-launch smoke test
```bash
# 1. Connect Phantom wallet
# 2. Register as creator (needs ~0.002 SOL for rent)
# 3. Send 1 USDC as patron (needs 1 USDC + gas)
# 4. Claim as creator
# 5. Generate monthly viewing key
# All 5 steps must complete without error on the production URL
```

---

## Useful Commands

```bash
# Start dev server
bun dev

# Type check (both packages)
bun typecheck

# Build
bun build

# Push DB schema changes (dev only — use migrate deploy for prod)
bun prisma db push

# Generate Prisma client after schema changes
bun prisma generate

# Open Prisma Studio (DB browser)
bun prisma studio

# Run with specific filter
bun --filter web dev
```

---

## File Ownership Quick Reference

| File / Directory | Owner | Notes |
|---|---|---|
| `packages/db/schema.prisma` | Agent A | Notify Agent B on any change |
| `packages/db/types.ts` | Both | Contract file — discuss before changing |
| `apps/web/app/api/**` | Agent A | |
| `apps/web/app/(pages)/**` | Agent B | |
| `apps/web/components/**` | Agent B | |
| `apps/web/lib/umbra/**` | Agent B | |
| `apps/web/lib/auth.ts` | Agent A | |
| `apps/web/lib/db.ts` | Agent A | |
| `apps/web/lib/middleware.ts` | Agent A | |
| `apps/web/lib/validation.ts` | Agent A | Agent B may read, not modify |
| `apps/web/lib/constants.ts` | Both | Discuss before adding |
| `apps/web/styles/**` | Agent B | |
| `.env.example` | Both | Add vars as they are needed |
