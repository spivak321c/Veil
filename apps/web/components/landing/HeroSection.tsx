"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EyeSlash, Heart, LockKey } from "@phosphor-icons/react";

export function HeroSection() {
  return (
    <section className="relative bg-canvas w-full flex flex-col items-center pt-[100px] md:pt-[140px] px-6 overflow-hidden">
      
      {/* Decorative Sky Blue Splash to add subtle energy */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-blue/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 },
          },
        }}
        className="w-full max-w-[1000px] flex flex-col items-center text-center relative z-10"
      >
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
          }}
          className="font-sans text-ink m-0 font-light text-display"
          style={{ 
            lineHeight: 0.98, 
            letterSpacing: "-2.3px", 
          }}
        >
          Creativity powered <br className="hidden md:block" /> by privacy.
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
          }}
          className="font-sans text-iron m-0 mt-[24px] max-w-[45ch] text-subheading"
          style={{ lineHeight: 1.4, letterSpacing: "-0.48px", fontWeight: 400 }}
        >
          Let fans support your work without exposing your public wallet history. Get paid anonymously, prove your revenue securely.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-[16px] w-full sm:w-auto mt-[40px]"
        >
          <Link 
            href="/onboard"
            className="w-full sm:w-auto bg-ink text-canvas hover:bg-ink/80 transition-all flex items-center justify-center font-sans font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
            style={{ borderRadius: "30px", padding: "18px 32px", fontSize: "18px" }}
          >
            Start receiving privately
          </Link>

          <Link 
            href="/explore" 
            className="w-full sm:w-auto bg-transparent text-ink hover:bg-iron/5 border border-iron/20 transition-colors flex items-center justify-center font-sans font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
            style={{ borderRadius: "30px", padding: "17px 32px", fontSize: "18px" }}
          >
            Explore Creators
          </Link>
        </motion.div>
      </motion.div>

      {/* Abstract UI Mockup (Centered below text) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="w-full max-w-[1000px] mt-[80px] md:mt-[100px] mb-[40px] relative z-10"
      >
        <div className="w-full aspect-[4/3] md:aspect-[21/9] bg-iron/5 rounded-[30px] p-[8px] md:p-[16px] flex flex-col overflow-hidden relative">
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-canvas/50 pointer-events-none" />

          {/* Inner Mockup Frame */}
          <div className="w-full h-full bg-canvas rounded-[20px] shadow-sm border border-iron/5 flex flex-col md:flex-row overflow-hidden relative z-10">
            
            {/* Left Panel: Creator Profile Mock */}
            <div className="w-full md:w-[40%] bg-iron/5 p-[24px] md:p-[32px] flex flex-col border-b md:border-b-0 md:border-r border-iron/5">
              <div className="w-[64px] h-[64px] rounded-full bg-sky-blue/20 flex items-center justify-center text-sky-blue font-sans text-[24px] mb-[20px]">
                A
              </div>
              <div className="font-sans text-[24px] tracking-[-0.48px] text-ink font-medium mb-[8px]">Alice Dev</div>
              <div className="font-sans text-[15px] text-iron leading-[1.5] mb-[32px]">Building open source privacy tools. Support my work below.</div>
              
              <div className="mt-auto space-y-[12px]">
                <div className="w-full h-[54px] rounded-[16px] bg-canvas border border-iron/10 flex items-center px-[16px] justify-between">
                  <span className="font-sans text-[15px] text-ink font-medium">Supporter</span>
                  <span className="font-mono text-[14px] text-ink">5 USDC</span>
                </div>
                <div className="w-full h-[54px] rounded-[16px] bg-canvas border border-iron/10 flex items-center px-[16px] justify-between">
                  <span className="font-sans text-[15px] text-ink font-medium">Sponsor</span>
                  <span className="font-mono text-[14px] text-ink">50 USDC</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Transaction Flow Mock */}
            <div className="flex-1 p-[24px] md:p-[40px] flex flex-col justify-center bg-canvas relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-vivid-pink/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-[16px] max-w-[320px] mx-auto w-full">
                
                {/* Event 1 */}
                <div className="w-full bg-canvas border border-iron/10 rounded-[20px] p-[16px] shadow-sm flex items-center gap-[16px]">
                  <div className="w-[40px] h-[40px] rounded-full bg-sky-blue/10 flex items-center justify-center">
                    <Heart weight="fill" className="w-[20px] h-[20px] text-sky-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="font-sans text-[15px] font-medium text-ink">Anonymous</div>
                    <div className="font-sans text-[13px] text-silver-thread">Via Stealth Address</div>
                  </div>
                  <div className="font-mono text-[14px] text-ink font-medium">+5 USDC</div>
                </div>

                {/* Event 2 */}
                <div className="w-full bg-canvas border border-iron/10 rounded-[20px] p-[16px] shadow-sm flex items-center gap-[16px] translate-x-[20px]">
                  <div className="w-[40px] h-[40px] rounded-full bg-vivid-pink/10 flex items-center justify-center">
                    <LockKey weight="fill" className="w-[20px] h-[20px] text-vivid-pink" />
                  </div>
                  <div className="flex-1">
                    <div className="font-sans text-[15px] font-medium text-ink">Anonymous</div>
                    <div className="font-sans text-[13px] text-silver-thread">Via Stealth Address</div>
                  </div>
                  <div className="font-mono text-[14px] text-ink font-medium">+50 USDC</div>
                </div>

                {/* Event 3 */}
                <div className="w-full bg-canvas border border-iron/10 rounded-[20px] p-[16px] shadow-sm flex items-center gap-[16px] translate-x-[40px]">
                  <div className="w-[40px] h-[40px] rounded-full bg-sky-blue/10 flex items-center justify-center">
                    <EyeSlash weight="fill" className="w-[20px] h-[20px] text-sky-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="font-sans text-[15px] font-medium text-ink">Anonymous</div>
                    <div className="font-sans text-[13px] text-silver-thread">Via Stealth Address</div>
                  </div>
                  <div className="font-mono text-[14px] text-ink font-medium">+100 USDC</div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
