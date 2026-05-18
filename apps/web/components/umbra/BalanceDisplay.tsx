"use client";

import { useEffect, useState } from "react";
import { useEncryptedBalance, type AccountState } from "@/lib/umbra/useEncryptedBalance";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EyeOff, RefreshCw } from "lucide-react";

export function BalanceDisplay() {
  const { getBalance } = useEncryptedBalance();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [accountState, setAccountState] = useState<AccountState>("none");
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const result = await getBalance();
      setBalance(result.balance);
      setAccountState(result.state);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const formatUSDC = (micro: bigint | null) => {
    if (micro === null) return "0.00";
    return (Number(micro) / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-iron/10 bg-canvas p-[32px] group font-sans">
      <div className="absolute top-0 right-0 w-[256px] h-[256px] bg-sky-blue/5 rounded-full blur-[80px] group-hover:bg-sky-blue/10 transition-colors pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[12px]">
            <div className="p-[8px] bg-iron/5 rounded-[12px]">
              <EyeOff className="w-[24px] h-[24px] text-ink" />
            </div>
            <h2 className="text-iron font-medium text-[15px]">Encrypted Balance</h2>
          </div>
          {loading && <Spinner size="sm" />}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {accountState === "mxe" ? (
            <div className="flex items-baseline gap-[8px]">
              <div className="font-mono text-display font-light text-ink tracking-[-2px] leading-[1.0]">
                🔒 MXE
              </div>
              <span className="text-iron font-mono text-[16px] mb-[8px]">USDC</span>
            </div>
          ) : balance !== null ? (
            <div className="flex items-baseline gap-[8px]">
              <div className="font-mono text-display font-light text-ink tracking-[-2px] leading-[1.0]">
                <span className="text-silver-thread mr-[8px] text-[40px]">$</span>
                {formatUSDC(balance)}
              </div>
              <span className="text-iron font-mono text-[16px] mb-[8px]">USDC</span>
            </div>
          ) : (
            <div className="font-mono text-display font-light text-silver-thread tracking-[-2px] leading-[1.0]">
              $---
            </div>
          )}
          <p className="text-[14px] text-iron mt-[16px] max-w-md">
            {accountState === "mxe"
              ? "Balance is in MXE (locked) mode. Use withdraw to claim via Arcium MPC."
              : "This balance is secured by Arcium MPC. It represents the sum of all your claimed stealth payments."}
          </p>
        </div>

        <div className="mt-[32px] flex justify-end">
          <button 
            onClick={fetchBalance}
            disabled={loading}
            className="flex items-center gap-[8px] px-[16px] py-[8px] rounded-[30px] bg-iron/5 text-[14px] font-medium text-iron hover:text-ink hover:bg-iron/10 transition-colors border border-iron/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <RefreshCw className={`w-[16px] h-[16px] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
