"use client";

import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { toast } from "sonner";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import bs58 from "bs58";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

export default function LoginPage() {
  const { connected, wallet } = useWalletConnection();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function handleSignIn() {
    if (!wallet) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsAuthenticating(true);
    try {
      const walletAddress = wallet.account.address;
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceRes.ok) {
        throw new Error("Failed to get sign-in nonce.");
      }

      const { nonce, expiresAt } = await nonceRes.json().then((r) => r.data ?? r);
      const message = `Sign in to Veil\n\nNonce: ${nonce}\nExpires: ${expiresAt}`;
      const encodedMessage = new TextEncoder().encode(message);

      let signature: Uint8Array | null = null;

      try {
        if (wallet.signMessage) {
          signature = await wallet.signMessage(encodedMessage);
        }
      } catch (e: unknown) {
        console.warn("[handleSignIn] wallet.signMessage failed:", e);
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
          console.warn("[handleSignIn] phantom.solana.signMessage failed:", e);
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
        throw new Error("Invalid signature or expired nonce.");
      }

      toast.success("Signed in successfully!");
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Authentication failed.");
      console.error("Sign in error:", error);
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-veil-bg selection:bg-veil-primary selection:text-white relative overflow-hidden">
      <VeilHeader />
      
      {/* Background Ambience */}
      <div className="absolute top-1/4 right-1/4 w-[40vw] h-[40vw] bg-veil-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <main className="flex-1 flex items-center justify-center px-6 py-32 z-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springTransition}
          className="w-full max-w-[440px] bg-white rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 relative overflow-hidden"
        >
          {/* Inner ambient glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-veil-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-10 relative z-10">
            <div className="w-16 h-16 bg-veil-bg text-veil-text rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-black/5">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-heading font-black tracking-tight text-veil-text mb-3">
              Creator Login
            </h1>
            <p className="text-veil-muted text-sm font-medium leading-relaxed max-w-[30ch] mx-auto">
              Connect your wallet and sign a message to access your dashboard securely.
            </p>
          </div>

          <div className="flex flex-col gap-5 relative z-10">
            {!connected ? (
              <div className="flex justify-center w-full">
                <div className="w-full [&>div]:w-full [&_button]:w-full [&_button]:justify-center">
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="w-full bg-veil-text text-white rounded-full font-bold text-base flex items-center justify-center gap-2 h-14 hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}

            <div className="mt-4 pt-6 border-t border-black/5 text-center">
              <p className="text-sm font-medium text-veil-muted">
                Don&apos;t have an account?{" "}
                <Link
                  href="/onboard"
                  className="text-veil-text font-bold hover:text-veil-primary transition-colors hover:underline underline-offset-4"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <VeilFooter />
    </div>
  );
}
