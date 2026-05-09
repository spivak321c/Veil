"use client";

import Link from "next/link";
import { HeartHandshake, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function VeilHeader() {
  const { isLoggedIn } = useAuth();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-veil-bg/90 backdrop-blur-md z-50 flex items-center justify-center border-b border-black/5">
      <div className="w-full max-w-7xl px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-full bg-veil-primary flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="font-heading font-black text-xl md:text-2xl tracking-tight text-veil-text">Veil</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/#features" className="text-sm font-bold text-veil-text hover:text-veil-primary transition-colors">
            Benefits
          </Link>
          <Link href="/#how-it-works" className="text-sm font-bold text-veil-text hover:text-veil-primary transition-colors">
            How it Works
          </Link>
          <Link href="/explore" className="text-sm font-bold text-veil-text hover:text-veil-primary transition-colors">
            Creators
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="text-sm font-bold text-veil-primary transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-veil-muted hover:text-vivid-pink transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
