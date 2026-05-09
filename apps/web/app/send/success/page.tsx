"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ExternalLink, Heart } from "lucide-react";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

function SendSuccessContent() {
  const searchParams = useSearchParams();
  const creator = searchParams.get("creator") || "the creator";
  const tx = searchParams.get("tx");

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />
      <main className="flex-1 flex items-center justify-center px-6 pt-16 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white rounded-[48px] p-12 shadow-card border border-black/5 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-veil-primary"></div>
          
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
            <Check className="w-12 h-12" />
          </div>
          
          <h1 className="font-heading text-4xl font-black mb-6">Support Delivered!</h1>
          
          <p className="text-xl text-veil-muted font-medium mb-10 leading-relaxed">
            Your support reached <span className="text-veil-text font-bold">{creator}</span> privately. <br />
            No one can link this payment to your wallet.
          </p>

          <div className="flex flex-col gap-4">
            {tx && (
              <Link 
                href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
                target="_blank"
                className="flex items-center justify-between p-4 rounded-2xl border border-black/5 bg-veil-bg hover:bg-veil-secondary transition-colors group"
              >
                <span className="font-bold text-veil-text">View on Solana Explorer</span>
                <ExternalLink className="w-5 h-5 text-veil-muted group-hover:text-veil-primary transition-colors" />
              </Link>
            )}
            
            <Link 
              href="/explore" 
              className="pill-button-primary py-4 text-lg flex items-center justify-center gap-2"
            >
              Support another creator <Heart className="w-5 h-5" />
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
