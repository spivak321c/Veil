"use client";

import { useState } from "react";
import { useSendUtxo, type SendStep } from "@/lib/umbra/useSendUtxo";
import { ShieldCheck, LockKeyhole, X, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMicroUsdc } from "@/lib/constants";
import { useRouter } from "next/navigation";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

interface SendFlowProps {
  creatorSlug: string;
  creatorName: string;
  recipientAddress: string;
  amountMicroUsdc: number;
  message?: string;
  isMessagePublic?: boolean;
  onClose: () => void;
}

export function SendFlow({ creatorSlug, creatorName, recipientAddress, amountMicroUsdc, message, isMessagePublic = true, onClose }: SendFlowProps) {
  const { send } = useSendUtxo();
  const [step, setStep] = useState<SendStep>({ status: "idle" });
  const router = useRouter();

  const BPS = 35n;
  const BPS_DIVISOR = 16384n;
  const amtBigInt = BigInt(Math.floor(amountMicroUsdc));
  const fee = (amtBigInt * BPS) / BPS_DIVISOR;
  const netAmount = amtBigInt - fee;

  const handleSend = async () => {
    try {
      const signature = await send(recipientAddress, amtBigInt, (progress) => {
        setStep(progress);
      });

      console.log("[SendFlow] Send completed, recording event. Signature:", signature);

      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorSlug,
            amountUsdc: Number(amountMicroUsdc),
            utxoSignature: signature,
            message: message || null,
            isMessagePublic,
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("[SendFlow] Failed to record event:", errorData);
        } else {
          const data = await res.json();
          console.log("[SendFlow] Event recorded successfully:", data);
        }
      } catch (err) {
        console.error("[SendFlow] Error recording event:", err);
      }

      router.push(`/send/success?creator=${encodeURIComponent(creatorName)}&tx=${signature}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step.status === "idle" || step.status === "error" || step.status === "success" ? onClose : undefined}
        className="absolute inset-0 bg-black/30 backdrop-blur-md" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={springTransition}
        className="relative w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden font-body border border-black/5"
      >
        <AnimatePresence mode="wait">
          {(step.status === "idle" || step.status === "error") && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={springTransition}
              className="p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1rem] bg-veil-bg border border-black/5 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-veil-text" />
                  </div>
                  <h2 className="text-veil-text font-heading font-black text-2xl tracking-tight">Shielded Transfer</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-veil-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-text">
                  <X className="w-5 h-5 text-veil-muted" />
                </button>
              </div>

              <div className="mb-10 space-y-1">
                <div className="flex justify-between items-center py-4 border-b border-black/5">
                  <span className="text-sm font-bold text-veil-muted uppercase tracking-wider">Recipient</span>
                  <span className="text-base text-veil-text font-black">{creatorName}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-black/5">
                  <span className="text-sm font-bold text-veil-muted uppercase tracking-wider">Amount</span>
                  <span className="text-base font-black text-veil-text">${formatMicroUsdc(Number(amtBigInt))}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-black/5">
                  <span className="text-sm font-bold text-veil-muted uppercase tracking-wider">Network Fee (0.21%)</span>
                  <span className="text-base font-black text-veil-muted">${formatMicroUsdc(Number(fee))}</span>
                </div>
                <div className="flex justify-between items-center pt-6 pb-2">
                  <span className="text-base text-veil-text font-black">Net to Creator</span>
                  <span className="text-3xl font-black text-veil-text">${formatMicroUsdc(Number(netAmount))}</span>
                </div>
              </div>

              {step.status === "error" && (
                <div className="mb-8 p-5 rounded-[1.25rem] bg-red-50 border border-red-100 text-red-600 text-sm font-medium leading-relaxed">
                  <span className="font-black mr-2">Error:</span>
                  {step.message}
                </div>
              )}

               <button 
                 onClick={handleSend}
                 className="w-full py-5 bg-veil-text text-white font-black text-lg rounded-[1.25rem] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-veil-text"
               >
                 <LockKeyhole className="w-5 h-5" />
                 Confirm & Send
               </button>
            </motion.div>
          )}

          {(step.status === "checking_registration" || step.status === "registering" || step.status === "submitting" || step.status === "awaiting_mpc") && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={springTransition}
              className="p-10 flex flex-col items-center justify-center text-center h-[420px]"
            >
              <div className="w-24 h-24 rounded-full bg-veil-bg flex items-center justify-center mb-8 relative shadow-sm border border-black/5">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-4px] rounded-full border-4 border-transparent border-t-veil-text"
                />
                <LockKeyhole className="w-8 h-8 text-veil-text" />
              </div>
              
              <h3 className="font-heading text-2xl font-black text-veil-text mb-4 tracking-tight">
                {step.status === "checking_registration" && "Checking Registration"}
                {step.status === "registering" && "Registering with Umbra"}
                {step.status === "submitting" && "Awaiting Signature"}
                {step.status === "awaiting_mpc" && "Processing Privacy"}
              </h3>
              
              <p className="text-base text-veil-muted font-medium leading-relaxed max-w-[25ch]">
                {step.status === "checking_registration" && "Verifying your Umbra account status."}
                {step.status === "registering" && "Setting up your anonymous account on Umbra. Approve the transaction in your wallet."}
                {step.status === "submitting" && "Approve the transaction in your wallet to continue."}
                {step.status === "awaiting_mpc" && "Severing on-chain link via Arcium MPC. Please wait."}
              </p>

              {step.status === "awaiting_mpc" && (
                <div className="mt-10 px-5 py-2.5 rounded-full bg-veil-primary/10 border border-veil-primary/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-veil-primary animate-pulse" />
                  <span className="text-sm font-bold text-veil-primary">Transaction Confirmed</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
