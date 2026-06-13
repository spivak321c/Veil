"use client";

import { useEffect, useCallback } from "react";
import { useWallet } from "@solana/react-hooks";
import type { IUmbraSigner } from "@umbra-privacy/sdk";
import { useUmbraStore } from "@/lib/umbra/store";
import { initUmbraClient } from "@/lib/umbra/client";

export function UmbraProvider({ children }: { children: React.ReactNode }) {
  const walletStatus = useWallet();
  const { setClient, setInitializing, setError, reset, retryKey } = useUmbraStore();

  const isConnected = walletStatus.status === "connected";
  const session = isConnected ? walletStatus.session : null;

  const createSigner = useCallback((): IUmbraSigner => {
    if (!session) {
      throw new Error("Wallet session is not available");
    }

    const address = session.account.address;
    if (!address) {
      throw new Error("Wallet session missing address");
    }

    if (!session.signTransaction) {
      throw new Error("Wallet does not support signTransaction");
    }

    if (!session.signMessage) {
      throw new Error("Wallet does not support signMessage");
    }

    const signTx = session.signTransaction;

    return {
      address,

      signTransaction: async (transaction: any): Promise<any> => {
        return await signTx(transaction);
      },

      signTransactions: async (transactions: readonly any[]): Promise<any[]> => {
        const s = session as any;

        if (s?.signTransactions) {
          return await s.signTransactions(transactions);
        }

        return Promise.all(
          transactions.map(async (tx) => {
            return await signTx(tx);
          })
        );
      },

      signMessage: async (message: Uint8Array): Promise<any> => {
        const signature = await session.signMessage!(message);
        return {
          message,
          signature,
          signer: address,
        };
      },
    } as any;
  }, [session]);

  useEffect(() => {
    if (!isConnected || !session) {
      reset();
      return;
    }

    let isActive = true;

    const initialize = async () => {
      setInitializing(true);
      setError(null);

      try {
        const signer = createSigner();
        const client = await initUmbraClient(signer);

        if (!isActive) return;

        setClient(client);
      } catch (err: unknown) {
        if (!isActive) return;

        const message =
          err instanceof Error
            ? err.message
            : "Failed to initialize Umbra Client";
        console.error("[UmbraProvider] Initialization failed:", err);
        setError(message);
      } finally {
        if (isActive) {
          setInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [
    isConnected,
    session,
    createSigner,
    setClient,
    setInitializing,
    setError,
    reset,
    retryKey,
  ]);

  return <>{children}</>;
}
