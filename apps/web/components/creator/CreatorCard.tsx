"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import type { CreatorPublic } from "@veil/db";

const CATEGORY_COLORS: Record<string, string> = {
  ART: "bg-rose-50 text-rose-600",
  MUSIC: "bg-purple-50 text-purple-600",
  WRITING: "bg-amber-50 text-amber-700",
  DEVELOPMENT: "bg-sky-50 text-sky-600",
  GAMING: "bg-green-50 text-green-600",
  EDUCATION: "bg-orange-50 text-orange-600",
  OTHER: "bg-gray-50 text-gray-500",
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
  ART: "from-rose-100 to-pink-50",
  MUSIC: "from-purple-100 to-violet-50",
  WRITING: "from-amber-100 to-yellow-50",
  DEVELOPMENT: "from-sky-100 to-cyan-50",
  GAMING: "from-green-100 to-emerald-50",
  EDUCATION: "from-orange-100 to-amber-50",
  OTHER: "from-gray-100 to-slate-50",
};

interface CreatorCardProps {
  creator: CreatorPublic;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const accent = CATEGORY_ACCENT[creator.category] ?? "from-veil-secondary/30 to-white";
  const badge = CATEGORY_COLORS[creator.category] ?? "bg-gray-50 text-gray-500";
  const label = CATEGORY_LABELS[creator.category] ?? creator.category;
  const minTier = creator.tiers.length > 0
    ? Math.min(...creator.tiers.map((t) => t.amountUsdc))
    : null;

  return (
    <Link
      href={`/c/${creator.slug}`}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-primary rounded-[28px]"
    >
      <div className="h-full rounded-[28px] overflow-hidden border border-black/[0.06] bg-white hover:border-black/10 hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(32,32,32,0.12)] transition-all duration-300 group flex flex-col">
        {/* Top gradient banner */}
        <div className={`h-24 bg-gradient-to-br ${accent} relative overflow-hidden shrink-0`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/30 blur-xl group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute right-4 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${badge}`}>
              {label}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 flex flex-col flex-1 relative">
          {/* Avatar — overlaps banner */}
          <div className="absolute -top-7 left-5 w-14 h-14 rounded-full border-[3px] border-white overflow-hidden bg-white shadow-md group-hover:scale-105 transition-transform duration-300">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-heading font-black text-xl">
                {creator.displayName[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + category */}
          <div className="pt-10">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-black text-[17px] text-veil-text leading-tight group-hover:text-veil-primary transition-colors">
                {creator.displayName}
              </h3>
              <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${badge} group-hover:opacity-0 transition-opacity`}>
                {label}
              </span>
            </div>

            <p className="text-veil-muted text-[13px] font-medium leading-relaxed line-clamp-2 mb-4">
              {creator.bio}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-black/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-veil-muted">
              <Users className="w-3.5 h-3.5" />
              {creator.stats.totalSupportEvents}{" "}
              {creator.stats.totalSupportEvents === 1 ? "supporter" : "supporters"}
            </div>
            {minTier !== null && (
              <span className="text-xs font-black text-veil-text bg-veil-bg px-2.5 py-1 rounded-full">
                from ${(minTier / 1_000_000).toFixed(0)}
              </span>
            )}
            <span className="text-veil-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 flex items-center gap-1 text-xs font-black">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
