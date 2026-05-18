"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { HeartHandshake, EyeOff, FileCheck2, Banknote, Smartphone, Wand2, Gem, LayoutDashboard, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";
import { useEffect, useRef } from "react";

// Premium Spring Physics
const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: springTransition
  },
} as const;

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="flex flex-col min-h-screen bg-veil-bg text-veil-text font-body overflow-x-hidden selection:bg-veil-primary selection:text-white" ref={containerRef}>
      <VeilHeader />

      <main className="flex-1 w-full pt-20 relative z-0">
        
        {/* 1. HERO SECTION - Asymmetric, Typographic, Cinematic */}
        <section className="relative w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16 min-h-[90dvh]">
          {/* Background Ambient */}
          <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-veil-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="w-full lg:w-[55%] flex flex-col items-start text-left z-10"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] border border-black/5 mb-8">
              <ShieldCheck className="w-4 h-4 text-veil-primary" />
              <span className="text-sm font-semibold tracking-tight text-veil-text">Privacy-first creator patronage</span>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.95] tracking-tighter mb-8 text-veil-text">
                Fund your work. <br />
                <span className="text-veil-muted relative inline-block">
                  Keep it private.
                </span>
              </h1>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <p className="text-lg md:text-xl text-veil-muted mb-10 max-w-[55ch] leading-relaxed font-medium">
                Join creators getting tips and growing communities without exposing their fans to the internet. We handle the privacy magic on Solana, you focus on creating.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/onboard" className="w-full sm:w-auto bg-veil-text text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black transition-colors flex items-center justify-center gap-2 group">
                Claim your free page
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/explore" className="w-full sm:w-auto bg-white/50 backdrop-blur-sm border border-black/10 text-veil-text px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-colors flex items-center justify-center gap-2">
                Explore creators
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Side - Photographic Asset & Interactive Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className="w-full lg:w-[45%] relative h-[600px] flex items-center justify-center pointer-events-none"
          >
            {/* The Asset Image (Unsplash placeholder via Picsum for now) */}
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden border border-black/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
              <img 
                src="https://picsum.photos/seed/veilhero/1600/2000" 
                alt="Creator portrait" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Base Card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute z-10 bottom-10 left-10 w-[260px] bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/40 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-veil-bg animate-pulse" />
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">New Tip</div>
              </div>
              <div>
                <div className="w-3/4 h-3 bg-veil-bg rounded-full mb-3" />
                <div className="w-1/2 h-3 bg-veil-bg rounded-full" />
              </div>
            </motion.div>

            {/* Floating Element 1 */}
            <motion.div 
              animate={{ y: [0, 15, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute z-20 -right-4 top-20 bg-white/80 backdrop-blur-xl border border-white/40 p-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4"
            >
              <div className="bg-veil-primary/10 p-2 rounded-full">
                <ShieldCheck className="w-5 h-5 text-veil-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-veil-text">Anonymous</p>
                <p className="text-xs text-veil-muted">50.00 USDC</p>
              </div>
            </motion.div>

            {/* Floating Element 2 */}
            <motion.div 
              animate={{ y: [0, -15, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute z-20 -left-6 top-1/2 bg-veil-primary text-white p-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(114,164,242,0.4)] flex items-center gap-3"
            >
              <HeartHandshake className="w-5 h-5" />
              <span className="text-sm font-bold">100% Private</span>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. BENTO GRID FEATURES SECTION */}
        <section id="features" className="w-full bg-white border-y border-black/5 py-32">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mb-20"
            >
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-veil-text tracking-tight max-w-2xl">
                Everything you need, <br /> without the snooping.
              </h2>
              <p className="text-veil-muted text-lg md:text-xl font-medium max-w-[60ch]">
                Normal Solana payments expose your supporters. Veil magically protects everyone's privacy behind the scenes using advanced zero-knowledge proofs.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Feature 1 - Large Wide Card (Col span 2 on md) */}
              <motion.div 
                variants={fadeInUp}
                className="md:col-span-2 bg-veil-bg rounded-[2.5rem] p-10 md:p-14 border border-black/5 flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="relative z-10 max-w-md">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-8 text-veil-text">
                    <EyeOff className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-3xl font-black mb-4 text-veil-text tracking-tight">Secret Supporters</h3>
                  <p className="text-veil-muted text-lg leading-relaxed font-medium">
                    When someone tips you, we scramble the payment trail. Only you know who supported you, keeping your fans safe from internet sleuths.
                  </p>
                </div>
                {/* Decorative element */}
                <div className="absolute right-0 bottom-0 w-2/3 h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.div>

              {/* Feature 2 - Tall Card */}
              <motion.div 
                variants={fadeInUp}
                className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] flex flex-col"
              >
                <div className="w-14 h-14 bg-veil-primary/10 rounded-2xl flex items-center justify-center mb-8 text-veil-primary">
                  <FileCheck2 className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-2xl font-black mb-4 text-veil-text tracking-tight">Show Your Success</h3>
                <p className="text-veil-muted text-base leading-relaxed font-medium">
                  Need to prove your income for taxes or a big sponsor? Generate a clean, official report without ever revealing who your actual fans are.
                </p>
              </motion.div>

              {/* Feature 3 - Standard Card */}
              <motion.div 
                variants={fadeInUp}
                className="bg-veil-text text-white rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden"
              >
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-white">
                  <Banknote className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-2xl font-black mb-4 tracking-tight">Crypto to Cash</h3>
                <p className="text-white/70 text-base leading-relaxed font-medium z-10">
                  Not a crypto expert? No problem. Receive tips smoothly on Solana and have them automatically routed to real cash in your bank account.
                </p>
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/noise.png')] mix-blend-overlay pointer-events-none" />
              </motion.div>

              {/* Feature 4 - Standard Card */}
              <motion.div 
                variants={fadeInUp}
                className="md:col-span-2 bg-veil-secondary/30 rounded-[2.5rem] p-10 flex items-center justify-between border border-black/5 group"
              >
                <div className="max-w-sm">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 text-veil-text shadow-sm">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-2xl font-black mb-4 text-veil-text tracking-tight">Lightning Fast</h3>
                  <p className="text-veil-muted text-base leading-relaxed font-medium">
                    Built on Solana for sub-second confirmation times and fractions of a penny in fees.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 3. HOW IT WORKS - Minimalist Flow */}
        <section id="how-it-works" className="w-full bg-veil-bg py-32">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
              <div>
                <h2 className="font-heading text-4xl md:text-5xl font-black mb-4 text-veil-text tracking-tight">As simple as 1, 2, 3</h2>
                <p className="text-veil-muted text-lg font-medium max-w-[40ch]">We handle the complex privacy math so you don't have to.</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-20 right-20 h-[1px] bg-black/10 z-0" />

              {[
                {
                  step: "01",
                  title: "Fan Connects",
                  desc: "Your supporter securely connects their wallet.",
                  icon: <Smartphone className="w-6 h-6" />
                },
                {
                  step: "02",
                  title: "Veil Magic",
                  desc: "We scramble the data behind the scenes.",
                  icon: <Wand2 className="w-6 h-6" />
                },
                {
                  step: "03",
                  title: "You Get Paid",
                  desc: "Funds land safely in your private balance.",
                  icon: <Gem className="w-6 h-6" />
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="relative z-10 flex flex-col"
                >
                  <div className="w-24 h-24 rounded-[2rem] bg-white shadow-sm border border-black/5 flex items-center justify-center mb-8 text-veil-text group hover:-translate-y-2 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <span className="text-sm font-mono text-veil-primary font-bold mb-3">{step.step}</span>
                  <h4 className="font-heading font-black text-2xl mb-3 text-veil-text tracking-tight">{step.title}</h4>
                  <p className="text-veil-muted text-base font-medium max-w-[30ch]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. CREATOR QUOTES - Editorial Style */}
        <section id="creators" className="w-full bg-white border-y border-black/5 py-32">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <h2 className="font-heading text-4xl md:text-5xl font-black mb-16 text-veil-text tracking-tight max-w-2xl">
              Loved by creators choosing privacy.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Jenkins",
                  role: "Fiber Artist",
                  text: "I used to hate how my earnings were public knowledge on the blockchain. Veil gave me back my peace of mind. Now my fans can tip me, and only I know about it.",
                  img: "https://picsum.photos/seed/sarah/200/200"
                },
                {
                  name: "Elena R.",
                  role: "Digital Illustrator",
                  text: "The cash out feature is a total lifesaver. I get all the benefits of fast crypto tips from my international fans, but the money just shows up in my regular bank account.",
                  img: "https://picsum.photos/seed/elena/200/200"
                },
                {
                  name: "Marcus T.",
                  role: "Tech Educator",
                  text: "When I applied for an apartment, I needed to prove my creator income. Veil let me generate a completely official report without doxxing a single one of my supporters.",
                  img: "https://picsum.photos/seed/marcus/200/200"
                }
              ].map((t, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="bg-veil-bg/50 rounded-[2rem] p-8 border border-black/5 flex flex-col justify-between"
                >
                  <p className="text-lg text-veil-text font-medium leading-relaxed mb-10">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    <div>
                      <p className="font-black text-lg text-veil-text tracking-tight leading-tight">{t.name}</p>
                      <p className="text-sm text-veil-muted font-bold">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CTA - Clean & Focused */}
        <section className="w-full bg-veil-bg py-32">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="flex flex-col items-center"
            >
              <motion.div variants={fadeInUp} className="w-16 h-16 bg-veil-primary text-white rounded-full flex items-center justify-center mb-8">
                <HeartHandshake className="w-8 h-8" />
              </motion.div>
              <motion.h2 variants={fadeInUp} className="font-heading text-5xl md:text-6xl font-black mb-6 text-veil-text tracking-tighter">
                Start building your community safely.
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-veil-muted text-xl mb-12 font-medium max-w-2xl">
                Join thousands of creators getting supported on their own terms. Your free page is just a few clicks away.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link href="/onboard" className="bg-veil-text text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl shadow-black/10">
                  Create Your Page
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <VeilFooter />
    </div>
  );
}
