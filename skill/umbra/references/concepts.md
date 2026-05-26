# Umbra Concepts

## Public vs Encrypted Token Accounts

Solana uses **Associated Token Accounts (ATAs)** for standard SPL tokens — balance is publicly visible.

Umbra introduces **Encrypted Token Accounts (ETAs)**:

| | ATA (public) | ETA (Umbra encrypted) |
|---|---|---|
| Balance visibility | Public | Hidden |
| Transfers | Standard SPL | Use Umbra deposit/withdraw |
| Registration | Not required | One-time registration |
| Token support | Any SPL | Any SPL |

### Deposit: ATA → ETA

```
Your ATA  ──deposit──►  Shielded Pool (on-chain SPL)
                              │
                              ▼
                         Your ETA  (encrypted balance stored here)
```

The shielded pool holds the real tokens. The ETA stores the cryptographic proof of your share.

### Withdraw: ETA → ATA

Arcium MPC verifies your encrypted balance is sufficient and authorizes transfer from the shielded pool back to your ATA.

---

## Encryption Modes

### MXE-Only (default without X25519 key)
- Balance encrypted under the **Arcium MXE public key** only
- Only the Arcium network can decrypt it
- You **cannot** query your own balance client-side
- Withdrawals require Arcium MPC computation

### Shared Mode (recommended)
- Balance encrypted under **both** Arcium MXE key **and** your personal X25519 key
- You can decrypt and read your balance **locally**, without a network call
- Available after registering an X25519 key (`confidential: true` in registration)
- Withdrawals still use Arcium MPC for the on-chain operation

> **Always register with `confidential: true`** — this enables `queryEncryptedBalance` for local balance reads without waiting for Arcium.

To convert an existing MXE-only account to Shared mode, use `getNetworkEncryptionToSharedEncryptionConverterFunction`.

---

## ETA Lifecycle

```typescript
// First deposit for a given mint → creates the ETA
await deposit(signer.address, USDC_MINT, 1_000_000n);

// Subsequent deposits → update the existing ETA balance
await deposit(signer.address, USDC_MINT, 500_000n);
```

Each ETA has a **nonce** (monotonically increasing counter) for replay protection. The SDK manages nonces automatically.

---

## The Mixer (UTXO System)

The mixer breaks the on-chain link between a deposit address and a withdrawal address.

### How It Works

1. **Deposit** — You create a UTXO: a Poseidon hash commitment of `(amount, recipient, secret randomness)` inserted as a leaf into an **Indexed Merkle Tree**. Tokens are locked in the shielded pool. The leaf is visible; the contents are not.
2. **Wait** — More users deposit. Your commitment becomes one of many thousands. The larger the anonymity set, the stronger the privacy guarantee.
3. **Claim** — You present a **Groth16 zero-knowledge proof** that you know the secret behind one of the tree's leaves, without revealing *which* leaf. The nullifier is burned to prevent double-spending, and tokens are released to any wallet you choose.

The deposit address and the claim address need not be related.

### UTXO Types

| Type | Funded from | Claimable by |
|---|---|---|
| Self-claimable (ephemeral) | Your encrypted balance or public ATA | Only you (same wallet) |
| Receiver-claimable | Another user's ATA | Specified recipient address |

Receiver-claimable is used for anonymous sends: you deposit for a recipient, and they claim with no on-chain link to you.

### Nullifiers (Double-Spend Prevention)

Each UTXO has a **nullifier** — a deterministic hash of its private inputs. On claim, the nullifier is stored in an on-chain **treap** (self-balancing sorted tree). Before allowing a claim, the program checks:
- Nullifier has not been seen before
- ZK proof is valid for a commitment in the current Merkle tree

### Ciphertext Discovery

After a UTXO is created, the SDK publishes an encrypted ciphertext on-chain addressed to the recipient's X25519 public key. Only the recipient can decrypt it to learn the secret inputs. The Umbra indexer stores all ciphertexts for efficient querying.

> Your private key never leaves your device. Decryption happens locally in the SDK.

### Anonymity Set

- Trees hold up to **1,048,576 leaves** (depth-20)
- When full, a new tree starts at the next sequential index
- UTXOs from different trees have **separate** anonymity sets
- Wait for more deposits before claiming to maximize privacy

---

## What Umbra Does and Does Not Hide

**Hidden:**
- Token balance amounts (Encrypted Balances)
- Transfer counterparty (Mixer)
- Transaction history (strongest when both tools are combined)

**NOT hidden:**
- That you are using Umbra (on-chain program interactions are visible)
- Deposit/withdrawal amounts when using the mixer (committed at deposit)
- Timing (immediate deposit + withdrawal can be correlated)

---

## Arcium MPC

Arcium is a network of nodes that perform computation on encrypted data using Multi-Party Computation. The key property:

> No single node can decrypt your data. Compromising a majority of independent parties simultaneously is required to learn your balance.

From the SDK perspective: Arcium is the computation backend. All communication is handled automatically.

---

## Compliance

Umbra has a built-in compliance system. Users can create **viewing grants** allowing specific third parties (auditors, regulators) to decrypt their balances:
- **User grants** — Authorized by the user. Grants access to shared-mode ciphertexts.
- **Network grants** — Authorized by the Arcium network. Can access MXE-mode or shared-mode ciphertexts without user interaction.

See `sdk-functions.md` → Compliance section for the API.
