"use client";

import Link from "next/link";
import { HeartHandshake, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VeilHeader() {
  const { isLoggedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      if (scrollingDown && currentScrollY > 60) {
        setIsVisible(false);
      } else if (!scrollingDown) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -120 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-0.75rem)] sm:w-[calc(100%-2rem)] max-w-[1200px]"
    >
      <div className="bg-white/70 backdrop-blur-xl border border-black/5 rounded-xl sm:rounded-2xl shadow-sm transition-shadow duration-300">
        <div className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-veil-text flex items-center justify-center text-white shadow-sm group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
              <HeartHandshake className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <span className="font-heading font-black text-lg sm:text-xl tracking-tighter text-veil-text">Veil</span>
          </Link>

          {/* Desktop Nav - visible from md breakpoint */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            <Link
              href="/#features"
              className="px-3 py-1.5 text-sm font-bold text-veil-muted hover:text-veil-text hover:bg-black/5 rounded-lg transition-all duration-200"
            >
              Benefits
            </Link>
            <Link
              href="/#how-it-works"
              className="px-3 py-1.5 text-sm font-bold text-veil-muted hover:text-veil-text hover:bg-black/5 rounded-lg transition-all duration-200"
            >
              How it Works
            </Link>
            <Link
              href="/explore"
              className="px-3 py-1.5 text-sm font-bold text-veil-muted hover:text-veil-text hover:bg-black/5 rounded-lg transition-all duration-200"
            >
              Creators
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>

            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className="text-sm font-bold bg-white border border-black/5 px-3 sm:px-4 py-2 rounded-full text-veil-text hover:border-black/15 hover:shadow-sm transition-all flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-black/5 text-veil-muted hover:text-red-500 hover:border-red-200 transition-all shrink-0"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:block text-sm font-bold text-veil-muted hover:text-veil-text px-3 py-1.5 rounded-lg hover:bg-black/5 transition-all duration-200"
              >
                Log in
              </Link>
            )}

            {/* Mobile Menu Toggle - hidden from md upward */}
            <button
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white border border-black/5 text-veil-text hover:bg-black/5 transition-all shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-black/5 rounded-b-xl sm:rounded-b-2xl"
            >
              <div className="px-4 sm:px-5 py-5 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-veil-text hover:bg-black/5 transition-all">
                    Benefits
                  </Link>
                  <Link href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-veil-text hover:bg-black/5 transition-all">
                    How it Works
                  </Link>
                  <Link href="/explore" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-veil-text hover:bg-black/5 transition-all">
                    Creators
                  </Link>
                </div>

                {/* Connect + Auth shown in mobile menu only when hidden from header */}
                <div className="sm:hidden">
                  <div className="h-px bg-black/5 mb-3" />
                  <div className="flex flex-col gap-3">
                    <ConnectButton className="relative w-full text-left" />
                    {isLoggedIn ? (
                      <>
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-veil-bg py-3 rounded-xl text-center font-bold text-veil-text flex items-center justify-center gap-2">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <button onClick={handleLogout} className="w-full py-3 text-center font-bold text-red-500">
                          Log out
                        </button>
                      </>
                    ) : (
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-veil-text py-3 rounded-xl text-center font-bold text-white">
                        Creator Login
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
