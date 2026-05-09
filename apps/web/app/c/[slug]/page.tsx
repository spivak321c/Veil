"use client";

import { useEffect, useState, use } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { Heart, Share2, Image as ImageIcon, MessageSquareHeart, Lock, PartyPopper, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { CreatorPublic, TierPublic } from "@veil/db";
import { SendFlow } from "@/components/umbra/SendFlow";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } 
  },
} as const;

export default function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { connected } = useWalletConnection();
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorPublic | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isSending, setIsSending] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierPublic | null>(null);
  const [customAmount, setCustomAmount] = useState<number | "">("");

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/creators/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setCreator(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchCreator();
  }, [slug]);

  const handleSupport = (tier?: TierPublic) => {
    if (tier) {
      setSelectedTier(tier);
      setCustomAmount(tier.amountUsdc);
    } else {
      setSelectedTier(null);
    }
    setIsSending(true);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-veil-bg flex items-center justify-center font-body text-veil-muted text-[14px]">
        <div className="w-[24px] h-[24px] rounded-full border-2 border-veil-muted/20 border-t-veil-primary animate-spin mr-[12px]" />
        Resolving identity...
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-[100dvh] bg-veil-bg flex flex-col items-center justify-center text-veil-muted">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Heart className="w-8 h-8 opacity-50" />
        </div>
        <span className="font-body text-[16px]">Creator not found</span>
        <Link href="/explore" className="mt-6 text-veil-primary font-bold hover:underline">Back to Explore</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text antialiased selection:bg-veil-primary selection:text-white overflow-x-hidden">
      <VeilHeader />
      <div className="absolute top-20 left-0 w-full h-[300px] bg-gradient-to-r from-[#ffe4e6] to-[#f3e8ff] -z-10 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="blob-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="20" fill="#72a4f2" opacity="0.2" />
              <circle cx="10" cy="20" r="15" fill="#f4efe7" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blob-pattern)" />
        </svg>
      </div>
      <main className="flex-1 w-full pt-16 relative z-0">
        <div className="max-w-6xl mx-auto px-6 md:px-12 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 space-y-8">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white rounded-[32px] overflow-hidden shadow-card border border-black/5 relative"
              >
                <div className="h-40 w-full bg-gradient-to-tr from-[#ff9a9e] via-[#fecfef] to-[#a1c4fd]"></div>
                <div className="px-8 pb-8 relative">
                  <div className="absolute -top-16 left-8 w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-heading font-black text-4xl">
                        {creator.displayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 right-6">
                    <button className="w-10 h-10 rounded-full bg-veil-bg text-veil-muted hover:text-veil-primary hover:bg-veil-secondary flex items-center justify-center transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="">
                    <h1 className="font-heading text-3xl md:text-4xl font-black text-veil-text mb-2">{creator.displayName}</h1>
                    <p className="text-lg font-bold text-veil-primary mb-4">{creator.category} Creator 🎨</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-3 py-1 bg-veil-bg rounded-full text-sm font-bold text-veil-muted flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private Support
                      </span>
                      <span className="px-3 py-1 bg-veil-bg rounded-full text-sm font-bold text-veil-muted flex items-center gap-1">
                        <Heart className="w-3 h-3 text-veil-primary" /> {creator.stats.totalSupportEvents} Supporters
                      </span>
                    </div>
                    <div className="prose prose-lg text-veil-muted font-medium leading-relaxed max-w-none">
                      <p>{creator.bio}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
              >
                <h2 className="font-heading text-2xl font-black text-veil-text mb-6 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-veil-primary" /> Recent Work
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden group relative bg-veil-bg">
                      <img src="https://pquxfbbxflqvtidtlrhl.supabase.co/storage/v1/object/public/hmac-uploads/brand/d8377d16-bae1-4eb6-9fbc-5bcd192d86f4/assets/6c2befa4-979c-4ddc-89b3-1eb258b6af07.webp" alt="Artwork" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 p-4" />
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-heading text-2xl font-black text-veil-text flex items-center gap-2">
                    <MessageSquareHeart className="w-6 h-6 text-pink-500" /> Supporter Board
                  </h2>
                  <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Privacy Protected
                  </div>
                </div>
                <div className="space-y-6">
                  {[
                    { name: "Jessie M.", amount: 15, text: "Absolutely love the new procreate brush set! It's saved me so much time on my comic backgrounds. Keep up the amazing work Maya! ✨", img: "https://pquxfbbxflqvtidtlrhl.supabase.co/storage/v1/object/public/hmac-uploads/brand/d8377d16-bae1-4eb6-9fbc-5bcd192d86f4/assets/19889982-6a06-4417-b844-394927250641.webp", time: "2 hours ago" },
                    { name: "Anonymous", amount: 5, text: "Thanks for the free tutorials on YouTube! They are super helpful for beginners like me.", img: null, time: "1 day ago" },
                    { name: "David K.", amount: 25, text: "Here's to more amazing art! 🥂", img: "https://pquxfbbxflqvtidtlrhl.supabase.co/storage/v1/object/public/hmac-uploads/brand/d8377d16-bae1-4eb6-9fbc-5bcd192d86f4/assets/e7763cef-6327-4188-a47e-4d96a46820ac.webp", time: "3 days ago" },
                  ].map((msg, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-veil-bg transition-colors group">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-sm bg-veil-secondary flex items-center justify-center">
                        {msg.img ? <img src={msg.img} alt={msg.name} className="w-full h-full object-cover" /> : <span className="text-xl opacity-50">👻</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                          <span className="font-bold text-veil-text">{msg.name}</span>
                          <span className="text-veil-muted text-sm">supported</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-veil-primary/10 text-veil-primary rounded-full text-xs font-black">
                            <Heart className="w-3 h-3" /> ${msg.amount}
                          </span>
                          <span className="text-veil-muted/50 text-xs ml-auto">{msg.time}</span>
                        </div>
                        <p className="text-veil-text font-medium bg-white border border-black/5 p-3 rounded-xl rounded-tl-none shadow-sm mt-2">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 font-bold text-veil-primary hover:bg-veil-bg rounded-xl transition-colors">Load more messages</button>
              </motion.div>
            </div>
            <div className="lg:col-span-5">
              <div className="sticky top-28 space-y-6">
                <div className="bg-white rounded-[32px] p-8 shadow-card border border-black/5 border-t-4 border-t-veil-primary" style={{ animation: 'wiggle 4s ease-in-out infinite' }}>
                  <h2 className="font-heading text-2xl font-black text-veil-text mb-2">Support {creator.displayName}</h2>
                  <p className="text-veil-muted font-medium mb-6">Fund their next creative project securely & privately.</p>
                  <div className="mb-6">
<div className="grid grid-cols-4 gap-3">
                      {creator.tiers.map((tier, i) => (
                        <button 
                          key={tier.id}
                          onClick={() => router.push(`/c/${slug}/send?amount=${tier.amountUsdc / 1000000}`)}
                          className={`py-3 rounded-xl border-2 transition-all focus:outline-none font-bold ${
                            selectedTier?.id === tier.id 
                              ? "border-veil-primary bg-veil-primary/10 text-veil-primary shadow-sm scale-105" 
                              : "border-black/10 text-veil-text hover:border-veil-primary hover:bg-veil-primary/5"
                          }`}
                        >
                          ${tier.amountUsdc / 1000000}
                        </button>
                      ))}
                      <button 
                        onClick={() => router.push(`/c/${slug}/send`)}
                        className="py-3 rounded-xl border-2 border-black/10 text-veil-text font-bold hover:border-veil-primary hover:bg-veil-primary/5 transition-all flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-veil-text mb-2">Leave a message (optional)</label>
                    <textarea className="w-full bg-veil-bg border border-black/10 rounded-2xl p-4 font-medium text-veil-text placeholder:text-veil-muted/50 focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all resize-none" rows={3} placeholder="Say something nice..." />
                  </div>
                  <div className="mb-8 p-4 bg-veil-bg rounded-2xl border border-black/5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded border-2 border-veil-primary bg-veil-primary flex items-center justify-center text-white">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-veil-text">Make message public</p>
                        <p className="text-xs text-veil-muted mt-0.5">Your payment identity remains 100% private via Veil Mixer regardless of this setting.</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleSupport()} className="w-full pill-button-primary py-4 text-xl flex items-center justify-center gap-2 shadow-lg">Support with Solana</button>
                  <p className="text-center text-xs text-veil-muted font-bold mt-4 flex items-center justify-center gap-1 opacity-70">
                    <Lock className="w-3 h-3" /> Secured by Veil Zero-Knowledge Tech
                  </p>
                </div>
                <div className="bg-veil-secondary/30 rounded-[32px] p-6 border border-veil-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-veil-primary shadow-sm">
                      <PartyPopper className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-veil-text">Join the club</h3>
                      <p className="text-sm text-veil-muted font-medium">Support {creator.displayName} to unlock exclusive updates.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <VeilFooter />
      {isSending && (
        <SendFlow 
          creatorName={creator.displayName}
          recipientAddress={creator.walletAddress}
          amountMicroUsdc={Number(customAmount || 0)}
          onClose={() => setIsSending(false)}
        />
      )}
    </div>
  );
}
