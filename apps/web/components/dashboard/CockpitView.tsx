"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEncryptedBalance } from "@/lib/umbra/useEncryptedBalance";
import { useClaim } from "@/lib/umbra/useClaim";
import { useViewingKey } from "@/lib/umbra/useViewingKey";
import { ShieldCheck, ArrowsClockwise, Key, TrendUp, DownloadSimple, ArrowLineDown, PauseCircle, PlayCircle } from "@phosphor-icons/react";
import { formatMicroUsdc } from "@/lib/constants";
import { EventFeed } from "@/components/creator/EventFeed";
import type { CreatorFull } from "@veil/db";
import { toast } from "sonner";
import { useWithdraw } from "@/lib/umbra/useWithdraw";
import { useConvertToShared } from "@/lib/umbra/useConvertToShared";
import type { Address } from "@solana/kit";

export function CockpitView() {
  const [data, setData] = useState<CreatorFull | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Umbra SDK
  const { getBalance } = useEncryptedBalance();
  const { scanAndClaim } = useClaim();
  const { convertToShared } = useConvertToShared();
  const { withdraw } = useWithdraw();
  const { deriveMonthly, deriveYearly } = useViewingKey();
  const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;

  const [encryptedBalance, setEncryptedBalance] = useState<bigint | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStartedAt, setClaimStartedAt] = useState<number | null>(null);
  const [claimElapsedSec, setClaimElapsedSec] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isPollingPaused, setIsPollingPaused] = useState(false);
  const pollingPausedRef = useRef(false);
  const pollingPendingRef = useRef(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    const bal = await getBalance();
    if (bal !== null) setEncryptedBalance(bal);
  };

  const refreshDashboard = async () => {
    setIsRefreshingBalance(true);
    await Promise.allSettled([fetchDashboard(), fetchBalance()]);
    setLastRefreshed(new Date());
    setIsRefreshingBalance(false);
  };

  useEffect(() => {
    fetchDashboard();
    fetchBalance();
  }, []);

  const fetchDashboardRef = useRef(fetchDashboard);
  const fetchBalanceRef = useRef(fetchBalance);
  useEffect(() => {
    fetchDashboardRef.current = fetchDashboard;
    fetchBalanceRef.current = fetchBalance;
  });

  const togglePolling = () => {
    const next = !pollingPausedRef.current;
    pollingPausedRef.current = next;
    setIsPollingPaused(next);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (pollingPausedRef.current || pollingPendingRef.current) return;
      pollingPendingRef.current = true;
      await Promise.allSettled([
        fetchDashboardRef.current(),
        fetchBalanceRef.current(),
      ]);
      pollingPendingRef.current = false;
      setLastRefreshed(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async () => {
    const wasPaused = pollingPausedRef.current;
    pollingPausedRef.current = true;
    setIsPollingPaused(true);
    try {
      setIsClaiming(true);
      setClaimStartedAt(Date.now());
      setClaimElapsedSec(0);
      const { claimed } = await scanAndClaim();
      if (claimed > 0) {
        await fetch("/api/events/claim-all", { method: "POST" });

        if (USDC_MINT) {
          toast.info("Converting balance to withdrawable format...");
          const result = await convertToShared([USDC_MINT as Address]);
          if (result.converted.size > 0) {
            toast.success(`Balance converted successfully`);
          }
        }

        toast.success(`Successfully claimed ${claimed} payments`);
        await fetchBalance();
        await fetchDashboard();
      } else {
        toast.info("No new payments found");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to claim payments");
    } finally {
      setIsClaiming(false);
      setClaimStartedAt(null);
      setClaimElapsedSec(0);
      if (!wasPaused) {
        pollingPausedRef.current = false;
        setIsPollingPaused(false);
      }
    }
  };

  // Tick elapsed seconds while a claim is in progress
  useEffect(() => {
    if (!isClaiming || claimStartedAt === null) return;
    const tick = setInterval(() => {
      setClaimElapsedSec(Math.floor((Date.now() - claimStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [isClaiming, claimStartedAt]);

  const handleWithdraw = async () => {
    if (!encryptedBalance || encryptedBalance === 0n) {
      toast.info("No balance to withdraw.");
      return;
    }
    const wasPaused = pollingPausedRef.current;
    pollingPausedRef.current = true;
    setIsPollingPaused(true);
    try {
      setIsWithdrawing(true);
      toast.info("Withdrawing to wallet... this may take 5–15 seconds.");
      await withdraw(encryptedBalance);
      toast.success("Funds withdrawn to your Solflare wallet!");
      await fetchBalance();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
      if (!wasPaused) {
        pollingPausedRef.current = false;
        setIsPollingPaused(false);
      }
    }
  };

  const handleGenerateKey = async (type: "monthly" | "yearly") => {
    try {
      toast.info("Generating Viewing Key...");
      const now = new Date();
      const year = BigInt(now.getUTCFullYear());
      const month = BigInt(now.getUTCMonth() + 1);

      const keyString = type === "monthly" 
        ? await deriveMonthly(year, month)
        : await deriveYearly(year);
      
      const blob = new Blob([JSON.stringify({ type, year: Number(year), month: Number(month), key: keyString }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veil_${type}_${year}${type === "monthly" ? `_${month}` : ""}.vk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Viewing key generated and downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate key");
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center text-iron font-sans text-[14px]">
        <div className="w-[24px] h-[24px] rounded-full border-2 border-iron/20 border-t-ink animate-spin mr-[12px]" />
        Loading Dashboard...
      </div>
    );
  }

  if (!data) {
    return <div className="h-[50vh] flex items-center justify-center font-sans text-ink text-[16px] tracking-[-0.28px]">NOT AUTHORIZED</div>;
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto pt-[60px] px-[24px] pb-[120px] font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[80px] gap-[24px]">
        <div>
          <h1 className="font-sans text-display tracking-[-1.5px] text-ink mb-[12px] leading-[1.0] font-light">
            {data.displayName}
          </h1>
          <div className="flex items-center gap-[12px] text-[15px] text-iron">
            <span>ID: {data.id.split('-')[0]}</span>
            <span className="w-[4px] h-[4px] bg-iron/20 rounded-full" />
            <span className="flex items-center gap-[6px] text-ink font-medium">
              <span className="w-[8px] h-[8px] rounded-full bg-sky-blue animate-pulse" />
              Connected
            </span>
          </div>
        </div>
        <button
          onClick={togglePolling}
          className={`flex items-center gap-[6px] text-[13px] font-medium px-[12px] py-[8px] rounded-full border transition-colors ${
            isPollingPaused
              ? "border-iron/10 text-iron hover:border-iron/30"
              : "border-iron/10 text-ink hover:border-iron/30"
          }`}
          title={isPollingPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
        >
          {isPollingPaused ? (
            <PlayCircle weight="fill" className="w-[16px] h-[16px]" />
          ) : (
            <PauseCircle weight="fill" className="w-[16px] h-[16px]" />
          )}
          {isPollingPaused ? "Paused" : "Auto"}
        </button>
      </div>

      {/* CORE METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-[24px] mb-[80px]">
        
        {/* Metric 1: Encrypted Balance */}
        <div className="col-span-1 lg:col-span-2 bg-canvas border border-iron/10 rounded-[30px] p-[40px] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow">
          <div className="flex items-center justify-between mb-[40px]">
            <span className="text-[16px] text-iron font-medium">Encrypted Balance</span>
            <button
              onClick={refreshDashboard}
              disabled={isRefreshingBalance}
              className="p-[8px] rounded-full hover:bg-iron/10 transition-colors disabled:opacity-40 focus-visible:outline-none"
              title="Refresh balance"
            >
              <ArrowsClockwise
                weight="bold"
                className={`w-[18px] h-[18px] text-iron ${isRefreshingBalance ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div>
            <div className="font-sans text-display font-light text-ink tracking-[-2px] mb-[8px] leading-[1.0]">
              ${encryptedBalance !== null ? formatMicroUsdc(Number(encryptedBalance)) : "---"}
            </div>
            <div className="text-[15px] text-silver-thread mb-[24px]">
              USDC secured via Umbra
              {lastRefreshed && (
                <span className="block text-[12px] text-silver-thread/60 mt-[4px]">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !encryptedBalance || encryptedBalance === 0n}
              className="flex items-center gap-[8px] text-[14px] font-medium text-iron hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none"
            >
              {isWithdrawing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <ArrowsClockwise weight="bold" className="w-[16px] h-[16px]" />
                  </motion.div>
                  Withdrawing...
                </>
              ) : (
                <>
                  <ArrowLineDown weight="bold" className="w-[16px] h-[16px]" />
                  Withdraw to Wallet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metric 2: Public Lifetime Volume */}
        <div className="bg-iron/5 rounded-[30px] p-[40px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-[40px]">
            <span className="text-[16px] text-ink font-medium">Lifetime Volume</span>
            <TrendUp weight="fill" className="w-[24px] h-[24px] text-ink" />
          </div>
          <div>
            <div className="font-sans text-heading-lg font-light text-ink tracking-[-1px] mb-[8px] leading-[1.0]">
              ${formatMicroUsdc(data.stats.totalVolumeUsdc)}
            </div>
            <div className="text-[15px] text-iron">USDC aggregate</div>
          </div>
        </div>

        {/* Metric 3: Pending UTXOs / Claim */}
        <div className="bg-iron/5 rounded-[30px] p-[40px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-[40px]">
            <span className="text-[16px] text-ink font-medium">Pending Payments</span>
            <div className={`w-[8px] h-[8px] rounded-full ${data.stats.pendingEvents > 0 ? "bg-vivid-pink animate-pulse" : "bg-iron/20"}`} />
          </div>
          <div>
            <div className="font-sans text-heading-lg font-light text-ink tracking-[-1px] mb-[24px] leading-[1.0]">
              {data.stats.pendingEvents}
            </div>
            <button 
              onClick={handleClaim}
              disabled={isClaiming || data.stats.pendingEvents === 0}
              className="w-full py-[16px] bg-ink text-canvas text-[15px] font-medium rounded-[30px] hover:bg-ink/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
            >
              {isClaiming ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <ArrowsClockwise weight="bold" className="w-[18px] h-[18px]" />
                  </motion.div>
                  Processing... {claimElapsedSec > 0 && `(${claimElapsedSec}s)`}
                </>
              ) : (
                "Claim to Balance"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LOWER SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-[64px]">
        
          {/* Left: Recent Events */}
        <div>
          <h3 className="font-sans font-medium text-heading-sm tracking-[-0.52px] text-ink mb-[32px]">Recent Activity</h3>
          <EventFeed events={data.stats.recentEvents} />
        </div>

        {/* Right: Cryptographic Operations */}
        <div>
          <h3 className="font-sans font-medium text-heading-sm tracking-[-0.52px] text-ink mb-[32px]">Reporting</h3>

          <div className="bg-canvas border border-iron/10 rounded-[30px] p-[32px]">
            <p className="text-[15px] text-iron leading-[1.6] mb-[32px]">
              Generate viewing keys to securely prove your encrypted revenue to sponsors or tax authorities without exposing patrons.
            </p>
            
            <div className="flex flex-col gap-[16px]">
              <button 
                onClick={() => handleGenerateKey("monthly")}
                className="group flex items-center justify-between w-full p-[20px] border border-iron/10 rounded-[20px] bg-iron/5 hover:bg-iron/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-[16px] text-ink mb-[4px] tracking-[-0.28px]">Monthly Key</span>
                  <span className="text-[13px] text-iron">Current Month Scope</span>
                </div>
                <DownloadSimple weight="bold" className="w-[20px] h-[20px] text-iron group-hover:text-ink transition-colors" />
              </button>

              <button 
                onClick={() => handleGenerateKey("yearly")}
                className="group flex items-center justify-between w-full p-[20px] border border-iron/10 rounded-[20px] bg-iron/5 hover:bg-iron/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-[16px] text-ink mb-[4px] tracking-[-0.28px]">Yearly Key</span>
                  <span className="text-[13px] text-iron">Full Year Scope</span>
                </div>
                <DownloadSimple weight="bold" className="w-[20px] h-[20px] text-iron group-hover:text-ink transition-colors" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
