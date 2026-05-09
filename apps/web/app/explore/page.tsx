"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowDown } from "lucide-react";
import type { CreatorPublic } from "@veil/db";

import { CreatorCard } from "@/components/creator/CreatorCard";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const CATEGORIES = [
  { label: "All Creators", value: "ALL", icon: "✨" },
  { label: "Digital Art", value: "ART", icon: "🎨" },
  { label: "Music", value: "MUSIC", icon: "🎵" },
  { label: "Writing", value: "WRITING", icon: "✍️" },
  { label: "Software", value: "DEVELOPMENT", icon: "💻" },
  { label: "Crafts", value: "OTHER", icon: "🧶" }, // Mapping OTHER to Crafts for demo
  { label: "Education", value: "EDUCATION", icon: "🎙️" },
  { label: "Gaming", value: "GAMING", icon: "🎮" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } 
  },
} as const;

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

  const filtered = creators.filter(c => {
    const matchesFilter = filter === "ALL" || c.category === filter;
    const matchesSearch = c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.bio.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text font-body overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-0 w-full overflow-hidden h-[600px] pointer-events-none z-0">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-white/40 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute top-40 right-[15%] w-96 h-96 bg-veil-primary/10 rounded-full blur-3xl animate-[float_6s_ease-in-out_3s_infinite]"></div>
      </div>

      <VeilHeader />

      <main className="flex-1 w-full pt-16 relative z-10">
        {/* Hero & Search Section */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-black/5 mb-6 hover:scale-105 transition-transform cursor-default">
              <span className="text-xl animate-bounce">✨</span>
              <span className="text-sm font-bold text-veil-text">Discover independent creators</span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-8 text-veil-text">
              Find your new favorite <br className="hidden md:block" />
              <span className="text-veil-primary">artists & builders.</span>
            </h1>
            
            <div className="w-full max-w-2xl relative mt-4 shadow-card hover:shadow-card-hover transition-shadow duration-300 rounded-full group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="w-6 h-6 text-veil-muted group-focus-within:text-veil-primary transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for creators, topics, or niches..." 
                className="w-full bg-white text-veil-text text-lg font-medium rounded-full py-5 pl-14 pr-32 outline-none border-2 border-transparent focus:border-veil-primary/20 transition-all placeholder:text-veil-muted/60"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-veil-text text-white px-6 rounded-full font-bold hover:bg-veil-primary transition-colors active:scale-95">
                Search
              </button>
            </div>
          </motion.div>
        </section>

        {/* Filters & Sort */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 sticky top-20 z-40 bg-veil-bg/95 backdrop-blur-sm py-4 border-b border-black/5 -mx-6 px-6 md:mx-auto md:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto overflow-x-auto hide-scrollbar flex items-center gap-2 pb-2 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                    filter === cat.value 
                      ? "bg-veil-text text-white shadow-md" 
                      : "bg-white text-veil-text border border-black/5 hover:bg-veil-secondary hover:border-veil-secondary"
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            <div className="w-full md:w-auto flex justify-end shrink-0">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-veil-text border border-black/5 font-bold text-sm hover:bg-veil-secondary transition-colors">
                <ArrowDown className="w-4 h-4 text-veil-muted" />
                Sort: Trending
              </button>
            </div>
          </div>
        </section>

        {/* Creator Grid */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-32 pt-8">
          {loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-veil-muted font-body text-[14px]">
              <div className="w-[24px] h-[24px] rounded-full border-2 border-veil-muted/20 border-t-veil-primary animate-spin mb-[16px]" />
              Fetching directory...
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[300px] flex flex-col items-center justify-center text-veil-muted"
            >
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-body text-[16px]">No creators found matching your search</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((creator, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                    key={creator.id}
                  >
                    <CreatorCard creator={creator} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Bottom CTA */}
          <div className="mt-24 flex justify-center">
            <div className="text-center p-12 rounded-[48px] bg-veil-primary/10 border border-black/5 max-w-3xl">
              <h2 className="font-heading text-3xl font-black mb-4 text-veil-text">
                Want to be featured here?
              </h2>
              <p className="text-veil-muted text-lg mb-8 font-medium">
                Set up your Veil page in minutes and start receiving private support.
              </p>
              <Link href="/onboard" className="pill-button-primary px-10 py-4 text-lg inline-flex items-center gap-2">
                Start your creator page <span>✨</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <VeilFooter />
    </div>
  );
}
