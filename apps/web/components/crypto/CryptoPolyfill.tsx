"use client";

import { install } from "@solana/webcrypto-ed25519-polyfill";

if (typeof window !== "undefined") {
  install();
}

export function CryptoPolyfill({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
