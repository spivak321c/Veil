"use client";

import { EyeOff, Key, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springTransition },
} as const;

export default function HowItWorksPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-veil-bg text-veil-text font-body selection:bg-veil-primary selection:text-white relative overflow-hidden">
      <VeilHeader />

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-veil-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <main className="flex-1 w-full pt-32 pb-24 relative z-0">
        <div className="max-w-[900px] mx-auto px-6 md:px-10">
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mb-20"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/5 mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-veil-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-veil-text">
                Architecture
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="font-heading text-5xl md:text-6xl font-black mb-6 tracking-tighter text-veil-text">
              How Veil Works
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-veil-muted text-xl max-w-[65ch] leading-relaxed font-medium">
              Veil leverages the Umbra Privacy SDK on Solana to break the on-chain link between patrons and creators. 
              Here is a technical overview of the cryptographic primitives securing the platform.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8 relative"
          >
            {/* Connecting line */}
            <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-black/5 -z-10 hidden md:block" />

            {/* Section 1 */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col md:flex-row gap-8 items-start group hover:border-black/10 transition-colors">
              <div className="w-20 h-20 rounded-[1.5rem] bg-veil-bg flex items-center justify-center shrink-0 border border-black/5 shadow-sm group-hover:scale-105 transition-transform">
                <EyeOff className="w-8 h-8 text-veil-text" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-black tracking-tight mb-4 text-veil-text">
                  1. The Umbra Mixer & Stealth Addresses
                </h2>
                <div className="text-lg text-veil-muted leading-relaxed font-medium space-y-4">
                  <p>
                    When a patron supports a creator, the funds are not sent directly to the creator's wallet. 
                    Instead, the Umbra SDK generates a one-time stealth address derived from the creator's public key.
                  </p>
                  <p>
                    The patron deposits USDC into the Umbra Mixer contract, assigning ownership to the stealth address. 
                    Only the creator holds the corresponding private key to claim the UTXO (Unspent Transaction Output) from the Merkle tree.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 2 */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col md:flex-row gap-8 items-start group hover:border-black/10 transition-colors">
              <div className="w-20 h-20 rounded-[1.5rem] bg-veil-primary/10 flex items-center justify-center shrink-0 border border-veil-primary/10 shadow-sm group-hover:scale-105 transition-transform">
                <Zap className="w-8 h-8 text-veil-primary" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-black tracking-tight mb-4 text-veil-text">
                  2. Arcium MPC & Encrypted Balances
                </h2>
                <div className="text-lg text-veil-muted leading-relaxed font-medium space-y-4">
                  <p>
                    Claiming a UTXO typically moves funds to a public wallet, exposing the creator's total revenue. 
                    Veil avoids this by claiming UTXOs directly into an <strong>Encrypted Balance</strong>.
                  </p>
                  <p>
                    The claiming transaction requires a callback to the Arcium Multi-Party Computation (MPC) network. 
                    Arcium nodes perform operations on the encrypted state without decrypting it, 
                    securely increasing the creator's hidden balance.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 3 */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col md:flex-row gap-8 items-start group hover:border-black/10 transition-colors">
              <div className="w-20 h-20 rounded-[1.5rem] bg-green-50 flex items-center justify-center shrink-0 border border-green-100 shadow-sm group-hover:scale-105 transition-transform">
                <Key className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-black tracking-tight mb-4 text-veil-text">
                  3. Viewing Keys & Compliance
                </h2>
                <div className="text-lg text-veil-muted leading-relaxed font-medium space-y-4">
                  <p>
                    Privacy should not preclude accountability. Creators can generate time-scoped 
                    <strong> Viewing Keys</strong> (monthly or yearly) via the Umbra SDK.
                  </p>
                  <p>
                    These JSON keys can be shared with sponsors, accountants, or tax authorities. 
                    They decrypt the total revenue volume for that specific period, but they <strong>never</strong> decrypt 
                    the identities of the individual patrons.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <VeilFooter />
    </div>
  );
}
