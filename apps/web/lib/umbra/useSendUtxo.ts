import {
  isCreateUtxoError,
  isRegistrationError,
} from "@umbra-privacy/sdk";
import {
  getATAIntoETADirectDepositorFunction,
  getETAIntoReceiverBurnableStealthPoolNoteCreatorFunction,
} from "@umbra-privacy/sdk/deposit";
import { getUserRegistrationFunction } from "@umbra-privacy/sdk/registration";
import {
  getEncryptedBalanceQuerierFunction,
  getUserAccountQuerierFunction,
} from "@umbra-privacy/sdk/query";
import { createFromEncryptedProver, registrationProver } from "./zk-prover";
import { useUmbraStore } from "./store";
import type { Address } from "@solana/kit";

export type SendStep =
  | { status: 'idle' }
  | { status: 'confirming'; tierName: string; amountUsdc: number }
  | { status: 'checking_registration' }
  | { status: 'registering' }
  | { status: 'shielding'; txSignature?: string }
  | { status: 'creating_note' }
  | { status: 'awaiting_mpc'; queueSignature: string }
  | { status: 'success'; callbackSignature: string }
  | { status: 'error'; message: string };

export function useSendUtxo() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const ensurePatronRegistered = async (
    onProgress: (step: SendStep) => void
  ): Promise<void> => {
    if (!client) throw new Error("Client not initialized");

    const patronAddress = client.signer.address;
    console.log("[useSendUtxo] Checking patron Umbra registration:", patronAddress);

    const queryUserAccount = getUserAccountQuerierFunction({ client });
    const accountResult = await queryUserAccount(patronAddress as Address).catch((e: unknown) => {
      console.log("[useSendUtxo] Patron account query returned:", e);
      return { state: "non_existent" } as const;
    });

    const accountState = accountResult.state;
    const accountData = accountResult.state === "exists" ? accountResult.data : undefined;
    console.log("[useSendUtxo] Patron account query result:", accountState, accountData?.isActiveForAnonymousUsage);

    if (accountState === "exists" && accountData?.isActiveForAnonymousUsage) {
      console.log("[useSendUtxo] Patron already registered with anonymous usage enabled");
      return;
    }

    if (accountState === "exists") {
      console.log("[useSendUtxo] Patron account exists but anonymous usage NOT enabled");
    } else {
      console.log("[useSendUtxo] Patron not registered at all");
    }

    onProgress({ status: 'registering' });

    try {
      console.log("[useSendUtxo] Starting registration with confidential=true, anonymous=true");
      const registerFn = getUserRegistrationFunction(
        { client },
        { zkProver: registrationProver }
      );
      const regResult = await registerFn({
        confidential: true,
        anonymous: true,
        hooks: {
          initUserAccount: {
            onTransactionBuilt: async () => console.log("[useSendUtxo] Registration step 1: Creating account..."),
            onPostSend: async (event) => console.log("[useSendUtxo] Registration step 1 complete:", event.signature),
          },
          registerX25519PublicKey: {
            onTransactionBuilt: async () => console.log("[useSendUtxo] Registration step 2: Registering encryption key..."),
            onPostSend: async (event) => console.log("[useSendUtxo] Registration step 2 complete:", event.signature),
          },
          registerAnonymousUsage: {
            onTransactionBuilt: async () => console.log("[useSendUtxo] Registration step 3: Enabling anonymous mode..."),
            onPostSend: async (event) => console.log("[useSendUtxo] Registration step 3 complete:", event.signature),
          },
        },
      });
      console.log("[useSendUtxo] Registration completed:", regResult);

      const verifyResult = await queryUserAccount(patronAddress as Address).catch((e: unknown) => {
        console.error("[useSendUtxo] Post-registration verification failed:", e);
        return { state: "non_existent" } as const;
      });
      const verifyState = verifyResult.state;
      const verifyData = verifyResult.state === "exists" ? verifyResult.data : undefined;
      console.log("[useSendUtxo] Post-registration verification:", verifyState, verifyData?.isActiveForAnonymousUsage);

      if (verifyState === "exists" && verifyData?.isActiveForAnonymousUsage) {
        console.log("[useSendUtxo] Anonymous usage confirmed after registration");
      } else {
        console.error("[useSendUtxo] WARNING: Anonymous usage NOT confirmed after registration!");
      }
    } catch (err: unknown) {
      if (isRegistrationError(err)) {
        console.error("[useSendUtxo] Registration failed at stage:", err.stage);
        console.error("[useSendUtxo] Registration error message:", err.message);
        if (err.stage === "initialization" && err.message?.includes("already")) {
          console.log("[useSendUtxo] Registration already done (idempotent), continuing");
          return;
        }
        throw new Error(`Umbra registration failed: ${err.stage} — ${err.message}`);
      }
      console.error("[useSendUtxo] Unknown registration error:", err);
      throw err;
    }
  };

  const checkReceiverRegistered = async (recipientAddress: string): Promise<boolean> => {
    if (!client) throw new Error("Client not initialized");

    console.log("[useSendUtxo] Checking receiver Umbra registration:", recipientAddress);

    const queryUserAccount = getUserAccountQuerierFunction({ client });
    const accountResult = await queryUserAccount(recipientAddress as Address).catch((e: unknown) => {
      console.error("[useSendUtxo] Receiver registration check failed:", e);
      return { state: "non_existent" } as const;
    });
    const isRegistered = accountResult.state === "exists";
    console.log("[useSendUtxo] Receiver registration:", isRegistered, "state:", accountResult.state);

    return isRegistered;
  };

  const send = async (
    recipientAddress: string,
    amountUsdc: bigint,
    onProgress: (step: SendStep) => void
  ): Promise<string> => {
    if (isInitializing) {
      throw new Error("Umbra client is still initializing. Please wait...");
    }
    if (!client) {
      if (initError) {
        throw new Error(
          `Umbra client failed to initialize: ${initError}. Please reconnect your wallet and try again.`
        );
      }
      throw new Error("Client not initialized. Please connect your wallet.");
    }

    const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
    if (!USDC_MINT) throw new Error("USDC_MINT is not configured.");

    if (!recipientAddress || typeof recipientAddress !== "string") {
      throw new Error(`Invalid recipientAddress: ${recipientAddress}`);
    }
    if (typeof amountUsdc !== "bigint") {
      throw new Error(`Invalid amountUsdc: expected bigint, got ${typeof amountUsdc}`);
    }
    if (amountUsdc <= 0n) {
      throw new Error(`Invalid amountUsdc: must be positive, got ${amountUsdc}`);
    }

    console.log("[useSendUtxo] Ensuring patron is registered...");
    onProgress({ status: 'checking_registration' });
    await ensurePatronRegistered(onProgress);

    console.log("[useSendUtxo] Checking receiver registration...");
    const receiverRegistered = await checkReceiverRegistered(recipientAddress);
    if (!receiverRegistered) {
      throw new Error("The creator has not completed Umbra registration and cannot receive anonymous payments. Please try again later or contact the creator.");
    }

    try {
      // Step 1: Check ETA balance — skip shield if sufficient
      console.log("[useSendUtxo] Checking ETA balance...");
      const queryBalance = getEncryptedBalanceQuerierFunction({ client });
      const balances = await queryBalance([USDC_MINT as Address]);
      const etaResult = balances.get(USDC_MINT as Address);
      const etaBalance = etaResult?.state === "shared" ? etaResult.balance : 0n;
      const needsShield = etaBalance < amountUsdc;

      console.log("[useSendUtxo] ETA balance:", etaBalance, "needs shield:", needsShield);

      if (needsShield) {
        onProgress({ status: 'shielding' });

        console.log("[useSendUtxo] Shielding ATA→ETA with:", {
          mint: USDC_MINT,
          amount: amountUsdc,
        });

        const depositFn = getATAIntoETADirectDepositorFunction({ client });
        const depositResult = await depositFn(
          client.signer.address as Address,
          USDC_MINT as Address,
          amountUsdc as never,
        );

        console.log("[useSendUtxo] Shield result:", depositResult);
        const shieldSig = (depositResult as any).queueSignature;
        onProgress({ status: 'shielding', txSignature: shieldSig });
      } else {
        console.log("[useSendUtxo] Sufficient ETA balance, skipping shield.");
      }

      // Step 2: Create receiver-burnable note from ETA → receiver
      onProgress({ status: 'creating_note' });

      console.log("[useSendUtxo] Creating ETA→receiver note with:", {
        destinationAddress: recipientAddress,
        mint: USDC_MINT,
        amount: amountUsdc,
      });

      const createUtxo = getETAIntoReceiverBurnableStealthPoolNoteCreatorFunction(
        { client },
        { zkProver: createFromEncryptedProver },
      );

      const result = await createUtxo({
        destinationAddress: recipientAddress as Address,
        mint: USDC_MINT as Address,
        amount: amountUsdc as never,
      });

      console.log("[useSendUtxo] createUtxo result:", result);

      const queueSig = (result as any).queueSignature;
      const populateProofSig = (result as any).populateProofAccountSignature;
      const callbackSig = (result as any).callback?.signature;

      console.log("[useSendUtxo] Signatures:", { populateProofSig, queueSig, callbackSig });

      const returnSig = queueSig ?? populateProofSig;
      if (!returnSig) {
        console.error("[useSendUtxo] No transaction signature returned from createUtxo!");
        throw new Error("Transaction completed but no signature was returned. The payment may still be processing — check your wallet.");
      }

      onProgress({ status: 'awaiting_mpc', queueSignature: returnSig });
      onProgress({ status: 'success', callbackSignature: callbackSig ?? returnSig });
      return returnSig;
    } catch (err: unknown) {
      let userMessage = "Failed to send payment.";

      if (isCreateUtxoError(err)) {
        switch (err.stage) {
          case "transaction-sign":
            userMessage = "Transaction signing was cancelled. Please approve the transaction in your wallet.";
            break;
          case "transaction-send":
            userMessage = "Transaction confirmation timed out. The payment may still process — check the Solana explorer in a minute.";
            break;
          case "zk-proof-generation":
            userMessage = "Zero-knowledge proof generation failed. This may be due to high memory usage. Try refreshing and sending again.";
            break;
          default:
            userMessage = `Stealth Pool Note creation failed at stage: ${err.stage}. ${err.message}`;
        }
      } else if (err instanceof Error) {
        const raw = err.message;

        if (raw.includes("AccountNotInitialized") || raw.includes("fee_schedule") || raw.includes("3012")) {
          userMessage =
            "The Umbra devnet stealth pool is not configured for this token. Make sure you are using Umbra's dummy USDC (dUSDC) from https://faucet.umbraprivacy.com — NOT standard devnet USDC. The correct dUSDC mint is 4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7.";
        } else if (raw.includes("BlockhashNotFound")) {
          userMessage = "Transaction blockhash expired. Please try again.";
        } else if (raw.includes("insufficient") || raw.includes("Insufficient")) {
          userMessage = "Insufficient USDC balance. Please fund your wallet and try again.";
        } else if (raw.includes("compute budget") || raw.includes("exceeded") || raw.includes("InsufficientFunds")) {
          userMessage = "Insufficient SOL for transaction fees. Please fund your wallet with devnet SOL.";
        } else {
          userMessage = raw;
        }
      }

      console.error("[useSendUtxo] Send UTXO error:", err);
      onProgress({ status: 'error', message: userMessage });
      throw new Error(userMessage, { cause: err });
    }
  };

  return { send, checkReceiverRegistered, ensurePatronRegistered };
}
