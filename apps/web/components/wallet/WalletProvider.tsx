"use client";

import { useMemo } from "react";
import { SolanaProvider } from "@solana/react-hooks";
import { autoDiscover, createClient } from "@solana/client";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const solanaClient = useMemo(() => {
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const websocketEndpoint = process.env.NEXT_PUBLIC_SOLANA_WSS_URL || "wss://api.devnet.solana.com";

    return createClient({
      endpoint,
      websocketEndpoint,
      walletConnectors: autoDiscover(),
    });
  }, []);

  return (
    <SolanaProvider client={solanaClient}>
      {children}
    </SolanaProvider>
  );
}
