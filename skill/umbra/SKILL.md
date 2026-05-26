---
name: umbra-sdk
description: >
  Comprehensive reference for the Umbra Privacy SDK (@umbra-privacy/sdk) on Solana.
  Use this skill whenever the user asks about Umbra, encrypted balances, the Umbra mixer,
  UTXOs, privacy on Solana, Arcium MPC, shielded tokens, confidential transfers, or any
  SDK function from @umbra-privacy/sdk. Also triggers for questions about registering with
  Umbra, depositing/withdrawing encrypted balances, creating/claiming UTXOs, compliance grants,
  Token-2022 privacy, or the Umbra indexer API.
---

# Umbra Privacy SDK

Umbra adds a **privacy layer** on top of Solana SPL and Token-2022 tokens. It provides two independent privacy tools:

| Feature | What it hides | How |
|---|---|---|
| **Encrypted Balances** | *How much* you hold | Balance encrypted via Arcium MPC |
| **Mixer (UTXOs)** | *Who sent to whom* | Indexed Merkle Tree + ZK proofs |

Both can be used independently or combined for maximum privacy.

> All cryptographic operations are handled by the SDK. You do **not** need to understand MPC or ZK proofs to use Umbra.

---

## Installation

```bash
npm install @umbra-privacy/sdk
# For ZK proving (mixer operations):
npm install @umbra-privacy/web-zk-prover
```

---

## Quick Start (Full Flow)

```typescript
import {
  createInMemorySigner,
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
} from "@umbra-privacy/sdk";

// 1. Create client
const client = await getUmbraClient({
  signer: walletAdapter,            // or createInMemorySigner() for testing
  network: "mainnet",
  rpcUrl: "https://api.mainnet-beta.solana.com",
  rpcSubscriptionsUrl: "wss://api.mainnet-beta.solana.com",
  indexerApiEndpoint: "https://utxo-indexer.api.umbraprivacy.com", // required for mixer
});

// 2. Register (one-time; safe to call again — skips if already registered)
const register = getUserRegistrationFunction({ client });
await register({ confidential: true, anonymous: true });
// confidential: true → Shared mode (you can query your own balance locally)
// anonymous: true   → X25519 key registered (required for mixer)

// 3. Deposit into encrypted balance
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
const depositResult = await deposit(client.signer.address, USDC, 1_000_000n); // 1 USDC
console.log("Deposited:", depositResult.queueSignature);

// 4. Withdraw back to public wallet
const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
const withdrawResult = await withdraw(client.signer.address, USDC, 1_000_000n);
console.log("Withdrawn:", withdrawResult.queueSignature);
```

---

## Program IDs

| Network | Program Address |
|---|---|
| Mainnet | `UMBRAD2ishebJTcgCLkTkNUx1v3GyoAgpTRPeWoLykh` |
| Devnet | `DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ` |

---

## Architecture

```
Your App
  └── Wallet (Phantom, Solflare, etc.)
        └── Umbra SDK (@umbra-privacy/sdk)
              ├── Solana RPC    - sends and confirms transactions
              ├── Arcium MPC    - performs confidential computation off-chain
              └── Umbra Indexer - indexes UTXOs and Merkle proofs
```

Every confidential operation uses a **dual-instruction pattern**:
1. **Handler tx** — your wallet signs; validates inputs and queues an Arcium computation
2. **Callback tx** — Arcium posts the MPC result on-chain; program updates state

The SDK awaits both confirmations before returning. This adds a few seconds vs standard transfers.

---

## Reference Files

Read the appropriate file based on what you need:

- **`references/concepts.md`** — Encrypted Balances vs Mixer deep dive, encryption modes (MXE vs Shared), UTXO internals, nullifiers, anonymity set
- **`references/sdk-functions.md`** — All SDK function signatures: client setup, registration, deposit, withdraw, query balance, mixer (create UTXO, scan, claim), compliance grants, key rotation
- **`references/errors.md`** — Typed error handling for deposit, withdrawal, registration, mixer, and conversion errors
- **`references/tokens-fees.md`** — Supported tokens (USDC, USDT, wSOL, UMBRA) with mint addresses, fee structure, Token-2022 handling, and Indexer API endpoints
