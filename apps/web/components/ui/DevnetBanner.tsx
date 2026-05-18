"use client";

import { useEffect, useState } from "react";

export function DevnetBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" || process.env.NODE_ENV !== "production") {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white border border-black/5 shadow-lg rounded-full px-4 py-2 animate-bounce-slow">
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-veil-bg text-veil-muted text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-veil-primary animate-pulse"></span>
        Devnet Demo
      </div>
    </div>
  );
}
