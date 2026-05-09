"use client";

import { ArrowRight } from "@phosphor-icons/react";
import type { TierPublic } from "@veil/db";
import { formatMicroUsdc } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

interface TierCardProps {
  tier: TierPublic;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function TierCard({ tier, isSelected, onClick, disabled }: TierCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group text-left p-[24px] rounded-[30px] border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink w-full",
        isSelected 
          ? "bg-iron/5 border-iron/30 shadow-inner" 
          : "bg-canvas border-iron/10 hover:border-iron/30 hover:shadow-sm",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex justify-between items-start mb-[8px]">
        <h3 className="text-[20px] font-medium text-ink tracking-[-0.48px]">{tier.name}</h3>
        <span className="font-mono text-[16px] text-ink font-medium">
          ${formatMicroUsdc(tier.amountUsdc)}
        </span>
      </div>
      <p className="text-[14px] text-iron leading-[1.5] mb-[24px] tracking-[-0.28px]">
        {tier.description}
      </p>
      <div className="flex justify-end">
        {!disabled && (
          <div className="flex items-center gap-[6px] text-[14px] font-medium text-silver-thread group-hover:text-ink transition-colors">
            {isSelected ? "Selected" : "Select"} <ArrowRight weight="bold" />
          </div>
        )}
      </div>
    </button>
  );
}