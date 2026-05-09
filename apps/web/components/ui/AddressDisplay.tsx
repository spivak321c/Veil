"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Copy, Check } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  className?: string;
}

export function AddressDisplay({ address, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const truncate = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  return (
    <div
      onClick={copyToClipboard}
      className={cn(
        "inline-flex items-center gap-[8px] px-[12px] py-[6px] rounded-[30px] bg-iron/5 border border-iron/10 text-[14px] font-mono text-silver-thread hover:text-ink hover:border-iron/30 cursor-pointer transition-colors group",
        className
      )}
      title={address}
    >
      <span className="address">{truncate(address)}</span>
      {copied ? (
        <Check className="w-[14px] h-[14px] text-sky-blue" />
      ) : (
        <Copy className="w-[14px] h-[14px] opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}
