"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletConnection } from "@solana/react-hooks";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { toast } from "sonner";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import bs58 from "bs58";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

export default function LoginPage() {
  const { connected, wallet } = useWalletConnection();
  const router = useRouter();
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
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Authentication failed.");
      console.error("Sign in error:", error);
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <VeilHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-[440px] bg-veil-surface rounded-[32px] p-10 shadow-sm border border-black/5 relative overflow-hidden"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-veil-text text-veil-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-[28px] font-heading font-black tracking-tight text-veil-text mb-3">
              Sign in
            </h1>
            <p className="text-veil-muted text-[15px] leading-relaxed">
              Connect your wallet and sign a message to access your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {!connected ? (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="pill-button-primary w-full flex items-center justify-center gap-2.5 h-[54px] text-[16px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none group"
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

            <p className="text-center text-[14px] text-veil-muted mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href="/onboard"
                className="text-veil-primary font-bold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
      <VeilFooter />
    </div>
  );
}
