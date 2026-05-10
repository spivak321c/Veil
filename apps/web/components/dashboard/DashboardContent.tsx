"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useEncryptedBalance } from "@/lib/umbra/useEncryptedBalance";
import { useClaim } from "@/lib/umbra/useClaim";
import { useViewingKey } from "@/lib/umbra/useViewingKey";
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
  RotateCw
} from "lucide-react";
import { formatMicroUsdc } from "@/lib/constants";
import { EventFeed } from "@/components/creator/EventFeed";
import type { CreatorFull } from "@veil/db";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } 
  },
} as const;

export function DashboardContent() {
  const [data, setData] = useState<CreatorFull | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { getBalance } = useEncryptedBalance();
  const { scanAndClaim } = useClaim();
  const { deriveMonthly, deriveYearly } = useViewingKey();

  const [encryptedBalance, setEncryptedBalance] = useState<bigint | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

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

  useEffect(() => {
    fetchDashboard();
    fetchBalance();
  }, []);

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      const { claimed } = await scanAndClaim();
      if (claimed > 0) {
        await fetch("/api/events/claim-all", { method: "POST" });
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
      <div className="h-[50vh] flex items-center justify-center text-veil-muted font-body text-[14px]">
        <div className="w-[24px] h-[24px] rounded-full border-2 border-veil-muted/20 border-t-veil-primary animate-spin mr-[12px]" />
        Loading Dashboard...
      </div>
    );
  }

  if (!data) {
    return <div className="h-[50vh] flex items-center justify-center font-body text-veil-text text-[16px]">NOT AUTHORIZED</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-20">
      {/* Top Actions & Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-black text-veil-text flex items-center gap-3">
            Welcome back, {data.displayName}! <span className="animate-[wiggle_4s_ease-in-out_infinite] inline-block origin-bottom-right">👋</span>
          </h1>
          <p className="text-veil-muted font-medium mt-2 text-lg">Here's what's happening with your page today.</p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/c/${data.slug}`).then(() => toast.success("Link copied!"))}
            className="pill-button-secondary px-6 py-3 text-base w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <a 
            href={`/c/${data.slug}`} 
            target="_blank"
            className="pill-button-primary px-6 py-3 text-base w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> View Public Page
          </a>
        </div>
      </div>

      {/* Metrics Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { 
            label: "Current Balance", 
            value: encryptedBalance !== null ? `$${formatMicroUsdc(Number(encryptedBalance))}` : "---", 
            icon: <Wallet className="w-6 h-6" />, 
            color: "bg-blue-50 text-veil-primary" 
          },
          { 
            label: "Last 30 Days", 
            value: `$${formatMicroUsdc(data.stats.totalVolumeUsdc)}`, // Using lifetime volume as mock for 30d
            icon: <TrendingUp className="w-6 h-6" />, 
            color: "bg-green-50 text-green-500" 
          },
          { 
            label: "Total Supporters", 
            value: data.stats.totalSupportEvents.toString(), 
            icon: <Users className="w-6 h-6" />, 
            color: "bg-veil-secondary/50 text-orange-600" 
          },
        ].map((metric, i) => (
          <motion.div 
            key={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[32px] p-6 shadow-card border border-black/5 flex items-center gap-5 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-14 h-14 rounded-full ${metric.color} flex items-center justify-center`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-veil-muted font-bold text-sm uppercase tracking-wide">{metric.label}</p>
              <h3 className="font-heading text-3xl font-black text-veil-text">{metric.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Spans 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Section */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-heading text-2xl font-black text-veil-text flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-veil-primary" /> Earnings Overview
              </h2>
              <select className="bg-veil-bg border-none text-veil-text font-bold text-sm rounded-full px-4 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-veil-primary">
                <option>Last 6 Months</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
            </div>

            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 mt-6 relative border-b-2 border-veil-bg pb-2">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs font-bold text-veil-muted/50 pb-2 -ml-2">
                <span>$2k</span>
                <span>$1k</span>
                <span>$0</span>
              </div>

              <div className="w-full flex justify-between items-end h-full pl-8">
                {[
                  { h: "30%", label: "Jan", val: "$450" },
                  { h: "45%", label: "Feb", val: "$680" },
                  { h: "25%", label: "Mar", val: "$320" },
                  { h: "60%", label: "Apr", val: "$950" },
                  { h: "85%", label: "May", val: "$1,250", active: true },
                ].map((bar, i) => (
                  <div key={i} className={`relative w-full max-w-[40px] ${bar.active ? 'bg-veil-primary' : 'bg-veil-secondary'} rounded-t-xl transition-colors duration-300 cursor-pointer group`} style={{ height: bar.h }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-veil-text text-white text-xs font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                      {bar.val}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-veil-text"></div>
                    </div>
                    <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold ${bar.active ? 'text-veil-text' : 'text-veil-muted'}`}>{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Recent Tips Section */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-2xl font-black text-veil-text flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500" /> Recent Support
              </h2>
              <button className="text-sm font-bold text-veil-primary hover:text-blue-700 transition-colors">View All</button>
            </div>

            <EventFeed events={data.stats.recentEvents} />
          </motion.section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* Wallet Card */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-veil-bg rounded-[32px] p-8 shadow-card border border-black/5 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-veil-primary/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h2 className="font-heading text-xl font-black text-veil-text mb-2">
              Your Wallet
            </h2>
            <p className="text-sm font-bold text-veil-muted mb-6">Available to withdraw</p>
            
            <div className="mb-8">
              <h3 className="font-heading text-5xl font-black text-veil-text tracking-tight flex items-start gap-1">
                <span className="text-2xl mt-1 text-veil-muted">$</span>
                {encryptedBalance !== null ? formatMicroUsdc(Number(encryptedBalance)) : "---"}
              </h3>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleClaim}
                disabled={isClaiming || data.stats.pendingEvents === 0}
                className="w-full pill-button-primary px-6 py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClaiming ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <RotateCw className="w-4 h-4" />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    Claim {data.stats.pendingEvents > 0 ? `${data.stats.pendingEvents} Payment${data.stats.pendingEvents > 1 ? "s" : ""}` : "Payments"}
                  </>
                )}
              </button>
              <button className="w-full pill-button-secondary bg-transparent border-black/20 hover:bg-white px-6 py-3.5 text-base flex items-center justify-center gap-2 text-veil-muted">
                <span>SOL</span> Transfer Crypto
              </button>
            </div>
          </motion.section>

          {/* Share Page Card */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
          >
            <h2 className="font-heading text-xl font-black text-veil-text mb-4 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-orange-400" /> Spread the word
            </h2>
            <p className="text-sm font-medium text-veil-muted mb-6 leading-relaxed">
              Share your link on Twitter, YouTube, or anywhere your fans hang out.
            </p>
            
            <div className="flex items-center gap-2 bg-veil-bg p-2 rounded-full border border-black/5 mb-6">
              <div className="bg-white px-4 py-2 rounded-full flex-1 text-sm font-bold text-veil-text truncate select-all">
                veil.to/{data.slug}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/c/${data.slug}`).then(() => toast.success("Link copied!"))}
                className="bg-veil-text text-white p-2.5 rounded-full hover:bg-veil-primary transition-colors active:scale-95 flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-full font-bold px-6 py-3 text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
              Twitter Share
            </button>
          </motion.section>

          {/* Top Supporters */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
          >
            <h2 className="font-heading text-xl font-black text-veil-text mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" /> Top Supporters
            </h2>

            <div className="space-y-4">
              {[
                { name: "Sarah Jenkins", val: "$450", img: "https://pquxfbbxflqvtidtlrhl.supabase.co/storage/v1/object/public/hmac-uploads/brand/d8377d16-bae1-4eb6-9fbc-5bcd192d86f4/assets/e1420747-0876-4400-836d-4fc1805dc264.webp", crown: true },
                { name: "MikeTriesToCode", val: "$200", img: null },
                { name: "Anonymous", val: "$150", img: null, ghost: true },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {s.img ? (
                        <img src={s.img} alt={s.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${s.ghost ? 'bg-veil-primary/20 text-veil-primary' : 'bg-veil-secondary text-veil-text font-bold'}`}>
                          {s.ghost ? <Ghost className="w-5 h-5" /> : s.name[0]}
                        </div>
                      )}
                      {s.crown && <span className="absolute -top-2 -left-2 text-lg drop-shadow-md transform -rotate-12">👑</span>}
                    </div>
                    <span className="font-bold text-veil-text text-sm">{s.name}</span>
                  </div>
                  <span className="font-black text-veil-primary text-sm">{s.val}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-sm font-bold text-veil-primary hover:text-blue-700 transition-colors py-2 bg-blue-50 hover:bg-blue-100 rounded-full">
              View Leaderboard
            </button>
          </motion.section>

          {/* Reporting Card */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white rounded-[32px] p-8 shadow-card border border-black/5"
          >
            <h2 className="font-heading text-xl font-black text-veil-text mb-4">Reporting</h2>
            <p className="text-sm font-medium text-veil-muted mb-6 leading-relaxed">
              Generate viewing keys to securely prove your encrypted revenue.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleGenerateKey("monthly")}
                className="group flex items-center justify-between w-full p-4 border border-black/5 rounded-2xl bg-veil-bg hover:bg-veil-secondary transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-veil-text text-sm">Monthly Key</span>
                  <span className="text-xs text-veil-muted">Current Month</span>
                </div>
                <Download className="w-4 h-4 text-veil-muted group-hover:text-veil-primary" />
              </button>
              <button 
                onClick={() => handleGenerateKey("yearly")}
                className="group flex items-center justify-between w-full p-4 border border-black/5 rounded-2xl bg-veil-bg hover:bg-veil-secondary transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-veil-text text-sm">Yearly Key</span>
                  <span className="text-xs text-veil-muted">Full Year Scope</span>
                </div>
                <Download className="w-4 h-4 text-veil-muted group-hover:text-veil-primary" />
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
