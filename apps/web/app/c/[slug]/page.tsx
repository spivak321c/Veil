"use client";

import { useEffect, useState, use } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { Heart, Share2, Image as ImageIcon, MessageSquareHeart, Lock, PartyPopper, Pencil, User, Check, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { CreatorPublic, TierPublic } from "@veil/db";
import { SendFlow } from "@/components/umbra/SendFlow";
import Link from "next/link";
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
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: springTransition 
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
  const [message, setMessage] = useState("");
  const [isMessagePublic, setIsMessagePublic] = useState(true);

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/creators/${slug}?include=publicEvents`);
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
      <div className="min-h-[100dvh] bg-veil-bg flex items-center justify-center font-body text-veil-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-veil-muted/20 border-t-veil-primary animate-spin" />
          <span className="text-sm font-semibold tracking-tight">Resolving identity...</span>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-[100dvh] bg-veil-bg flex flex-col items-center justify-center text-veil-muted font-body">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-black/5">
          <Heart className="w-8 h-8 opacity-20" />
        </div>
        <span className="text-lg font-bold text-veil-text tracking-tight mb-2">Creator not found</span>
        <p className="text-sm text-veil-muted mb-6">The profile you are looking for does not exist.</p>
        <Link href="/explore" className="px-6 py-3 bg-white border border-black/10 rounded-full text-veil-text font-bold hover:border-veil-primary hover:text-veil-primary transition-all shadow-sm">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text antialiased selection:bg-veil-primary selection:text-white overflow-x-hidden">
      <VeilHeader />
      
      {/* Abstract Background Blur */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-veil-primary/5 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-white rounded-[100%] blur-[80px] -z-10 pointer-events-none opacity-60" />

      <main className="flex-1 w-full pt-28 relative z-0">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN - Profile Info */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Profile Header Card */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 relative"
              >
                {/* Cover Banner (Subtle Gradient instead of loud colors) */}
                <div className="h-48 w-full bg-gradient-to-br from-slate-100 via-veil-secondary/30 to-slate-50 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/noise.png')] mix-blend-overlay pointer-events-none" />
                </div>
                
                <div className="px-10 pb-10 relative">
                  <div className="absolute -top-16 left-10 w-32 h-32 rounded-full border-4 border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] bg-white overflow-hidden z-10">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-veil-bg flex items-center justify-center text-veil-text font-heading font-black text-5xl">
                        {creator.displayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-veil-bg/50 border border-black/5 text-veil-text hover:text-veil-primary hover:bg-white flex items-center justify-center transition-all shadow-sm">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-20">
                    <h1 className="font-heading text-4xl md:text-5xl font-black text-veil-text mb-2 tracking-tighter">
                      {creator.displayName}
                    </h1>
                    <div className="flex items-center gap-2 mb-6">
                      <p className="text-base font-bold text-veil-primary uppercase tracking-wider">{creator.category}</p>
                      <span className="w-1 h-1 rounded-full bg-black/10" />
                      <p className="text-sm font-semibold text-veil-muted">Creator</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-8">
                      <span className="px-4 py-1.5 bg-veil-bg border border-black/5 rounded-full text-xs font-bold text-veil-text flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Private Support
                      </span>
                      <span className="px-4 py-1.5 bg-veil-bg border border-black/5 rounded-full text-xs font-bold text-veil-text flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-veil-primary" /> {creator.stats.totalSupportEvents} Supporters
                      </span>
                    </div>
                    
                    <div className="text-veil-muted text-lg font-medium leading-relaxed max-w-[65ch]">
                      <p>{creator.bio}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Recent Work / Portfolio */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-veil-bg flex items-center justify-center text-veil-text">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <h2 className="font-heading text-2xl font-black text-veil-text tracking-tight">
                    Recent Work
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg",
                    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/e534354d-c5f2-4399-a1d9-2f50338e8c47_1600w.jpg",
                    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/d14dc069-558a-4c51-8aad-5cc237f9b61d_1600w.jpg"
                  ].map((src, i) => (
                    <motion.div key={i} variants={fadeInUp} className="aspect-square rounded-[1.5rem] overflow-hidden group relative bg-veil-bg border border-black/5 shadow-sm">
                      <img src={src} alt="Artwork" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Supporter Board */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-veil-primary/10 flex items-center justify-center text-veil-primary">
                      <MessageSquareHeart className="w-5 h-5" />
                    </div>
                    <h2 className="font-heading text-2xl font-black text-veil-text tracking-tight">
                      Supporter Board
                    </h2>
                  </div>
                  <div className="px-4 py-1.5 bg-veil-bg rounded-full text-xs font-bold border border-black/5 flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Privacy Protected
                  </div>
                </div>

                <div className="space-y-4">
                  {(creator.recentPublicEvents ?? []).length === 0 ? (
                    <p className="text-veil-muted text-sm font-medium text-center py-8">
                      No public supporter messages yet. Be the first to leave a message!
                    </p>
                  ) : (creator.recentPublicEvents ?? []).map((event, i) => (
                    <motion.div key={event.id} variants={fadeInUp} className="flex gap-4 p-5 rounded-[1.5rem] hover:bg-veil-bg transition-colors border border-transparent hover:border-black/5 group">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-veil-secondary flex items-center justify-center mt-1">
                        <User className="w-5 h-5 text-veil-muted" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                          <span className="font-bold text-veil-text text-sm">Anonymous Supporter</span>
                          <span className="text-veil-muted text-sm">supported</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-veil-primary/10 text-veil-primary rounded-full text-xs font-black">
                            <Heart className="w-3 h-3 fill-current" /> ${(event.amountUsdc / 1000000).toFixed(2)}
                          </span>
                          <span className="text-veil-muted text-xs ml-auto">{new Date(event.createdAt).toLocaleDateString()}</span>
                        </div>
                        {event.message && (
                          <p className="text-veil-muted font-medium text-base leading-relaxed">{event.message}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN - Support Widget (Sticky) */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 space-y-6">
                
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="bg-white rounded-[2.5rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-black/5 border-t-4 border-t-veil-text"
                >
                  <h2 className="font-heading text-2xl font-black text-veil-text mb-2 tracking-tight">Support {creator.displayName}</h2>
                  <p className="text-veil-muted font-medium text-sm mb-8">Fund their next creative project securely & privately.</p>
                  
                  <div className="mb-8">
                    <div className="grid grid-cols-4 gap-3">
                      {creator.tiers.map((tier, i) => (
                        <button 
                          key={tier.id}
                          onClick={() => router.push(`/c/${slug}/send?amount=${tier.amountUsdc / 1000000}`)}
                          className={`py-4 rounded-2xl border-2 transition-all focus:outline-none font-black text-lg flex items-center justify-center ${
                            selectedTier?.id === tier.id 
                              ? "border-veil-text bg-veil-text text-white shadow-md scale-[1.02]" 
                              : "border-black/5 text-veil-text hover:border-black/20 hover:bg-veil-bg bg-white"
                          }`}
                        >
                          ${tier.amountUsdc / 1000000}
                        </button>
                      ))}
                      <button 
                        onClick={() => router.push(`/c/${slug}/send`)}
                        className="py-4 rounded-2xl border-2 border-black/5 text-veil-text font-black hover:border-black/20 hover:bg-veil-bg bg-white transition-all flex items-center justify-center"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-veil-text mb-3">Leave a message (optional)</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-veil-bg border-none rounded-2xl p-5 font-medium text-veil-text placeholder:text-veil-muted focus:outline-none focus:ring-2 focus:ring-veil-text focus:bg-white transition-all resize-none shadow-inner" 
                      rows={3} 
                      placeholder="Say something nice..." 
                    />
                  </div>

                  <div className="mb-8">
                    <button 
                      onClick={() => setIsMessagePublic(!isMessagePublic)}
                      className="w-full flex items-start gap-4 p-4 rounded-2xl border border-black/5 hover:bg-veil-bg transition-colors text-left"
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isMessagePublic ? 'border-veil-text bg-veil-text text-white' : 'border-black/20 bg-transparent'}`}>
                        {isMessagePublic && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-veil-text">Make message public</p>
                        <p className="text-xs text-veil-muted mt-1 leading-relaxed">Your payment identity remains 100% private via Veil Mixer regardless of this setting.</p>
                      </div>
                    </button>
                  </div>

                  <button 
                    onClick={() => handleSupport()} 
                    className="w-full bg-veil-text text-white py-5 rounded-full font-black text-lg hover:bg-black active:scale-[0.98] transition-all shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2"
                  >
                    Support with Solana
                  </button>
                  
                  <div className="mt-6 flex items-center justify-center gap-1.5 opacity-60">
                    <Lock className="w-3.5 h-3.5 text-veil-muted" />
                    <p className="text-center text-xs text-veil-muted font-bold uppercase tracking-wider">
                      Secured by Veil Zero-Knowledge Tech
                    </p>
                  </div>
                </motion.div>

                {/* Additional Widget */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: 0.4 }}
                  className="bg-white rounded-[2.5rem] p-6 border border-black/5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-veil-bg flex items-center justify-center text-veil-text">
                      <PartyPopper className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-veil-text tracking-tight">Join the club</h3>
                      <p className="text-sm text-veil-muted font-medium mt-0.5">Support {creator.displayName} to unlock exclusive updates.</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
            
          </div>
        </div>
      </main>
      <VeilFooter />
      
      <AnimatePresence>
        {isSending && (
          <SendFlow 
            creatorSlug={slug}
            creatorName={creator.displayName}
            recipientAddress={creator.walletAddress}
            amountMicroUsdc={Number(customAmount || 0)}
            message={message || undefined}
            isMessagePublic={isMessagePublic}
            onClose={() => setIsSending(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
