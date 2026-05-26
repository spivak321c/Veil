"use client";

import { useState } from "react";
import { useViewingKey } from "@/lib/umbra/useViewingKey";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FileKey, Copy, Download, Key, Link as LinkIcon, Award } from "lucide-react";
import { toast } from "sonner";
import { APP_URL } from "@/lib/constants";

export function ViewingKeyExport({ creatorSlug }: { creatorSlug?: string }) {
  const { deriveMonthly, deriveYearly } = useViewingKey();
  const [scope, setScope] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [key, setKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      let generatedKey = "";
      if (scope === "monthly") {
        generatedKey = await deriveMonthly(BigInt(year), BigInt(month));
      } else {
        generatedKey = await deriveYearly(BigInt(year));
      }
      setKey(generatedKey);
      toast.success("Viewing key generated successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate viewing key.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (key) {
      navigator.clipboard.writeText(key);
      toast.success("Key copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (!key) return;
    
    const payload = {
      format: "veil-viewing-key-v1",
      scope,
      token: "USDC",
      year,
      month: scope === "monthly" ? month : undefined,
      key,
      generatedAt: new Date().toISOString(),
      instructions: "Share with your accountant or sponsor. This key decrypts payment amounts for the specified period only."
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veil-key-${scope}-${year}${scope === "monthly" ? `-${month}` : ""}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    if (!key) return;
    const params = new URLSearchParams({
      key,
      scope,
      year: String(year),
      ...(scope === "monthly" ? { month: String(month) } : {}),
    });
    const shareUrl = `${APP_URL}/verify?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  const handleCopyRevenueBadge = () => {
    if (!key || !creatorSlug) return;
    const period =
      scope === "monthly"
        ? `${year}-${String(month).padStart(2, "0")}`
        : String(year);
    const params = new URLSearchParams({ key });
    const badgeUrl = `${APP_URL}/c/${creatorSlug}/revenue/${period}?${params.toString()}`;
    navigator.clipboard.writeText(badgeUrl);
    toast.success("Revenue badge URL copied");
  };

  return (
    <div className="flex flex-col h-full bg-canvas rounded-[30px] border border-iron/10 p-[32px] font-sans">
      <div className="flex-1">
        <div className="flex items-center gap-[16px] mb-[24px]">
          <div className="w-[48px] h-[48px] rounded-full bg-iron/5 flex items-center justify-center">
            <Key className="w-[24px] h-[24px] text-ink" />
          </div>
          <div>
            <h3 className="text-[26px] tracking-[-0.52px] font-medium text-ink">Viewing Keys</h3>
            <p className="text-iron text-[15px]">Generate read-only keys for sponsors or tax reporting.</p>
          </div>
        </div>

        <div className="space-y-[24px]">
          <div>
            <label className="block text-[15px] font-medium text-ink mb-[8px]">Scope</label>
            <select 
              value={scope} 
              onChange={(e) => setScope(e.target.value as "monthly" | "yearly")}
              className="flex h-[54px] w-full rounded-[45px] border border-iron/20 bg-canvas px-[24px] py-[12px] text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink appearance-none"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className="block text-[15px] font-medium text-ink mb-[8px]">Year</label>
              <select 
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="flex h-[54px] w-full rounded-[45px] border border-iron/20 bg-canvas px-[24px] py-[12px] text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink font-mono appearance-none"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            {scope === "monthly" && (
              <div>
                <label className="block text-[15px] font-medium text-ink mb-[8px]">Month</label>
                <select 
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="flex h-[54px] w-full rounded-[45px] border border-iron/20 bg-canvas px-[24px] py-[12px] text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink font-mono appearance-none"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {key && (
          <div className="mt-[24px]">
            <div className="bg-iron/5 p-[24px] rounded-[20px] border border-iron/10">
              <label className="block text-[13px] font-medium text-iron mb-[8px] uppercase tracking-wider">Your Key</label>
              <div className="font-mono text-[14px] break-all text-ink bg-canvas p-[16px] rounded-[16px] border border-iron/10 mb-[16px]">
                {key}
              </div>
              <div className="flex flex-col gap-[10px]">
                <Button onClick={handleCopyShareLink} variant="secondary" className="w-full">
                  <LinkIcon className="w-[16px] h-[16px] mr-[8px]" />
                  Copy Share Link
                </Button>
                {creatorSlug && (
                  <Button onClick={handleCopyRevenueBadge} variant="secondary" className="w-full">
                    <Award className="w-[16px] h-[16px] mr-[8px]" />
                    Copy Revenue Badge URL
                  </Button>
                )}
                <Button onClick={handleDownload} variant="secondary" className="w-full">
                  <Download className="w-[16px] h-[16px] mr-[8px]" />
                  Download JSON
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-[32px] pt-[24px] border-t border-iron/10">
        <Button 
          className="w-full" 
          onClick={handleGenerate}
          disabled={loading}
        >
          Generate Key
        </Button>
      </div>
    </div>
  );
}
