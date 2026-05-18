"use client";

import Link from "next/link";
import { HeartHandshake, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VeilHeader() {
  const { isLoggedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-veil-bg/80 backdrop-blur-xl z-50 flex items-center justify-center border-b border-black/5 transition-colors">
      <div className="w-full max-w-[1400px] px-6 md:px-10 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-veil-text flex items-center justify-center text-white shadow-sm group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="font-heading font-black text-2xl tracking-tighter text-veil-text">Veil</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link href="/#features" className="text-sm font-bold text-veil-muted hover:text-veil-text transition-colors">
            Benefits
          </Link>
          <Link href="/#how-it-works" className="text-sm font-bold text-veil-muted hover:text-veil-text transition-colors">
            How it Works
          </Link>
          <Link href="/explore" className="text-sm font-bold text-veil-muted hover:text-veil-text transition-colors">
            Creators
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ConnectButton />
          </div>
          
          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-bold bg-white border border-black/5 px-4 py-2 rounded-full text-veil-text hover:border-black/20 transition-colors flex items-center gap-2 shadow-sm">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-black/5 text-veil-muted hover:text-red-500 transition-colors shadow-sm"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block text-sm font-bold text-veil-muted hover:text-veil-text transition-colors ml-2">
              Log in
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white border border-black/5 text-veil-text shadow-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 w-full bg-white border-b border-black/5 shadow-lg flex flex-col p-6 gap-6 lg:hidden"
          >
            <div className="flex flex-col gap-4">
              <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-veil-text">Benefits</Link>
              <Link href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-veil-text">How it Works</Link>
              <Link href="/explore" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-veil-text">Creators</Link>
            </div>
            
            <div className="h-[1px] w-full bg-black/5" />
            
            <div className="flex flex-col gap-4">
              <div className="w-full flex justify-center">
                <ConnectButton />
              </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
