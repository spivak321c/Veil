"use client";

import { useState, useRef, useEffect } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { ChevronDown, LogOut, Wallet as WalletIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ConnectButton({ className }: { className?: string }) {
  const { connectors, connect, disconnect, connected, wallet } = useWalletConnection();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const containerClass = className || "relative inline-block text-left";

  if (connected && wallet) {
    return (
      <div className={containerClass} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-[8px] h-[44px] px-[24px] rounded-[30px] bg-ink text-canvas font-sans font-medium hover:bg-ink/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
        >
          <div className="w-[8px] h-[8px] rounded-full bg-green-400" />
          {formatAddress(wallet.account.address)}
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-48 rounded-[16px] bg-white border border-iron/10 shadow-lg overflow-hidden z-50 p-1"
            >
              <button
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-[14px] text-vivid-pink hover:bg-vivid-pink/10 rounded-[12px] transition-colors flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={containerClass} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-[8px] h-[44px] px-[24px] rounded-[30px] bg-ink text-canvas font-sans font-medium hover:bg-ink/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink"
      >
        <WalletIcon className="w-4 h-4" />
        Connect Wallet
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-[16px] bg-white border border-iron/10 shadow-lg overflow-hidden z-50 p-2"
          >
            {connectors.length > 0 ? (
              <div className="flex flex-col gap-1">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect(connector.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-[14px] text-ink hover:bg-iron/5 rounded-[12px] transition-colors flex items-center gap-3 font-medium"
                  >
                    {connector.icon && (
                      <img src={connector.icon} alt={connector.name} className="w-6 h-6 rounded-md" />
                    )}
                    {connector.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-[14px] text-iron text-center">
                No wallets found. Please install Phantom or Solflare.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
