// Network & environment constants for Veil

export const SOLANA_NETWORK = "devnet" as const;
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
export const SOLANA_WSS_URL = process.env.NEXT_PUBLIC_SOLANA_WSS_URL ?? "wss://api.devnet.solana.com";
export const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? "4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7";
/// Umbra devnet dummy USDC (dUSDC) — NOT the standard devnet USDC

// Umbra endpoints (devnet)
export const UMBRA_INDEXER_URL = "https://utxo-indexer.api-devnet.umbraprivacy.com";
export const UMBRA_RELAYER_URL = "https://relayer.api-devnet.umbraprivacy.com";

// Auth
export const JWT_COOKIE_NAME = "veil_session";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
export const NONCE_EXPIRES_MINUTES = 5;

// Fee estimation — Umbra protocol fee is ~0.21% (35 bps out of 16384)
export const FEE_BPS = 35n;
export const FEE_BPS_DIVISOR = 16384n;

export function estimateFee(amountMicroUsdc: bigint): bigint {
  return (amountMicroUsdc * FEE_BPS) / FEE_BPS_DIVISOR;
}

export function formatMicroUsdc(microUsdc: number): string {
  return (microUsdc / 1_000_000).toFixed(2);
}

// Solana explorer
export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

// App
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
