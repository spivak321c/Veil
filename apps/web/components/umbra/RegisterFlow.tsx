"use client";

import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { useUmbraRegistration } from "@/lib/umbra/useUmbraRegistration";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Shield, ShieldAlert, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useUmbraStore } from "@/lib/umbra/store";
import { toast } from "sonner";

export function RegisterFlow({ onComplete }: { onComplete: () => void }) {
  const { register, isInitializing, initError } = useUmbraRegistration();
  const retryInitialize = useUmbraStore((s) => s.retryInitialize);
  const { connected } = useWalletConnection();
  const [status, setStatus] = useState<"idle" | "registering" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async () => {
    console.log("[RegisterFlow] Handle register called");
    try {
      setStatus("registering");
      console.log("[RegisterFlow] Calling register function");
      await register();
      console.log("[RegisterFlow] Register function completed successfully");
      setStatus("success");
      toast.success("Successfully registered with Umbra!");
      onComplete();
    } catch (err: unknown) {
      console.error("[RegisterFlow] Registration error:", err);
      setStatus("error");
      const message = err instanceof Error ? err.message : "Failed to register with Umbra.";
      setErrorMsg(message);
      toast.error("Registration failed. Please try again.");
    }
  };

  const isWalletConnected = connected;
  const isClientReady = !isInitializing && !initError;
  const isProcessing = status === "registering";
  const isSuccess = status === "success";

  const buttonDisabled = !isWalletConnected || isInitializing || isProcessing || isSuccess;

  const showInitError = initError && status !== "error";

  return (
    <div className="flex flex-col items-center justify-center p-[40px] bg-canvas rounded-[30px] border border-iron/10 text-center font-sans">
      <div className="w-[80px] h-[80px] rounded-full bg-iron/5 flex items-center justify-center mb-[24px]">
        {status === "registering" ? (
          <Spinner size="lg" />
        ) : status === "success" ? (
          <CheckCircle className="w-[40px] h-[40px] text-sky-blue" />
        ) : status === "error" ? (
          <ShieldAlert className="w-[40px] h-[40px] text-vivid-pink" />
        ) : (
          <Shield className="w-[40px] h-[40px] text-ink" />
        )}
      </div>

      <h3 className="text-[26px] tracking-[-0.52px] text-ink font-medium mb-[12px]">
        Enable Privacy Layer
      </h3>

      <p className="text-[16px] text-iron leading-[1.5] max-w-[35ch] mb-[32px]">
        To receive anonymous payments and secure your balance, you need to register your wallet with the Umbra Privacy network. This is a one-time setup.
      </p>

      {!isWalletConnected && (
        <div className="mb-[24px] p-[16px] bg-amber-50 border border-amber-200 rounded-[16px] text-amber-800 text-[14px] max-w-[35ch] w-full text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Wallet not connected</span>
            <p className="text-xs mt-1 text-amber-700">Please connect your Solana wallet to proceed with Umbra registration.</p>
          </div>
        </div>
      )}

      {showInitError && (
        <div className="mb-[24px] p-[16px] bg-vivid-pink/10 border border-vivid-pink/20 rounded-[16px] text-vivid-pink text-[14px] max-w-[35ch] w-full text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Initialization error:</span>
            <p className="text-xs mt-1 opacity-80">{initError}</p>
            <button
              onClick={() => retryInitialize()}
              className="mt-3 text-xs font-bold underline hover:opacity-80 transition-opacity"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mb-[24px] p-[16px] bg-vivid-pink/10 border border-vivid-pink/20 rounded-[16px] text-vivid-pink text-[14px] max-w-[35ch] w-full text-left">
          <span className="font-bold">Registration failed:</span> {errorMsg}
        </div>
      )}

      {isWalletConnected && isInitializing && (
        <div className="mb-[24px] p-[16px] bg-sky-50 border border-sky-200 rounded-[16px] text-sky-800 text-[14px] max-w-[35ch] w-full text-left flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-sky-500 animate-spin mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Initializing privacy client...</span>
            <p className="text-xs mt-1 text-sky-600">Please wait while we connect to the Umbra network.</p>
          </div>
        </div>
      )}

      <Button
        size="lg"
        onClick={handleRegister}
        isLoading={isProcessing}
        disabled={buttonDisabled}
        className="w-full sm:w-auto min-w-[200px]"
      >
        {!isWalletConnected
          ? "Connect Wallet First"
          : isInitializing
          ? "Initializing..."
          : isSuccess
          ? "Registered"
          : "Register with Umbra"}
      </Button>

      {status === "error" && (
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs text-iron hover:text-ink underline transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
