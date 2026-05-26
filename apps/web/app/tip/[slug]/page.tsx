"use client";

import { useState, useEffect, use } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { SendFlow } from "@/components/umbra/SendFlow";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ShieldCheck, Lock, Zap, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";
import type { CreatorPublic } from "@veil/db";

const QUICK_AMOUNTS = [1, 5, 10, 25];

/**
 * Private Tip Jar — /tip/[slug]
 *
 * A friction-free, single-purpose send page. No account required,
 * no tier selection, no public/private toggle. Just connect → pick amount → send.
 * The patron's identity is severed by the Umbra mixer exactly like the full send flow.
 */
export default function TipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { connected } = useWalletConnection();
  const [amount, setAmount] = useState<number | "">(5);
  const [isSending, setIsSending] = useState(false);
  const [creator, setCreator] = useState<CreatorPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creators/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setCreator(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-veil-bg">
        <VeilHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-veil-primary/20 border-t-veil-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col bg-veil-bg">
        <VeilHeader />
        <div className="flex-1 flex flex-col items-center justify-center text-veil-muted font-body gap-4">
          <Heart className="w-10 h-10 opacity-20" />
          <p className="font-bold text-veil-text">Creator not found</p>
          <Link href="/explore" className="text-sm font-bold text-veil-primary hover:underline">
            Browse creators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50vw] h-[40vh] bg-veil-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full max-w-sm"
        >
          {/* Creator header — minimal */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-veil-secondary border-4 border-white shadow-md mx-auto mb-4">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading font-black text-3xl text-veil-text">
                  {creator.displayName[0].toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="font-heading text-2xl font-black text-veil-text tracking-tight">
              Tip {creator.displayName}
            </h1>
            <p className="text-sm text-veil-muted font-medium mt-1">
              Private · Anonymous · Instant
            </p>
          </div>

          {!connected ? (
            /* Not connected */
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-black/5 text-center">
              <div className="w-14 h-14 bg-veil-bg rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-6 h-6 text-veil-primary" />
              </div>
              <p className="font-bold text-veil-text mb-2">Connect your wallet to tip</p>
              <p className="text-sm text-veil-muted font-medium mb-6">
                Your identity is hidden by Umbra — no one will know it was you.
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            /* Connected — tip form */
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-black/5">
              <div className="h-1 bg-veil-primary w-full" />
              <div className="p-8">
                {/* Quick amounts */}
                <p className="text-xs font-bold text-veil-muted uppercase tracking-wider mb-3">
                  Choose amount (USDC)
                </p>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {QUICK_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`py-3 rounded-xl font-black text-sm transition-all border ${
                        amount === preset
                          ? "bg-veil-primary text-white border-veil-primary shadow-sm"
                          : "bg-veil-bg text-veil-text border-black/5 hover:border-veil-primary/30"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-6">
                  <span className="absolute inset-y-0 left-4 flex items-center font-black text-veil-muted text-xl pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-veil-bg border-2 border-transparent rounded-2xl py-4 pl-9 pr-4 text-2xl font-black text-veil-text focus:outline-none focus:border-veil-primary/40 focus:bg-white transition-all placeholder:text-veil-muted/40"
                    placeholder="0.00"
                    min={0.01}
                  />
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-3 p-4 bg-veil-bg rounded-2xl border border-black/5 mb-6">
                  <ShieldCheck className="w-4 h-4 text-veil-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-veil-muted font-medium leading-relaxed">
                    Routed through the Umbra mixer — the on-chain link between you and{" "}
                    <span className="font-bold text-veil-text">{creator.displayName}</span> is severed.
                  </p>
                </div>

                {/* Send button */}
                <button
                  onClick={() => setIsSending(true)}
                  disabled={!amount || Number(amount) <= 0}
                  className="w-full bg-veil-text text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  Send ${amount || "0"} privately
                </button>

                <p className="text-center text-xs text-veil-muted font-medium mt-4">
                  Powered by <span className="font-bold text-veil-text">Umbra Protocol</span> on Solana
                </p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="text-center mt-6">
            <Link
              href={`/c/${slug}`}
              className="text-xs font-bold text-veil-muted hover:text-veil-primary transition-colors"
            >
              View full profile →
            </Link>
          </div>
        </motion.div>
      </main>

      <VeilFooter />

      {isSending && creator && (
        <SendFlow
          creatorSlug={slug}
          creatorName={creator.displayName}
          recipientAddress={creator.walletAddress}
          amountMicroUsdc={Number(amount) * 1_000_000}
          onClose={() => setIsSending(false)}
        />
      )}
    </div>
  );
}
