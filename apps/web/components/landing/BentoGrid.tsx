"use client";

import { motion } from "framer-motion";

export function BentoGrid() {
  return (
    <section className="bg-eggshell w-full" style={{ padding: "80px 0" }}>
      <div className="mx-auto max-w-[1200px] px-6">
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-[40px]"
        >
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "#777169", marginBottom: "12px" }}>
            Platform Architecture
          </div>
          <h2 
            style={{ 
              fontFamily: "var(--font-serif)", 
              fontWeight: 300, 
              fontSize: "36px", 
              letterSpacing: "-0.72px", 
              lineHeight: 1.13, 
              color: "#000000",
              margin: 0,
              borderBottom: "1px solid #e5e5e5",
              paddingBottom: "32px"
            }}
          >
            Built entirely on Solana using the official Umbra Privacy SDK.
          </h2>
        </motion.div>

        {/* Feature Grid - Pure Typographic Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
          
          {/* Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <div className="w-[8px] h-[8px] rounded-full bg-obsidian" />
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "16px", color: "#000000", margin: 0 }}>
                Stealth Addresses
              </h3>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "14px", color: "#777169", margin: 0, lineHeight: 1.5, maxWidth: "55ch" }}>
              Patrons send funds to unique, one-time addresses generated strictly for that transaction. The origin remains mathematically untraceable on-chain.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <div className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: "#b1b0b0" }} />
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "16px", color: "#000000", margin: 0 }}>
                Encrypted Balances
              </h3>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "14px", color: "#777169", margin: 0, lineHeight: 1.5, maxWidth: "55ch" }}>
              Creator revenue is secured via Arcium MPC. Your UTXOs are pooled into an encrypted balance. Only you hold the decryption key to view the true amount.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <div className="w-[8px] h-[8px] rounded-full bg-obsidian" />
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "16px", color: "#000000", margin: 0 }}>
                Viewing Keys
              </h3>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "14px", color: "#777169", margin: 0, lineHeight: 1.5, maxWidth: "55ch" }}>
              Generate cryptographic proofs of your income locked to specific months or years. Report revenue to sponsors or tax authorities without exposing patrons.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <div className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: "#b1b0b0" }} />
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "16px", color: "#000000", margin: 0 }}>
                Zero-Knowledge Infrastructure
              </h3>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "14px", color: "#777169", margin: 0, lineHeight: 1.5, maxWidth: "55ch" }}>
              Powered by the official Umbra SDK and native Solana primitives. No wrapping or bridging required. Payments settle instantly and privately.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
