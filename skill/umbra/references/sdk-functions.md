# Umbra SDK Functions Reference

All functions follow the same factory pattern: `getSomethingFunction({ client }, deps?)` returns an async function you call with the actual arguments.

---

## Client Setup

### getUmbraClient

```typescript
import { getUmbraClient } from "@umbra-privacy/sdk";

const client = await getUmbraClient({
  signer: walletAdapter,             // IUmbraSigner: must implement signMessage + signTransaction
  network: "mainnet",                // "mainnet" | "devnet" | "localnet"
  rpcUrl: "https://api.mainnet-beta.solana.com",
  rpcSubscriptionsUrl: "wss://api.mainnet-beta.solana.com",
  indexerApiEndpoint: "https://utxo-indexer.api.umbraprivacy.com", // required for mixer
  deferMasterSeedSignature?: boolean, // skip wallet prompt at construction; default: false
});
```

**IUmbraClient** fields (read-only, pass to all factory functions):
- `signer` — connected wallet
- `network` — configured network
- `networkConfig` — on-chain program IDs
- `accountInfoProvider`, `blockhashProvider`, `transactionForwarder`, `epochInfoProvider` — RPC providers
- `fetchMerkleProof`, `fetchUtxoData` — present only when `indexerApiEndpoint` is set
- `masterSeed.getMasterSeed()` — convenience method combining load + generate

**IUmbraSigner interface:**
```typescript
interface IUmbraSigner {
  readonly address: Address;
  signTransaction(tx: SignableTransaction): Promise<SignedTransaction>;
  signTransactions(txs: readonly SignableTransaction[]): Promise<SignedTransaction[]>;
  signMessage(message: Uint8Array): Promise<SignedMessage>;
}
```

For testing, use `createInMemorySigner()` from `@umbra-privacy/sdk`.

---

## Registration

### getUserRegistrationFunction

One-time idempotent flow. Steps already completed in previous sessions are skipped.

```typescript
import { getUserRegistrationFunction } from "@umbra-privacy/sdk";
import { getUserRegistrationProver } from "@umbra-privacy/web-zk-prover"; // required for anonymous: true

const zkProver = getUserRegistrationProver(); // needed only for anonymous mode
const register = getUserRegistrationFunction({ client }, { zkProver });
const signatures = await register({
  confidential: true, // enable encrypted balance (Shared mode). Default: true
  anonymous: true,    // enable mixer (requires zkProver). Default: true
});
```

Returns `TransactionSignature[]` of all submitted transactions.
Throws `RegistrationError` on failure.

### Key Rotation Functions

```typescript
// Rotate the X25519 key in the on-chain user account
const rotateX25519 = getRotateUserAccountX25519KeyFunction({ client }, deps);
await rotateX25519(); // no arguments

// Rotate the Master Viewing Key X25519 encryption key
const rotateMvk = getRotateMvkX25519KeyFunction({ client }, deps);
await rotateMvk(); // no arguments

// Update random generation seed (affects commitment randomness)
const updateSeed = getUpdateRandomGenerationSeedFunction({ client });
await updateSeed(newSeed32Bytes);

// Update per-mint token account seed
const updateMintSeed = getUpdateTokenAccountRandomGenerationSeedFunction({ client });
await updateMintSeed(mintAddress, newSeed32Bytes);
```

### Staged Fund Recovery (after failed MPC callback)

```typescript
// Recover staged SOL
const claimSol = getClaimStagedSolFromPoolFunction({ client });
await claimSol(mintAddress, lamports, destinationAddress);

// Recover staged SPL tokens
const claimSpl = getClaimStagedSplFromPoolFunction({ client });
await claimSpl(mintAddress, amount, destinationAddress);
```

---

## Deposit (ATA → Encrypted Balance)

### getPublicBalanceToEncryptedBalanceDirectDepositorFunction

```typescript
import { getPublicBalanceToEncryptedBalanceDirectDepositorFunction } from "@umbra-privacy/sdk";

const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
const result = await deposit(
  destinationAddress,   // Address — Umbra-registered recipient
  mintAddress,          // Address — token mint
  1_000_000n,           // U64 — amount in base token units (bigint)
  {                     // options (all optional):
    priorityFees?: U64,         // compute unit price in microlamports
    purpose?: number,           // caller-defined tag stored on-chain
    awaitCallback?: boolean,    // wait for MPC callback? Default: true
    skipPreflight?: boolean,    // Default: false
    maxRetries?: number,
    accountInfoCommitment?: Commitment,
    epochInfoCommitment?: Commitment,
  }
);
```

**DepositResult:**
```typescript
{
  queueSignature: string;            // handler tx signature
  callbackStatus?: "finalized" | "pruned" | "timed-out";
  callbackSignature?: string;        // MPC callback tx signature (when finalized)
  callbackElapsedMs?: number;
  rentClaimSignature?: string;
  rentClaimError?: string;
}
```

Throws `EncryptedDepositError`.

---

## Withdraw (Encrypted Balance → ATA)

### getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction

```typescript
import { getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction } from "@umbra-privacy/sdk";

const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
const result = await withdraw(
  destinationAddress,   // Address — where tokens go (must have ATA for mint)
  mintAddress,          // Address — token mint
  50_000_000n,          // U64 — amount in base units (must not exceed encrypted balance)
  {                     // options (all optional):
    priorityFees?: U64,
    awaitCallback?: boolean,  // Default: true
    optionalData?: Uint8Array, // 32 bytes
    skipPreflight?: boolean,
    maxRetries?: number,
    accountInfoCommitment?: Commitment,
    epochInfoCommitment?: Commitment,
  }
);
```

**WithdrawResult:**
```typescript
{
  queueSignature: string;
  callbackStatus?: "finalized" | "pruned" | "timed-out";
  callbackSignature?: string;
  callbackElapsedMs?: number;
  rentClaimSignature?: string;
  rentClaimError?: string;
}
```

> If the destination ATA does not exist, the transaction will fail. Create it first using standard token tooling.

Throws `EncryptedWithdrawalError`.

---

## Query

### getEncryptedBalanceQuerierFunction

Reads encrypted balance locally (Shared mode only).

```typescript
import { getEncryptedBalanceQuerierFunction } from "@umbra-privacy/sdk";

const queryBalances = getEncryptedBalanceQuerierFunction({ client });
const balances = await queryBalances([usdcMint, solMint]);

for (const [mint, result] of balances) {
  switch (result.state) {
    case "shared":        console.log("Balance:", result.balance); break;
    case "mxe":           console.log("Cannot decrypt client-side"); break;
    case "uninitialized": console.log("No balance yet"); break;
    case "non_existent":  console.log("No ETA for this mint"); break;
  }
}
```

Throws `QueryError`.

### getUserAccountQuerierFunction

Checks if an address is registered on Umbra.

```typescript
import { getUserAccountQuerierFunction } from "@umbra-privacy/sdk";

const queryUserAccount = getUserAccountQuerierFunction({ client });
const result = await queryUserAccount(userAddress);

if (result.state === "exists") {
  // result.data: EncryptedUserAccount
  result.data.isActiveForAnonymousUsage        // bool — mixer enabled
  result.data.isUserAccountX25519KeyRegistered // bool
  result.data.x25519PublicKey                  // Uint8Array (32 bytes)
  result.data.generationIndex                  // U128
} else {
  // result.state === "non_existent" — not registered
}
```

---

## Mixer: Create UTXOs

All UTXO creators require a `zkProver` from `@umbra-privacy/web-zk-prover`. They return `Promise<TransactionSignature[]>` — `[proofAccountSignature, utxoCreationSignature]`.

### UTXO Creator Matrix

| Function | Funded from | Claimable by |
|---|---|---|
| `getPublicBalanceToSelfClaimableUtxoCreatorFunction` | Public ATA | Creator only |
| `getPublicBalanceToReceiverClaimableUtxoCreatorFunction` | Public ATA | Specified recipient |
| `getEncryptedBalanceToSelfClaimableUtxoCreatorFunction` | Encrypted balance | Creator only |
| `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction` | Encrypted balance | Specified recipient |

**Example — anonymous send from public balance:**
```typescript
import {
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
} from "@umbra-privacy/sdk";
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from "@umbra-privacy/web-zk-prover";

const zkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
  { client },
  { zkProver },
);

const [proofSig, utxoSig] = await createUtxo({
  destinationAddress: recipientAddress,  // recipient (must be registered)
  mint: USDC_MINT,
  amount: 500_000n,
});
```

**CreateUtxoArgs:**
```typescript
{
  amount: U64;              // base token units
  destinationAddress: Address; // recipient (for self: must equal caller)
  mint: Address;
}
```

---

## Mixer: Scan & Claim UTXOs

### getClaimableUtxoScannerFunction

Scans a Merkle tree for UTXOs addressed to the caller's X25519 key. Requires `indexerApiEndpoint` in client config.

```typescript
import { getClaimableUtxoScannerFunction } from "@umbra-privacy/sdk";

const fetchUtxos = getClaimableUtxoScannerFunction({ client });

// Scan tree 0 starting at index 0 (pass last known index to resume)
const { received } = await fetchUtxos(
  0,  // tree index
  0,  // start insertion index
);

console.log("Claimable UTXOs:", received.length);
```

### Claim Functions

| Function | Claims into |
|---|---|
| `getSelfClaimableUtxoToEncryptedBalanceClaimerFunction` | Your encrypted balance |
| `getSelfClaimableUtxoToPublicBalanceClaimerFunction` | Your public ATA |
| `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction` | Your encrypted balance |
| `getReceiverClaimableUtxoToPublicBalanceClaimerFunction` | Your public ATA |

**Example — claim into encrypted balance:**
```typescript
import {
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getUmbraRelayer,
} from "@umbra-privacy/sdk";
import { getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver } from "@umbra-privacy/web-zk-prover";

const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
const relayer = getUmbraRelayer({
  apiEndpoint: "https://relayer.api.umbraprivacy.com",
});

const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
  { client },
  { zkProver, relayer },
);

const claimResult = await claim([received[0]]); // pass array of UTXOs
```

Relayer API endpoint (mainnet): `https://relayer.api.umbraprivacy.com`

---

## Conversion (MXE → Shared)

### getNetworkEncryptionToSharedEncryptionConverterFunction

Converts one or more ETAs from MXE-only to Shared mode. Already-Shared, uninitialized, or non-existent mints are skipped.

```typescript
import { getNetworkEncryptionToSharedEncryptionConverterFunction } from "@umbra-privacy/sdk";

const convert = getNetworkEncryptionToSharedEncryptionConverterFunction({ client });
const result = await convert([usdcMint, solMint]);

result.converted // Map<Address, TransactionSignature>
result.skipped   // Map<Address, "non_existent" | "not_initialised" | "already_shared" | "balance_not_initialised">
```

### getMintEncryptionKeyRotatorFunction

Rotates the X25519 key for a specific mint's shared-mode ETA.

```typescript
const rotateMintKey = getMintEncryptionKeyRotatorFunction({ client });
await rotateMintKey(usdcMint);
```

---

## Compliance Grants

### X25519 Compliance Grants (on-chain PDA)

Creates an on-chain authorization allowing Arcium MPC to re-encrypt your ciphertexts for a grantee.

```typescript
import {
  getComplianceGrantIssuerFunction,
  getComplianceGrantRevokerFunction,
} from "@umbra-privacy/sdk";
import { generateRandomNonce } from "@umbra-privacy/sdk/utils";

const nonce = generateRandomNonce(); // random u128 bigint — STORE THIS

// Create grant
const createGrant = getComplianceGrantIssuerFunction({ client });
await createGrant(receiverAddress, granterX25519Key, receiverX25519Key, nonce);

// Revoke grant (same parameters)
const revokeGrant = getComplianceGrantRevokerFunction({ client });
await revokeGrant(receiverAddress, granterX25519Key, receiverX25519Key, nonce);
```

> **Warning:** Once a grantee decrypts a re-encrypted ciphertext for a given nonce, they retain permanent access to all encryptions under that nonce (Rescue is a stream cipher). Revocation stops future re-encryptions but cannot undo disclosure. Use a fresh nonce per grant.

### Viewing Key Grants (off-chain, read-only)

Derive time-scoped viewing keys to share with auditors. No on-chain state created.

```typescript
import {
  getMintViewingKeyDeriver,
  getYearlyViewingKeyDeriver,
  getMonthlyViewingKeyDeriver,
  getDailyViewingKeyDeriver,
} from "@umbra-privacy/sdk";

// Derive a monthly viewing key for USDC, February 2025
const deriveMonthly = getMonthlyViewingKeyDeriver({ client });
const key = await deriveMonthly(USDC_MINT, 2025n, 2n); // bigint

// Export for sharing
const keyString = key.toString(); // or key.toString(16) for hex

// Auditor can:
// - scan the mixer for UTXOs encrypted under this key
// - decrypt UTXO payloads (amount, recipient)
// Auditor CANNOT:
// - claim UTXOs (viewing key ≠ spending key)
// - access data outside the key's scope
```

Key derivation hierarchy (one-directional — child cannot derive parent):
```
MintViewingKey(mint)
  └── YearlyViewingKey(mint, year)
        └── MonthlyViewingKey(mint, year, month)
              └── DailyViewingKey(mint, year, month, day)
```
