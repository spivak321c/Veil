"use client";

import { useState } from "react";
import { Coins, ArrowsClockwise } from "@phosphor-icons/react";
import { useWalletConnection } from "@solana/react-hooks";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function DevFaucetButton() {
  const { connected, wallet } = useWalletConnection();
  const [loading, setLoading] = useState(false);

  const handleAirdrop = async () => {
    if (!connected || !wallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      const walletAddress = wallet?.account?.address;
      if (!walletAddress) {
        toast.error("Wallet address not available");
        return;
      }
      console.log("[faucet] Requesting airdrop for:", walletAddress);

      const res = await fetch("/api/devnet/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to request airdrop");
        return;
      }

      toast.success(`Airdropped ${data.data.solAmount} SOL! TX: ${data.data.signature.slice(0, 8)}...`);
      console.log("[faucet] Explorer:", data.data.explorer);
    } catch (err: any) {
      console.error("[faucet] Error:", err);
      toast.error(err.message || "Failed to request airdrop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAirdrop}
      disabled={loading || !connected}
      className="inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-[30px] bg-sky-blue/10 text-[14px] font-sans font-medium text-sky-blue hover:bg-sky-blue/20 transition-colors border border-sky-blue/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue"
    >
      {loading ? (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration:1, ease: "linear" }}>
          <ArrowsClockwise weight="bold" className="w-[16px] h-[16px]" />
        </motion.div>
      ) : (
        <Coins weight="fill" className="w-[16px] h-[16px]" />
      )}
      Devnet Faucet
    </button>
  );
}
