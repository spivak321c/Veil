"use client";

import { useState, useEffect, useRef } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { RegisterFlow } from "@/components/umbra/RegisterFlow";
import { toast } from "sonner";
import { ShieldCheck, Check, Info, ArrowLeft, ArrowRight, Lock, Heart, ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import bs58 from "bs58";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const profileSchema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500),
  category: z.enum(["MUSIC", "ART", "WRITING", "DEVELOPMENT", "GAMING", "EDUCATION", "OTHER"]),
  tiers: z.array(z.object({
    name: z.string().min(1),
    amountUsdc: z.number().min(1),
  })).length(3),
});

type OnboardValues = z.infer<typeof profileSchema>;
type Step = "connect" | "authenticating" | "setup" | "umbra" | "done";

export default function OnboardPage() {
  const { connected, wallet } = useWalletConnection();
  const [step, setStep] = useState<Step>("connect");
  const [authError, setAuthError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const isAuthenticatingRef = useRef(false);
  const prevConnectedRef = useRef(connected);
  const hasAutoTriggeredRef = useRef(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<OnboardValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      category: "OTHER",
      tiers: [
        { name: "Coffee", amountUsdc: 5 },
        { name: "Lunch", amountUsdc: 15 },
        { name: "Sponsor", amountUsdc: 50 },
      ]
    }
  });

  const watchValues = watch();

  useEffect(() => {
    const justConnected = connected && !prevConnectedRef.current;
    const justDisconnected = !connected && prevConnectedRef.current;
    prevConnectedRef.current = connected;

    if (justDisconnected) {
      hasAutoTriggeredRef.current = false;
      if (step !== "connect") setStep("connect");
      return;
    }

    if (justConnected && wallet && step === "connect" && !hasAutoTriggeredRef.current) {
      hasAutoTriggeredRef.current = true;
      const timer = setTimeout(() => {
        if (!connected || !wallet) {
          isAuthenticatingRef.current = false;
          return;
        }
        authenticate();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [connected, wallet, step]);

  async function authenticate() {
    if (isAuthenticatingRef.current) return;
    if (!wallet) {
      toast.error("Wallet not connected. Please connect your wallet first.");
      setAuthError("Wallet not connected");
      return;
    }

    isAuthenticatingRef.current = true;
    setStep("authenticating");
    setAuthError(null);

    try {
      const walletAddress = wallet.account.address;
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      if (!nonceRes.ok) throw new Error("Failed to get auth nonce");
      const { nonce, expiresAt } = await nonceRes.json().then((r) => r.data ?? r);

      const message = `Sign in to Veil\n\nNonce: ${nonce}\nExpires: ${expiresAt}`;
      const encodedMessage = new TextEncoder().encode(message);

      let signature: Uint8Array | null = null;

      try {
        if (wallet.signMessage) {
          signature = await wallet.signMessage(encodedMessage);
        }
      } catch (e: unknown) {
        console.warn("[authenticate] wallet.signMessage failed:", e);
        signature = null;
      }

      if (!signature) {
        try {
          const phantomWallet = (window as any).phantom?.solana;
          if (phantomWallet?.signMessage) {
            const result = await phantomWallet.signMessage(encodedMessage, "utf8");
            signature = result.signature;
          }
        } catch (e: unknown) {
          console.warn("[authenticate] phantom.solana.signMessage failed:", e);
          signature = null;
        }
      }

      if (!signature || signature.length === 0) {
        throw new Error("Wallet signing failed. Please ensure your wallet is unlocked and supports message signing.");
      }

      const signatureBase58 = bs58.encode(signature);
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature: signatureBase58, nonce }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.error || "Authentication failed");
      }

      setStep("setup");
      toast.success("Authenticated successfully!");
    } catch (err: any) {
      console.error("Authentication error:", err);
      const msg = (err?.message || "").toLowerCase();
      const wasUserRejected =
        msg.includes("rejected") || msg.includes("cancel") || msg.includes("dismiss") || msg.includes("user denied") || msg.includes("user cancelled");

      if (wasUserRejected) {
        toast.error("Signature request was denied. Please approve the request in your wallet and try again.");
      } else if (!err?.message || msg.includes("not ready") || msg.includes("timeout") || msg.includes("failed")) {
        toast.error("Wallet not ready yet. Please unlock it, wait a moment, and try again.");
      } else {
        toast.error(`Authentication failed: ${err.message || "Unknown error"}`);
      }
      setAuthError(err?.message || "Authentication failed");
    } finally {
      isAuthenticatingRef.current = false;
    }
  }

  const handleSetupSubmit = async (data: OnboardValues) => {
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: data.displayName,
          slug: data.slug,
          bio: data.bio,
          category: data.category,
          tiers: []
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create profile");
      }

      setSlug(data.slug);

      const tiersPayload = data.tiers.map((t, i) => ({
        name: t.name,
        amountUsdc: Math.floor(t.amountUsdc * 1_000_000),
        description: "",
        sortOrder: i
      }));

      const tiersRes = await fetch(`/api/creators/${data.slug}/tiers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers: tiersPayload })
      });

      if (!tiersRes.ok) throw new Error("Failed to save tiers");

      setStep("umbra");
      toast.success("Profile and tiers saved!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUmbraComplete = async () => {
    console.log("[onboard] Handle Umbra complete called");
    try {
      await fetch(`/api/creators/${slug}/umbra-registered`, { method: "POST" });
      console.log("[onboard] Umbra registration status updated in database");
      setStep("done");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
      console.error("[onboard] Failed to update registration status:", err);
      toast.error("Failed to update registration status");
    }
  };

  return (
    <div className="min-h-[100dvh] relative flex flex-col bg-veil-bg text-veil-text antialiased selection:bg-veil-primary selection:text-white overflow-x-hidden">
      <VeilHeader />

      {/* Abstract Background Blur */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-veil-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <main className="flex-1 w-full pt-28 pb-20 relative z-0">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

          {step !== "connect" && step !== "done" && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mx-auto lg:max-w-none mb-10"
            >
              <div className="flex items-center justify-between text-sm font-bold text-veil-muted mb-4 px-2">
                <span className="uppercase tracking-widest">{step === "setup" ? "Step 01 / Profile" : "Step 02 / Shielding"}</span>
                <span className="text-veil-text flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Almost done
                </span>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-veil-text rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: step === "setup" ? "50%" : "100%" }}
                />
              </div>
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            <div className="w-full lg:w-[55%] flex flex-col gap-8">
              <AnimatePresence mode="wait">
                {step === "connect" && (
                  <motion.div 
                    key="connect"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="bg-white rounded-[2.5rem] p-12 md:p-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-24 h-24 rounded-[1.5rem] bg-veil-bg flex items-center justify-center mb-8 shadow-sm">
                      <ShieldCheck className="w-10 h-10 text-veil-primary" />
                    </div>
                    <h1 className="font-heading text-4xl md:text-5xl font-black mb-4 tracking-tighter">Connect Wallet</h1>
                    <p className="text-veil-muted font-medium mb-10 max-w-[40ch] leading-relaxed">Connect your Solana wallet to begin setting up your private creator page.</p>

                    {authError && (
                      <div className="mb-8 w-full max-w-sm p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm text-left">
                        <p className="font-bold mb-1 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Connection failed
                        </p>
                        <p className="text-xs opacity-80">{authError}</p>
                      </div>
                    )}

                    <ConnectButton />
                  </motion.div>
                )}

                {step === "authenticating" && (
                  <motion.div 
                    key="authenticating"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="bg-white rounded-[2.5rem] p-12 md:p-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col items-center justify-center text-center"
                  >
                    {!authError ? (
                      <>
                        <div className="w-24 h-24 rounded-[1.5rem] bg-veil-bg flex items-center justify-center mb-8 shadow-sm relative overflow-hidden">
                          <div className="absolute inset-0 bg-veil-primary/10 animate-pulse" />
                          <div className="w-10 h-10 border-4 border-veil-primary border-t-transparent rounded-full animate-spin z-10" />
                        </div>
                        <h1 className="font-heading text-4xl md:text-5xl font-black mb-4 tracking-tighter">Verifying Wallet</h1>
                        <p className="text-veil-muted font-medium mb-10 max-w-[40ch] leading-relaxed">Please sign the verification request in your wallet to secure your account.</p>
                        <button
                          onClick={() => {
                            hasAutoTriggeredRef.current = false;
                            authenticate();
                          }}
                          className="text-sm font-bold text-veil-muted hover:text-veil-text transition-colors underline decoration-black/20 underline-offset-4"
                        >
                          Didn&apos;t see the wallet popup? Click to retry.
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-[1.5rem] bg-red-50 flex items-center justify-center mb-8 shadow-sm">
                          <ShieldCheck className="w-10 h-10 text-red-500 opacity-50" />
                        </div>
                        <h1 className="font-heading text-4xl md:text-5xl font-black mb-4 tracking-tighter">Verification Failed</h1>
                        <p className="text-veil-muted font-medium mb-10 max-w-[40ch] leading-relaxed">{authError}</p>
                        <button
                          onClick={() => {
                            hasAutoTriggeredRef.current = false;
                            authenticate();
                          }}
                          className="px-8 py-4 text-base flex items-center gap-2 bg-veil-text text-white rounded-full font-bold hover:bg-black transition-colors shadow-lg"
                        >
                          Try Again <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {step === "setup" && (
                  <motion.div 
                    key="setup"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 relative overflow-hidden"
                  >
                    <h1 className="font-heading text-4xl md:text-5xl font-black text-veil-text mb-4 tracking-tighter">Make it yours</h1>
                    <p className="text-veil-muted font-medium mb-12 text-lg">Personalize your page. This is what your fans will see when they come to support you.</p>

                    <form onSubmit={handleSubmit(handleSetupSubmit)} className="space-y-8">
                      <div className="mb-10">
                        <label className="block text-sm font-bold text-veil-text mb-4">Profile Picture</label>
                        <div className="flex items-center gap-6">
                          <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-veil-bg border-4 border-white shadow-sm overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                              <div className="w-full h-full flex items-center justify-center text-veil-text font-heading font-black text-4xl">
                                {watchValues.displayName?.[0] || "V"}
                              </div>
                            </div>
                          </div>
                          <div>
                            <button type="button" className="px-5 py-2.5 bg-white hover:bg-veil-bg border border-black/10 text-veil-text font-bold rounded-full text-sm transition-colors mb-2 shadow-sm">
                              Upload new picture
                            </button>
                            <p className="text-xs font-semibold text-veil-muted">Recommended: 400x400px</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-veil-text mb-2" htmlFor="displayName">Display Name</label>
                          <input
                            {...register("displayName")}
                            id="displayName"
                            className="w-full bg-veil-bg border border-transparent rounded-[1.25rem] py-4 px-5 font-medium text-veil-text placeholder:text-veil-muted/50 focus:outline-none focus:ring-2 focus:ring-veil-text focus:bg-white transition-all"
                            placeholder="Your creator name"
                          />
                          {errors.displayName && <p className="text-xs font-bold text-red-500 mt-2">{errors.displayName.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-veil-text mb-2" htmlFor="slug">Page URL</label>
                          <div className="flex items-center bg-veil-bg border border-transparent rounded-[1.25rem] px-5 py-4 focus-within:ring-2 focus-within:ring-veil-text focus-within:bg-white transition-all">
                            <span className="text-veil-muted font-bold text-sm mr-2 shrink-0">veil.to/</span>
                            <input
                              {...register("slug")}
                              id="slug"
                              className="bg-transparent flex-1 font-medium text-veil-text placeholder:text-veil-muted/50 focus:outline-none"
                              placeholder="your-name"
                            />
                          </div>
                          {errors.slug && <p className="text-xs font-bold text-red-500 mt-2">{errors.slug.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-veil-text mb-2" htmlFor="category">Category</label>
                          <select
                            {...register("category")}
                            id="category"
                            className="w-full bg-veil-bg border border-transparent rounded-[1.25rem] py-4 px-5 font-bold text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-text focus:bg-white transition-all appearance-none cursor-pointer"
                          >
                            <option value="MUSIC">Music</option>
                            <option value="ART">Art</option>
                            <option value="WRITING">Writing</option>
                            <option value="DEVELOPMENT">Development</option>
                            <option value="GAMING">Gaming</option>
                            <option value="EDUCATION">Education</option>
                            <option value="OTHER">Other</option>
                          </select>
                          {errors.category && <p className="text-xs font-bold text-red-500 mt-2">{errors.category.message}</p>}
                        </div>
                      </div>

                      <div className="mb-10">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-bold text-veil-text" htmlFor="bio">About You</label>
                          <span className="text-xs text-veil-muted font-bold">{watchValues.bio?.length || 0}/500</span>
                        </div>
                        <textarea
                          {...register("bio")}
                          id="bio"
                          rows={4}
                          className="w-full bg-veil-bg border border-transparent rounded-[1.25rem] p-5 font-medium text-veil-text placeholder:text-veil-muted/50 focus:outline-none focus:ring-2 focus:ring-veil-text focus:bg-white transition-all resize-none leading-relaxed"
                          placeholder="e.g., I create digital art and write about fantasy worlds..."
                        />
                        {errors.bio && <p className="text-xs font-bold text-red-500 mt-2">{errors.bio.message}</p>}
                      </div>

                      <div className="pt-4 border-t border-black/5">
                        <div className="flex items-center gap-2 mb-6">
                          <h3 className="font-heading text-xl font-black text-veil-text">Set your tip amounts</h3>
                          <div className="relative group flex items-center justify-center cursor-help">
                            <Info className="w-4 h-4 text-veil-muted hover:text-veil-text transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-veil-text text-white text-xs font-medium p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-20 text-center">
                              Give fans easy options to support you.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-veil-text"></div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {watchValues.tiers.map((_, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-xs font-bold text-veil-muted mb-2 pl-1 uppercase tracking-wider">Option {i + 1} Name</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-veil-muted">
                                    <Heart className="w-4 h-4" />
                                  </div>
                                  <input
                                    {...register(`tiers.${i}.name` as any)}
                                    className="w-full bg-veil-bg border border-transparent rounded-[1.25rem] py-4 pl-12 pr-4 text-sm font-bold text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-text focus:bg-white transition-all"
                                  />
                                </div>
                              </div>
                              <div className="w-32">
                                <label className="block text-xs font-bold text-veil-muted mb-2 pl-1 uppercase tracking-wider">Amount</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none font-bold text-veil-muted">$</div>
                                  <input
                                    type="number"
                                    {...register(`tiers.${i}.amountUsdc` as any, { valueAsNumber: true })}
                                    className="w-full bg-veil-bg border border-transparent rounded-[1.25rem] py-4 pl-8 pr-4 text-sm font-bold text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-text focus:bg-white transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-12 gap-4">
                        <Link href="/" className="px-6 py-4 font-bold text-veil-muted hover:text-veil-text transition-colors flex items-center gap-2">
                          <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                        <button type="submit" className="w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-2 bg-veil-text text-white rounded-full font-bold hover:bg-black transition-all shadow-lg active:scale-95">
                          Complete Setup <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {step === "umbra" && (
                  <motion.div 
                    key="umbra"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="bg-white rounded-[2.5rem] p-12 md:p-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
                  >
                    <div className="text-center mb-12">
                      <div className="w-16 h-16 rounded-full bg-veil-bg flex items-center justify-center text-veil-text mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h1 className="font-heading text-4xl font-black text-veil-text mb-4 tracking-tighter">Activate Privacy Shield</h1>
                      <p className="text-veil-muted font-medium text-lg leading-relaxed max-w-md mx-auto">We&apos;re registering your wallet with the Veil Network to enable fully anonymous patronage.</p>
                    </div>
                    <RegisterFlow onComplete={handleUmbraComplete} />
                  </motion.div>
                )}

                {step === "done" && (
                  <motion.div 
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="bg-white rounded-[2.5rem] p-12 md:p-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-8 shadow-sm">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="font-heading text-4xl md:text-5xl font-black text-veil-text mb-4 tracking-tighter">You&apos;re all set!</h1>
                    <p className="text-veil-muted font-medium text-lg mb-8 leading-relaxed max-w-sm">Your private creator page is now live. Redirecting you to your dashboard...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Preview Panel (Only on Setup step) */}
            {step === "setup" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                className="w-full lg:w-[45%] lg:mt-0 mt-8"
              >
                <div className="sticky top-28">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="font-heading font-black text-xl text-veil-text flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-veil-primary" /> Live Preview
                    </h3>
                    <span className="text-xs font-bold bg-white px-3 py-1.5 rounded-full text-veil-text border border-black/5 shadow-sm animate-pulse">
                      Updates as you type
                    </span>
                  </div>

                  <div className="bg-white rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-black/5 overflow-hidden group">
                    <div className="h-32 bg-veil-bg w-full relative overflow-hidden border-b border-black/5">
                      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/noise.png')] mix-blend-overlay" />
                    </div>

                    <div className="px-8 pb-8 relative">
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-white -mt-12 mb-6 relative z-10 overflow-hidden shadow-sm flex items-center justify-center">
                        <div className="w-full h-full bg-veil-bg flex items-center justify-center text-veil-text font-heading font-black text-3xl">
                          {watchValues.displayName?.[0] || "V"}
                        </div>
                      </div>

                      <h2 className="font-heading text-2xl font-black text-veil-text mb-1 tracking-tight">{watchValues.displayName || "Your Name"}</h2>
                      <p className="text-sm font-bold text-veil-primary mb-4">veil.to/{watchValues.slug || "your-slug"}</p>
                      <p className="text-veil-muted text-sm leading-relaxed font-medium mb-8 min-h-[60px]">
                        {watchValues.bio || "Your bio will appear here..."}
                      </p>

                      <div className="bg-white border border-black/5 rounded-[1.5rem] p-6 shadow-sm">
                        <h4 className="font-heading font-black text-lg text-veil-text mb-4 tracking-tight">Support Privately</h4>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {watchValues.tiers.map((tier, i) => (
                            <div key={i} className="flex flex-col items-center justify-center py-4 bg-veil-bg rounded-xl border border-transparent">
                              <span className="text-xs font-bold text-veil-muted mb-1 truncate px-2 w-full text-center">{tier.name || `Option ${i+1}`}</span>
                              <span className="text-base font-black text-veil-text">${tier.amountUsdc || 0}</span>
                            </div>
                          ))}
                        </div>

                        <div className="relative mb-6">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none font-bold text-veil-muted">$</div>
                          <input type="text" className="w-full bg-veil-bg rounded-xl py-4 pl-8 pr-4 text-sm font-bold text-veil-text" placeholder="Custom amount" readOnly />
                        </div>

                        <button className="w-full bg-veil-text text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" /> Send Tip Privately
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <VeilFooter />
    </div>
  );
}
