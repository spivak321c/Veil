# Umbra SDK Error Handling

All errors are typed with a `stage` field identifying where in the pipeline the failure occurred.

## Pattern

```typescript
import {
  isEncryptedDepositError,
  isEncryptedWithdrawalError,
  isRegistrationError,
  isCreateUtxoError,
  isClaimUtxoError,
  isConversionError,
  isQueryError,
} from "@umbra-privacy/sdk/errors";
```

---

## EncryptedDepositError

Thrown by `getPublicBalanceToEncryptedBalanceDirectDepositorFunction`.

```typescript
import { isEncryptedDepositError } from "@umbra-privacy/sdk/errors";

try {
  const result = await deposit(destination, mint, amount);
} catch (err) {
  if (isEncryptedDepositError(err)) {
    switch (err.stage) {
      case "validation":
        // Zero amount, or destination not registered.
        break;
      case "mint-fetch":
        // RPC connectivity issue fetching the mint account.
        break;
      case "pda-derivation":
        // Could not derive required PDAs — unexpected on-chain state.
        break;
      case "instruction-build":
        // Could not construct the instruction — protocol state mismatch.
        break;
      case "transaction-sign":
        // User rejected the transaction.
        showNotification("Deposit cancelled.");
        break;
      case "transaction-send":
        // Confirmation timed out — check on-chain before retrying.
        console.warn("Timeout. Check signature:", err.cause);
        break;
      default:
        // Other: initialization, transaction-build, transaction-compile.
        console.error("Deposit failed at stage:", err.stage, err);
    }
  } else {
    throw err;
  }
}
```

---

## EncryptedWithdrawalError

Thrown by `getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction`.

Same stages as `EncryptedDepositError`. Key notes:
- `"transaction-send"` timeout: The transaction may have landed — check on-chain before retrying.
- `"validation"`: Zero amount, or no encrypted balance exists for this mint.

```typescript
import { isEncryptedWithdrawalError } from "@umbra-privacy/sdk/errors";

try {
  const result = await withdraw(destination, mint, amount);
} catch (err) {
  if (isEncryptedWithdrawalError(err)) {
    switch (err.stage) {
      case "transaction-sign":
        showNotification("Withdrawal cancelled.");
        break;
      case "transaction-send":
        console.warn("Confirmation timeout. Check on-chain before retrying:", err.cause);
        break;
      default:
        console.error("Withdrawal failed at stage:", err.stage, err);
    }
  } else {
    throw err;
  }
}
```

---

## RegistrationError

Thrown by `getUserRegistrationFunction` and key rotation functions.

Stage values: `"initialization"` | `"account-fetch"` | `"account-decode"` | `"pda-derivation"` | `"key-derivation"` | `"instruction-build"` | `"transaction-build"` | `"transaction-compile"` | `"transaction-sign"` | `"transaction-validate"` | `"transaction-send"` | `"zk-proof-generation"` | `"seed-derivation"`

```typescript
import { isRegistrationError } from "@umbra-privacy/sdk/errors";

try {
  await register({ confidential: true, anonymous: true });
} catch (err) {
  if (isRegistrationError(err)) {
    if (err.stage === "transaction-sign") {
      showNotification("Registration cancelled.");
    } else {
      console.error("Registration failed:", err.stage, err.message);
    }
  } else {
    throw err;
  }
}
```

---

## CreateUtxoError

Thrown by all four UTXO creator functions.

Stage values include `"zk-proof-generation"` (ZK circuit failure — may be out-of-memory or prover mismatch), `"transaction-sign"` (user rejected), `"transaction-send"` (timeout).

```typescript
import { isCreateUtxoError } from "@umbra-privacy/sdk/errors";

try {
  await createUtxo({ destinationAddress, mint, amount });
} catch (err) {
  if (isCreateUtxoError(err)) {
    switch (err.stage) {
      case "zk-proof-generation":
        console.error("ZK proof failed:", err.message);
        break;
      case "transaction-sign":
        showNotification("UTXO creation cancelled.");
        break;
      default:
        console.error("UTXO creation failed at:", err.stage, err);
    }
  } else {
    throw err;
  }
}
```

---

## ClaimUtxoError

Thrown by all four claim functions.

Key stage: `"transaction-validate"` often indicates a **stale Merkle proof** — re-fetch via `getClaimableUtxoScannerFunction` and retry.

> **Warning:** On `"transaction-send"` timeout, always verify on-chain before retrying. A successful claim burns the nullifier permanently — double-claiming wastes fees and will be rejected.

```typescript
import { isClaimUtxoError } from "@umbra-privacy/sdk/errors";

try {
  const result = await claim([utxo]);
} catch (err) {
  if (isClaimUtxoError(err)) {
    switch (err.stage) {
      case "zk-proof-generation":
        console.error("Proof generation failed:", err.message);
        break;
      case "transaction-sign":
        showNotification("Claim cancelled.");
        break;
      case "transaction-validate":
        // Stale Merkle proof — re-scan and retry
        console.warn("Pre-flight failed — Merkle proof stale:", err.message);
        break;
      case "transaction-send":
        // Check nullifier on-chain before retrying!
        console.warn("Timeout — verify on-chain:", err.cause);
        break;
      default:
        console.error("Claim failed at stage:", err.stage, err);
    }
  } else {
    throw err;
  }
}
```

---

## ConversionError

Thrown by `getNetworkEncryptionToSharedEncryptionConverterFunction` and `getMintEncryptionKeyRotatorFunction`.

Stage values: `"initialization"` | `"account-fetch"` | `"pda-derivation"` | `"instruction-build"` | `"transaction-build"` | `"transaction-compile"` | `"transaction-sign"` | `"transaction-validate"` | `"transaction-send"`

On `"transaction-sign"` cancellation, any mints already converted in the batch remain confirmed on-chain. Re-call `convert()` with the remaining mints to resume — it is idempotent.

```typescript
import { isConversionError } from "@umbra-privacy/sdk/errors";
```

---

## QueryError

Thrown by `getUserAccountQuerierFunction` and `getEncryptedBalanceQuerierFunction`.

Stage values: `"initialization"` | `"pda-derivation"` | `"account-fetch"` | `"account-decode"` | `"key-derivation"` | `"decryption"`

`"key-derivation"` and `"decryption"` are only reachable from `getEncryptedBalanceQuerierFunction` (shared-mode decryption path).

```typescript
import { isQueryError } from "@umbra-privacy/sdk/errors";

try {
  const result = await queryBalance([USDC, USDT]);
} catch (err) {
  if (isQueryError(err)) {
    console.error("Query failed at stage:", err.stage, err.message);
  } else {
    throw err;
  }
}
```

---

## General Retry Guidance

| Stage | Safe to retry? | Notes |
|---|---|---|
| `"validation"` | Fix input first | Retrying with the same input will fail again |
| `"transaction-sign"` | Yes | User cancelled — retry with user action |
| `"transaction-send"` | **Check on-chain first** | Transaction may have landed |
| `"transaction-validate"` | Yes (re-fetch proof first for claims) | Pre-flight failure |
| `"zk-proof-generation"` | Yes | May be transient memory issue |
| Other stages | Yes | Transient RPC or protocol errors |
