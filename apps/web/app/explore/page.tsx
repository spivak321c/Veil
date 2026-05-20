"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
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

      <main className="flex-1 w-full pt-12 relative">

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-veil-primary/4 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[20%] left-[-10%] w-[30vw] h-[30vw] bg-veil-accent/4 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero */}
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/5 mb-4 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-widest text-veil-primary">
                  Directory
                </span>
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-black leading-[1.05] tracking-tighter">
                Discover{" "}
                <span className="text-gradient-primary">creators</span>
              </h1>
              <p className="text-veil-muted text-sm md:text-base font-medium mt-2 max-w-lg leading-relaxed">
                Browse independent artists, builders, and educators — and support them privately via the Veil network.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              className="relative w-full md:w-72 shrink-0"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veil-muted/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators..."
                className="w-full h-11 bg-white border border-black/5 rounded-xl pl-10 pr-4 text-sm font-medium text-veil-text placeholder:text-veil-muted/50 focus:outline-none focus:border-veil-primary/30 focus:ring-4 focus:ring-veil-primary/10 transition-all shadow-sm"
              />
            </motion.div>
          </div>
        </section>

        {/* Filters row */}
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-4">
          <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
            {!loading && (
              <span className="text-xs font-bold text-veil-muted/60 tracking-tight shrink-0">
                {filtered.length === creators.length
                  ? `${creators.length} creator${creators.length !== 1 ? "s" : ""}`
                  : `${filtered.length} of ${creators.length}`}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === cat.value
                      ? "bg-veil-text text-white shadow-sm"
                      : "bg-white text-veil-muted border border-black/5 hover:border-black/20 hover:text-veil-text shadow-sm"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-6 pb-32">
          {loading ? (
            <div className="h-60 flex flex-col items-center justify-center gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-black/10 border-t-veil-text animate-spin" />
              <p className="text-sm font-bold tracking-tight text-veil-muted">Loading directory...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="h-60 flex flex-col items-center justify-center text-veil-muted gap-4"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5">
                <Search className="w-5 h-5 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-heading text-lg font-black text-veil-text mb-1 tracking-tight">No creators found</p>
                <p className="text-sm font-medium">Try a different search or category.</p>
              </div>
              <button
                onClick={() => { setFilter("ALL"); setSearchQuery(""); }}
                className="mt-2 px-5 py-2 bg-white border border-black/10 rounded-full text-sm font-bold text-veil-text hover:border-veil-text transition-colors"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.04 }}
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
              className="mt-16 flex justify-center"
            >
              <div className="text-center bg-white border border-black/5 rounded-[2rem] p-10 max-w-lg w-full shadow-sm relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-veil-primary/5 rounded-full blur-3xl group-hover:bg-veil-primary/10 transition-colors duration-500 pointer-events-none" />

                <p className="text-2xl font-black font-heading mb-2 text-veil-text tracking-tight">
                  Want to appear here?
                </p>
                <p className="text-veil-muted text-sm font-medium mb-6 max-w-sm mx-auto leading-relaxed">
                  Join the Veil directory and start getting supported by your community in under two minutes.
                </p>
                <Link
                  href="/onboard"
                  className="bg-veil-text text-white px-7 py-3.5 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md group-hover:-translate-y-0.5"
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
