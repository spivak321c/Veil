# Veil

**Private patronage for Solana creators.** Fans support their favorite creators without exposing their wallet address or transaction history. Creators receive payments into encrypted balances — their total revenue is invisible to on-chain observers, yet provable to accountants via time-scoped viewing keys.

Built on the [Umbra Privacy SDK](https://github.com/UmbraPrivacy/sdk) and Arcium MPC.

---

## The Problem

Every Solana transaction is public. When a fan tips a creator, anyone can see who sent what, when, and to whom. This creates three real problems:

1. **Fan exposure** — Supporters' wallet addresses and spending patterns become public knowledge. Financial privacy shouldn't be the cost of being generous.
2. **Creator exposure** — A creator's total on-chain income is visible to everyone: competitors, landlords, estranged family, anyone. Public income creates real-world safety and negotiating disadvantages.
3. **Compliance friction** — Privacy tools that make income invisible also make it impossible to prove income for taxes, sponsors, or loan applications. Creators are forced to choose between privacy and legitimacy.

## Target Users

- **Creators** (artists, writers, educators, streamers) who accept tips and patronage on Solana and want their income to remain private
- **Fans/Patrons** who want to support creators without broadcasting their wallet activity
- **Accountants and sponsors** who need verified income statements without seeing individual patron identities

## How Veil Uses the Umbra SDK

The Umbra SDK is not a peripheral dependency — it is the core privacy engine. Every payment on Veil flows through Umbra's cryptographic primitives:

### 1. Stealth Address Generation (Patron → Creator)

When a patron sends a tip, the Umbra SDK generates a one-time stealth address from the creator's registered X25519 public key. The patron deposits dUSDC into Umbra's Mixer contract, assigning ownership to the stealth address — not the creator's wallet. On-chain, the transaction appears as a generic mixer deposit with no link to either party.

```typescript
// apps/web/lib/umbra/useSendUtxo.ts
const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
  { client },
  { zkProver },
);
const result = await createUtxo({
  destinationAddress: recipientAddress,
  mint: USDC_MINT,
  amount: amountUsdc,
});
```

**SDK functions used:** `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`, `getCreateReceiverClaimableUtxoFromPublicBalanceProver`, `getUserRegistrationFunction`, `getUserAccountQuerierFunction`

### 2. UTXO Scanning & Encrypted Balance Claiming (Creator)

Creators scan the Umbra Merkle tree for UTXOs assigned to their stealth addresses. The SDK's scanner returns four buckets — `received`, `publicReceived`, `selfBurnable`, `publicSelfBurnable` — based on the funding source. Veil claims receiver-claimable UTXOs (both `received` and `publicReceived`) directly into an **encrypted balance** powered by Arcium MPC. The claim never exposes the creator's wallet address or the payment amount on-chain.

```typescript
// apps/web/lib/umbra/useClaim.ts
const scan = getClaimableUtxoScannerFunction({ client });
const scanResult = await scan(treeIndex, insertionIndex);
const { received, publicReceived } = scanResult;
const allReceived = [...received, ...publicReceived];

const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
  { client },
  { zkProver, relayer, fetchBatchMerkleProof: client.fetchBatchMerkleProof },
);
await claim(allReceived);
```

**SDK functions used:** `getClaimableUtxoScannerFunction`, `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction`, `getUmbraRelayer`

**ZK prover:** `getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver` from `@umbra-privacy/web-zk-prover`

### 3. Encrypted Balance Queries

After claiming, the creator's balance lives in an Arcium-encrypted on-chain state. Only the creator can read it. No external observer can see the balance, the number of payments, or any payment metadata.

```typescript
// apps/web/lib/umbra/useEncryptedBalance.ts
const queryBalances = getEncryptedBalanceQuerierFunction({ client });
const balances = await queryBalances([USDC_MINT]);
```

**SDK functions used:** `getEncryptedBalanceQuerierFunction`

### 4. Viewing Keys for Compliance

Creators generate time-scoped viewing keys (monthly or yearly) that decrypt the total revenue for a given period without revealing individual patron identities. These keys can be shared with accountants, sponsors, or tax authorities — proving income while preserving fan privacy.

```typescript
// apps/web/lib/umbra/useViewingKey.ts
const derive = getMonthlyViewingKeyDeriver({ client });
const key = await derive(USDC_MINT, year, month);
```

**SDK functions used:** `getMonthlyViewingKeyDeriver`, `getYearlyViewingKeyDeriver`

### 5. Wallet Registration

Both patrons and creators must register with Umbra (one-time) to enable stealth payments and encrypted balances. Registration creates an on-chain user account, registers an X25519 public key for stealth address derivation, and optionally enables the anonymous usage flag.

```typescript
// apps/web/lib/umbra/useUmbraRegistration.ts
const registerFn = getUserRegistrationFunction({ client }, { zkProver });
await registerFn({ confidential: true, anonymous: true });
```

**SDK functions used:** `getUserRegistrationFunction`, `getUserRegistrationProver`, `isRegistrationError`

### 6. Client Initialization with Polling Forwarders

The Umbra client is initialized with polling-based transaction forwarding and computation monitoring for reliability on Solana devnet (where WebSocket subscriptions are unstable).

```typescript
// apps/web/lib/umbra/client.ts
const client = await getUmbraClient(
  { signer, network: "devnet", rpcUrl, indexerApiEndpoint, deferMasterSeedSignature: false },
  { transactionForwarder: getPollingTransactionForwarder({ rpcUrl }),
    computationMonitor: getPollingComputationMonitor({ rpcUrl }) },
);
```

**SDK functions used:** `getUmbraClient`, `getPollingTransactionForwarder`, `getPollingComputationMonitor`

### Complete SDK Dependency Map

| Component | SDK Package | Functions |
|-----------|------------|-----------|
| Client init | `@umbra-privacy/sdk` | `getUmbraClient`, `getPollingTransactionForwarder`, `getPollingComputationMonitor` |
| Registration | `@umbra-privacy/sdk` | `getUserRegistrationFunction`, `getUserAccountQuerierFunction`, `isRegistrationError` |
| Registration ZK | `@umbra-privacy/web-zk-prover` | `getUserRegistrationProver` |
| Send payment | `@umbra-privacy/sdk` | `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`, `isCreateUtxoError` |
| Send ZK | `@umbra-privacy/web-zk-prover` | `getCreateReceiverClaimableUtxoFromPublicBalanceProver` |
| Scan & claim | `@umbra-privacy/sdk` | `getClaimableUtxoScannerFunction`, `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction`, `getUmbraRelayer` |
| Claim ZK | `@umbra-privacy/web-zk-prover` | `getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver` |
| Balance query | `@umbra-privacy/sdk` | `getEncryptedBalanceQuerierFunction` |
| Viewing keys | `@umbra-privacy/sdk` | `getMonthlyViewingKeyDeriver`, `getYearlyViewingKeyDeriver` |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.com) v1.3+
- [Node.js](https://nodejs.org) 20+ (for native crypto APIs)
- A Solana wallet extension (Phantom, Backpack, Solflare) set to **devnet**
- Devnet SOL (from [Solana Faucet](https://faucet.solana.com))
- Umbra dUSDC (from [Umbra Faucet](https://faucet.umbraprivacy.com) — mint: `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7`)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp apps/web/.env apps/web/.env.local
```

Edit `.env.local` with your values. The defaults work for devnet out of the box:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Solana devnet RPC endpoint |
| `NEXT_PUBLIC_SOLANA_WSS_URL` | Yes | Solana devnet WebSocket endpoint |
| `NEXT_PUBLIC_USDC_MINT` | Yes | Umbra dUSDC mint address (default: `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase, Neon, or local) |
| `JWT_SECRET` | Yes | Session signing key (`openssl rand -hex 32`) |
| `FUNDER_KEYPAIR_PATH` | No | Server-side devnet funder keypair (for faucet API) |

### 3. Set up the database

```bash
cd apps/web
bunx prisma db push
```

### 4. Start the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. First-time flow

1. **As a creator:** Connect wallet → register with Umbra → your public page is ready at `/c/{slug}`
2. **As a patron:** Visit a creator's page → connect wallet → the app auto-registers you with Umbra on first tip → send a private tip
3. **Claiming:** Creator opens dashboard → clicks "Claim Payments" → SDK scans the Merkle tree and claims UTXOs into encrypted balance

---

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript type checker (`tsc --noEmit`) |
| `bun run fund:sol` | Airdrop devnet SOL to funder wallet |
| `bun run fund:usdc` | Mint devnet dUSDC to funder wallet |
| `bun run fund:demo` | Fund demo creator wallets |

---

## Architecture

```
Veil/
├── apps/web/                    # Next.js 16 application (App Router)
│   ├── app/                     # Routes
│   │   ├── page.tsx             # Landing page
│   │   ├── onboard/             # Creator onboarding
│   │   ├── c/[slug]/            # Public creator page (tip flow)
│   │   ├── dashboard/           # Creator dashboard
│   │   │   ├── compliance/      # Viewing key generation
│   │   │   └── settings/        # Account settings
│   │   ├── explore/             # Creator directory
│   │   ├── how-it-works/        # Technical explainer
│   │   ├── send/                # Send flow with deep links
│   │   ├── login/               # SIWS authentication
│   │   └── api/                 # Backend routes
│   │       ├── auth/            # Nonce + verify + logout (SIWS)
│   │       ├── creators/        # Creator CRUD
│   │       ├── dashboard/       # Dashboard aggregation
│   │       ├── events/          # Payment event recording + claim-all
│   │       └── devnet/faucet/   # Devnet SOL airdrop API
│   ├── lib/
│   │   ├── umbra/               # ← Core Umbra integration layer
│   │   │   ├── client.ts        # Umbra client init (polling forwarders)
│   │   │   ├── store.ts         # Zustand store for client state
│   │   │   ├── useClaim.ts      # Scan Merkle tree + claim into encrypted balance
│   │   │   ├── useSendUtxo.ts   # Create receiver-claimable UTXO from public balance
│   │   │   ├── useUmbraRegistration.ts  # One-time wallet registration
│   │   │   ├── useViewingKey.ts # Monthly/yearly viewing key derivation
│   │   │   └── useEncryptedBalance.ts   # Encrypted balance query
│   │   ├── auth.ts              # JWT auth utilities
│   │   ├── constants.ts         # Network addresses, fee math, formatters
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── middleware.ts        # Route protection
│   │   └── validation.ts        # Zod schemas
│   ├── components/
│   │   ├── umbra/               # ← Privacy UI components
│   │   │   ├── UmbraProvider.tsx # Wallet→SDK signer bridge (reactive init)
│   │   │   ├── SendFlow.tsx     # Shielded transfer modal with step tracking
│   │   │   ├── ClaimPanel.tsx   # Scan + claim interface
│   │   │   ├── RegisterFlow.tsx # One-click Umbra registration
│   │   │   ├── BalanceDisplay.tsx  # Encrypted balance card
│   │   │   └── ViewingKeyExport.tsx # Key generation + JSON export
│   │   ├── auth/                # SIWS login flow
│   │   ├── creator/             # Creator profile components
│   │   ├── dashboard/           # Dashboard layout + CockpitView
│   │   ├── wallet/              # Solana wallet connection
│   │   ├── crypto/              # WebCrypto polyfills
│   │   ├── landing/             # Landing page sections
│   │   └── ui/                  # Shared primitives (Button, Card, Spinner, Toast)
│   ├── prisma/                  # Database schema
│   └── scripts/                 # Dev tooling (fund-wallets, debug-utxo-scan)
└── packages/                    # Shared packages (reserved for future use)
```

### Key Design Decisions

- **Claim into encrypted balance, not public wallet.** The claim flow uses `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction` so funds remain invisible on-chain. This is the fundamental privacy property — without it, claiming a stealth UTXO would re-associate the creator with the payment.
- **Polling forwarders over WebSocket.** Solana devnet's WebSocket subscriptions are unreliable (frequent 503s). The Umbra client is initialized with `getPollingTransactionForwarder` and `getPollingComputationMonitor` for transaction forwarding and MPC callback monitoring.
- **Four-bucket scan results.** The SDK's `ScannedUtxoResult` returns four arrays: `received`, `publicReceived`, `selfBurnable`, `publicSelfBurnable`. Patron tips sent from public ATAs land in `publicReceived`, not `received`. Veil merges both receiver-claimable buckets before claiming.
- **Wallet-standard wallet connection.** Veil uses `@solana/react-hooks` with wallet-standard for wallet discovery and connection, then bridges the wallet session into an `IUmbraSigner` in `UmbraProvider.tsx`.
- **SIWS authentication.** Creator sessions use Solana's Sign-In With Solana (SIWS) spec, with JWT cookies for server-side route protection.

---

## Devnet Configuration

Veil runs on **Solana devnet** with Umbra's devnet infrastructure:

| Service | URL |
|---------|-----|
| Umbra Indexer | `https://utxo-indexer.api-devnet.umbraprivacy.com` |
| Umbra Relayer | `https://relayer.api-devnet.umbraprivacy.com` |
| dUSDC Mint | `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7` |
| Umbra Faucet | [https://faucet.umbraprivacy.com](https://faucet.umbraprivacy.com) |

> **Important:** You must use Umbra's dUSDC, not the standard devnet USDC. Umbra's devnet stealth pool is only initialized for the dUSDC mint above.

---

## Testing the Flow End-to-End

### As a Patron (sending a tip)

1. Visit a creator's public page at `/c/{slug}`
2. Connect your Solana wallet (set to devnet)
3. Ensure you have devnet SOL and dUSDC
4. Select a tip amount and click "Tip"
5. Approve the wallet transaction — the SDK handles registration (if first time), ZK proof generation, UTXO creation, and the Arcium MPC callback automatically

### As a Creator (claiming payments)

1. Connect your wallet and log in to the dashboard at `/dashboard`
2. Complete Umbra registration if you haven't already (one-time)
3. Click "Claim Payments" — the SDK scans the Merkle tree for your UTXOs and claims them into your encrypted balance
4. View your encrypted balance on the dashboard
5. Generate a viewing key at `/dashboard/compliance` for tax or sponsor reporting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Privacy | `@umbra-privacy/sdk` v4, `@umbra-privacy/web-zk-prover` v2 |
| Blockchain | Solana devnet, `@solana/kit`, `@solana/react-hooks` |
| State | Zustand |
| Auth | SIWS (Sign-In With Solana) + JWT |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Runtime | Bun |

---

## Project Status

This is a hackathon prototype built for the Umbra SDK Hackathon. The core privacy flow (send → scan → claim → encrypted balance → viewing keys) is functional on devnet. Known limitations:

- **Devnet only** — no mainnet deployment yet
- **Single token** — dUSDC only (Umbra devnet pool constraint)
- **No off-ramp** — the "crypto to cash" feature described on the landing page is aspirational
- **Event tracking is server-side** — payment events are recorded in PostgreSQL for the dashboard; on-chain event indexing would be more robust

---

## License

MIT
