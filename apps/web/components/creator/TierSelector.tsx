"use client";

import { TierCard } from "./TierCard";
import type { TierPublic } from "@veil/db";

interface TierSelectorProps {
  tiers: TierPublic[];
  selectedTier: TierPublic | null;
  onSelect: (tier: TierPublic) => void;
  disabled?: boolean;
}

export function TierSelector({ tiers, selectedTier, onSelect, disabled }: TierSelectorProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="p-[32px] rounded-[30px] border border-iron/10 bg-iron/5 text-center text-iron text-[15px]">
        No support tiers available.
      </div>
    );
  }

  // Sort tiers by sortOrder, fallback to amount if no sortOrder
  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    }
    return a.amountUsdc - b.amountUsdc;
  });

  return (
    <div className="flex flex-col gap-[16px] w-full">
      {sortedTiers.map((tier) => (
        <TierCard
          key={tier.id}
          tier={tier}
          isSelected={selectedTier?.id === tier.id}
          onClick={() => onSelect(tier)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}