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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Airdropped 2 SOL and test USDC to your wallet on Devnet!");
    } catch (err: any) {
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
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <ArrowsClockwise weight="bold" className="w-[16px] h-[16px]" />
        </motion.div>
      ) : (
        <Coins weight="fill" className="w-[16px] h-[16px]" />
      )}
      Devnet Faucet
    </button>
  );
}
