"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ExternalLink, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

function SendSuccessContent() {
  const searchParams = useSearchParams();
  const creator = searchParams.get("creator") || "the creator";
  const tx = searchParams.get("tx");

  return (
    <div className="min-h-[100dvh] relative flex flex-col bg-veil-bg text-veil-text font-body selection:bg-veil-primary selection:text-white">
      <VeilHeader />
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-green-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24 z-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springTransition}
          className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 md:p-14 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 text-center relative overflow-hidden"
        >
          {/* Top accent border */}
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className="w-24 h-24 bg-green-50 rounded-[1.5rem] border border-green-100 flex items-center justify-center mx-auto mb-8 text-green-600 shadow-sm"
          >
            <Check className="w-10 h-10" />
          </motion.div>
          
          <h1 className="font-heading text-4xl md:text-5xl font-black mb-4 tracking-tighter text-veil-text">
            Support Delivered!
          </h1>
          
          <p className="text-lg text-veil-muted font-medium mb-10 leading-relaxed max-w-md mx-auto">
            Your support reached <span className="text-veil-text font-bold">{creator}</span> securely. <br />
            No one can link this payment to your wallet.
          </p>

          <div className="flex flex-col gap-4 relative z-10">
            {tx && (
              <Link 
                href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
                target="_blank"
                className="flex items-center justify-between p-5 rounded-2xl border border-black/5 bg-veil-bg hover:bg-veil-secondary transition-colors group shadow-sm hover:shadow-none"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-veil-text text-sm">View anonymous tx</span>
                </div>
                <ExternalLink className="w-4 h-4 text-veil-muted group-hover:text-veil-text transition-colors" />
              </Link>
            )}
            
            <Link 
              href="/explore" 
              className="bg-veil-text text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-[0.98] group"
            >
              Support another creator 
              <Heart className="w-4 h-4 group-hover:fill-white group-hover:text-white transition-colors" />
            </Link>
          </div>
        </motion.div>
      </main>
      <VeilFooter />
    </div>
  );
}

export default function SendSuccessPage() {
  return (
    <Suspense>
      <SendSuccessContent />
    </Suspense>
  );
}
