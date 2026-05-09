"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import type { CreatorPublic } from "@veil/db";

interface CreatorCardProps {
  creator: CreatorPublic;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Link href={`/c/${creator.slug}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-primary rounded-[32px]">
      <div className="h-full rounded-[32px] overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 group flex flex-col bg-white">
        
        {/* Header background with a decorative gradient/color based on category */}
        <div className="h-28 relative overflow-hidden bg-veil-secondary/30">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-veil-primary/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="absolute -top-10 left-6 w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-sm group-hover:scale-105 transition-transform duration-300">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-veil-primary flex items-center justify-center text-white font-heading font-black text-2xl">
                {creator.displayName[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="pt-14">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading font-black text-xl text-veil-text group-hover:text-veil-primary transition-colors">
                {creator.displayName}
              </h3>
            </div>
            
            <div className="inline-flex items-center gap-1.5 bg-veil-bg px-3 py-1 rounded-full text-xs font-bold text-veil-muted mb-3">
              <span className="opacity-70">{creator.category}</span>
            </div>
            
            <p className="text-veil-text font-medium text-sm mb-5 line-clamp-2 leading-relaxed">
              {creator.bio}
            </p>
            
            <div className="flex items-center justify-between border-t border-black/5 pt-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-veil-text">
                <Heart className="w-4 h-4 text-veil-primary fill-veil-primary" /> {creator.stats.totalSupportEvents} Supporters
              </div>
              <span className="text-veil-primary font-bold text-sm flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                View <ArrowRight className="ml-1 w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
