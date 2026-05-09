"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWalletConnection } from "@solana/react-hooks";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { RegisterFlow } from "@/components/umbra/RegisterFlow";
import { toast } from "sonner";
import { ShieldCheck, Check, Info, ArrowLeft, ArrowRight, Lock, Heart, ImageIcon } from "lucide-react";
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
  const router = useRouter();
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
          setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err) {
          console.error("[onboard] Failed to update registration status:", err);
          toast.error("Failed to update registration status");
        }
      };

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text antialiased selection:bg-veil-primary selection:text-white overflow-x-hidden">
      <VeilHeader />

      <main className="flex-1 w-full pt-16 pb-20 relative z-0">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">

          {step !== "connect" && step !== "done" && (
            <div className="w-full max-w-2xl mx-auto lg:max-w-none mb-10">
              <div className="flex items-center justify-between text-sm font-bold text-veil-muted mb-3 px-1">
                <span>{step === "setup" ? "Step 1 of 2: Profile Setup" : "Step 2 of 2: Privacy Shielding"}</span>
                <span className="text-veil-primary flex items-center gap-1">
                  <span className="text-xs">✨</span> Almost done!
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner border border-black/5">
                <div
                  className="h-full bg-veil-primary rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: step === "setup" ? "50%" : "100%" }}
                >
                  <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 animate-[translateX_2s_infinite]"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

            <div className="w-full lg:w-[55%] flex flex-col gap-8">

              {step === "connect" && (
                <div className="bg-white rounded-[32px] p-12 shadow-card border border-black/5 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-veil-bg flex items-center justify-center mb-8">
                    <ShieldCheck className="w-12 h-12 text-veil-primary" />
                  </div>
                  <h1 className="font-heading text-4xl font-black mb-4">Connect Wallet</h1>
                  <p className="text-veil-muted mb-10 max-w-sm">Connect your Solana wallet to begin setting up your private creator page.</p>

                  {authError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-sm">
                      <p className="font-medium mb-1">Connection failed</p>
                      <p className="text-xs opacity-80">{authError}</p>
                      <p className="text-xs mt-2 font-medium">Please try connecting again.</p>
                    </div>
                  )}

                  <ConnectButton />
                </div>
              )}

              {step === "authenticating" && (
                <div className="bg-white rounded-[32px] p-12 shadow-card border border-black/5 flex flex-col items-center justify-center text-center">
                  {!authError ? (
                    <>
                      <div className="w-24 h-24 rounded-full bg-veil-bg flex items-center justify-center mb-8">
                        <div className="w-12 h-12 border-4 border-veil-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <h1 className="font-heading text-4xl font-black mb-4">Verifying Wallet</h1>
                      <p className="text-veil-muted mb-10 max-w-sm">Please sign the verification request in your wallet to secure your account.</p>
                      <button
                        onClick={() => {
                          hasAutoTriggeredRef.current = false;
                          authenticate();
                        }}
                        className="text-sm text-veil-muted hover:text-veil-primary font-medium transition-colors"
                      >
                        Didn&apos;t see the wallet popup? Click to retry.
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-8">
                        <div className="w-12 h-12 text-red-500">
                          <ShieldCheck className="w-12 h-12 opacity-50" />
                        </div>
                      </div>
                      <h1 className="font-heading text-4xl font-black mb-4">Verification Failed</h1>
                      <p className="text-veil-muted mb-6 max-w-sm">{authError}</p>
                      <button
                        onClick={() => {
                          hasAutoTriggeredRef.current = false;
                          authenticate();
                        }}
                        className="px-8 py-4 text-lg flex items-center gap-2 bg-veil-primary text-white rounded-2xl font-bold hover:opacity-90 transition-opacity"
                      >
                        Try Again <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {step === "setup" && (
                <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-card border border-black/5 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-veil-secondary/30 rounded-full blur-2xl pointer-events-none"></div>

                  <h1 className="font-heading text-3xl md:text-4xl font-black text-veil-text mb-2">Make it yours</h1>
                  <p className="text-veil-muted font-medium mb-10">Personalize your page. This is what your fans will see when they come to support you.</p>

                  <form onSubmit={handleSubmit(handleSetupSubmit)} className="space-y-8">
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-veil-text mb-4">Profile Picture</label>
                      <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer">
                          <div className="w-24 h-24 rounded-full bg-veil-secondary border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-heading font-black text-3xl">
                              {watchValues.displayName?.[0] || "V"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <button type="button" className="px-4 py-2 bg-veil-bg hover:bg-veil-secondary text-veil-text font-bold rounded-xl text-sm transition-colors border border-black/5 mb-2">
                            Upload new picture
                          </button>
                          <p className="text-xs font-medium text-veil-muted">Recommended: 400x400px</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-veil-text mb-2" htmlFor="displayName">Display Name</label>
                        <input
                          {...register("displayName")}
                          id="displayName"
                          className="w-full bg-veil-bg border border-black/10 rounded-2xl py-4 px-5 font-bold text-veil-text placeholder:text-veil-muted/50 focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all"
                          placeholder="Your creator name"
                        />
                        {errors.displayName && <p className="text-xs text-red-500 mt-1">{errors.displayName.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-veil-text mb-2" htmlFor="slug">Page URL</label>
                        <div className="flex items-center bg-veil-bg border border-black/10 rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-veil-primary/50 focus-within:bg-white transition-all">
                          <span className="text-veil-muted font-bold text-sm mr-2 shrink-0">veil.to/</span>
                          <input
                            {...register("slug")}
                            id="slug"
                            className="bg-transparent flex-1 font-bold text-veil-text placeholder:text-veil-muted/50 focus:outline-none"
                            placeholder="your-name"
                          />
                        </div>
                        {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-veil-text mb-2" htmlFor="category">Category</label>
                        <select
                          {...register("category")}
                          id="category"
                          className="w-full bg-veil-bg border border-black/10 rounded-2xl py-4 px-5 font-bold text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="MUSIC">Music</option>
                          <option value="ART">Art</option>
                          <option value="WRITING">Writing</option>
                          <option value="DEVELOPMENT">Development</option>
                          <option value="GAMING">Gaming</option>
                          <option value="EDUCATION">Education</option>
                          <option value="OTHER">Other</option>
                        </select>
                        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                      </div>
                    </div>

                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-veil-text" htmlFor="bio">About You</label>
                        <span className="text-xs text-veil-muted font-medium">{watchValues.bio?.length || 0}/500</span>
                      </div>
                      <textarea
                        {...register("bio")}
                        id="bio"
                        rows={4}
                        className="w-full bg-veil-bg border border-black/10 rounded-2xl p-4 font-medium text-veil-text placeholder:text-veil-muted/50 focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all resize-none"
                        placeholder="e.g., I create digital art and write about fantasy worlds..."
                      />
                      {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="font-heading text-xl font-black text-veil-text">Set your tip amounts</h3>
                        <div className="relative group flex items-center justify-center cursor-help">
                          <Info className="w-4 h-4 text-veil-muted hover:text-veil-primary transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-veil-text text-white text-xs font-medium p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-20">
                            Give fans easy options to support you.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-veil-text"></div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {watchValues.tiers.map((_, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-veil-muted mb-1 pl-1">Option {i + 1} Name</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-veil-muted">
                                  <Heart className="w-3 h-3" />
                                </div>
                                <input
                                  {...register(`tiers.${i}.name` as any)}
                                  className="w-full bg-veil-bg border border-black/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all"
                                />
                              </div>
                            </div>
                            <div className="w-32">
                              <label className="block text-xs font-bold text-veil-muted mb-1 pl-1">Amount</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none font-bold text-veil-muted">$</div>
                                <input
                                  type="number"
                                  {...register(`tiers.${i}.amountUsdc` as any, { valueAsNumber: true })}
                                  className="w-full bg-veil-bg border border-black/10 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-veil-text focus:outline-none focus:ring-2 focus:ring-veil-primary/50 focus:bg-white transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <Link href="/" className="px-6 py-3 font-bold text-veil-muted hover:text-veil-text transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Link>
                      <button type="submit" className="px-8 py-4 text-lg flex items-center gap-2 bg-veil-primary text-white rounded-2xl font-bold hover:opacity-90 transition-opacity">
                        Complete Setup <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === "umbra" && (
                <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-card border border-black/5">
                  <div className="text-center mb-10">
                    <h1 className="font-heading text-3xl font-black text-veil-text mb-4">Activate Privacy Shield</h1>
                    <p className="text-veil-muted font-medium">We&apos;re registering your wallet with the Umbra Mixer to enable anonymous patronage.</p>
                  </div>
                  <RegisterFlow onComplete={handleUmbraComplete} />
                </div>
              )}

              {step === "done" && (
                <div className="bg-white rounded-[32px] p-12 shadow-card border border-black/5 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-8">
                    <Check className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="font-heading text-4xl font-black text-veil-text mb-4">You&apos;re all set!</h1>
                  <p className="text-veil-muted font-medium text-lg mb-8">Your private creator page is now live. Redirecting you to your dashboard...</p>
                </div>
              )}
            </div>

            {step === "setup" && (
              <div className="w-full lg:w-[45%] lg:mt-0 mt-8">
                <div className="sticky top-28">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-heading font-black text-xl text-veil-text flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-veil-primary" /> Live Preview
                    </h3>
                    <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-veil-primary border border-veil-primary/20 shadow-sm animate-pulse">
                      Updates as you type
                    </span>
                  </div>

                  <div className="bg-white rounded-[32px] shadow-card border border-black/5 overflow-hidden transition-all duration-300 hover:shadow-card-hover group">
                    <div className="h-32 bg-veil-secondary w-full relative overflow-hidden">
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-xl"></div>
                    </div>

                    <div className="px-6 pb-6 relative">
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-veil-bg -mt-12 mb-4 relative z-10 overflow-hidden shadow-sm flex items-center justify-center">
                        <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-heading font-black text-3xl">
                          {watchValues.displayName?.[0] || "V"}
                        </div>
                      </div>

                      <h2 className="font-heading text-2xl font-black text-veil-text mb-1">{watchValues.displayName || "Your Name"}</h2>
                      <p className="text-sm font-bold text-veil-primary mb-3">veil.to/{watchValues.slug || "your-slug"}</p>
                      <p className="text-veil-muted text-sm leading-relaxed font-medium mb-6 min-h-[60px]">
                        {watchValues.bio || "Your bio will appear here..."}
                      </p>

                      <div className="bg-veil-bg rounded-2xl p-5 border border-black/5">
                        <h4 className="font-heading font-black text-lg text-veil-text mb-4">Support Privately</h4>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {watchValues.tiers.map((tier, i) => (
                            <div key={i} className="flex flex-col items-center justify-center py-3 bg-white border border-black/5 rounded-xl hover:border-veil-primary transition-colors">
                              <span className="text-xs font-bold text-veil-text mb-1">{tier.name || `Option ${i+1}`}</span>
                              <span className="text-sm font-black text-veil-primary">${tier.amountUsdc || 0}</span>
                            </div>
                          ))}
                        </div>

                        <div className="relative mb-4">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none font-bold text-veil-muted">$</div>
                          <input type="text" className="w-full bg-white border border-black/10 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-veil-text" placeholder="Custom amount" readOnly />
                        </div>

                        <button className="w-full bg-veil-text text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
                          <Lock className="w-3 h-3" /> Send Tip Privately
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <VeilFooter />
    </div>
  );
}
