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
    <div className="flex-grow flex flex-col pt-16 px-4">
      <VeilHeader />
      <div className="max-w-[1200px] mx-auto w-full flex-grow flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[480px] w-full bg-canvas border border-iron/10 rounded-[32px] p-[40px] shadow-sm relative overflow-hidden"
        >
          <div className="text-center mb-[40px]">
            <div className="w-[64px] h-[64px] bg-ink text-canvas rounded-full flex items-center justify-center mx-auto mb-[24px]">
              <Lock className="w-[28px] h-[28px]" />
            </div>
            <h1 className="text-[32px] font-medium tracking-tight text-ink mb-[12px]">
              Creator Login
            </h1>
            <p className="text-iron text-[16px]">
              Connect your wallet and sign a message to access your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-[16px]">
            {!connected ? (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-[12px] h-[56px] rounded-[30px] bg-sky-blue text-white font-medium text-[16px] hover:bg-sky-blue/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-[20px] h-[20px] animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-[20px] h-[20px] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}

            <p className="text-center text-[14px] text-iron mt-[16px]">
              Don&apos;t have an account?{" "}
              <Link href="/onboard" className="text-sky-blue hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
      <VeilFooter />
    </div>
  );
}
