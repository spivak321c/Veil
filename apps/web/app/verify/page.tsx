"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Key, AlertCircle, Copy } from "lucide-react";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";
import { toast } from "sonner";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function VerifyContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const scope = searchParams.get("scope") as "monthly" | "yearly" | null;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const isValid = key && scope && year;

  const periodLabel = isValid
    ? scope === "monthly" && month
      ? `${MONTH_NAMES[Number(month) - 1]} ${year}`
      : `Full Year ${year}`
    : null;

  const handleCopyKey = () => {
    if (key) {
      navigator.clipboard.writeText(key);
      toast.success("Key copied to clipboard");
    }
  };

  return (
    <div className="min-h-[100dvh] relative flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />

      {/* Background ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-veil-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24 z-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="max-w-xl w-full"
        >
          {!isValid ? (
            /* Invalid / missing params */
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-black/5 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-[1.5rem] border border-red-100 flex items-center justify-center mx-auto mb-8 text-red-400">
                <AlertCircle className="w-9 h-9" />
              </div>
              <h1 className="font-heading text-3xl font-black mb-3 tracking-tight text-veil-text">
                Invalid Verification Link
              </h1>
              <p className="text-veil-muted font-medium mb-8 leading-relaxed">
                This link is missing required parameters. Ask the creator to regenerate their viewing key share link.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-8 py-4 bg-veil-text text-white font-black rounded-full hover:bg-black transition-all"
              >
                Browse Creators
              </Link>
            </div>
          ) : (
            /* Valid key — show verification card */
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-black/5">
              {/* Top accent */}
              <div className="h-1.5 bg-veil-primary w-full" />

              <div className="p-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-veil-primary/10 rounded-[1rem] flex items-center justify-center shrink-0">
                    <Key className="w-7 h-7 text-veil-primary" />
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl font-black text-veil-text tracking-tight">
                      Revenue Viewing Key
                    </h1>
                    <p className="text-sm text-veil-muted font-medium mt-0.5">
                      Cryptographic proof of creator revenue
                    </p>
                  </div>
                </div>

                {/* Period badge */}
                <div className="flex items-center gap-3 p-4 bg-veil-bg rounded-2xl border border-black/5 mb-8">
                  <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-veil-muted uppercase tracking-wider">
                      Verified Period
                    </p>
                    <p className="font-black text-veil-text text-lg leading-none mt-1">
                      {periodLabel}
                    </p>
                  </div>
                </div>

                {/* What this key proves */}
                <div className="mb-8 space-y-3">
                  <p className="text-xs font-bold text-veil-muted uppercase tracking-wider">
                    What this key proves
                  </p>
                  {[
                    "Total USDC received during this period",
                    "Payments were processed via Umbra private rails",
                    "Individual patron identities remain hidden",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-veil-text">{item}</p>
                    </div>
                  ))}
                </div>

                {/* Key display */}
                <div className="bg-veil-bg rounded-2xl p-5 border border-black/5 mb-6">
                  <p className="text-xs font-bold text-veil-muted uppercase tracking-wider mb-3">
                    Viewing Key ({scope})
                  </p>
                  <p className="font-mono text-xs break-all text-veil-text leading-relaxed mb-4">
                    {key}
                  </p>
                  <button
                    onClick={handleCopyKey}
                    className="flex items-center gap-2 text-xs font-bold text-veil-primary hover:text-veil-text transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy key
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-veil-muted font-medium leading-relaxed text-center">
                  This key is read-only. It decrypts revenue totals for{" "}
                  <span className="font-bold text-veil-text">{periodLabel}</span> only — it
                  cannot access funds or identify individual supporters.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <VeilFooter />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
