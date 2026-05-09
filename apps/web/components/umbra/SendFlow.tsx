"use client";

import { useState } from "react";
import { useSendUtxo, type SendStep } from "@/lib/umbra/useSendUtxo";
import { ShieldCheck, LockKeyhole, X, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMicroUsdc } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface SendFlowProps {
  creatorName: string;
  recipientAddress: string;
  amountMicroUsdc: number;
  onClose: () => void;
}

export function SendFlow({ creatorName, recipientAddress, amountMicroUsdc, onClose }: SendFlowProps) {
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
      await send(recipientAddress, amtBigInt, (progress) => {
        setStep(progress);
        if (progress.status === "success") {
          fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creatorSlug: window.location.pathname.split("/").pop(),
              amountUsdc: Number(amountMicroUsdc),
              utxoSignature: progress.callbackSignature,
            })
          }).catch(console.error);
          
          // Redirect to success page instead of staying in modal
          router.push(`/send/success?creator=${encodeURIComponent(creatorName)}&tx=${progress.callbackSignature}`);
        }
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step.status === "idle" || step.status === "error" || step.status === "success" ? onClose : undefined}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[480px] bg-canvas rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden font-sans"
      >
        <AnimatePresence mode="wait">
          {(step.status === "idle" || step.status === "error") && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-[40px]"
            >
              <div className="flex justify-between items-center mb-[32px]">
                <div className="flex items-center gap-[12px]">
                  <div className="w-[48px] h-[48px] rounded-full bg-iron/5 flex items-center justify-center">
                    <ShieldCheck className="w-[24px] h-[24px] text-ink" />
                  </div>
                  <div>
                    <h2 className="text-ink font-medium text-[22px] tracking-[-0.48px]">Shielded Transfer</h2>
                  </div>
                </div>
                <button onClick={onClose} className="p-[8px] rounded-full hover:bg-iron/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
                  <X className="w-[20px] h-[20px] text-iron" />
                </button>
              </div>

              <div className="mb-[32px] space-y-[4px]">
                <div className="flex justify-between items-center py-[16px] border-b border-iron/5">
                  <span className="text-[15px] text-iron">Recipient</span>
                  <span className="text-[15px] text-ink font-medium">{creatorName}</span>
                </div>
                <div className="flex justify-between items-center py-[16px] border-b border-iron/5">
                  <span className="text-[15px] text-iron">Amount</span>
                  <span className="text-[16px] font-mono text-ink">${formatMicroUsdc(Number(amtBigInt))}</span>
                </div>
                <div className="flex justify-between items-center py-[16px] border-b border-iron/5">
                  <span className="text-[15px] text-iron">Network Fee (0.21%)</span>
                  <span className="text-[15px] font-mono text-silver-thread">${formatMicroUsdc(Number(fee))}</span>
                </div>
                <div className="flex justify-between items-center py-[24px]">
                  <span className="text-[16px] text-ink font-medium">Net to Creator</span>
                  <span className="text-[20px] font-mono text-ink font-medium">${formatMicroUsdc(Number(netAmount))}</span>
                </div>
              </div>

              {step.status === "error" && (
                <div className="mb-[24px] p-[16px] rounded-[16px] bg-iron/5 text-ink text-[14px] leading-[1.5] border border-iron/10">
                  <span className="font-medium mr-2">Error:</span>
                  {step.message}
                </div>
              )}

               <button 
                 onClick={handleSend}
                 className="w-full py-[16px] bg-ink text-canvas font-medium text-[16px] rounded-[30px] hover:bg-ink/80 transition-colors flex items-center justify-center gap-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
               >
                 <LockKeyhole className="w-[20px] h-[20px]" />
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
              className="p-[60px] flex flex-col items-center justify-center text-center h-[420px]"
            >
              <div className="w-[80px] h-[80px] rounded-full border-[2px] border-iron/10 flex items-center justify-center mb-[32px] relative">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-2px] rounded-full border-[2px] border-transparent border-t-sky-blue"
                />
                <LockKeyhole className="w-[32px] h-[32px] text-ink" />
              </div>
              
              <h3 className="font-sans text-[26px] tracking-[-0.52px] text-ink font-medium mb-[12px]">
                {step.status === "checking_registration" && "Checking Registration"}
                {step.status === "registering" && "Registering with Umbra"}
                {step.status === "submitting" && "Awaiting Signature"}
                {step.status === "awaiting_mpc" && "Processing Privacy"}
              </h3>
              
              <p className="text-[16px] text-iron leading-[1.5] max-w-[25ch]">
                {step.status === "checking_registration" && "Verifying your Umbra account status."}
                {step.status === "registering" && "Setting up your anonymous account on Umbra. Approve the transaction in your wallet."}
                {step.status === "submitting" && "Approve the transaction in your wallet to continue."}
                {step.status === "awaiting_mpc" && "Severing on-chain link via Arcium MPC. Please wait."}
              </p>

              {step.status === "awaiting_mpc" && (
                <div className="mt-[40px] px-[16px] py-[8px] rounded-[37.5px] bg-sky-blue/10 inline-flex items-center gap-[8px]">
                  <div className="w-[6px] h-[6px] rounded-full bg-sky-blue animate-pulse" />
                  <span className="text-[13px] font-sans font-medium text-sky-blue">Transaction Confirmed</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
