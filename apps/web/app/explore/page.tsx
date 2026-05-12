"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />

      <main className="flex-1 w-full pt-16">
        {/* ── Hero ── */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="max-w-2xl"
          >
            <p className="text-xs font-black uppercase tracking-widest text-veil-primary mb-4">
              Creator Directory
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4 text-veil-text">
              Discover creators doing{" "}
              <span className="relative inline-block">
                <span className="relative z-10">great work.</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-veil-secondary -z-10 rounded-full -rotate-1" />
              </span>
            </h1>
            <p className="text-veil-muted text-lg font-medium">
              Browse independent artists, builders, and educators — support them privately.
            </p>
          </motion.div>
        </section>

        {/* ── Search + Filters ── */}
        <section className="sticky top-16 z-30 bg-veil-bg/95 backdrop-blur-md border-b border-black/5">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veil-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators..."
                className="w-full h-10 bg-white border border-black/8 rounded-xl pl-10 pr-4 text-sm font-medium text-veil-text placeholder:text-veil-muted/60 focus:outline-none focus:border-veil-primary/30 transition-colors"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    filter === cat.value
                      ? "bg-veil-text text-white shadow-sm"
                      : "bg-white text-veil-muted border border-black/8 hover:border-veil-text/20 hover:text-veil-text"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Grid ── */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10 pb-24">
          {/* Stats bar */}
          {!loading && (
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm font-bold text-veil-muted">
                {filtered.length === creators.length
                  ? `${creators.length} creators`
                  : `${filtered.length} of ${creators.length} creators`}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-veil-muted bg-white border border-black/8 px-3 py-1.5 rounded-xl">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Trending
              </div>
            </div>
          )}

          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-veil-primary/20 border-t-veil-primary animate-spin" />
              <p className="text-sm font-medium text-veil-muted">Loading creators…</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-80 flex flex-col items-center justify-center text-veil-muted gap-4"
            >
              <Search className="w-10 h-10 opacity-30" />
              <div className="text-center">
                <p className="font-bold text-veil-text mb-1">No creators found</p>
                <p className="text-sm">Try a different search or category</p>
              </div>
              <button
                onClick={() => { setFilter("ALL"); setSearchQuery(""); }}
                className="text-sm font-bold text-veil-primary hover:underline"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((creator, i) => (
                  <motion.div
                    layout
                    key={creator.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                  >
                    <CreatorCard creator={creator} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CTA */}
          {!loading && (
            <div className="mt-20 flex justify-center">
              <div className="text-center bg-white border border-black/6 rounded-[32px] p-10 max-w-lg">
                <p className="text-2xl font-black font-heading mb-2 text-veil-text">
                  Want to appear here?
                </p>
                <p className="text-veil-muted text-sm font-medium mb-6">
                  Set up your Veil creator page in under two minutes.
                </p>
                <Link
                  href="/onboard"
                  className="pill-button-primary px-8 py-3 text-sm inline-flex items-center gap-2"
                >
                  Create your page
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <VeilFooter />
    </div>
  );
}
