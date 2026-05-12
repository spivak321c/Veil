"use client";

import { useState, useEffect, use } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { SendFlow } from "@/components/umbra/SendFlow";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ShieldCheck, Lock, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function SendPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { connected } = useWalletConnection();
  const [amount, setAmount] = useState<number | "">("");
  const [isSending, setIsSending] = useState(false);
  const [creator, setCreator] = useState<any>(null);

  useEffect(() => {
    async function loadCreator() {
      const res = await fetch(`/api/creators/${slug}`);
      if (res.ok) {
        const json = await res.json();
        setCreator(json.data);
      }
    }
    loadCreator();
  }, [slug]);

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col bg-veil-bg">
        <VeilHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-veil-primary/20 border-t-veil-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20">
        {/* Back link */}
        <Link
          href={`/c/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-veil-muted hover:text-veil-primary transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to {creator.displayName}
        </Link>

        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {!connected ? (
              /* ── Not connected ── */
              <div className="bg-white rounded-[40px] p-10 shadow-card border border-black/5 text-center">
                <div className="w-20 h-20 bg-veil-bg rounded-full flex items-center justify-center mx-auto mb-8">
                  <Lock className="w-9 h-9 text-veil-primary" />
                </div>
                <h1 className="font-heading text-3xl font-black mb-3">Connect your wallet</h1>
                <p className="text-veil-muted font-medium mb-8 max-w-xs mx-auto">
                  You need a Solana wallet to send private support via the Umbra protocol.
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>

                {/* Privacy note */}
                <div className="mt-8 p-4 bg-veil-bg rounded-2xl flex items-start gap-3 text-left">
                  <ShieldCheck className="w-5 h-5 text-veil-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-veil-muted font-medium leading-relaxed">
                    Your support is routed through the Umbra mixer — the on-chain link between you
                    and {creator.displayName} is severed completely.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Connected: send form ── */
              <div className="bg-white rounded-[40px] shadow-card border border-black/5 overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1.5 bg-veil-primary w-full" />

                <div className="p-8 md:p-10">
                  {/* Creator header */}
                  <div className="flex items-center gap-5 mb-10 pb-8 border-b border-black/5">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-veil-bg bg-veil-bg shadow-sm shrink-0">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-heading font-black text-2xl">
                          {creator.displayName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-veil-muted uppercase tracking-wider mb-1">
                        Supporting
                      </p>
                      <h1 className="font-heading text-2xl font-black text-veil-text">
                        {creator.displayName}
                      </h1>
                      <p className="text-sm text-veil-muted font-medium">via Umbra private transfer</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Quick amounts */}
                    <div>
                      <p className="text-xs font-bold text-veil-muted uppercase tracking-wider mb-3">
                        Quick select
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {QUICK_AMOUNTS.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setAmount(preset)}
                            className={`py-3 rounded-2xl font-black text-sm transition-all border ${
                              amount === preset
                                ? "bg-veil-primary text-white border-veil-primary shadow-sm"
                                : "bg-veil-bg text-veil-text border-black/5 hover:border-veil-primary/30 hover:bg-veil-secondary/30"
                            }`}
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom amount */}
                    <div>
                      <label className="block text-xs font-bold text-veil-muted uppercase tracking-wider mb-3">
                        Custom amount (USDC)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-5 flex items-center font-black text-veil-muted text-xl pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                          className="w-full bg-veil-bg border-2 border-transparent rounded-2xl py-4 pl-10 pr-5 text-2xl font-black text-veil-text focus:outline-none focus:border-veil-primary/40 focus:bg-white transition-all placeholder:text-veil-muted/40"
                          placeholder="0.00"
                          min={1}
                        />
                      </div>
                    </div>

                    {/* Privacy badge */}
                    <div className="flex items-start gap-3 p-4 bg-veil-bg rounded-2xl border border-black/5">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-veil-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-veil-text">Your identity is protected</p>
                        <p className="text-xs text-veil-muted mt-0.5 leading-relaxed">
                          The Umbra mixer severs the on-chain link between you and {creator.displayName}.
                        </p>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={() => setIsSending(true)}
                      disabled={!amount || Number(amount) <= 0}
                      className="w-full pill-button-primary py-5 text-lg font-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                      <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Send ${amount || "0"} privately
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-center text-xs text-veil-muted font-medium">
                      Powered by{" "}
                      <span className="font-bold text-veil-text">Umbra Protocol</span> on Solana
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <VeilFooter />

      {isSending && (
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
