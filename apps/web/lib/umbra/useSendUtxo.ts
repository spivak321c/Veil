import {
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  getUserAccountQuerierFunction,
  getUserRegistrationFunction,
  isCreateUtxoError,
  isRegistrationError,
} from "@umbra-privacy/sdk";
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver, getUserRegistrationProver } from "@umbra-privacy/web-zk-prover";
import { useUmbraStore } from "./store";
import type { Address } from "@solana/kit";

export type SendStep =
  | { status: 'idle' }
  | { status: 'confirming'; tierName: string; amountUsdc: number }
  | { status: 'checking_registration' }
  | { status: 'registering' }
  | { status: 'submitting' }
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
      console.log("[useSendUtxo] Account data isActiveForAnonymousUsage:", accountData?.isActiveForAnonymousUsage);
    } else {
      console.log("[useSendUtxo] Patron not registered at all");
    }

    onProgress({ status: 'registering' });

    try {
      console.log("[useSendUtxo] Starting registration with confidential=true, anonymous=true");
      const zkProver = getUserRegistrationProver();
      const registerFn = getUserRegistrationFunction(
        { client },
        { zkProver }
      );
      const regResult = await registerFn({
        confidential: true,
        anonymous: true,
        callbacks: {
          userAccountInitialisation: {
            pre: async () => console.log("[useSendUtxo] Registration step 1: Creating account..."),
            post: async (_tx, sig) => console.log("[useSendUtxo] Registration step 1 complete:", sig),
          },
          registerX25519PublicKey: {
            pre: async () => console.log("[useSendUtxo] Registration step 2: Registering encryption key..."),
            post: async (_tx, sig) => console.log("[useSendUtxo] Registration step 2 complete:", sig),
          },
          registerUserForAnonymousUsage: {
            pre: async () => console.log("[useSendUtxo] Registration step 3: Enabling anonymous mode..."),
            post: async (_tx, sig) => console.log("[useSendUtxo] Registration step 3 complete:", sig),
          },
        },
      });
      console.log("[useSendUtxo] Registration completed:", regResult);

      // Verify the anonymous bit was actually set
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
        console.error("[useSendUtxo] Registration error stack:", err.stack);
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

    console.log("[useSendUtxo] Initializing ZK prover...");
    const zkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();

    console.log("[useSendUtxo] Creating UTXO function...");
    const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
      { client },
      { zkProver },
    );

    onProgress({ status: 'submitting' });

    try {
      console.log("[useSendUtxo] Calling createUtxo with:", {
        destinationAddress: recipientAddress,
        mint: USDC_MINT,
        amount: amountUsdc,
      });

      const result = await createUtxo({
        destinationAddress: recipientAddress as Address,
        mint: USDC_MINT as Address,
        amount: amountUsdc as unknown as Parameters<typeof createUtxo>[0]["amount"],
      });

      const signatures = result as unknown as string[];
      const utxoSig = signatures[1] ?? signatures[0] ?? "";

      onProgress({ status: 'awaiting_mpc', queueSignature: utxoSig });
      onProgress({ status: 'success', callbackSignature: utxoSig });
      return utxoSig;
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
            userMessage = `UTXO creation failed at stage: ${err.stage}. ${err.message}`;
        }
      } else if (err instanceof Error) {
        const raw = err.message;
        console.log("[useSendUtxo] Raw error message:", raw);

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
