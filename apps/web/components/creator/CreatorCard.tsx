"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import type { CreatorPublic } from "@veil/db";
import { motion } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  ART: "bg-rose-50 text-rose-600 border-rose-100",
  MUSIC: "bg-purple-50 text-purple-600 border-purple-100",
  WRITING: "bg-amber-50 text-amber-700 border-amber-100",
  DEVELOPMENT: "bg-sky-50 text-sky-600 border-sky-100",
  GAMING: "bg-green-50 text-green-600 border-green-100",
  EDUCATION: "bg-orange-50 text-orange-600 border-orange-100",
  OTHER: "bg-gray-50 text-gray-500 border-gray-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  ART: "Digital Art",
  MUSIC: "Music",
  WRITING: "Writing",
  DEVELOPMENT: "Development",
  GAMING: "Gaming",
  EDUCATION: "Education",
  OTHER: "Other",
};

const CATEGORY_ACCENT: Record<string, string> = {
  ART: "from-rose-100/50 to-pink-50/20",
  MUSIC: "from-purple-100/50 to-violet-50/20",
  WRITING: "from-amber-100/50 to-yellow-50/20",
  DEVELOPMENT: "from-sky-100/50 to-cyan-50/20",
  GAMING: "from-green-100/50 to-emerald-50/20",
  EDUCATION: "from-orange-100/50 to-amber-50/20",
  OTHER: "from-gray-100/50 to-slate-50/20",
};

interface CreatorCardProps {
  creator: CreatorPublic;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const accent = CATEGORY_ACCENT[creator.category] ?? "from-veil-secondary/30 to-white/10";
  const badge = CATEGORY_COLORS[creator.category] ?? "bg-gray-50 text-gray-500 border-gray-200";
  const label = CATEGORY_LABELS[creator.category] ?? creator.category;
  const minTier = creator.tiers.length > 0
    ? Math.min(...creator.tiers.map((t) => t.amountUsdc))
    : null;

  return (
    <Link
      href={`/c/${creator.slug}`}
      className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-veil-text rounded-[1.5rem]"
    >
      <div className="h-full rounded-[1.5rem] overflow-hidden border border-black/5 bg-white hover:border-black/10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group flex flex-col relative transform hover:-translate-y-1">
        
        {/* Top gradient banner */}
        <div className={`h-24 bg-gradient-to-br ${accent} relative overflow-hidden shrink-0`}>
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/noise.png')] mix-blend-overlay" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/40 blur-xl group-hover:scale-150 transition-transform duration-700 ease-out" />
        </div>

        <div className="px-6 pb-6 flex flex-col flex-1 relative">
          {/* Avatar - overlaps banner */}
          <div className="absolute -top-8 left-6 w-16 h-16 rounded-[1rem] border-4 border-white overflow-hidden bg-veil-bg shadow-sm group-hover:scale-105 transition-transform duration-500 ease-out flex items-center justify-center">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-veil-bg flex items-center justify-center text-veil-text font-heading font-black text-2xl">
                {creator.displayName[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="absolute top-3 right-5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${badge} opacity-100 group-hover:opacity-0 transition-opacity duration-300 shadow-sm`}>
              {label}
            </span>
          </div>

          {/* Name + bio */}
          <div className="pt-12 flex-1">
            <h3 className="font-heading font-black text-xl text-veil-text leading-tight mb-2 tracking-tight group-hover:text-veil-text transition-colors">
              {creator.displayName}
            </h3>

            <p className="text-veil-muted text-sm font-medium leading-relaxed line-clamp-2">
              {creator.bio}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-veil-muted group-hover:text-veil-text transition-colors">
              <Users className="w-4 h-4" />
              {creator.stats.totalSupportEvents}{" "}
              {creator.stats.totalSupportEvents === 1 ? "supporter" : "supporters"}
            </div>
            
            <div className="flex items-center">
              {minTier !== null && (
                <span className="text-xs font-black text-veil-text px-2 py-1 rounded-lg bg-veil-bg group-hover:opacity-0 transition-opacity absolute right-6">
                  from ${(minTier / 1_000_000).toFixed(0)}
                </span>
              )}
              <span className="text-veil-text opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 flex items-center gap-1.5 text-xs font-black absolute right-6">
                View <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
