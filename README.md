# Veil — Private Patronage for Creators

Veil is a website that lets fans send tips to artists and creators on the Solana blockchain — but with total financial privacy. Normally, every transaction on a blockchain is visible to everyone, like mailing a letter with a transparent envelope. Veil wraps each payment in layers of cryptographic magic so the creator gets paid, but nobody — not even the people running the blockchain — can see how much was sent, who sent it, or how much the creator has earned in total. The creator can, however, generate a special limited-time "viewing key" to prove their income to a tax accountant or sponsor, without revealing anything about their individual fans.

---

## The Problem

Imagine a fan wants to send $10 to their favorite musician. On a normal blockchain, this transaction would permanently record: "Wallet ABC sent 10 USDC to Wallet XYZ at 3:14 PM on Tuesday." Everyone in the world can see this — the fan's friends, the musician's competitors, the musician's landlord, anyone.

This creates three real problems that Veil solves:

1. **Fan exposure** — Your spending habits become public record. Financial privacy should not be the cost of supporting someone you love.
2. **Creator exposure** — A creator's total income is visible to everyone: competitors, landlords, tax authorities without context, anyone. Public income creates real-world safety and negotiating disadvantages.
3. **Compliance friction** — Tools that make income invisible also make it impossible to prove income for taxes, sponsors, or loan applications. Creators are forced to choose between privacy and legitimacy.

---

## The Conveyor Belt: Walk Through the Factory

Imagine you're a fan at your computer sending $10 of USDC (a type of digital dollar) to your favorite artist. Here's what happens step by step inside the code, visualized as a factory floor.

### Before Anything Runs: The Main Power Switch

File: `apps/web/lib/umbra/client.ts`

Before any payment can happen, the factory's main power switch must be turned on. A function called `initUmbraClient` does this:

1. It connects to your **wallet** — this is your personal rubber stamp. Every time the system needs your permission (like "is it OK to send $10?"), your wallet asks you to approve it.
2. It talks to the **Solana blockchain** — the public digital ledger where everything is recorded. Think of this as the factory's link to the outside world.
3. It creates two filing cabinets in your browser's memory:
   - A **nullifier store** — a list of all receipts that have already been cashed, so nobody can cash the same receipt twice.
   - A **UTXO data store** — a catalog of all payments (called "notes") that have been sent to you.
4. It derives your **master seed** — a secret password that stays in your browser and is never sent to the blockchain. This seed is used to generate all your other cryptographic keys. It's stored in your browser's `localStorage` (like a sticky note in your desk drawer) so you don't have to re-register every time you visit.

The entire factory is powered by the **Umbra Privacy SDK** — a toolkit that handles all the hard math. Veil is the factory building; the SDK is the electricity and machinery inside.

### Step 0: The ID Check

File: `apps/web/lib/umbra/useSendUtxo.ts` (function: `ensurePatronRegistered`)

Before you can send money, Veil checks whether you've ever used this privacy system before. It calls `getUserAccountQuerierFunction`, which is like a bouncer scanning your ID at the club entrance. The bouncer asks the blockchain's membership registry: "Does this person have an account?" If yes (and anonymous usage is enabled), you walk right in. If not, you're sent to the registration desk.

The same check happens for the creator too — Veil verifies they've registered before you can send to them. If they haven't, the system stops with a polite error message: "This creator hasn't set up their account yet."

### Step 1: Getting Your Membership Card

File: `apps/web/lib/umbra/useUmbraRegistration.ts`

If you're a new user, the system runs `getUserRegistrationFunction`. This is a three-stage assembly line:

1. **initUserAccount** — Creates your account on the blockchain. Like engraving your name on the club's membership plaque.
2. **registerX25519PublicKey** — Publishes a special encryption key (called an X25519 key) that others use to address secret notes to you. Like giving the club your PO Box number — anyone can send mail to it, but only you have the key to open it.
3. **registerAnonymousUsage** — Enables the ability to transact without linking your identity. This is what makes "stealth" possible — it's like telling the club: "I want to be able to leave tips without anyone seeing it's me."

Each of these three steps requires signing a transaction in your wallet (you see a pop-up asking you to approve). The entire process runs in about 10-20 seconds and only happens **once per wallet**.

### Step 2: Checking Your Steel Safe

File: `apps/web/lib/umbra/useEncryptedBalance.ts`

Before sending, Veil checks how much money you already have in your **ETA** (Encrypted Token Account). This is a steel safe in your basement — only you can see what's inside. The function `getEncryptedBalanceQuerierFunction` calls the blockchain and asks: "What's in this safe?" The blockchain returns an encrypted number. Your browser uses your secret key to decrypt it, right on your own computer. The balance is never visible to anyone else.

The result comes in one of three states:
- **"shared"** — the balance is in a form your browser can decrypt. You can use it immediately.
- **"mxe"** — the balance uses a different encryption mode that your browser can't read yet. The money is there, but it needs to be converted first.
- **"none"** — you have no encrypted balance for this token.

Why check before sending? If you already have $100 in your steel safe and you want to send $5, you can skip the expensive "shielding" step (Step 3). This is like checking your wallet for cash before going to the ATM — saves a trip.

### Step 3: The Shielding Furnace

File: `apps/web/lib/umbra/useSendUtxo.ts` (inside the `send` function)

If you don't have enough money in your steel safe, Veil moves money from your **ATA** (Associated Token Account) into your **ETA**.

- **ATA** — your public USDC wallet. This is a glass jar on your front porch. Everyone walking by can see how many coins are inside.
- **ETA** — your encrypted USDC vault. This is a steel safe in your basement. Nobody can see its contents except you.

The function `getATAIntoETADirectDepositorFunction` takes money out of your glass jar, melts it down, and pours it into your steel safe. The transaction on the blockchain says only: "Someone moved some money into an encrypted account." It doesn't say who, how much, or why.

**Why do this step at all?** If you sent money directly from your public wallet to the creator, everyone could see "Fan X sent Creator Y $10." That defeats the purpose of privacy. The shield step severs the link between your public identity and the eventual payment. It's like dropping your letter into a public mailbox instead of hand-delivering it — the postal service knows someone mailed something, but they don't know what or to whom.

### Step 4: The Secret Note Factory

File: `apps/web/lib/umbra/useSendUtxo.ts` (inside the `send` function)

Now the real magic happens. The function `getETAIntoReceiverBurnableStealthPoolNoteCreatorFunction` takes money from your encrypted vault and creates a **stealth pool note** — a cryptographic IOU that only the creator can claim.

Here's what happens inside this function:

1. **Stealth address generation** — It takes the creator's X25519 public key (their PO Box number) and mathematically generates a one-time, disposable address. Think of it as sending a package addressed to "Current Resident of 123 Main St" — the post office doesn't know which specific person it's for, but the right person (the one living there) can recognize and receive it.

2. **Note creation** — It creates an IOU and tosses it into the **stealth pool** — a giant collection of millions of identical-looking notes on the blockchain. Each note is like a sealed envelope dropped into a massive pile. There's no way to tell which envelope belongs to whom or how much each contains.

3. **Zero-knowledge proof generation** — It generates a mathematical certificate that says "this note was created correctly" without revealing any details. This is like a notary stamp that says "this document was processed correctly" without reading the document. This proof is generated by a **ZK prover** — a piece of software that runs a WebAssembly (WASM) program in your browser. WASM is like a race car engine compared to JavaScript's bicycle — it can do the heavy mathematical lifting fast enough to be usable. The proving keys and WASM files needed for this are large (megabytes each), so they're downloaded from a CDN on first use and cached in your browser's IndexedDB for future visits.

4. **Relayer submission** — A **relayer** — a third-party service — submits the transaction to the blockchain and pays the network fee for you. Your wallet isn't even linked on the fee-payment level. It's like having a courier deliver your package — the store only sees the courier, not you.

5. **MPC completion** — MPC stands for "Multi-Party Computation." Multiple computers run a cryptographic ritual together, and no single computer ever sees the full picture. It's like a bank vault that requires three employees, each with their own key — no one person can open it alone. The Arcium network handles this.

### Step 5: Recording the Receipt

File: `apps/web/app/api/events/route.ts`

After the note is created and submitted, Veil's backend (a PostgreSQL database, accessed via a tool called Prisma) records a lightweight event: "Fan X's payment of Y amount to Creator Z was initiated with transaction signature S." This event is stored in a database table called `SupportEvent`. It's used to show the creator their recent support activity on their dashboard — they can see someone tipped, but the database doesn't know who or link it to any on-chain data. This recording is optional and purely for the dashboard's convenience; the actual payment lives entirely on the blockchain inside the stealth pool.

---

### Sometime Later: The Creator's Turn

#### Step 6: Scanning the Pool

File: `apps/web/lib/umbra/useClaim.ts`

Days later, the creator opens their dashboard and clicks "Claim Payments." The function `getBurnableStealthPoolNoteScannerFunction` runs first. It talks to an **indexer** — a search engine that has pre-organized all the blockchain data for fast lookup.

The scanner tells the indexer: "Hey, has anyone sent notes to me?" It doesn't fully reveal which notes are yours — instead, it downloads all potential matches into your local data store. The notes are organized in a **Merkle tree**, which is a way of arranging data where each piece is a "leaf" on a giant tree, and the tree's structure mathematically proves that nothing has been tampered with.

After the scan, your local filing cabinet contains all the notes that might be yours. The code filters to only notes of type `etaToStealthPoolReceiverBurnable` — notes that:
- Came from an ETA (encrypted vault), meaning they're properly private
- Are "receiver-burnable," meaning the creator (the receiver) can destroy them to claim the value
- Haven't been claimed yet (checked against a local cache in `localStorage`)

Before burning, the system **reconciles with on-chain state** — it asks the blockchain which notes have already been spent (nullified) to avoid wasting time trying to claim them again.

#### Step 7: The Incinerator

File: `apps/web/lib/umbra/useClaim.ts` (inside `scanAndClaim`)

For each batch of up to 4 notes, Veil calls `getReceiverBurnableStealthPoolNoteIntoETABurnerFunction`. This is the most complex machine on the factory floor. For each note:

1. **ZK proof generation** — It generates a proof that you are the rightful owner of the note, without revealing who you are. This is like showing the bank a key that fits a safety deposit box — they don't need your name, just that the key fits.

2. **Nullifier generation** — It produces a **nullifier** — a unique, one-time-use identifier that says "this note has been spent." If anyone tries to claim the same note again, the blockchain sees the nullifier and rejects it. This prevents double-spending without revealing which note was spent.

3. **Merkle proof** — It fetches proof that the note was actually part of the pool. This is like pulling the original receipt from the filing system to prove the package was real.

4. **Relayer submission** — The burn is submitted through a relayer, again to avoid linking the creator's wallet to the transaction.

5. **The note is destroyed** — The value flows into the creator's ETA (their encrypted vault), where it becomes part of their invisible balance.

The batch size is 4 notes per claim. Each burn is computationally heavy (multiple ZK proofs, multiple blockchain writes). Doing them in small batches is like washing dishes — you don't wash each dish individually (too many trips to the sink) and you don't wash all 100 at once (your hands can't hold them all). Four is the sweet spot where the machine is efficient without risking failure.

After a successful burn, the note ID is stored in `localStorage` under the key `veil_claimed_...` so the system never tries to burn it again, even if the scanner picks it up in a future scan.

The database is also updated via `POST /api/events/claim-all` — all `SupportEvent` records for this creator that don't have a `claimedAt` timestamp get marked as claimed.

#### Step 8: Checking What You Have

File: `apps/web/lib/umbra/useEncryptedBalance.ts`

The creator's dashboard calls `getEncryptedBalanceQuerierFunction` again. Now their encrypted balance shows the new total — minus the platform fee of 0.21% (35 basis points per 16384), which funds the relayers and operational costs.

The balance display component in the UI handles three states:
- **Decryptable balance** ("shared") — shows the amount with a refresh button
- **Non-decryptable balance** ("mxe") — shows a message explaining the balance exists but needs converting
- **No balance** — shows zero

The `useConvertToShared` hook (using `getNetworkEncryptionToSharedEncryptionConverterFunction`) can convert MXE-mode balances into the decryptable "shared" format when needed.

#### Step 9: The Escalator (Optional - Moving Money Out)

File: `apps/web/lib/umbra/useWithdraw.ts`

If the creator wants to use their money in the real world, they can "withdraw" from their encrypted vault back to their public wallet using `getETAIntoATAWithdrawerFunction`. This is the reverse of Step 3 — it takes money from the steel safe and pours it back into the glass jar. The on-chain record shows only "someone withdrew from an encrypted account" — it doesn't link the creator to the original payments.

#### Step 10: The Key Cutter (Optional - Compliance)

File: `apps/web/lib/umbra/useViewingKey.ts`

This is Veil's most innovative feature. The creator generates a **viewing key** — a limited-time password that decrypts only the **total revenue** for a specific month or year, without revealing individual transaction details or patron identities.

The functions `getMonthlyViewingKeyDeriver` and `getYearlyViewingKeyDeriver` take three inputs:
1. The token type (USDC)
2. The year
3. The month (for monthly version)

And produce a single string — the viewing key. This key is mathematically derived from the creator's master seed combined with the time period. It cannot decrypt other time periods, individual patron identities, or any other data. The mathematics ensure this is not enforced by rules or policies but by the underlying cryptography — the key simply will not work on a different month.

The creator can hand this key to a tax accountant, a sponsor, or a loan officer. The recipient visits Veil's `/verify` page, enters the key, and sees: "This creator earned $X in December 2025." The blockchain itself verifies this — it's not Veil's website saying it, it's the blockchain's encrypted data being decrypted by the key. This means the proof is trustworthy even if the recipient doesn't trust Veil.

The creator can also generate a shareable revenue badge (at `/c/{slug}/revenue/{period}`) and a shareable verification link (at `/verify`) to distribute via email or their website.

---

## Meet the Machines: SDK Method Reference

Here is every SDK "machine" used in the codebase, what it does, and why it exists:

### Client Initialization

| Machine | File | Analogy |
|---------|------|---------|
| `getUmbraClient` | `client.ts` | Turning on the factory's main power switch |
| `getPollingTransactionForwarder` | `client.ts` | A courier who keeps checking "is it there yet?" instead of waiting for a phone call |
| `getPollingComputationMonitor` | `client.ts` | A foreman who keeps checking "is the machine done yet?" |
| `createBrowserStorageBackend` | `client.ts` | Installing the filing cabinet in your browser |
| `createShardedNullifierStore` | `client.ts` | A ledger that records which receipts have been cashed |
| `createShardedUtxoDataStore` | `client.ts` | A catalog of all notes sent to you |

### Registration

| Machine | File | Analogy |
|---------|------|---------|
| `getUserAccountQuerierFunction` | `useSendUtxo.ts` | The bouncer checking your ID |
| `getUserRegistrationFunction` | `useUmbraRegistration.ts` | The membership desk - 3-step signup process |

### Sending a Payment

| Machine | File | Analogy |
|---------|------|---------|
| `getEncryptedBalanceQuerierFunction` | `useEncryptedBalance.ts` | Peeking into your steel safe to check your balance |
| `getATAIntoETADirectDepositorFunction` | `useSendUtxo.ts` | Moving coins from your glass jar to your steel safe |
| `getETAIntoReceiverBurnableStealthPoolNoteCreatorFunction` | `useSendUtxo.ts` | Creating a secret IOU and tossing it into a pile of millions of identical IOUs |

### Claiming Payments

| Machine | File | Analogy |
|---------|------|---------|
| `getBurnableStealthPoolNoteScannerFunction` | `useClaim.ts` | Raking through the pile of IOUs looking for ones with your name on them |
| `getReceiverBurnableStealthPoolNoteIntoETABurnerFunction` | `useClaim.ts` | Incinerating the IOU and funneling the money into your steel safe |
| `getUmbraRelayer` | `useClaim.ts` | The anonymous courier who delivers your claim for you |

### Balance & Conversion

| Machine | File | Analogy |
|---------|------|---------|
| `getEncryptedBalanceQuerierFunction` | `useEncryptedBalance.ts` | The safe inspector who tells you your balance without anyone else hearing |
| `getNetworkEncryptionToSharedEncryptionConverterFunction` | `useConvertToShared.ts` | Converting a safe that needs 3 keys into a safe that only needs 1 |

### Withdrawals

| Machine | File | Analogy |
|---------|------|---------|
| `getETAIntoATAWithdrawerFunction` | `useWithdraw.ts` | Moving money from your steel safe back to your glass jar |

### Viewing Keys

| Machine | File | Analogy |
|---------|------|---------|
| `getMonthlyViewingKeyDeriver` | `useViewingKey.ts` | Cutting a key that only opens the door labeled "January 2025" |
| `getYearlyViewingKeyDeriver` | `useViewingKey.ts` | Cutting a key that only opens the door labeled "2025" |

### ZK Provers

| Machine | File | Analogy |
|---------|------|---------|
| `getUserRegistrationProver` | `zk-prover.ts` | The mathematical notary that stamps "registration is valid" |
| `getETAIntoStealthPoolNoteCreatorProver` | `zk-prover.ts` | The mathematical notary that stamps "this IOU was created correctly" |
| `getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver` | `zk-prover.ts` | The mathematical notary that stamps "this claim is legitimate" |
| `getCdnZkAssetProvider` | `zk-prover.ts` | The parts warehouse that delivers the heavy machinery needed for proof generation |
| `resolveZkAssets` | (SDK internal) | The parts fetcher that checks your IndexedDB cache first, and only goes to the warehouse if needed |
| `proveGroth16` | (SDK internal) | The engine that actually runs the heavy computation to produce a Groth16 proof |

---

## Why It's Built This Way: Key Design Decisions

### Privacy is a Series of Steps, Not a Single Switch

There is no single "make this private" button. Each SDK method handles one specific information leak:

- **Shielding** (Step 3) prevents the link between your public wallet and the payment
- **Stealth addresses** (Step 4) prevents the link between you and the creator
- **The stealth pool** (Step 4) prevents anyone from counting payments by making all notes look identical
- **Claiming into encrypted balance** (Step 7) prevents the link between the payment and the creator's wallet
- **The relayer** (Steps 4 and 7) prevents the network fee from linking wallets

If you skip any step, privacy is broken. That's why there are 10+ distinct SDK methods instead of one magic button.

### Claim into Encrypted Balance, Not Public Wallet

This is the most critical privacy property. If claiming a stealth note moved the money to the creator's public wallet, anyone watching the blockchain could say: "This wallet just claimed a note from the stealth pool, so this transaction must have been to this creator." The encrypted balance breaks this link — the money enters a vault where nobody can see what's inside.

### Polling Over WebSockets

WebSockets are like having a phone pressed to your ear waiting for the call to come in. On Solana's development network (devnet), these connections are unreliable (they frequently drop). Polling is like calling the front desk every 2 seconds and asking "is it ready yet?" — it's less elegant, but it works reliably.

### Polling transaction forwarder: constantly asks the blockchain "is my transaction confirmed yet?"
### Polling computation monitor: constantly asks the MPC network "is my computation done yet?"

### Batch Processing

Claiming notes costs money (blockchain transaction fees) and takes time (ZK proof generation). Processing notes in batches of 4 is the economic sweet spot: each batch costs one transaction fee but can handle up to 4 claims, and the machine isn't overworked to the point of failure.

### Viewing Keys Over Full Transparency

This is the innovation that makes Veil different from both "everything is public" and "everything is invisible." The viewing key is a cryptographic construct — it's mathematically bound to a specific time period and token. This means:
- **The creator cannot fake it** — the key only decrypts what the blockchain actually recorded
- **The sponsor cannot expand it** — the same key that works for December will not work for January
- **The patron is protected** — even with the key, the sponsor sees only totals, not individual transactions

### Master Seed in localStorage

Your master seed (the root password for all your cryptographic keys) is stored in your browser's `localStorage`. This is like keeping a sticky note in your desk drawer — it's convenient but it means you can only access your encrypted balance from the same browser. If you clear your browser data, you lose access to your master seed. Production systems would use more sophisticated key management, but for a devnet prototype this trade-off is acceptable.

### The ZK Prover Cache

The WASM files and proving keys needed for zero-knowledge proof generation are large (megabytes each). On first use, they're downloaded from a CDN and stored in IndexedDB — a permanent database in your browser that survives page reloads. The CDN manifest (which maps circuit types to download URLs) is cached in memory. This means:
- **First ever use of any prover** — downloads WASM + proving keys + manifest
- **Subsequent uses in the same page session** — uses in-memory manifest cache + IndexedDB cache
- **Next visit tomorrow** — IndexedDB still has the files, manifest is re-fetched once (it's tiny)
- **No network requests during proof generation** — all assets are local

---

## Architecture

```
Veil/
├── apps/web/               # The website (Next.js with App Router)
│   ├── app/                # Pages and API routes
│   │   ├── page.tsx        # Landing page
│   │   ├── c/[slug]/       # Creator profile page (fans send tips here)
│   │   ├── dashboard/      # Creator dashboard (view balance, claim, settings)
│   │   ├── onboard/        # New creator signup wizard
│   │   ├── explore/        # Browse all creators
│   │   ├── login/          # Sign in with your Solana wallet
│   │   ├── verify/         # Verify a viewing key
│   │   ├── how-it-works/   # Explainer pages
│   │   └── api/            # Backend routes (auth, creators, events, dashboard)
│   ├── lib/
│   │   ├── umbra/          # The factory floor — all Umbra SDK integrations
│   │   │   ├── client.ts           # Main power switch (client initialization)
│   │   │   ├── store.ts            # Global state (Zustand)
│   │   │   ├── useSendUtxo.ts      # Sending tips (Steps 0-4)
│   │   │   ├── useClaim.ts         # Claiming payments (Steps 6-7)
│   │   │   ├── useUmbraRegistration.ts  # Getting your membership card (Step 1)
│   │   │   ├── useEncryptedBalance.ts   # Checking your steel safe (Step 8)
│   │   │   ├── useViewingKey.ts    # Cutting keys for compliance (Step 10)
│   │   │   ├── useWithdraw.ts      # Moving money out of the vault
│   │   │   ├── useConvertToShared.ts   # Converting balance format
│   │   │   ├── zk-prover.ts        # The ZK engine room
│   │   │   ├── zk-cache.ts         # Persistent cache for proving assets
│   │   │   └── ephemeral-keys.ts   # Derivation of temporary keys
│   │   ├── auth.ts         # JWT token management
│   │   ├── constants.ts    # Network URLs, fee math, formatters
│   │   ├── db.ts           # Database connection (Prisma)
│   │   ├── middleware.ts   # Route protection utilities
│   │   └── validation.ts   # Input validation rules (Zod)
│   ├── components/
│   │   ├── umbra/          # Privacy UI components
│   │   │   ├── UmbraProvider.tsx    # Wires wallet to Umbra SDK
│   │   │   ├── SendFlow.tsx         # Tip modal with progress states
│   │   │   ├── ClaimPanel.tsx       # Scan & claim interface
│   │   │   ├── RegisterFlow.tsx     # Registration wizard
│   │   │   ├── BalanceDisplay.tsx   # Encrypted balance card
│   │   │   └── ViewingKeyExport.tsx # Viewing key generation
│   │   ├── landing/        # Landing page sections
│   │   ├── dashboard/      # Dashboard components
│   │   ├── creator/        # Creator profile components
│   │   ├── auth/           # Login flow
│   │   ├── wallet/         # Wallet connection
│   │   └── ui/             # Shared primitives (Button, Card, etc.)
│   └── prisma/             # Database schema
└── packages/db/            # Shared database types
```

---

## Tech Stack

| Layer | What it is | Plain English |
|-------|-----------|---------------|
| Framework | Next.js 16 (App Router, React 19) | The engine that builds and serves the website |
| Privacy Engine | `@umbra-privacy/sdk` v5 | The machinery that makes payments invisible |
| Blockchain | Solana devnet | The public digital ledger used for testing |
| State Management | Zustand | A tiny box that holds the current state of the Umbra client |
| Authentication | SIWS (Sign In With Solana) + JWT | Proving you own your wallet using a digital signature |
| Database | PostgreSQL (Supabase) + Prisma | A traditional database that stores creator profiles and event records |
| Styling | Tailwind CSS v4 | A system for writing CSS without leaving your HTML |
| Runtime | Bun | The program that runs the development server |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.com) v1.3+ — the program that runs this project
- [Node.js](https://nodejs.org) 20+ — needed for some cryptographic APIs
- A Solana wallet extension (Phantom, Backpack, or Solflare) set to **devnet** — this is your digital identity
- Devnet SOL (free test tokens from [Solana Faucet](https://faucet.solana.com))
- Umbra dUSDC (free test USDC from [Umbra Faucet](https://faucet.umbraprivacy.com))

### Setup

```bash
# 1. Download all dependencies
bun install

# 2. Create your local settings file
cp apps/web/.env.example apps/web/.env.local

# 3. Set up the database (creates tables in your PostgreSQL)
cd apps/web
bunx prisma db push
cd ../..

# 4. Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-Time Walkthrough

**As a creator:** Connect your wallet → complete the onboarding wizard (profile setup + Umbra registration) → your public tip page is live at `/c/{your-name}`. Share this link with your fans.

**As a fan:** Visit a creator's page → connect your wallet → pick a tip amount → click "Send" → approve the wallet transactions. The system registers you with Umbra automatically on your first tip. The creator receives your payment without anyone knowing it was you.

**Claiming:** As a creator, open your dashboard → click "Scan & Claim" → the system finds all unclaimed tips and moves them into your encrypted balance. The transaction is invisible to outside observers.

**Compliance:** Go to Dashboard → Compliance → select a month → click "Generate Key" → copy the viewing key or download it as JSON. Send this key to your accountant. They can paste it into the verify page to see your total revenue for that period.

---

## Commands

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start the development website |
| `bun run build` | Build the website for production |
| `bun run start` | Start the production server |
| `bun run lint` | Check code quality (ESLint) |
| `bun run typecheck` | Check for type errors (TypeScript) |
| `bun run fund:sol` | Get free test SOL for the project funder wallet |
| `bun run fund:usdc` | Get free test USDC for the project funder wallet |
| `bun run fund:demo` | Fund demo creator wallets with test tokens |

---

## Network Addresses

| Resource | Address |
|----------|---------|
| **Website** | [https://veil-umbra.vercel.app](https://veil-umbra.vercel.app) |
| **Umbra Indexer** (searches blockchain for notes) | `https://utxo-indexer.api-devnet.umbraprivacy.com` |
| **Umbra Relayer** (submits transactions anonymously) | `https://relayer.api-devnet.umbraprivacy.com` |
| **dUSDC Mint** (the test USDC token address) | `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7` |
| **Umbra Faucet** (get free test USDC) | [https://faucet.umbraprivacy.com](https://faucet.umbraprivacy.com) |

> **Important:** You must use Umbra's dUSDC, not standard devnet USDC. The Umbra devnet stealth pool is only configured for the dUSDC mint listed above.

---

## Known Limitations

- **Devnet only** — The system runs on Solana's test network, not the real one. Mainnet deployment would require production proving keys and real USDC liquidity.
- **Single token** — Only dUSDC is supported. The Umbra devnet pool constraints limit this.
- **No off-ramp** — Moving from crypto back to regular money is aspirational.
- **Browser-bound master seed** — Your master seed is stored in your browser's localStorage. Clearing your browser data will lose it. Future versions would use hardware wallet signing or cloud backup.
- **Server-side event tracking** — Payment events are recorded in PostgreSQL. On-chain indexing (reading events directly from the blockchain) would be more robust and trustless long-term.

---

## License

MIT
