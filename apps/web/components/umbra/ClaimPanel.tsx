"use client";

import { useState } from "react";
import { useClaim } from "@/lib/umbra/useClaim";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Search, Download, Inbox, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";

export function ClaimPanel({ onClaimed }: { onClaimed: () => void }) {
  const { scanAndClaim } = useClaim();
  const [status, setStatus] = useState<"idle" | "scanning" | "claiming">("idle");
  const [lastResult, setLastResult] = useState<{ claimed: number } | null>(null);

  const handleScanAndClaim = async () => {
    try {
      setStatus("scanning");
      const result = await scanAndClaim();

      setLastResult(result);

      if (result.claimed > 0) {
        // Mark events as claimed in the DB
        await fetch("/api/events/claim-all", { method: "POST" });
        toast.success(`Successfully claimed ${result.claimed} payments!`);
        onClaimed();
      } else {
        toast.info("No new payments found.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to scan and claim.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col h-full bg-canvas rounded-[30px] border border-iron/10 p-[32px] font-sans">
      <div className="flex-1">
        <div className="flex items-center gap-[16px] mb-[24px]">
          <div className="w-[48px] h-[48px] rounded-full bg-iron/5 flex items-center justify-center">
            <Inbox className="w-[24px] h-[24px] text-ink" />
          </div>
          <div>
            <h3 className="text-[26px] tracking-[-0.52px] font-medium text-ink">Sync Inbox</h3>
            <p className="text-iron text-[15px]">Scan the network for anonymous payments sent to you.</p>
          </div>
        </div>

        <div className="bg-iron/5 p-[24px] rounded-[20px] border border-iron/10 mb-[24px]">
          {status === "idle" && (
            <div className="text-center py-[16px]">
              <p className="text-[16px] text-ink font-medium">Ready to scan</p>
              <p className="text-[14px] text-iron mt-[8px] max-w-xs mx-auto">
                Scanning checks the blockchain for new UTXOs assigned to your stealth address.
              </p>
            </div>
          )}

          {status === "scanning" && (
            <div className="flex flex-col items-center justify-center py-[16px]">
              <Spinner size="lg" className="mb-[16px]" />
              <p className="text-[16px] text-ink font-medium">Scanning Network...</p>
              <p className="text-[14px] text-iron mt-[8px] max-w-xs text-center">
                This may take a few moments as we verify proofs on-chain.
              </p>
            </div>
          )}

          {status === "idle" && lastResult && (
            <div className="flex flex-col items-center justify-center py-[16px] text-center">
              <div className="w-[64px] h-[64px] rounded-full bg-canvas flex items-center justify-center mb-[16px] shadow-sm border border-iron/10">
                <Search className="w-[24px] h-[24px] text-iron" />
              </div>
              {lastResult.claimed > 0 ? (
                <>
                  <p className="text-iron mb-[8px]">
                    Last scan found <span className="text-ink font-medium">{lastResult.claimed}</span> new payments.
                  </p>
                  <p className="text-[13px] text-silver-thread font-mono">They have been added to your encrypted balance.</p>
                </>
              ) : (
                <p className="text-iron mb-[8px]">Inbox is synced.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-[32px] pt-[24px] border-t border-iron/10">
        <Button 
          className="w-full" 
          onClick={handleScanAndClaim}
          isLoading={status === "scanning"}
        >
          {status === "scanning" ? "Scanning..." : "Scan & Claim"}
        </Button>
      </div>
    </div>
  );
}
