"use client";

import { useState, useEffect, use } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { SendFlow } from "@/components/umbra/SendFlow";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatMicroUsdc } from "@/lib/constants";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

export default function SendPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { connected } = useWalletConnection();
  const [amount, setAmount] = useState<number | "">("");
  const [isSending, setIsSending] = useState(false);
  
  // We need to fetch creator details to get the wallet address and name
  // For now we'll use a mock or fetch it (ideally passed from the prev page or fetched here)
  // To keep it simple and functional, let's fetch it.
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

  if (!creator) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />
      <main className="flex-1 flex items-center justify-center px-6 pt-16 pb-20">
        <div className="max-w-2xl w-full">
          {!connected ? (
            <div className="bg-white rounded-[48px] p-12 shadow-card border border-black/5 text-center">
              <div className="w-20 h-20 bg-veil-bg rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-veil-primary" />
              </div>
              <h1 className="font-heading text-3xl font-black mb-4">Connect Wallet to Support</h1>
              <p className="text-veil-muted mb-10 font-medium">You need a connected Solana wallet to send private support via the Umbra Mixer.</p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-card border border-black/5 relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-veil-primary rounded-t-[48px]"></div>
              
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-veil-bg">
                  {creator.avatarUrl ? <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-black text-2xl">{creator.displayName[0]}</div>}
                </div>
                <div>
                  <h1 className="font-heading text-3xl font-black">Support {creator.displayName}</h1>
                  <p className="text-veil-muted font-medium">Sending privately via Umbra Mixer</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-veil-text mb-4">Amount (USDC)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none font-bold text-veil-muted">$</div>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-veil-bg border border-black/10 rounded-2xl py-5 pl-10 pr-6 text-2xl font-black text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="p-6 bg-veil-bg rounded-2xl border border-black/5 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-veil-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-veil-text">Your identity is hidden</p>
                    <p className="text-xs text-veil-muted">The Umbra Mixer severs the on-chain link between your wallet and {creator.displayName}.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSending(true)}
                  disabled={!amount || amount <= 0}
                  className="w-full pill-button-primary py-5 text-xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Confirm & Send <ArrowRight className="w-6 h-6" />
                </button>
              </div>
              </div>
             )}
          </div>
        </main>
      <VeilFooter />

      {isSending && (
        <SendFlow 
          creatorSlug={slug}
          creatorName={creator.displayName}
          recipientAddress={creator.walletAddress}
          amountMicroUsdc={Number(amount) * 1000000}
          onClose={() => setIsSending(false)}
        />
      )}
    </div>
  );
}
