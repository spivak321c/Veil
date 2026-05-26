# Veil Patronage — Product Requirements Document
**Version:** 1.1  
**Target Launch:** 10 days from kickoff  
**Scope:** Hackathon prototype — **Solana Devnet demo** (not mainnet)  
**Stack:** Next.js 14 · TypeScript · Prisma · PostgreSQL · @umbra-privacy/sdk  
**Network:** Devnet throughout. `funder.json` keypair used for SOL airdrops and test token minting.

---

## 1. Product Vision

Veil is a privacy-first creator patronage platform built on Solana. Patrons support creators using the Umbra Mixer — severing the on-chain link between sender and receiver via ZK proofs — so neither patron identity nor payment amounts are visible on-chain. Creators can optionally generate time-scoped viewing keys to prove aggregate revenue to sponsors or tax authorities without revealing individual supporters.

**One sentence:** _Fund creators anonymously on Solana. No public trail. No exposure._

### What Veil is NOT building (scope boundary)
- No custom tokens / "Veil Shares" — Umbra only supports USDC, USDT, wSOL, UMBRA
- No recurring automated payments — each transfer is user-signed
- No on-chain governance or DAO mechanics
- No swap functionality
- No mobile-native app (responsive web only)

---

## 2. Core User Flows

### Flow A — Creator Setup
1. Creator connects Solana wallet (Phantom / Solflare)
2. Creator registers with Umbra SDK (`anonymous: true, confidential: true`)
3. Creator fills profile: display name, bio, avatar URL, support tiers, category
4. System generates a shareable Veil link (`veil.app/c/{slug}`)
5. Creator sees their dashboard: encrypted balance, UTXO inbox, viewing keys

### Flow B — Patron Support
1. Patron opens creator's Veil link
2. Patron connects wallet (or proceeds as "stealth sender" — wallet connects but address is never displayed on creator page)
3. Patron picks a tier or enters custom amount in USDC
4. SDK fires `getPublicBalanceToReceiverClaimableUtxoCreatorFunction` — patron identity severed by Mixer
5. Patron sees a transaction confirmation; no public record links them to creator

### Flow C — Creator Claims
1. Creator opens dashboard → "Pending Inbox"
2. Dashboard triggers `getClaimableUtxoScannerFunction` to scan Merkle tree
3. Creator reviews pending UTXOs (amount visible, sender is anonymous "shielded")
4. Creator clicks "Claim All" → `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction`
5. Funds land in creator's encrypted balance (visible only to creator via Shared mode)

### Flow D — Viewing Key Export
1. Creator opens "Compliance" tab in dashboard
2. Selects scope: monthly or yearly, selects token (USDC)
3. SDK derives key via `getMonthlyViewingKeyDeriver` or `getYearlyViewingKeyDeriver`
4. Creator copies or downloads key as a `.veil-key` file
5. Key can be shared with accountant or sponsor — decrypts amounts, NOT identities

---

## 3. Tech Stack & Architecture

```
veil/
├── apps/
│   └── web/                    # Next.js 14 App Router frontend + API routes
│       ├── app/
│       │   ├── (marketing)/    # Landing page, how-it-works
│       │   ├── (app)/
│       │   │   ├── dashboard/  # Creator dashboard (protected)
│       │   │   └── c/[slug]/   # Public creator page (patron view)
│       │   └── api/            # Next.js API routes (backend)
│       ├── components/
│       │   ├── ui/             # Design system primitives
│       │   ├── wallet/         # Wallet adapter components
│       │   ├── umbra/          # SDK wrapper components
│       │   └── creator/        # Creator-specific components
│       └── lib/
│           ├── umbra/          # SDK client factory & hooks
│           ├── db/             # Prisma client
│           └── utils/
└── packages/
    └── db/                     # Prisma schema shared package
```

### Frontend: Next.js 14 App Router
- **Framework:** Next.js 14 with App Router (React Server Components for creator pages, Client Components for wallet/SDK interactions)
- **Styling:** Tailwind CSS v3 + custom design tokens
- **Wallet:** `@solana/wallet-adapter-react` + `@solana/wallet-adapter-phantom`
- **State:** Zustand for global app state (wallet, SDK client, creator profile)
- **SDK operations:** Always client-side (wallet must sign); wrapped in custom hooks
- **Fonts:** Syne (display) + DM Mono (numbers/addresses) — distinctive, not generic

### Backend: Next.js API Routes + Prisma
- **Database:** PostgreSQL (Supabase free tier for hackathon)
- **ORM:** Prisma 5
- **Auth:** Wallet-signature auth — no passwords, no OAuth. Creator signs a nonce to prove wallet ownership
- **API style:** REST (not tRPC — simpler for agent parallelism)

### External Services
- **Umbra SDK:** `@umbra-privacy/sdk` + `@umbra-privacy/web-zk-prover`
- **Umbra Program (devnet):** `DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ`
- **Solana RPC:** Devnet public endpoint (`https://api.devnet.solana.com`) or Helius devnet if available
- **Umbra Indexer (devnet):** `https://utxo-indexer.api-devnet.umbraprivacy.com`
- **Umbra Relayer (devnet):** `https://relayer.api-devnet.umbraprivacy.com`
- **File storage:** Supabase Storage (creator avatars — optional, can use URL input)
- **Funder keypair:** `funder.json` — a funded devnet keypair checked into the repo under `scripts/` (gitignored from production builds). Used to airdrop SOL to test wallets and mint test USDC.

---

## 4. Database Schema (Prisma)

```prisma
// packages/db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Creator {
  id              String   @id @default(cuid())
  walletAddress   String   @unique             // Solana public key (base58)
  umbraRegistered Boolean  @default(false)     // True after SDK register() completes
  slug            String   @unique             // URL-safe handle e.g. "alice-art"
  displayName     String
  bio             String   @db.Text
  avatarUrl       String?
  category        Category @default(OTHER)
  tiers           Tier[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([slug])
  @@index([walletAddress])
}

model Tier {
  id          String  @id @default(cuid())
  creatorId   String
  creator     Creator @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  name        String                          // e.g. "Supporter", "Patron", "Believer"
  amountUsdc  Int                             // in micro-USDC (1_000_000 = 1 USDC)
  description String  @db.Text
  sortOrder   Int     @default(0)

  @@index([creatorId])
}

// Lightweight audit log — no wallet addresses stored, just amounts + timestamps
// We intentionally do NOT store patron wallet addresses (privacy by design)
model SupportEvent {
  id              String   @id @default(cuid())
  creatorId       String
  amountUsdc      Int                          // micro-USDC
  utxoSignature   String?                     // handler tx signature (public, on-chain)
  claimedAt       DateTime?
  createdAt       DateTime @default(now())

  @@index([creatorId])
}

// Nonce table for wallet-signature auth
model AuthNonce {
  walletAddress String   @id
  nonce         String
  expiresAt     DateTime

  @@index([walletAddress])
}

enum Category {
  MUSIC
  ART
  WRITING
  DEVELOPMENT
  GAMING
  EDUCATION
  OTHER
}
```

### Design Notes on Privacy
- **No patron wallet addresses are stored.** The database never records who sent to whom.
- `SupportEvent` records exist only for the creator's own analytics (how many supporters, total volume) — populated when the creator claims UTXOs, not at send time.
- `utxoSignature` is the handler tx, which is already public on-chain — storing it adds no privacy risk and allows duplicate detection.

---

## 5. API Routes Specification

All routes under `apps/web/app/api/`.

### Auth Routes

#### `POST /api/auth/nonce`
Generate a sign-in nonce for a wallet address.
```typescript
// Request
{ walletAddress: string }

// Response 200
{ nonce: string, expiresAt: string } // ISO timestamp

// Errors
400 — missing walletAddress
```

#### `POST /api/auth/verify`
Verify a signed nonce and return a session token.
```typescript
// Request
{ walletAddress: string, signature: string, nonce: string }

// Response 200
{ token: string, expiresAt: string }

// Errors
400 — invalid input
401 — signature verification failed
410 — nonce expired
```

Implementation: use `tweetnacl` to verify Ed25519 signature. On success, return a signed JWT (HS256) stored in an httpOnly cookie.

#### `POST /api/auth/logout`
Clear session cookie.

---

### Creator Routes

#### `POST /api/creators`
Register a new creator profile. Requires auth token.
```typescript
// Request
{
  slug: string,           // validated: /^[a-z0-9-]{3,30}$/
  displayName: string,    // max 50 chars
  bio: string,            // max 500 chars
  avatarUrl?: string,     // must be valid URL if provided
  category: Category,
  tiers: Array<{
    name: string,
    amountUsdc: number,   // micro-USDC; min 1_000_000 (1 USDC)
    description: string
  }>
}

// Response 201
{ creator: CreatorPublic }

// Errors
400 — validation failure
409 — slug already taken
401 — not authenticated
```

#### `GET /api/creators/:slug`
Public endpoint — no auth required.
```typescript
// Response 200
{
  id: string,
  slug: string,
  displayName: string,
  bio: string,
  avatarUrl: string | null,
  category: string,
  umbraRegistered: boolean,
  tiers: Tier[],
  stats: {
    totalSupportEvents: number,   // count only — no amounts on public endpoint
  }
}

// Errors
404 — creator not found
```

#### `PATCH /api/creators/:slug`
Update creator profile. Requires auth + must own this profile.
```typescript
// Request — all fields optional
{
  displayName?: string,
  bio?: string,
  avatarUrl?: string,
  category?: Category,
}

// Response 200
{ creator: CreatorPublic }
```

#### `PUT /api/creators/:slug/tiers`
Replace all tiers. Requires auth.
```typescript
// Request
{ tiers: Tier[] }  // full replacement, not patch

// Response 200
{ tiers: Tier[] }
```

---

### Registration Status Route

#### `POST /api/creators/:slug/umbra-registered`
Called by frontend after SDK `register()` completes successfully. Sets `umbraRegistered = true` in DB.
```typescript
// Request — no body needed; wallet proven via JWT

// Response 200
{ umbraRegistered: true }
```

---

### Support Event Routes

#### `POST /api/events`
Record a support event after patron sends a UTXO. Called client-side after `createUtxo` succeeds.
```typescript
// Request — NOTE: no patron identity sent
{
  creatorSlug: string,
  amountUsdc: number,
  utxoSignature: string,   // handler tx signature
}

// Response 201
{ eventId: string }

// Errors
400 — invalid input
404 — creator not found
409 — duplicate utxoSignature
```

#### `PATCH /api/events/:eventId/claimed`
Mark a support event as claimed. Called after creator claims UTXOs. Requires creator auth.
```typescript
// Request
{ claimedAt: string }  // ISO timestamp

// Response 200
{ ok: true }
```

---

### Dashboard Routes (all require auth)

#### `GET /api/dashboard`
Return creator's own stats — fuller than the public endpoint.
```typescript
// Response 200
{
  creator: CreatorFull,
  stats: {
    totalSupportEvents: number,
    claimedEvents: number,
    pendingEvents: number,
    totalVolumeUsdc: number,      // micro-USDC, only from claimed events
    recentEvents: SupportEvent[]  // last 10, no patron info
  }
}
```

---

## 6. Frontend Pages & Components

### 6.1 Page Map

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Marketing landing page |
| `/how-it-works` | No | Explainer: Mixer, ZK proofs, viewing keys |
| `/explore` | No | Browse creators by category |
| `/onboard` | Yes (wallet) | Creator registration flow |
| `/dashboard` | Yes (wallet) | Creator dashboard |
| `/dashboard/compliance` | Yes (wallet) | Viewing key generator |
| `/dashboard/settings` | Yes (wallet) | Edit profile & tiers |
| `/c/[slug]` | No | Public creator page (patron view) |
| `/c/[slug]/send` | Yes (wallet) | Patron sends UTXO — wallet required |

### 6.2 Component Architecture

```
components/
├── ui/
│   ├── Button.tsx          # variant: primary | ghost | danger
│   ├── Input.tsx           # with validation state
│   ├── Textarea.tsx
│   ├── Badge.tsx           # category tags
│   ├── Card.tsx            # base card wrapper
│   ├── Modal.tsx           # portal-based modal
│   ├── Spinner.tsx         # loading states
│   ├── Toast.tsx           # success/error notifications
│   └── AddressDisplay.tsx  # truncate + copy for wallet addresses
│
├── wallet/
│   ├── WalletProvider.tsx  # wraps @solana/wallet-adapter-react
│   ├── ConnectButton.tsx   # styled connect/disconnect button
│   └── WalletGuard.tsx     # redirects if not connected
│
├── umbra/
│   ├── UmbraProvider.tsx   # initializes SDK client after wallet connects
│   ├── RegisterFlow.tsx    # one-time Umbra registration UI
│   ├── SendFlow.tsx        # patron UTXO creation flow with progress steps
│   ├── ClaimPanel.tsx      # creator claims pending UTXOs
│   ├── BalanceDisplay.tsx  # shows encrypted balance (Shared mode)
│   └── ViewingKeyExport.tsx # derive + display/download viewing key
│
└── creator/
    ├── CreatorCard.tsx      # used on /explore
    ├── TierCard.tsx         # support tier display on creator page
    ├── TierSelector.tsx     # patron picks tier or custom amount
    ├── ProfileForm.tsx      # onboard + settings form
    ├── TierForm.tsx         # add/edit tiers
    ├── DashboardStats.tsx   # stat cards: total supporters, volume
    └── EventFeed.tsx        # recent support events (anonymized)
```

### 6.3 Key Component Specs

#### `UmbraProvider.tsx`
```typescript
// Initializes getUmbraClient() when wallet connects.
// Stores client in Zustand. All SDK hooks read from this store.

interface UmbraStore {
  client: IUmbraClient | null;
  isInitializing: boolean;
  error: string | null;
  init: (wallet: WalletAdapter) => Promise<void>;
  reset: () => void;
}
```

#### `SendFlow.tsx` (most complex component)
Multi-step modal:
- Step 1: Amount selection (tier cards or custom input)
- Step 2: Privacy notice ("Your wallet address will not be visible to the creator or on-chain observers")
- Step 3: Transaction in progress — two-phase: "Submitting..." → "Waiting for Arcium MPC..." (can take 5-15s)
- Step 4: Success — confetti animation, "You've supported {creator} anonymously"

Progress state machine:
```typescript
type SendStep =
  | { status: 'idle' }
  | { status: 'confirming'; tierName: string; amountUsdc: number }
  | { status: 'submitting' }
  | { status: 'awaiting_mpc'; queueSignature: string }
  | { status: 'success'; callbackSignature: string }
  | { status: 'error'; message: string };
```

#### `ClaimPanel.tsx`
- "Scan Inbox" button → triggers `getClaimableUtxoScannerFunction` (may take 10-30s on first scan)
- Shows list of claimable UTXOs: amount + "from anonymous supporter"
- "Claim All" button → `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction`
- After claim: updates `SupportEvent.claimedAt` via `PATCH /api/events/:id/claimed`

#### `ViewingKeyExport.tsx`
```typescript
// Month picker (year + month dropdowns)
// Token selector (USDC only for MVP, extensible)
// "Generate Key" button → getMonthlyViewingKeyDeriver()
// Displays key in monospace with copy button
// "Download as .veil-key" — saves as JSON:
{
  "format": "veil-viewing-key-v1",
  "scope": "monthly",
  "token": "USDC",
  "year": 2025,
  "month": 3,
  "key": "...",
  "generatedAt": "2025-03-01T00:00:00Z",
  "instructions": "Share with your accountant or sponsor. This key decrypts payment amounts for the specified month only."
}
```

---

## 7. Umbra SDK Integration Specification

### 7.1 Client Initialization

```typescript
// lib/umbra/client.ts
import { getUmbraClient } from "@umbra-privacy/sdk";

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const DEVNET_WSS = process.env.NEXT_PUBLIC_SOLANA_WSS_URL!;

export async function initUmbraClient(wallet: IUmbraSigner) {
  return getUmbraClient({
    signer: wallet,
    network: "devnet",
    rpcUrl: DEVNET_RPC,
    rpcSubscriptionsUrl: DEVNET_WSS,
    indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
    deferMasterSeedSignature: false,
  });
}
```

### 7.2 Registration Hook

```typescript
// lib/umbra/useUmbraRegistration.ts
export function useUmbraRegistration() {
  const client = useUmbraStore(s => s.client);

  const register = async (): Promise<void> => {
    if (!client) throw new Error("Client not initialized");
    const zkProver = getUserRegistrationProver();
    const registerFn = getUserRegistrationFunction({ client }, { zkProver });
    await registerFn({ confidential: true, anonymous: true });
    // On success, call POST /api/creators/:slug/umbra-registered
  };

  return { register };
}
```

### 7.3 Send UTXO Hook

```typescript
// lib/umbra/useSendUtxo.ts
export function useSendUtxo() {
  const client = useUmbraStore(s => s.client);

  const send = async (
    recipientAddress: string,
    amountUsdc: bigint,
    onProgress: (step: SendStep) => void
  ) => {
    const zkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
    const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
      { client! },
      { zkProver }
    );

    onProgress({ status: 'submitting' });
    const [proofSig, utxoSig] = await createUtxo({
      destinationAddress: recipientAddress,
      mint: USDC_MINT,
      amount: amountUsdc,
    });

    onProgress({ status: 'awaiting_mpc', queueSignature: utxoSig });
    // Note: createUtxo awaits both txs before returning
    onProgress({ status: 'success', callbackSignature: utxoSig });
    return utxoSig;
  };

  return { send };
}
```

### 7.4 Claim Hook

```typescript
// lib/umbra/useClaim.ts
export function useClaim() {
  const client = useUmbraStore(s => s.client);

  const scanAndClaim = async () => {
    // Step 1: Scan
    const scan = getClaimableUtxoScannerFunction({ client! });
    const { received } = await scan(0, 0);
    if (received.length === 0) return { claimed: 0 };

    // Step 2: Claim all into encrypted balance
    const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
    const relayer = getUmbraRelayer({
      apiEndpoint: "https://relayer.api.umbraprivacy.com",
    });
    const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client! },
      { zkProver, relayer }
    );

    await claim(received);
    return { claimed: received.length };
  };

  return { scanAndClaim };
}
```

### 7.5 Encrypted Balance Hook

```typescript
// lib/umbra/useEncryptedBalance.ts
export function useEncryptedBalance() {
  const client = useUmbraStore(s => s.client);

  const getBalance = async () => {
    const queryBalances = getEncryptedBalanceQuerierFunction({ client! });
    const balances = await queryBalances([USDC_MINT]);
    const result = balances.get(USDC_MINT);
    if (result?.state === "shared") return result.balance;
    return null;
  };

  return { getBalance };
}
```

### 7.6 Viewing Key Hook

```typescript
// lib/umbra/useViewingKey.ts
export function useViewingKey() {
  const client = useUmbraStore(s => s.client);

  const deriveMonthly = async (year: bigint, month: bigint) => {
    const derive = getMonthlyViewingKeyDeriver({ client! });
    const key = await derive(USDC_MINT, year, month);
    return key.toString();
  };

  const deriveYearly = async (year: bigint) => {
    const derive = getYearlyViewingKeyDeriver({ client! });
    const key = await derive(USDC_MINT, year);
    return key.toString();
  };

  return { deriveMonthly, deriveYearly };
}
```

---

## 8. Environment Variables

```bash
# .env.local (frontend + backend, monorepo)

# Solana — devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_WSS_URL=wss://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Devnet token mints
# Confirm the exact devnet USDC mint Umbra's devnet pools support.
# Check with: https://utxo-indexer.api-devnet.umbraprivacy.com/v1/stats
# Placeholder below — replace after confirming with Umbra devnet deployment.
NEXT_PUBLIC_USDC_MINT=<devnet-usdc-mint-from-umbra-docs>

# Database
DATABASE_URL=postgresql://user:pass@host:5432/veil

# Auth
JWT_SECRET=<run: openssl rand -hex 32>
JWT_EXPIRES_IN=7d

# Optional: Supabase Storage for avatars
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Funder keypair path (server-side only — used by scripts/ and /api/dev/airdrop)
# NEVER prefix with NEXT_PUBLIC_
FUNDER_KEYPAIR_PATH=./scripts/funder.json

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **`funder.json` handling:** Place the funded devnet keypair at `scripts/funder.json`. This file is gitignored (`.gitignore` entry: `scripts/funder.json`). It is NEVER committed to the repo or exposed client-side. All server-side scripts that use it load it via `FUNDER_KEYPAIR_PATH`. See Section 8a for the full airdrop and mint-funding scripts.

---

## 8a. Devnet Funding Scripts (`scripts/`)

All scripts in `scripts/` are Node.js/TypeScript run via `tsx`. They use `funder.json` as the funding authority. **None of these scripts run in the browser.**

### `scripts/airdrop-sol.ts`
Airdrops SOL to any devnet wallet address. Used to fund test creator and patron wallets before running the demo.

```typescript
// scripts/airdrop-sol.ts
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { readFileSync } from "fs";
import { resolve } from "path";

const FUNDER_PATH = process.env.FUNDER_KEYPAIR_PATH ?? "./scripts/funder.json";
const RPC = "https://api.devnet.solana.com";

async function main() {
  const targetAddress = process.argv[2];
  const solAmount = parseFloat(process.argv[3] ?? "2");

  if (!targetAddress) {
    console.error("Usage: tsx scripts/airdrop-sol.ts <wallet-address> [sol-amount]");
    process.exit(1);
  }

  const connection = new Connection(RPC, "confirmed");
  const funderRaw = JSON.parse(readFileSync(resolve(FUNDER_PATH), "utf-8"));
  const funder = Keypair.fromSecretKey(Uint8Array.from(funderRaw));

  const target = new PublicKey(targetAddress);
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  // Use requestAirdrop for small amounts on devnet, transfer from funder for larger
  if (solAmount <= 2) {
    const sig = await connection.requestAirdrop(target, lamports);
    await connection.confirmTransaction(sig, "confirmed");
    console.log(`✓ Airdropped ${solAmount} SOL to ${targetAddress} via faucet`);
    console.log(`  Signature: ${sig}`);
  } else {
    // Transfer from funder for amounts > 2 SOL (faucet limit)
    const { SystemProgram, Transaction, sendAndConfirmTransaction } = await import("@solana/web3.js");
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: target, lamports })
    );
    const sig = await sendAndConfirmTransaction(connection, tx, [funder]);
    console.log(`✓ Transferred ${solAmount} SOL from funder to ${targetAddress}`);
    console.log(`  Signature: ${sig}`);
  }
}

main().catch(console.error);
```

**Usage:**
```bash
# Airdrop 2 SOL to a test wallet (uses devnet faucet)
tsx scripts/airdrop-sol.ts <WALLET_ADDRESS>

# Transfer 5 SOL from funder (for amounts > 2)
tsx scripts/airdrop-sol.ts <WALLET_ADDRESS> 5
```

---

### `scripts/fund-usdc.ts`
Mints devnet test USDC to a target wallet. The funder keypair must be the mint authority for the devnet USDC token.

```typescript
// scripts/fund-usdc.ts
import {
  Connection, Keypair, PublicKey,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} from "@solana/spl-token";
import { readFileSync } from "fs";
import { resolve } from "path";

const FUNDER_PATH = process.env.FUNDER_KEYPAIR_PATH ?? "./scripts/funder.json";
const RPC = "https://api.devnet.solana.com";
const DEVNET_USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT!;

async function main() {
  const targetAddress = process.argv[2];
  const usdcAmount = parseFloat(process.argv[3] ?? "100");  // default 100 USDC

  if (!targetAddress) {
    console.error("Usage: tsx scripts/fund-usdc.ts <wallet-address> [usdc-amount]");
    process.exit(1);
  }

  const connection = new Connection(RPC, "confirmed");
  const funderRaw = JSON.parse(readFileSync(resolve(FUNDER_PATH), "utf-8"));
  const funder = Keypair.fromSecretKey(Uint8Array.from(funderRaw));

  const mint = new PublicKey(DEVNET_USDC_MINT);
  const mintInfo = await getMint(connection, mint);
  const target = new PublicKey(targetAddress);

  // Create ATA if it doesn't exist
  const ata = await getOrCreateAssociatedTokenAccount(
    connection, funder, mint, target
  );

  const rawAmount = BigInt(Math.floor(usdcAmount * 10 ** mintInfo.decimals));
  const sig = await mintTo(connection, funder, mint, ata.address, funder, rawAmount);

  console.log(`✓ Minted ${usdcAmount} test USDC to ${targetAddress}`);
  console.log(`  ATA: ${ata.address.toBase58()}`);
  console.log(`  Signature: ${sig}`);
}

main().catch(console.error);
```

**Usage:**
```bash
# Mint 100 test USDC to a wallet (default)
tsx scripts/fund-usdc.ts <WALLET_ADDRESS>

# Mint 500 test USDC
tsx scripts/fund-usdc.ts <WALLET_ADDRESS> 500
```

> ⚠️ `funder.json` must be the **mint authority** of the devnet USDC token used in Umbra's devnet pools. If Umbra uses a third-party devnet USDC that you don't control, use `airdrop-sol.ts` to fund wallets with SOL only and obtain test USDC via Umbra's own devnet faucet (if provided) or the Circle devnet faucet at https://faucet.circle.com.

---

### `scripts/fund-demo.ts`
Convenience script — funds **all demo wallets** with both SOL and USDC in one command. Run this before recording the demo video.

```typescript
// scripts/fund-demo.ts
// Funds all wallets listed in scripts/demo-wallets.json
// Format: [{ "name": "creator-alice", "address": "..." }, ...]

import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const wallets = JSON.parse(
  readFileSync(resolve("scripts/demo-wallets.json"), "utf-8")
) as Array<{ name: string; address: string }>;

for (const wallet of wallets) {
  console.log(`\n→ Funding ${wallet.name} (${wallet.address})`);
  execSync(`tsx scripts/airdrop-sol.ts ${wallet.address} 2`, { stdio: "inherit" });
  execSync(`tsx scripts/fund-usdc.ts ${wallet.address} 200`, { stdio: "inherit" });
}

console.log("\n✓ All demo wallets funded.");
```

**`scripts/demo-wallets.json`** (gitignored — add your own test wallet addresses):
```json
[
  { "name": "creator-alice",  "address": "ALICE_WALLET_ADDRESS" },
  { "name": "patron-bob",    "address": "BOB_WALLET_ADDRESS" },
  { "name": "patron-carol",  "address": "CAROL_WALLET_ADDRESS" }
]
```

```bash
# Fund all demo wallets at once
tsx scripts/fund-demo.ts
```

---

### `scripts/check-funder.ts`
Quick health check — verifies funder.json is valid and shows its SOL balance.

```typescript
// scripts/check-funder.ts
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { readFileSync } from "fs";
import { resolve } from "path";

const FUNDER_PATH = process.env.FUNDER_KEYPAIR_PATH ?? "./scripts/funder.json";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const raw = JSON.parse(readFileSync(resolve(FUNDER_PATH), "utf-8"));
  const funder = Keypair.fromSecretKey(Uint8Array.from(raw));
  const balance = await connection.getBalance(funder.publicKey);

  console.log(`Funder address : ${funder.publicKey.toBase58()}`);
  console.log(`Funder balance : ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.warn("⚠ Funder balance is low. Run: solana airdrop 2 <funder-address> --url devnet");
  } else {
    console.log("✓ Funder has sufficient balance for demo.");
  }
}

main().catch(console.error);
```

```bash
tsx scripts/check-funder.ts
```

---

### `.gitignore` additions
```gitignore
# Devnet keypairs — NEVER commit
scripts/funder.json
scripts/demo-wallets.json

# Environment
.env.local
.env*.local
```

---

### `package.json` script shortcuts
Add these to `apps/web/package.json` under `"scripts"`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "fund:check": "tsx scripts/check-funder.ts",
    "fund:sol": "tsx scripts/airdrop-sol.ts",
    "fund:usdc": "tsx scripts/fund-usdc.ts",
    "fund:demo": "tsx scripts/fund-demo.ts"
  }
}
```

## 9. UI Design Language

### Aesthetic Direction: "Encrypted Luxury"
Dark-first. Deep obsidian backgrounds. Soft teal accents (trust, privacy). Monospace type for addresses and numbers. Subtle grain overlay for depth. No gradients — flat, deliberate color fields. Feels like a private banking interface, not a crypto app.

### Color Tokens
```css
:root {
  /* Backgrounds */
  --bg-base: #0a0a0f;       /* near-black, main background */
  --bg-surface: #111118;    /* cards, panels */
  --bg-raised: #1a1a24;     /* inputs, hover states */
  --bg-overlay: #22222e;    /* modals */

  /* Teal accent (privacy = trust) */
  --accent: #00d4aa;
  --accent-dim: #00b891;
  --accent-muted: rgba(0, 212, 170, 0.12);

  /* Text */
  --text-primary: #e8e8f0;
  --text-secondary: #8888a0;
  --text-tertiary: #555568;
  --text-accent: #00d4aa;

  /* Borders */
  --border: rgba(255, 255, 255, 0.06);
  --border-accent: rgba(0, 212, 170, 0.3);

  /* Status */
  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
}
```

### Typography
```css
/* Display / headings */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

/* Body */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500&display=swap');

/* Monospace — addresses, amounts, keys */
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

h1, h2, h3 { font-family: 'Syne', sans-serif; font-weight: 700; }
body { font-family: 'DM Sans', sans-serif; }
code, .amount, .address, .key { font-family: 'DM Mono', monospace; }
```

### Key Motion Principles
- Page transitions: opacity fade (150ms ease)
- Modal open: slide up + fade (200ms ease-out)
- UTXO send success: confetti burst (canvas-confetti library)
- MPC waiting state: slow pulsing teal ring ("Arcium is processing...")
- Scan inbox: skeleton shimmer on UTXO cards while scanning

---

## 10. Ten-Day Build Plan

### Day 1 — Foundation
**Agent A (Backend):**
- Initialize Next.js 14 monorepo with TypeScript strict mode
- Set up Prisma with PostgreSQL (Supabase), push schema
- Implement `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`
- JWT utility functions (sign, verify)
- Place `funder.json` in `scripts/`, run `tsx scripts/check-funder.ts` to confirm balance

**Agent B (Frontend):**
- Set up Tailwind with custom design tokens (CSS vars above)
- Implement global layout, font imports, grain texture overlay
- Build UI primitives: Button, Input, Card, Spinner, Toast
- Set up Zustand stores (wallet store, umbra store)
- Add **devnet banner** component — persistent top bar reading "🔧 Devnet Demo — use test funds only" shown in non-production environments

**Sync checkpoint:** Both agents agree on `Creator`, `Tier`, `AuthNonce` Prisma types. Shared TypeScript interfaces in `packages/db/types.ts`. Run `tsx scripts/check-funder.ts` — must show ≥ 2 SOL balance.

---

### Day 2 — Wallet & Umbra Client
**Agent A (Backend):**
- Implement `POST /api/creators`, `GET /api/creators/:slug`, `PATCH /api/creators/:slug`
- Input validation with Zod
- Seed database with 3 test creator profiles

**Agent B (Frontend):**
- `WalletProvider.tsx` + `ConnectButton.tsx` (Phantom + Solflare)
- `UmbraProvider.tsx` — `initUmbraClient()` on wallet connect, Zustand hydration
- `useUmbraRegistration` hook (wired but not yet in UI)
- `AddressDisplay.tsx` with truncation + copy

**Sync checkpoint:** Test that `initUmbraClient()` succeeds with a connected Phantom wallet pointed at **devnet**. Log client fields. Run `tsx scripts/airdrop-sol.ts <your-test-wallet> 2` to ensure your test wallet has gas.

---

### Day 3 — Creator Onboarding
**Agent A (Backend):**
- `POST /api/creators/:slug/umbra-registered`
- `PUT /api/creators/:slug/tiers`
- Auth middleware — verify JWT on all protected routes

**Agent B (Frontend):**
- `/onboard` page — multi-step form: profile → tiers → Umbra registration
- `ProfileForm.tsx`, `TierForm.tsx`
- `RegisterFlow.tsx` — calls `register()` with progress UI, then hits `/api/creators/:slug/umbra-registered`
- Slug validation (client-side real-time + server uniqueness check)

**Sync checkpoint:** Full onboard flow: connect wallet → fill profile → register with Umbra → redirect to dashboard.

---

### Day 4 — Creator Dashboard (Skeleton)
**Agent A (Backend):**
- `GET /api/dashboard`
- `POST /api/events` (for later use by patron flow)
- `POST /api/dev/airdrop` — **devnet-only** route that calls `airdrop-sol.ts` and `fund-usdc.ts` server-side. Exposed only when `NEXT_PUBLIC_SOLANA_NETWORK=devnet`. Lets the demo UI show a "Get test funds" button so judges can self-fund without CLI access.

**Agent B (Frontend):**
- `/dashboard` layout with sidebar nav
- `DashboardStats.tsx` — stat cards: total supporters, claimed volume, pending claims
- `BalanceDisplay.tsx` — shows encrypted USDC balance via `useEncryptedBalance`
- `DevFaucetButton.tsx` — visible only on devnet; calls `/api/dev/airdrop` to top up connected wallet with SOL + test USDC
- Empty states for EventFeed and ClaimPanel

**Sync checkpoint:** Dashboard renders with real data from `/api/dashboard`. Faucet button successfully airdrops to connected wallet on devnet.

---

### Day 5 — Public Creator Page + Patron Flow (Core)
**Agent A (Backend):**
- Finalize `GET /api/creators/:slug` response shape
- Rate limiting middleware (100 req/min per IP) on patron endpoints

**Agent B (Frontend):**
- `/c/[slug]` — public creator page: avatar, bio, tiers, support button
- `TierSelector.tsx` — tier cards + custom amount input (min 1 USDC, max 10,000 USDC)
- `SendFlow.tsx` — full 4-step modal with state machine
- `useSendUtxo` hook wired to real SDK

**Sync checkpoint:** End-to-end patron send on **devnet**. UTXO created, proof + handler tx confirmed. Check Solana devnet explorer: `https://explorer.solana.com/tx/<sig>?cluster=devnet`. Before testing, run `tsx scripts/fund-demo.ts` to pre-fund patron test wallet.

---

### Day 6 — Claim Flow
**Agent A (Backend):**
- `PATCH /api/events/:eventId/claimed`
- Background cleanup: mark stale unclaimed events (older than 30 days)

**Agent B (Frontend):**
- `ClaimPanel.tsx` — scan inbox, display UTXOs, claim all button
- `useClaim` hook: scan → claim into encrypted balance → update DB
- After claim: refresh `BalanceDisplay` and `DashboardStats`
- Loading states for scan (can take 10-30s) with explanatory copy

**Sync checkpoint:** Creator can scan, see pending UTXOs, and claim. Balance reflects correctly post-claim.

---

### Day 7 — Compliance / Viewing Keys
**Agent A (Backend):**
- No new routes — this is purely client-side key derivation
- Add `GET /api/creators/:slug/stats` for richer analytics

**Agent B (Frontend):**
- `/dashboard/compliance` page
- `ViewingKeyExport.tsx` — year/month pickers, generate button, display + copy
- Download as `.veil-key` JSON file
- Explanatory UI: what the key discloses and what it does NOT disclose
- Yearly key option for full-year tax reporting

**Sync checkpoint:** Viewing key generates, displays, and downloads correctly. Test with Umbra team docs to verify format.

---

### Day 8 — Explore Page + Polish Pass
**Agent A (Backend):**
- `GET /api/creators` — paginated, filterable by category, search by name
- Indexes on `Creator.category`, `Creator.displayName`

**Agent B (Frontend):**
- `/explore` — grid of `CreatorCard.tsx`, filter bar by category
- Landing page `/` — hero section, how-it-works teaser, featured creators
- `/how-it-works` — visual explainer of Mixer, ZK proofs, viewing keys
- Global error boundary + 404 page

**Sync checkpoint:** Full user journey from landing → explore → creator page → send works end-to-end.

---

### Day 9 — Settings, Edge Cases & Hardening
**Agent A (Backend):**
- `PATCH /api/creators/:slug` (settings)
- `PUT /api/creators/:slug/tiers` (update tiers)
- Input sanitization audit — Zod on every route
- Error response standardization: `{ error: string, code: string }`

**Agent B (Frontend):**
- `/dashboard/settings` — edit profile + tiers
- Handle all SDK error states: `EncryptedDepositError`, `RegistrationError`, etc.
- Handle wallet disconnect mid-flow gracefully
- Handle MPC timeout ("pruned" or "timed-out" callbackStatus)
- Responsive design audit (mobile-first breakpoints)

**Sync checkpoint:** All error flows tested. Wallet disconnect + reconnect works without SDK reinitialization errors.

---

### Day 10 — Demo Polish & Documentation
**Both Agents:**
- Run `tsx scripts/fund-demo.ts` — pre-fund all demo wallets with 2 SOL + 200 USDC each
- Seed realistic demo data (5 creator profiles, varied categories)
- Record demo video walkthrough (devnet — show Solana devnet explorer links as proof)
- Write `README.md` per hackathon submission requirements
- Deploy to Vercel (frontend) + Supabase (DB)
- Ensure `NEXT_PUBLIC_SOLANA_NETWORK=devnet` is set in Vercel environment
- Final end-to-end smoke test on **devnet** via production Vercel URL
- Submit GitHub repository + video link

> **Demo prep checklist:** Before hitting record, run `tsx scripts/check-funder.ts` to confirm funder has SOL, then `tsx scripts/fund-demo.ts` to top up all test wallets.

---

## 11. Error Handling Strategy

### SDK Errors
Every SDK call must be wrapped in try/catch. Map to user-friendly messages:

```typescript
// lib/umbra/errors.ts
import { EncryptedDepositError, RegistrationError } from "@umbra-privacy/sdk";

export function handleUmbraError(error: unknown): string {
  if (error instanceof RegistrationError) {
    return "Registration failed. Please try again — your wallet may need SOL for fees.";
  }
  if (error instanceof EncryptedDepositError) {
    return "Payment failed. Check your USDC balance and try again.";
  }
  // MPC timeout
  if (error instanceof Error && error.message.includes("timed-out")) {
    return "The Arcium network is taking longer than expected. Your funds are safe — check again in a few minutes.";
  }
  return "Something went wrong. Please try again.";
}
```

### MPC Callback Timeout
The SDK may return `callbackStatus: "timed-out"`. This is not a loss of funds — it means the Arcium callback hasn't landed yet. Show a pending state and let the user refresh.

### ATA Not Found
Before calling withdraw, check that the destination ATA exists. Use `@solana/spl-token` to create it if missing. Note: for the patron flow (UTXO send) this is handled by the Mixer, not ETA withdraw — no ATA creation needed.

---

## 12. Security Checklist

- [ ] JWT stored in httpOnly cookie — not localStorage
- [ ] All mutation routes verify JWT before touching DB
- [ ] Creator can only edit their own profile (wallet address match)
- [ ] No patron wallet addresses stored in database
- [ ] Zod validation on all API inputs
- [ ] Rate limiting: 10 req/min on auth routes, 100 req/min on others
- [ ] Slug regex enforced: `/^[a-z0-9-]{3,30}$/`
- [ ] Avatar URLs validated (must be https://)
- [ ] CORS: only allow `NEXT_PUBLIC_APP_URL`
- [ ] `funder.json` is in `.gitignore` — confirm with `git status scripts/` before every push
- [ ] `demo-wallets.json` is in `.gitignore`
- [ ] `FUNDER_KEYPAIR_PATH` is server-side only — never `NEXT_PUBLIC_` prefixed
- [ ] `/api/dev/airdrop` route is gated behind `NEXT_PUBLIC_SOLANA_NETWORK === "devnet"` check — returns 403 on any other network
- [ ] No private keys in any environment variable (funder.json is a file path, not the key itself)

---

## 13. Submission Deliverables

1. **GitHub repo** — public, clean commits, `.env.example` included
2. **README.md** — problem, SDK usage, setup instructions, deployed links
3. **AGENTS.md** — agent coordination spec (this file's companion)
4. **Deployed app** — Vercel URL in README
5. **Demo video** — under 5 minutes, covers: creator onboard, patron send, creator claim, viewing key export

---

## Appendix A — Constants

```typescript
// lib/constants.ts

// ─── Network ────────────────────────────────────────────────────────────────
export const SOLANA_NETWORK = "devnet" as const;
export const SOLANA_RPC     = "https://api.devnet.solana.com";
export const SOLANA_WSS     = "wss://api.devnet.solana.com";

// ─── Umbra program (devnet) ─────────────────────────────────────────────────
export const UMBRA_PROGRAM_ID = "DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ";
export const UMBRA_INDEXER    = "https://utxo-indexer.api-devnet.umbraprivacy.com";
export const UMBRA_RELAYER    = "https://relayer.api-devnet.umbraprivacy.com";

// ─── Token mints (devnet) ────────────────────────────────────────────────────
// ⚠ Confirm exact devnet mint against Umbra's devnet pool registry:
//   GET https://utxo-indexer.api-devnet.umbraprivacy.com/v1/stats
// Replace the placeholder below with the confirmed value.
export const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT as string;

// ─── Amount helpers ──────────────────────────────────────────────────────────
export const USDC_DECIMALS      = 6;
export const MIN_SUPPORT_USDC   = 1_000_000n;         // 1 USDC
export const MAX_SUPPORT_USDC   = 10_000_000_000n;    // 10,000 USDC

// ─── Protocol fee (≈ 0.2136%) ───────────────────────────────────────────────
export const BPS        = 35n;
export const BPS_DIVISOR = 16_384n;
export function estimateFee(amount: bigint): bigint {
  return (amount * BPS) / BPS_DIVISOR;
}

// ─── Explorer helper ─────────────────────────────────────────────────────────
export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
export function explorerAddress(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}
```

## Appendix B — Folder Structure (Full)

```
veil/
├── AGENTS.md
├── PRD.md
├── README.md
├── .env.example
├── .env.local                  # gitignored
├── .gitignore
├── package.json                # root workspace
├── turbo.json                  # Turborepo config
│
├── scripts/                    # Devnet tooling — server-side only
│   ├── funder.json             # ⛔ GITIGNORED — funded devnet keypair
│   ├── demo-wallets.json       # ⛔ GITIGNORED — test wallet addresses
│   ├── check-funder.ts         # Verify funder balance
│   ├── airdrop-sol.ts          # Airdrop/transfer SOL to a wallet
│   ├── fund-usdc.ts            # Mint test USDC to a wallet
│   └── fund-demo.ts            # Fund all demo-wallets.json entries at once
│
├── packages/
│   └── db/
│       ├── package.json
│       ├── schema.prisma
│       ├── migrations/
│       └── index.ts            # exports PrismaClient singleton
│
└── apps/
    └── web/
        ├── package.json
        ├── next.config.ts
        ├── tailwind.config.ts
        ├── tsconfig.json
        │
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                    # /  (landing)
        │   ├── how-it-works/
        │   │   └── page.tsx
        │   ├── explore/
        │   │   └── page.tsx
        │   ├── onboard/
        │   │   └── page.tsx
        │   ├── dashboard/
        │   │   ├── layout.tsx
        │   │   ├── page.tsx
        │   │   ├── compliance/
        │   │   │   └── page.tsx
        │   │   └── settings/
        │   │       └── page.tsx
        │   ├── c/
        │   │   └── [slug]/
        │   │       └── page.tsx
        │   └── api/
        │       ├── auth/
        │       │   ├── nonce/route.ts
        │       │   ├── verify/route.ts
        │       │   └── logout/route.ts
        │       ├── creators/
        │       │   ├── route.ts                    # GET list, POST create
        │       │   └── [slug]/
        │       │       ├── route.ts                # GET, PATCH
        │       │       ├── tiers/route.ts          # PUT
        │       │       └── umbra-registered/route.ts
        │       ├── events/
        │       │   ├── route.ts                    # POST
        │       │   └── [eventId]/
        │       │       └── claimed/route.ts        # PATCH
        │       ├── dashboard/
        │       │   └── route.ts                    # GET
        │       └── dev/
        │           └── airdrop/route.ts            # POST — devnet only, uses funder.json
        │
        ├── components/
        │   ├── ui/             # (see component architecture above)
        │   ├── wallet/
        │   ├── umbra/
        │   └── creator/
        │       └── DevFaucetButton.tsx             # visible only when NETWORK=devnet
        │
        ├── lib/
        │   ├── constants.ts
        │   ├── auth.ts         # JWT sign/verify
        │   ├── middleware.ts   # auth middleware for API routes
        │   ├── db.ts           # Prisma client
        │   ├── validation.ts   # Zod schemas
        │   └── umbra/
        │       ├── client.ts
        │       ├── store.ts    # Zustand
        │       ├── errors.ts
        │       ├── useUmbraRegistration.ts
        │       ├── useSendUtxo.ts
        │       ├── useClaim.ts
        │       ├── useEncryptedBalance.ts
        │       └── useViewingKey.ts
        │
        └── styles/
            └── globals.css     # Tailwind imports + CSS custom properties
```
