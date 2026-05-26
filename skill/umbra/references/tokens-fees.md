# Supported Tokens, Fees & Indexer

## Supported Tokens

Each shielded pool is deployed per token mint and supports both encrypted balances and the mixer.

### Mainnet

| Token | Mint Address | Program | Confidentiality | Mixer |
|---|---|---|---|---|
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | SPL | ✅ | ✅ |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | SPL | ✅ | ✅ |
| wSOL | `So11111111111111111111111111111111111111112` | SPL | ✅ | ✅ |
| UMBRA | `PRVT6TB7uss3FrUd2D9xs2zqDBsa3GbMJMwCQsgmeta` | SPL | ✅ | ✅ |

> Attempting to deposit into a mint without an active pool will fail at the account-fetch stage with an account-not-found error.

### Usage

Pass the mint address directly to any SDK function accepting a `mint` parameter:

```typescript
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
await deposit(client.signer.address, USDC, 1_000_000n); // 1 USDC

const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
await withdraw(client.signer.address, USDC, 1_000_000n);
```

---

## Fee Structure

### Protocol Fee (deducted from SPL token amount)

- **Fixed base:** 0 token micro-units
- **Proportional:** 35 bps (using `BPS_DIVISOR = 2^14 = 16,384`)

**Formula:**
```
protocol_fee = floor(amount × 35 / 16_384)
```

This means 35/16,384 ≈ **0.2136%** (not 0.35% — uses power-of-two divisor, not 10,000).

**Example — 1,000 USDC withdrawal:**
```
1,000,000,000 µUSDC × 35 / 16,384 = 2,136,230 µUSDC ≈ 2.14 USDC fee
Net received: ≈ 997.86 USDC
```

**Programmatic estimate:**
```typescript
import { BPS_DIVISOR } from "@umbra-privacy/sdk";

const bps = 35n;
function estimateProtocolFee(amount: bigint): bigint {
  return (amount * bps) / BPS_DIVISOR; // BPS_DIVISOR = 16_384n
}
```

### Relayer Fee (on mixer claims)

**Current rates: 0.** No SPL relayer fee today.

When non-zero, it applies on top of the protocol fee:
```
relayer_fee = RELAYER_BASE_FEE + floor(amount × RELAYER_BPS / 16_384)
net = amount - protocol_fee - relayer_fee
```

### Mixer SOL Fee (UTXO creation only)

A one-time SOL fee paid upfront when inserting a UTXO into the mixer. Covers:
- **Treap node rent** — minimum rent for the 48-byte nullifier account
- **Claim compute costs** — pre-funds the most expensive possible claim path

Fee is calculated dynamically at UTXO creation time from current Solana rent rates. **Non-refundable.** Denominated in SOL (lamports), separate from the SPL protocol fee.

### Which Operations Carry Which Fees

| Operation | Protocol Fee | Relayer Fee | Mixer SOL Fee |
|---|---|---|---|
| Deposit (ATA → ETA) | ✅ deducted from deposit | ❌ | ❌ |
| Withdraw (ETA → ATA) | ✅ deducted from withdrawal | ❌ | ❌ |
| Create UTXO | ✅ | ❌ | ✅ |
| Claim UTXO | ✅ | ✅ (currently 0) | ❌ (pre-funded at creation) |

### Token-2022 Interaction

For Token-2022 mints with a transfer fee extension: the Token-2022 transfer fee is subtracted **before** Umbra protocol fees are applied. The SDK handles this automatically using `epochInfoProvider` for fee schedule selection.

---

## Indexer API

The UTXO indexer watches Solana for Umbra transactions and provides queryable UTXO data and Merkle proofs.

### Base URLs

| Network | URL |
|---|---|
| Mainnet | `https://utxo-indexer.api.umbraprivacy.com` |
| Devnet | `https://utxo-indexer.api-devnet.umbraprivacy.com` |

All responses are **Protobuf** (`application/x-protobuf`). Rate limited — `429` on excess.

### Passing to SDK

```typescript
const client = await getUmbraClient({
  // ...
  indexerApiEndpoint: "https://utxo-indexer.api.umbraprivacy.com",
});
// The SDK auto-constructs client.fetchUtxoData and client.fetchMerkleProof
// from the endpoint. You don't call the indexer directly when using the SDK.
```

### Key Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /v1/utxos` | Paginated global UTXO list (all trees) |
| `GET /v1/trees/{tree_index}/utxos` | Paginated UTXOs for a specific tree |
| `GET /v1/utxos/{absolute_index}` | Single UTXO by absolute index |
| `POST /v1/trees/{tree_index}/proofs` | Batch Merkle inclusion proofs (max 8) |
| `GET /v1/trees/{tree_index}` | Tree metadata (root hash, leaf count) |
| `GET /v1/stats` | Aggregate stats across all trees |

### Tree Structure

```
absolute_index = tree_index × 1,048,576 + insertion_index
```

Each tree holds up to 1,048,576 leaves (depth-20). When full, a new tree starts.

### Pagination (Tree UTXOs)

```bash
# First page of tree 0
curl "https://utxo-indexer.api.umbraprivacy.com/v1/trees/0/utxos?cursor=0&limit=1000"

# Next page — use next_cursor from previous response
curl "https://utxo-indexer.api.umbraprivacy.com/v1/trees/0/utxos?cursor=1000&limit=1000"
```

Initialize with `cursor = tree_index × 1,048,576`. Repeat with `next_cursor` until the response contains fewer records than `limit`.

### Response Layout Header

For bulk processing, use columnar layout (significantly smaller):
```
X-Response-Layout: columnar
```

Default (omit header) is row-oriented layout — recommended for SDK-level use.

---

## Relayer

The relayer submits claim transactions on your behalf so your wallet never appears on-chain as the fee payer.

```typescript
import { getUmbraRelayer } from "@umbra-privacy/sdk";

const relayer = getUmbraRelayer({
  apiEndpoint: "https://relayer.api.umbraprivacy.com",
});
```

Pass `relayer` as a dependency to any claim factory function.
