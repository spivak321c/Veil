"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useEncryptedBalance, type AccountState } from "@/lib/umbra/useEncryptedBalance";
import { useClaim } from "@/lib/umbra/useClaim";
import { useViewingKey } from "@/lib/umbra/useViewingKey";
import { useConvertToShared } from "@/lib/umbra/useConvertToShared";
import { useWithdraw } from "@/lib/umbra/useWithdraw";
import type { Address } from "@solana/kit";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Heart, 
  ArrowRight, 
  Copy, 
  ExternalLink, 
  Megaphone, 
  Award, 
  Ghost,
  Download,
  RotateCw,
  PauseCircle,
  PlayCircle,
  Sparkles,
  ChevronDown,
  FileKey,
} from "lucide-react";
import Link from "next/link";
import { formatMicroUsdc } from "@/lib/constants";
import { EventFeed } from "@/components/creator/EventFeed";
import type { CreatorFull } from "@veil/db";
import { toast } from "sonner";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: springTransition 
  },
} as const;

export function DashboardContent() {
  const [data, setData] = useState<CreatorFull | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { getBalance } = useEncryptedBalance();
  const { scanAndClaim } = useClaim();
  const { convertToShared } = useConvertToShared();
  const { deriveMonthly, deriveYearly } = useViewingKey();
  const { withdraw } = useWithdraw();
  const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;

  const [encryptedBalance, setEncryptedBalance] = useState<bigint | null>(null);
  const [accountState, setAccountState] = useState<AccountState>("none");
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
    const result = await getBalance();
    setEncryptedBalance(result.balance);
    setAccountState(result.state);
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
          try {
            await convertToShared([USDC_MINT as Address]);
            toast.success(`Balance converted successfully`);
          } catch (convErr: any) {
            console.warn("[handleClaim] convertToShared failed:", convErr);
            toast.warning("Balance may be in locked mode — withdrawal via Arcium still works");
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

  useEffect(() => {
    if (!isClaiming || claimStartedAt === null) return;
    const tick = setInterval(() => {
      setClaimElapsedSec(Math.floor((Date.now() - claimStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [isClaiming, claimStartedAt]);

  const handleWithdraw = async () => {
    if (!encryptedBalance && accountState !== "mxe") {
      toast.info("No balance to withdraw.");
      return;
    }
    const amountToWithdraw = encryptedBalance ?? 0n;
    const wasPaused = pollingPausedRef.current;
    pollingPausedRef.current = true;
    setIsPollingPaused(true);
    try {
      setIsWithdrawing(true);
      toast.info("Withdrawing to wallet... this may take 5–15 seconds.");
      await withdraw(amountToWithdraw);
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
      <div className="h-[50vh] flex items-center justify-center font-body text-veil-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-veil-muted/20 border-t-veil-primary animate-spin" />
          <span className="text-sm font-semibold tracking-tight">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="h-[50vh] flex items-center justify-center font-body text-veil-text font-bold tracking-widest text-lg">NOT AUTHORIZED</div>;
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-10 pb-20">
      {/* Top Actions & Greeting */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-4xl md:text-5xl font-black text-veil-text tracking-tighter">
              Welcome back, {data.displayName}
            </h1>
            <Sparkles className="w-6 h-6 text-veil-primary animate-pulse" />
          </div>
          <p className="text-veil-muted font-medium text-lg max-w-xl">
            Here's what's happening with your page today.
          </p>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
        >
          <button
            onClick={togglePolling}
            className={`px-4 py-3 bg-white border border-black/5 rounded-full font-bold text-sm text-veil-text hover:bg-veil-bg transition-colors flex items-center justify-center gap-2 shadow-sm ${
              isPollingPaused ? "opacity-60" : ""
            }`}
            title={isPollingPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
          >
            {isPollingPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/c/${data.slug}`).then(() => toast.success("Link copied!"))}
            className="px-6 py-3 bg-white border border-black/5 rounded-full font-bold text-sm text-veil-text hover:border-black/20 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <a 
            href={`/c/${data.slug}`} 
            target="_blank"
            className="px-6 py-3 bg-veil-text text-white rounded-full font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]"
          >
            <ExternalLink className="w-4 h-4" /> View Public Page
          </a>
        </motion.div>
      </div>

      {/* Metrics Overview Row */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        {[
          { 
            label: "Current Balance", 
            value: accountState === "mxe" ? "🔒 MXE" : encryptedBalance !== null ? `$${formatMicroUsdc(Number(encryptedBalance))}` : "---", 
            icon: <Wallet className="w-6 h-6" />, 
            color: "text-blue-600 bg-blue-50/50",
            onRefresh: refreshDashboard,
          },
          { 
            label: "Lifetime Volume", 
            value: `$${formatMicroUsdc(data.stats.totalVolumeUsdc)}`, 
            icon: <TrendingUp className="w-6 h-6" />, 
            color: "text-emerald-600 bg-emerald-50/50" 
          },
          { 
            label: "Total Supporters", 
            value: data.stats.totalSupportEvents.toString(), 
            icon: <Users className="w-6 h-6" />, 
            color: "text-amber-600 bg-amber-50/50" 
          },
        ].map((metric, i) => (
          <motion.div 
            key={i}
            variants={fadeInUp}
            className="bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300 ease-out"
          >
            <div className={`w-16 h-16 rounded-[1.25rem] ${metric.color} flex items-center justify-center border border-black/5 shadow-sm group-hover:scale-105 transition-transform`}>
              {metric.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-veil-muted font-bold text-xs uppercase tracking-wider">{metric.label}</p>
                {"onRefresh" in metric && (
                  <button
                    onClick={metric.onRefresh}
                    disabled={isRefreshingBalance}
                    className="p-1.5 rounded-full hover:bg-black/5 transition-colors disabled:opacity-40"
                    title="Refresh balance"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-veil-muted ${isRefreshingBalance ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
              <h3 className="font-heading text-4xl font-black text-veil-text tracking-tighter">{metric.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="lg:col-span-8 space-y-8"
        >
          
          {/* Chart Section */}
          <motion.section 
            variants={fadeInUp}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
              <h2 className="font-heading text-2xl font-black text-veil-text flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 rounded-xl bg-veil-primary/10 flex items-center justify-center text-veil-primary">
                  <BarChart3 className="w-5 h-5" />
                </div>
                Earnings Overview
              </h2>
              <div className="relative">
                <select className="appearance-none bg-veil-bg border border-black/5 text-veil-text font-bold text-sm rounded-full pl-6 pr-10 py-3 outline-none cursor-pointer focus:ring-2 focus:ring-veil-text transition-all w-full sm:w-auto">
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                  <option>All Time</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-veil-muted" />
              </div>
            </div>

            <div className="h-[280px] flex items-end justify-between gap-2 sm:gap-4 mt-6 relative border-b border-black/10 pb-4">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs font-bold text-veil-muted/50 pb-4 -ml-1">
                <span>$2k</span>
                <span>$1k</span>
                <span>$0</span>
              </div>

              <div className="w-full flex justify-between items-end h-full pl-10">
                {(function buildChartBars() {
                  const monthlyTotals: Record<string, number> = {};
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const now = new Date();
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    monthlyTotals[key] = 0;
                  }
                  for (const ev of data.stats.recentEvents) {
                    const d = new Date(ev.createdAt);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (key in monthlyTotals) {
                      monthlyTotals[key] += ev.amountUsdc;
                    }
                  }
                  const maxVal = Math.max(...Object.values(monthlyTotals), 1);
                  return Object.entries(monthlyTotals).map(([key, total], i) => {
                    const [yearStr, monthIdx] = key.split("-");
                    const monthLabel = monthNames[parseInt(monthIdx)];
                    const pct = (total / maxVal) * 85;
                    const isLatest = i === Object.entries(monthlyTotals).length - 1;
                    return (
                      <div key={key} className={`relative w-full max-w-[50px] ${isLatest ? 'bg-veil-text' : 'bg-veil-secondary/50 hover:bg-veil-secondary'} rounded-t-2xl transition-colors duration-300 cursor-pointer group`} style={{ height: `${Math.max(pct, 4)}%` }}>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-black/5 text-veil-text text-sm font-bold py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg whitespace-nowrap z-10 pointer-events-none">
                          ${(total / 1_000_000).toFixed(2)}
                        </div>
                        <span className={`absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm font-bold ${isLatest ? 'text-veil-text' : 'text-veil-muted'}`}>{monthLabel}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </motion.section>

          {/* Recent Tips Section */}
          <motion.section 
            variants={fadeInUp}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-heading text-2xl font-black text-veil-text flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                Recent Support
              </h2>
              <button className="text-sm font-bold text-veil-text bg-veil-bg px-4 py-2 rounded-full hover:bg-black/5 transition-colors">
                View All
              </button>
            </div>

            <EventFeed events={data.stats.recentEvents} />
          </motion.section>
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="lg:col-span-4 space-y-8"
        >
          
          {/* Wallet Card */}
          <motion.section 
            variants={fadeInUp}
            className="bg-veil-text text-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-black/5 relative overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-veil-primary/30 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/noise.png')] mix-blend-overlay pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl font-black tracking-tight">
                  Your Wallet
                </h2>
                <button
                  onClick={refreshDashboard}
                  disabled={isRefreshingBalance}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 text-white/70 hover:text-white"
                  title="Refresh balance"
                >
                  <RotateCw className={`w-4 h-4 ${isRefreshingBalance ? "animate-spin" : ""}`} />
                </button>
              </div>
              
              <div className="mb-10">
                <p className="text-sm font-bold text-white/60 mb-2 uppercase tracking-widest">Available to withdraw</p>
                <h3 className="font-heading text-6xl font-black tracking-tighter flex items-start gap-1">
                  <span className="text-3xl mt-2 text-white/40">$</span>
                  {accountState === "mxe" ? "🔒" : encryptedBalance !== null ? formatMicroUsdc(Number(encryptedBalance)) : "---"}
                </h3>
                {accountState === "mxe" && (
                  <p className="text-xs text-amber-400/80 mt-3 font-medium">Balance locked — use &ldquo;Withdraw (MXE detected)&rdquo; to claim via Arcium</p>
                )}
                {lastRefreshed && !isPollingPaused && (
                  <p className="text-xs text-white/40 mt-3 font-medium">
                    Updated {lastRefreshed.toLocaleTimeString()}
                  </p>
                )}
                {isPollingPaused && (
                  <p className="text-xs text-amber-400/80 mt-3 font-medium flex items-center gap-1.5">
                    <PauseCircle className="w-3 h-3" /> Auto-refresh paused
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleClaim}
                  disabled={isClaiming || data.stats.pendingEvents === 0}
                  className="w-full bg-veil-primary text-white hover:bg-blue-500 px-6 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-10px_rgba(114,164,242,0.5)]"
                >
                  {isClaiming ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <RotateCw className="w-5 h-5" />
                      </motion.div>
                      Processing... {claimElapsedSec > 0 && `(${claimElapsedSec}s)`}
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-5 h-5" />
                      Claim {data.stats.pendingEvents > 0 ? `${data.stats.pendingEvents} Payment${data.stats.pendingEvents > 1 ? "s" : ""}` : "Payments"}
                    </>
                  )}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || (encryptedBalance === null && accountState !== "mxe")}
                  className="w-full bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? "Withdrawing..." : accountState === "mxe" ? "Withdraw (MXE detected)" : "Withdraw to Wallet"}
                </button>
              </div>
            </div>
          </motion.section>

          {/* Share Page Card */}
          <motion.section 
            variants={fadeInUp}
            className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
          >
            <h2 className="font-heading text-xl font-black text-veil-text mb-2 flex items-center gap-2">
              Spread the word
            </h2>
            <p className="text-sm font-medium text-veil-muted mb-6 leading-relaxed">
              Share your link on Twitter, YouTube, or anywhere your fans hang out.
            </p>
            
            <div className="flex items-center gap-2 bg-veil-bg p-2 rounded-[1.25rem] border border-black/5 mb-4">
              <div className="bg-white px-4 py-3 rounded-xl flex-1 text-sm font-bold text-veil-text truncate select-all shadow-sm border border-black/5">
                veil.to/{data.slug}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/c/${data.slug}`).then(() => toast.success("Profile link copied!"))}
                className="bg-veil-text text-white p-3 rounded-xl hover:bg-black active:scale-95 transition-all flex-shrink-0 shadow-sm"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-veil-bg p-2 rounded-[1.25rem] border border-black/5 mb-6">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl flex-1 text-sm font-bold text-veil-text truncate">
                <Megaphone className="w-4 h-4 text-veil-primary" />
                Tip Jar
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/tip/${data.slug}`).then(() => toast.success("Tip jar link copied!"))}
                className="bg-veil-text text-white p-3 rounded-xl hover:bg-black active:scale-95 transition-all flex-shrink-0 shadow-sm"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-[1.25rem] font-bold px-6 py-4 text-sm flex items-center justify-center gap-2 transition-all">
              Share on Twitter
            </button>
          </motion.section>

          {/* Reporting Card */}
          <motion.section 
            variants={fadeInUp}
            className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] border border-black/5"
          >
            <h2 className="font-heading text-xl font-black text-veil-text mb-2 tracking-tight">Reporting</h2>
            <p className="text-sm font-medium text-veil-muted mb-6 leading-relaxed">
              Generate viewing keys to securely prove your encrypted revenue.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleGenerateKey("monthly")}
                className="group flex items-center justify-between w-full p-5 border border-black/5 rounded-2xl bg-white hover:bg-veil-bg transition-colors shadow-sm hover:shadow-none"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-veil-text text-sm mb-0.5">Monthly Key</span>
                  <span className="text-xs font-semibold text-veil-muted">Current Month</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-veil-bg group-hover:bg-white flex items-center justify-center transition-colors">
                  <Download className="w-4 h-4 text-veil-text" />
                </div>
              </button>
              <button 
                onClick={() => handleGenerateKey("yearly")}
                className="group flex items-center justify-between w-full p-5 border border-black/5 rounded-2xl bg-white hover:bg-veil-bg transition-colors shadow-sm hover:shadow-none"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-veil-text text-sm mb-0.5">Yearly Key</span>
                  <span className="text-xs font-semibold text-veil-muted">Full Year Scope</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-veil-bg group-hover:bg-white flex items-center justify-center transition-colors">
                  <Download className="w-4 h-4 text-veil-text" />
                </div>
              </button>
              <Link 
                href="/dashboard/compliance"
                className="group flex items-center justify-between w-full p-5 border border-black/5 rounded-2xl bg-white hover:bg-veil-bg transition-colors shadow-sm hover:shadow-none mt-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-veil-text text-sm mb-0.5">Full Compliance Dashboard</span>
                  <span className="text-xs font-semibold text-veil-muted">Shareable links & revenue badges</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-veil-bg group-hover:bg-white flex items-center justify-center transition-colors">
                  <FileKey className="w-4 h-4 text-veil-text" />
                </div>
              </Link>
            </div>
          </motion.section>

        </motion.div>
      </div>
    </div>
  );
}
