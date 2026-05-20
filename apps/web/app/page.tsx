"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import {
  HeartHandshake,
  EyeOff,
  FileCheck2,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  Globe,
  ChevronDown,
  Users,
} from "lucide-react";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const springGentle = { type: "spring" as const, stiffness: 80, damping: 18, mass: 1 };
const springBouncy = { type: "spring" as const, stiffness: 150, damping: 12, mass: 0.8 };

const containerStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: springGentle },
};

const SUPABASE = "https://pquxfbbxflqvtidtlrhl.supabase.co/storage/v1/object/public/hmac-uploads/brand/d8377d16-bae1-4eb6-9fbc-5bcd192d86f4/assets";

const HERO_ILLUSTRATION = `${SUPABASE}/6c2befa4-979c-4ddc-89b3-1eb258b6af07.webp`;

const HERO_IMAGES = [
  HERO_ILLUSTRATION,
  "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&fit=crop&q=80", // Artist painting
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&fit=crop&q=80", // Colorful paint/craft
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&fit=crop&q=80", // Collaborative creators
];

const AVATAR_FAN_TIP = `${SUPABASE}/880ac24b-ee1f-4bf4-94da-43bd99f721b0.webp`;
const AVATAR_FAN_STEP = `${SUPABASE}/01c7a345-6b8a-4f06-9142-83d1b4192885.webp`;
const AVATAR_CREATOR_STEP = `${SUPABASE}/cd5270d9-37d2-4ac4-94af-aabfc28b962e.webp`;

const HERO_BG =
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=2400&q=80&fit=crop";

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "Fiber Artist",
    text: "I used to hate how my earnings were public knowledge on the blockchain. Veil gave me back my peace of mind. Now my fans can tip me, and only I know about it.",
    img: `${SUPABASE}/e1420747-0876-4400-836d-4fc1805dc264.webp`,
  },
  {
    name: "Elena R.",
    role: "Digital Illustrator",
    text: "The cash out feature is a total lifesaver. I get all the benefits of fast crypto tips from my international fans, but the money just shows up in my regular bank account.",
    img: `${SUPABASE}/19889982-6a06-4417-b844-394927250641.webp`,
  },
  {
    name: "Marcus T.",
    role: "Tech Educator",
    text: "When I applied for an apartment, I needed to prove my creator income. Veil let me generate a completely official report without doxxing a single one of my supporters.",
    img: `${SUPABASE}/9775cb4c-f9db-4c4f-b992-cd6cdb5d89d1.webp`,
  },
];

function BackgroundMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-veil-primary/8 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-veil-umbra/8 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] rounded-full bg-veil-arcium/6 blur-[100px]"
      />
      <div className="absolute inset-0 bg-noise opacity-50" />
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-veil-primary/20"
          style={{
            left: `${15 + i * 10 + (i % 3) * 5}%`,
            top: `${20 + (i * 13) % 70}%`,
          }}
          animate={{
            y: [0, -30 - i * 5, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.ceil(value / 60);
          const interval = setInterval(() => {
            start += step;
            if (start >= value) {
              setCount(value);
              clearInterval(interval);
            } else {
              setCount(start);
            }
          }, 25);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/5 py-6 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left group cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-heading font-bold text-lg text-veil-text group-hover:text-veil-primary transition-colors pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0 w-8 h-8 rounded-full bg-veil-secondary/50 flex items-center justify-center"
        >
          <ChevronDown className="w-4 h-4 text-veil-muted" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-veil-muted leading-relaxed max-w-[55ch]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.2]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.98]);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  const parallaxX = useTransform(mouseX, [0, 1], [-12, 12]);
  const parallaxY = useTransform(mouseY, [0, 1], [-12, 12]);

  // Hero slideshow auto-cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const featuresRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"],
  });

  useGSAP(() => {
    // Fun visual effect: The background slowly pans and zooms continuously
    gsap.to(".hero-bg-img", {
      scale: 1.15,
      rotation: 2,
      x: "-2%",
      y: "2%",
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Fun scroll effect: Parallax on the background image when scrolling down
    gsap.to(".hero-bg-container", {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });

  }, { scope: containerRef });

  return (
    <div
      className="flex flex-col min-h-screen bg-veil-bg text-veil-text font-body overflow-x-hidden selection:bg-veil-primary selection:text-white"
      ref={containerRef}
    >
      <VeilHeader />

      <main className="flex-1 w-full relative z-0">

        {/* HERO */}
        <section className="relative w-full min-h-[100dvh] flex items-center overflow-hidden">
          {/* GSAP Animated Fun Background */}
          <div className="absolute inset-0 overflow-hidden -z-20 hero-bg-container">
            <img 
              src={HERO_BG} 
              alt="Colorful abstract background" 
              className="w-full h-[120%] object-cover opacity-20 hero-bg-img"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-veil-bg/40 to-veil-bg" />
          </div>

          <BackgroundMesh />
          <FloatingParticles />

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-32 pb-24 flex flex-col lg:flex-row items-center gap-16">
            {/* Left Content */}
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              initial="hidden"
              animate="show"
              variants={containerStagger}
              className="w-full lg:w-[52%] flex flex-col items-start text-left"
            >


              <motion.div variants={fadeUp}>
                <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-black leading-[0.92] tracking-tighter mb-8">
                  Fund your work.{" "}
                  <span className="text-gradient-primary inline-block">Keep it private.</span>
                </h1>
              </motion.div>

              <motion.div variants={fadeUp}>
                <p className="text-lg md:text-xl text-veil-muted mb-10 max-w-[52ch] leading-relaxed">
                  Join creators getting tips and growing communities without exposing their fans
                  to the whole internet. We handle the privacy magic, you focus on creating.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
              >
                <Link
                  href="/onboard"
                  className="group relative w-full sm:w-auto bg-veil-text text-white px-9 py-4.5 rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Claim your free page
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/explore"
                  className="w-full sm:w-auto bg-white/70 backdrop-blur-xl border border-white/50 text-veil-text px-9 py-4.5 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  Explore creators
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-12 flex items-center gap-6 text-sm text-veil-muted"
              >
                <div className="flex -space-x-2">
                  {TESTIMONIALS.slice(0, 3).map((t, i) => (
                    <img
                      key={i}
                      src={t.img}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-veil-bg"
                    />
                  ))}
                </div>
                <span>
                  Trusted by <strong className="text-veil-text">1,200+</strong> creators
                </span>
              </motion.div>
            </motion.div>

            {/* Right: Hero Visual — Playful Illustration + Floating Cards */}
            <motion.div
              style={{ scale: heroScale }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springGentle, delay: 0.15 }}
              className="w-full lg:w-[45%] max-w-[460px] mx-auto lg:max-w-none relative h-[380px] md:h-[460px] flex items-center justify-center"
            >
              {/* Decorative rotated background shapes */}
              <motion.div
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[8%] rounded-[3rem] bg-veil-secondary"
              />
              <motion.div
                animate={{ rotate: [0, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[4%] rounded-[3rem] bg-white border border-black/5 shadow-card"
              />

              {/* Illustration / Slideshow Wrapper */}
              <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="relative z-10 w-full h-full flex items-center justify-center p-8 md:p-12 overflow-hidden rounded-[3rem]"
              >
                <AnimatePresence>
                  {HERO_IMAGES.map((src, idx) => (
                    idx === slideIndex && (
                      <motion.img
                        key={idx}
                        src={src}
                        alt={`Creator visual ${idx + 1}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover drop-shadow-xl"
                        style={{ borderRadius: "inherit" }}
                      />
                    )
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Floating tip notification */}
              <motion.div
                animate={{ y: [0, -14, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute z-20 top-12 -left-4 md:-left-8 bg-white border border-black/10 pr-5 pl-2 py-2 rounded-full flex items-center gap-3 shadow-lg"
              >
                <img
                  src={AVATAR_FAN_TIP}
                  alt="Fan"
                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <span className="font-bold text-veil-text text-sm whitespace-nowrap">
                  Someone tipped $5!
                </span>
              </motion.div>

              {/* Floating privacy badge */}
              <motion.div
                animate={{ y: [0, 10, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute z-20 bottom-24 -right-3 md:-right-6 bg-veil-umbra text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-lg"
              >
                <div className="bg-white/20 p-1.5 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">100% Private</span>
              </motion.div>

              {/* Floating Arcium badge */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute z-20 top-1/3 -right-2 md:-right-4 bg-white/90 backdrop-blur-md border border-veil-arcium/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg"
              >
                <div className="w-8 h-8 rounded-full bg-veil-arcium/15 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-veil-arcium" />
                </div>
                <div>
                  <p className="text-xs font-bold text-veil-text">Encrypted</p>
                  <p className="text-[10px] text-veil-muted">Balance Hidden</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            animate={{ y: [0, 6, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-veil-muted"
          >
            <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-veil-muted/30 flex justify-center pt-1.5">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1.5 rounded-full bg-veil-muted/50"
              />
            </div>
          </motion.div>
        </section>

        {/* POWERED BY UMBRA + ARCIUM */}
        <section className="relative w-full bg-white border-y border-black/5 py-12 overflow-hidden">
          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 text-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerStagger}
              className="flex flex-col items-center justify-center gap-4"
            >
              <motion.p variants={fadeUp} className="text-xs font-bold tracking-[0.2em] uppercase text-veil-muted-light">
                Built on battle-tested privacy infrastructure
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-8 mt-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-2">
                  <img src="https://app.umbra.cash/favicon.ico" alt="Umbra Protocol" className="w-5 h-5 rounded-full" />
                  <span className="font-bold text-veil-text text-sm">Umbra Protocol</span>
                </div>
                <span className="text-veil-muted-light/30 text-sm">•</span>
                <div className="flex items-center gap-2">
                  <img src="https://cdn.prod.website-files.com/67086aa28c40f80ff00c0a83/67086aa28c40f80ff00c0b12_Fav%20Icon.png" alt="Arcium" className="w-5 h-5" />
                  <span className="font-bold text-veil-text text-sm">Arcium Network</span>
                </div>
                <span className="text-veil-muted-light/30 text-sm">•</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                     <span className="text-white text-[10px] font-bold">S</span>
                  </div>
                  <span className="font-bold text-veil-text text-sm">Solana</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES — BENTO GRID */}
        <section id="features" className="relative w-full bg-veil-bg py-28 overflow-hidden">
          <BackgroundMesh />

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
              className="mb-16"
            >
              <motion.span variants={fadeUp} className="text-xs font-semibold tracking-[0.15em] uppercase text-veil-primary mb-4 block">
                Why Veil
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-veil-text tracking-tight max-w-2xl leading-[0.95]"
              >
                Everything you need,<br /> without the snooping.
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-veil-muted text-lg md:text-xl mt-6 max-w-[55ch] leading-relaxed"
              >
                Normal public payments expose your supporters to the entire internet. Veil
                magically protects everyone&apos;s privacy behind the scenes using zero-knowledge 
                stealth payments and MPC encryption.
              </motion.p>
            </motion.div>

            <div
              ref={featuresRef}
              className="grid grid-cols-1 md:grid-cols-6 gap-5"
            >
              {/* Feature 1 — Secret Supporters */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springGentle, delay: 0 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="md:col-span-3 md:row-span-2 bg-white rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm flex flex-col relative overflow-hidden group"
              >
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-veil-primary to-veil-primary-deep flex items-center justify-center shadow-md mb-6">
                    <EyeOff className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading text-2xl md:text-3xl font-black mb-3 text-veil-text tracking-tight">
                    Secret Supporters
                  </h3>
                  <p className="text-veil-muted leading-relaxed max-w-sm flex-1">
                    When someone tips you, we scramble the payment trail using stealth
                    addresses. Only you know who supported you.
                  </p>
                </div>
                <div className="relative z-10 mt-6 flex items-center gap-4 p-4 rounded-xl bg-veil-bg border border-black/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-veil-muted/20" />
                      <span className="text-[10px] text-veil-muted-light font-mono">→</span>
                      <div className="h-2 w-16 rounded-full bg-veil-primary/40" />
                    </div>
                    <p className="text-[11px] text-veil-muted-light mt-1">
                      Stealth Address: <span className="font-mono">umbra1...xyz</span>
                    </p>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-veil-primary/5 rounded-full blur-3xl group-hover:bg-veil-primary/10 transition-all duration-700" />
              </motion.div>

              {/* Feature 2 — Show Your Success */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springGentle, delay: 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="md:col-span-3 bg-veil-bg-alt rounded-[2rem] p-8 md:p-10 border border-black/5 flex flex-col relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <FileCheck2 className="w-6 h-6 text-veil-text" />
                </div>
                <h3 className="font-heading text-2xl font-black mb-3 text-veil-text tracking-tight">
                  Show Your Success
                </h3>
                <p className="text-veil-muted leading-relaxed flex-1">
                  Generate a cryptographic viewing key to prove your income for taxes or
                  sponsors — without revealing who your fans are.
                </p>
                <div className="mt-5 flex gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-veil-primary/30" />
                  <div className="h-1.5 flex-1 rounded-full bg-veil-primary/50" />
                  <div className="h-1.5 flex-1 rounded-full bg-veil-primary" />
                </div>
              </motion.div>

              {/* Feature 3 — Crypto to Cash */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springGentle, delay: 0.15 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="md:col-span-2 bg-veil-text text-white rounded-[2rem] p-8 md:p-10 flex flex-col relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-black mb-3 tracking-tight">
                  Crypto to Cash
                </h3>
                <p className="text-white/70 leading-relaxed flex-1 z-10">
                  Receive tips privately on Solana and automatically route them to your bank
                  account. No crypto expertise required.
                </p>
                <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay pointer-events-none" />
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-veil-primary/10 to-transparent pointer-events-none"
                />
              </motion.div>

              {/* Feature 4 — Lightning Fast */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springGentle, delay: 0.2 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="md:col-span-2 bg-white rounded-[2rem] p-8 md:p-10 border border-black/5 flex flex-col relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-xl bg-veil-secondary/50 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-veil-text" />
                </div>
                <h3 className="font-heading text-2xl font-black mb-3 text-veil-text tracking-tight">
                  Lightning Fast
                </h3>
                <p className="text-veil-muted leading-relaxed flex-1">
                  Built on Solana for sub-second confirmations and fractions of a penny in fees.
                  Your supporters won&apos;t even notice the transaction.
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-400"
                  />
                  <span className="text-xs text-veil-muted-light font-mono">&lt; 400ms finality</span>
                </div>
              </motion.div>

              {/* Feature 5 — Global & Private */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springGentle, delay: 0.25 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="md:col-span-2 bg-gradient-to-br from-veil-primary/5 to-veil-arcium/5 rounded-[2rem] p-8 md:p-10 border border-veil-primary/10 flex flex-col relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-veil-primary" />
                </div>
                <h3 className="font-heading text-2xl font-black mb-3 text-veil-text tracking-tight">
                  Global &amp; Private
                </h3>
                <p className="text-veil-muted leading-relaxed flex-1">
                  Accept support from anyone, anywhere. Your fans stay anonymous, your income
                  stays encrypted, and the whole world stays out of your business.
                </p>
                <div className="mt-5 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, rgba(99,102,241,${0.3 + i * 0.15}), rgba(168,85,247,${0.3 + i * 0.15}))`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springGentle, delay: 0.3 }}
                className="md:col-span-6 bg-veil-bg-alt rounded-[2rem] p-10 md:p-14 border border-black/5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  {[
                    { label: "Active Creators", value: 1200, suffix: "+" },
                    { label: "Transactions Private", value: 45000, suffix: "+" },
                    { label: "USDC Shielded", value: 280000, suffix: "+" },
                    { label: "Avg. Confirmation", value: 380, suffix: "ms" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="text-center"
                    >
                      <p className="font-heading text-3xl md:text-4xl font-black text-veil-text mb-2">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </p>
                      <p className="text-sm text-veil-muted font-medium">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="relative w-full bg-white border-y border-black/5 py-28 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerStagger}
              className="mb-16"
            >
              <motion.span variants={fadeUp} className="text-xs font-semibold tracking-[0.15em] uppercase text-veil-primary mb-4 block">
                How It Works
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="font-heading text-4xl md:text-5xl font-black text-veil-text tracking-tight"
              >
                As simple as 1, 2, 3
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-veil-muted text-lg mt-4 max-w-[40ch]"
              >
                We handle the complex privacy math so you don&apos;t have to.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-veil-primary/0 via-veil-primary/30 to-veil-primary/0 z-0" />

              {[
                {
                  step: "01",
                  title: "Fan Connects",
                  desc: "Your supporter securely connects their wallet and chooses a support tier.",
                  icon: <Users className="w-7 h-7" />,
                  avatar: AVATAR_FAN_STEP,
                },
                {
                  step: "02",
                  title: "Veil Shields It",
                  desc: "We route the tip through secure stealth addresses and advanced encryption.",
                  icon: <Lock className="w-7 h-7" />,
                  avatar: null,
                },
                {
                  step: "03",
                  title: "You Get Paid",
                  desc: "Funds land in your private encrypted balance. View, withdraw, or prove income.",
                  icon: <Sparkles className="w-7 h-7" />,
                  avatar: AVATAR_CREATOR_STEP,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...springGentle, delay: i * 0.15 }}
                  className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left group"
                >
                  <div className="relative w-20 h-20 rounded-[1.5rem] bg-white border border-black/5 shadow-sm flex items-center justify-center mb-6 text-veil-text hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="text-veil-primary">
                      {step.icon}
                    </div>
                    {step.avatar && (
                      <img
                        src={step.avatar}
                        alt=""
                        className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full object-cover border-3 border-white shadow-md"
                      />
                    )}
                  </div>
                  <span className="text-sm font-mono text-veil-primary font-bold mb-3">{step.step}</span>
                  <h4 className="font-heading font-black text-2xl mb-3 text-veil-text tracking-tight">{step.title}</h4>
                  <p className="text-veil-muted leading-relaxed max-w-[32ch]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="creators" className="relative w-full bg-veil-bg py-28 overflow-hidden">
          <BackgroundMesh />
          
          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerStagger}
              className="mb-16"
            >
              <motion.span variants={fadeUp} className="text-xs font-semibold tracking-[0.15em] uppercase text-veil-primary mb-4 block">
                Testimonials
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="font-heading text-4xl md:text-5xl font-black text-veil-text tracking-tight max-w-2xl"
              >
                Loved by creators choosing privacy.
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...springGentle, delay: i * 0.12 }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="bg-white rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm flex flex-col justify-between relative group"
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-veil-primary/10 flex items-center justify-center">
                    <span className="text-veil-primary text-lg font-serif leading-none">"</span>
                  </div>
                  <p className="text-veil-text leading-relaxed mb-8 flex-1">
                    {t.text}
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    />
                    <div>
                      <p className="font-black text-veil-text tracking-tight leading-tight">{t.name}</p>
                      <p className="text-sm text-veil-muted">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative w-full bg-white border-y border-black/5 py-28">
          <div className="max-w-[800px] mx-auto px-6 md:px-12">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerStagger}
              className="mb-14 text-center"
            >
              <motion.span variants={fadeUp} className="text-xs font-semibold tracking-[0.15em] uppercase text-veil-primary mb-4 block">
                FAQ
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="font-heading text-4xl md:text-5xl font-black text-veil-text tracking-tight"
              >
                Got questions?
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-veil-muted text-lg mt-4 max-w-[40ch] mx-auto"
              >
                Everything you need to know about Veil&apos;s privacy technology.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-veil-bg/50 rounded-[2rem] p-8 md:p-12"
            >
              {[
                {
                  q: "How does the privacy mechanism work?",
                  a: "Veil uses the Umbra Privacy SDK. When a patron supports you, the funds aren't sent directly to your wallet. Instead, they are sent to a mathematically unique 'stealth address' that only you have the private keys to unlock. This completely severs the public link between the sender and your main wallet.",
                },
                {
                  q: "What is an Encrypted Balance?",
                  a: "Before you claim your funds, they exist as individual UTXOs on the blockchain. Veil uses Arcium Multi-Party Computation (MPC) to securely tally these hidden amounts into a single 'Encrypted Balance' that only you can view in your dashboard.",
                },
                {
                  q: "What are Viewing Keys?",
                  a: "A Viewing Key is a cryptographic proof you can generate (e.g., for a specific month or year) that proves how much revenue you received. You can hand this key to an auditor or sponsor, allowing them to verify your aggregate income without revealing who sent it to you.",
                },
                {
                  q: "Do my fans need to know about crypto?",
                  a: "Not at all. Your supporters can connect any Solana wallet and send tips without understanding the underlying privacy tech. Veil handles all the stealth address generation and encryption invisibly.",
                },
                {
                  q: "What fees are involved?",
                  a: "Solana transaction fees are fractions of a penny. Veil adds no additional platform fees on top. The privacy layer is completely free to use — you only pay the negligible network cost.",
                },
              ].map((faq, i) => (
                <FaqItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative w-full py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-veil-text via-veil-text to-veil-primary/20" />
          <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay pointer-events-none" />

          {/* Floating avatar decorations */}
          <motion.img
            src={AVATAR_CREATOR_STEP}
            alt=""
            animate={{ y: [0, -15, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-16 left-[8%] w-14 h-14 rounded-full border-4 border-white/20 opacity-40 hidden md:block"
          />
          <motion.img
            src={AVATAR_FAN_STEP}
            alt=""
            animate={{ y: [0, 12, 0], rotate: [3, -3, 3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 right-[12%] w-12 h-12 rounded-full border-4 border-white/20 opacity-40 hidden md:block"
          />
          
          <motion.div
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, rgba(114,164,242,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(168,85,247,0.2) 0%, transparent 50%)",
              backgroundSize: "200% 200%",
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={containerStagger}
              className="flex flex-col items-center"
            >
              <motion.div
                variants={fadeUp}
                className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 border border-white/20"
              >
                <HeartHandshake className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="font-heading text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[0.95]"
              >
                Start building your <br />community safely.
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="text-white/70 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed"
              >
                Join thousands of creators getting supported on their own terms. Your free page 
                is just a few clicks away.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Link
                  href="/onboard"
                  className="group inline-flex items-center gap-3 bg-white text-veil-text px-10 py-5 rounded-full font-bold text-lg hover:bg-white/90 transition-all shadow-2xl shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5"
                >
                  Create Your Free Page
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-xs text-white/40 font-medium"
              >
                No crypto knowledge required. No hidden fees. No exposed fans.
              </motion.p>
            </motion.div>
          </div>
        </section>
      </main>

      <VeilFooter />
    </div>
  );
}
