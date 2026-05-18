"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import type { CreatorPublic } from "@veil/db";

import { CreatorCard } from "@/components/creator/CreatorCard";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const CATEGORIES = [
  { label: "All", value: "ALL" },
  { label: "Art", value: "ART" },
  { label: "Music", value: "MUSIC" },
  { label: "Writing", value: "WRITING" },
  { label: "Dev", value: "DEVELOPMENT" },
  { label: "Gaming", value: "GAMING" },
  { label: "Education", value: "EDUCATION" },
  { label: "Other", value: "OTHER" },
];

export default function ExplorePage() {
  const [creators, setCreators] = useState<CreatorPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/creators");
        if (res.ok) {
          const json = await res.json();
          setCreators(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch creators", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  const filtered = creators.filter((c) => {
    const matchesFilter = filter === "ALL" || c.category === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.displayName.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-veil-bg text-veil-text font-body selection:bg-veil-primary selection:text-white">
      <VeilHeader />

      <main className="flex-1 w-full pt-16 relative">
        
        {/* Background Blur */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-veil-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero */}
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 mb-6 shadow-sm">
              <span className="text-xs font-black uppercase tracking-widest text-veil-primary">
                Directory
              </span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter mb-6 text-veil-text">
              Discover creators doing <br />
              <span className="text-veil-muted">great work.</span>
            </h1>
            <p className="text-veil-muted text-lg md:text-xl font-medium max-w-[50ch] leading-relaxed">
              Browse independent artists, builders, and educators — support them privately via the Veil network.
            </p>
          </motion.div>
        </section>

        {/* Search + Filters (Sticky) */}
        <section className="sticky top-16 z-30 bg-veil-bg/80 backdrop-blur-xl border-b border-black/5 py-4 transition-colors">
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-veil-muted/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators..."
                className="w-full h-12 bg-white border border-black/5 rounded-[1rem] pl-12 pr-4 text-base font-medium text-veil-text placeholder:text-veil-muted/60 focus:outline-none focus:border-veil-primary/30 focus:ring-4 focus:ring-veil-primary/10 transition-all shadow-sm"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0 pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-[1rem] text-sm font-bold transition-all ${
                    filter === cat.value
                      ? "bg-veil-text text-white shadow-md scale-105"
                      : "bg-white text-veil-muted border border-black/5 hover:border-black/20 hover:text-veil-text shadow-sm hover:-translate-y-0.5"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-12 pb-32">
          {/* Stats bar */}
          {!loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-10"
            >
              <p className="text-sm font-bold text-veil-muted tracking-tight">
                {filtered.length === creators.length
                  ? `${creators.length} creators`
                  : `Showing ${filtered.length} of ${creators.length} creators`}
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-veil-text bg-white border border-black/5 px-4 py-2 rounded-xl shadow-sm">
                <SlidersHorizontal className="w-4 h-4" />
                Trending
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-black/10 border-t-veil-text animate-spin" />
              <p className="text-sm font-bold tracking-tight text-veil-muted">Loading directory...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="h-80 flex flex-col items-center justify-center text-veil-muted gap-4"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 mb-2">
                <Search className="w-6 h-6 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-heading text-2xl font-black text-veil-text mb-2 tracking-tight">No creators found</p>
                <p className="text-base font-medium">Try a different search or category.</p>
              </div>
              <button
                onClick={() => { setFilter("ALL"); setSearchQuery(""); }}
                className="mt-4 px-6 py-2 bg-white border border-black/10 rounded-full text-sm font-bold text-veil-text hover:border-veil-text transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((creator, i) => (
                  <motion.div
                    layout
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.05 }}
                  >
                    <CreatorCard creator={creator} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CTA */}
          {!loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="mt-32 flex justify-center"
            >
              <div className="text-center bg-white border border-black/5 rounded-[2.5rem] p-12 max-w-2xl w-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-veil-primary/5 rounded-full blur-3xl group-hover:bg-veil-primary/10 transition-colors duration-500 pointer-events-none" />
                
                <p className="text-3xl md:text-4xl font-black font-heading mb-4 text-veil-text tracking-tight">
                  Want to appear here?
                </p>
                <p className="text-veil-muted text-lg font-medium mb-8 max-w-md mx-auto leading-relaxed">
                  Join the Veil directory and start getting supported by your community in under two minutes.
                </p>
                <Link
                  href="/onboard"
                  className="bg-veil-text text-white px-8 py-4 rounded-full text-base font-bold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg group-hover:-translate-y-1"
                >
                  Create your page
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </section>
      </main>

      <VeilFooter />
    </div>
  );
}
