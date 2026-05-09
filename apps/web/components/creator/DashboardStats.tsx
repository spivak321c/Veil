"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Users, TrendingUp, Clock } from "lucide-react";

interface StatsProps {
  totalSupporters: number;
  claimedVolume: number; // in micro-USDC
  pendingClaims: number;
}

export function DashboardStats({ totalSupporters, claimedVolume, pendingClaims }: StatsProps) {
  const formatUSDC = (micro: number) => {
    return (micro / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mb-[32px]">
      <div className="bg-canvas border border-iron/10 rounded-[30px] p-[32px]">
        <div className="flex items-center justify-between mb-[24px]">
          <h3 className="text-iron font-medium text-[15px]">Total Supporters</h3>
          <div className="w-[40px] h-[40px] rounded-full bg-sky-blue/10 flex items-center justify-center">
            <Users className="w-[20px] h-[20px] text-sky-blue" />
          </div>
        </div>
        <div className="font-mono text-[32px] font-medium text-ink">
          {totalSupporters}
        </div>
      </div>

      <div className="bg-canvas border border-iron/10 rounded-[30px] p-[32px]">
        <div className="flex items-center justify-between mb-[24px]">
          <h3 className="text-iron font-medium text-[15px]">Claimed Volume (USDC)</h3>
          <div className="w-[40px] h-[40px] rounded-full bg-vivid-pink/10 flex items-center justify-center">
            <TrendingUp className="w-[20px] h-[20px] text-vivid-pink" />
          </div>
        </div>
        <div className="font-mono text-[32px] font-medium text-ink">
          <span className="text-silver-thread mr-[8px]">$</span>
          {formatUSDC(claimedVolume)}
        </div>
      </div>

      <div className="bg-canvas border border-iron/10 rounded-[30px] p-[32px]">
        <div className="flex items-center justify-between mb-[24px]">
          <h3 className="text-iron font-medium text-[15px]">Pending Claims</h3>
          <div className="w-[40px] h-[40px] rounded-full bg-iron/5 flex items-center justify-center">
            <Clock className="w-[20px] h-[20px] text-ink" />
          </div>
        </div>
        <div className="font-mono text-[32px] font-medium text-ink">
          {pendingClaims}
        </div>
      </div>
    </div>
  );
}
