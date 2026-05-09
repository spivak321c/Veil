"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, EyeSlash, Key, CheckCircle, LockKey, CaretDown, Heart } from "@phosphor-icons/react";
import { useState } from "react";

function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Share your profile",
      desc: "Fans visit your custom Veil page and choose a support tier."
    },
    {
      num: 2,
      title: "Funds are shielded",
      desc: "Transactions route through stealth addresses via the Umbra Mixer."
    },
    {
      num: 3,
      title: "Claim your balance",
      desc: "Only you hold the decryption key to claim funds to your real wallet."
    }
  ];

  return (
    <section className="bg-canvas w-full py-[120px]">
      <div className="container mx-auto max-w-[1200px] px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-[80px]"
        >
          <h2 className="font-sans text-heading-lg tracking-[-0.97px] text-ink mb-[16px] font-medium leading-[1.1]">
            How Veil works
          </h2>
          <p className="font-sans text-subheading text-iron tracking-[-0.48px] max-w-[40ch] mx-auto leading-[1.3]">
            A seamless experience for your fans, powered by complex zero-knowledge cryptography under the hood.
          </p>
        </motion.div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-[24px]">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center bg-iron/5 p-[40px] md:p-[52px] rounded-[30px]"
            >
              <div className="mb-[24px] w-[64px] h-[64px] rounded-full bg-ink text-canvas flex items-center justify-center font-sans text-[26px] tracking-[-0.52px]">
                {step.num}
              </div>
              <h3 className="font-sans font-medium text-heading-sm tracking-[-0.52px] text-ink mb-[16px]">
                {step.title}
              </h3>
              <p className="font-sans text-[16px] text-iron leading-[1.5]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-canvas w-full pb-[120px]">
      <div className="container mx-auto max-w-[1200px] px-6">
        
        {/* Benefit 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px] lg:gap-[120px] items-center mb-[60px] lg:mb-[120px]">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 md:order-1"
          >
            <div className="w-[64px] h-[64px] rounded-full bg-sky-blue/10 flex items-center justify-center mb-[32px]">
              <EyeSlash weight="fill" className="w-[32px] h-[32px] text-sky-blue" />
            </div>
            <h2 className="font-sans text-heading-lg tracking-[-0.97px] text-ink leading-[1.1] mb-[24px] font-medium">
              Total financial privacy.
            </h2>
            <p className="font-sans text-[18px] text-iron leading-[1.5] max-w-[45ch]">
              Never worry about "wallet watching" again. Because funds flow through one-time stealth addresses, your main wallet's transaction history cannot be tied to your patrons.
            </p>
          </motion.div>
          
          <div className="w-full aspect-square bg-iron/5 rounded-[30px] flex items-center justify-center relative overflow-hidden order-1 md:order-2">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-iron/5 pointer-events-none" />
            <div className="w-[60%] h-[60%] rounded-full border-[2px] border-dashed border-ink/10 animate-[spin_30s_linear_infinite]" />
            <div className="absolute w-[40%] h-[40%] rounded-full bg-canvas shadow-sm flex items-center justify-center">
              <LockKey weight="duotone" className="w-[48px] h-[48px] text-sky-blue" />
            </div>
          </div>
        </div>

        {/* Benefit 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px] lg:gap-[120px] items-center">
          <div className="w-full aspect-square bg-iron/5 rounded-[30px] flex flex-col justify-center gap-[16px] p-[40px] relative overflow-hidden">
            {/* Visual abstraction of keys */}
            <div className="w-full h-[64px] bg-canvas rounded-[20px] shadow-sm flex items-center px-[24px] translate-x-[-20px]">
              <div className="w-[12px] h-[12px] rounded-full bg-vivid-pink/40 mr-[16px]" />
              <div className="h-[8px] w-[40%] bg-iron/10 rounded-full" />
            </div>
            <div className="w-full h-[64px] bg-canvas rounded-[20px] shadow-sm flex items-center px-[24px]">
              <div className="w-[12px] h-[12px] rounded-full bg-vivid-pink mr-[16px]" />
              <div className="h-[8px] w-[60%] bg-iron/20 rounded-full" />
            </div>
            <div className="w-full h-[64px] bg-canvas rounded-[20px] shadow-sm flex items-center px-[24px] translate-x-[20px]">
              <div className="w-[12px] h-[12px] rounded-full bg-vivid-pink/40 mr-[16px]" />
              <div className="h-[8px] w-[30%] bg-iron/10 rounded-full" />
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-[64px] h-[64px] rounded-full bg-vivid-pink/10 flex items-center justify-center mb-[32px]">
              <Key weight="fill" className="w-[32px] h-[32px] text-vivid-pink" />
            </div>
            <h2 className="font-sans text-heading-lg tracking-[-0.97px] text-ink leading-[1.1] mb-[24px] font-medium">
              Auditable on your terms.
            </h2>
            <p className="font-sans text-[18px] text-iron leading-[1.5] max-w-[45ch]">
              Need to prove income for a mortgage or sponsorship? Generate cryptographic, time-scoped "Viewing Keys" that prove your aggregate revenue without doxxing individual supporters.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-iron/10 py-[32px] last:border-b-0">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md group"
        aria-expanded={open}
      >
        <span className="font-sans font-medium text-heading-sm tracking-[-0.52px] text-ink group-hover:text-iron transition-colors">{question}</span>
        <CaretDown weight="bold" className={`w-[24px] h-[24px] text-iron transition-transform duration-300 ${open ? "rotate-180 text-ink" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-[24px] font-sans text-[16px] text-silver-thread leading-[1.6] max-w-[65ch]">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: "How does the privacy mechanism work?",
      a: "Veil uses the Umbra Privacy SDK. When a patron supports you, the funds aren't sent directly to your wallet. Instead, they are sent to a mathematically unique 'stealth address' that only you have the private keys to unlock. This completely severs the public link between the sender and your main wallet."
    },
    {
      q: "What is an Encrypted Balance?",
      a: "Before you claim your funds, they exist as individual UTXOs on the blockchain. Veil uses Arcium Multi-Party Computation (MPC) to securely tally these hidden amounts into a single 'Encrypted Balance' that only you can view in your dashboard."
    },
    {
      q: "What are Viewing Keys?",
      a: "A Viewing Key is a cryptographic proof you can generate (e.g., for a specific month or year) that proves how much revenue you received. You can hand this key to an auditor or sponsor, allowing them to verify your aggregate income without revealing who sent it to you."
    }
  ];

  return (
    <section className="bg-canvas w-full pb-[120px]">
      <div className="container mx-auto max-w-[800px] px-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-heading-lg tracking-[-0.97px] text-ink mb-[64px] font-medium text-center"
        >
          Frequently asked questions
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-col"
        >
          {faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
        </motion.div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-iron/5 w-full py-[120px] text-center">
      <div className="container mx-auto max-w-[800px] px-6 flex flex-col items-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-display tracking-[-2.3px] text-ink mb-[24px] font-light leading-[1.0]"
        >
          Reclaim your financial privacy.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="font-sans text-subheading tracking-[-0.48px] text-iron mb-[48px] max-w-[45ch]"
        >
          Join the protocol and start accepting zero-knowledge patronage today.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <Link 
            href="/onboard"
            className="bg-ink text-canvas hover:bg-ink/90 transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
            style={{ borderRadius: "30px", padding: "18px 40px", fontSize: "18px", fontWeight: 500 }}
          >
            Start receiving privately
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingContent() {
  return (
    <>
      <HowItWorks />
      <BenefitsSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
