"use client";

import { useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// Hedera Testnet EVM — switch to chainId "0x127" + mainnet RPC for production
const HEDERA_NETWORK = {
  chainId: "0x128",                          // 296 = Hedera Testnet
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

interface Props {
  account: string | null;
  onConnect: (address: string) => void;
}

function MetaMaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 318 318" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M274.1 35.5l-99.7 73.9 18.4-43.6z" fill="#E2761B" stroke="#E2761B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44.4 35.5l98.7 74.6-17.5-44.3zM238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3zM33.9 207.7L50 263l56.7-15.6-26.5-40.6z" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5zM214.9 138.2l-39.4-34.9-1.3 61.3 56.2-2.5zM106.7 247.4l33.8-16.5-29.2-22.8zM177.9 230.9l33.9 16.5-4.7-39.3z" fill="#E4761B" stroke="#E4761B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3zM106.7 247.4l31.5 14.9-.2-9.3 2.6-22.1z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M138.8 193.5l-28.2-8.3 19.9-9.1zM179.7 193.5l8.3-17.4 20 9.1z" fill="#233447" stroke="#233447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M106.7 247.4l4.9-40.6-31.4.9zM206.9 206.8l4.9 40.6 26.5-39.7zM230.8 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zM110.6 185.2l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z" fill="#CD6116" stroke="#CD6116" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M87.8 162.1l23.6 46.1-.8-22.9zM208 185.3l-1 22.9 23.8-46.1zM144.1 164.6l-5.3 28.9 6.6 34.1 1.5-44.9zM174.6 164.6l-2.7 18 1.2 45 6.7-34.1z" fill="#E4751F" stroke="#E4751F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M179.8 193.5l-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zM110.6 185.2l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z" fill="#F6851B" stroke="#F6851B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M180.3 262.3l.3-9.3-2.5-2.2h-37.7l-2.4 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M177.9 230.9l-4.8-3.3h-27.8l-4.8 3.3-2.6 22.1 2.4-2.2h37.7l2.5 2.2z" fill="#161616" stroke="#161616" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M278.3 114.2l8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z" fill="#763D16" stroke="#763D16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M267.2 153.5l-52.3-15.3 15.9 23.9-23.8 46.1 31.3-.4h46.8zM103.6 138.2L51.3 153.5 33.9 208l46.7.4 31.2.4-23.8-46.1zM174.6 164.6l3.3-57.8 15.2-41.1h-67.5l15 41.1 3.5 57.8 1.2 18.2.1 44.8h27.8l.2-44.8z" fill="#F6851B" stroke="#F6851B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function WalletWidget({ account, onConnect }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);

    if (!window.ethereum?.isMetaMask) {
      window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
      setError("MetaMask not detected — install it and try again.");
      return;
    }

    setConnecting(true);
    try {
      // Request wallet accounts
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      // Switch to Hedera network, adding it if not yet configured
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HEDERA_NETWORK.chainId }],
        });
      } catch (switchErr: unknown) {
        const err = switchErr as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HEDERA_NETWORK],
          });
        } else {
          throw switchErr;
        }
      }

      onConnect(accounts[0]);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: number };
      if (e.code === 4001) {
        setError("Connection rejected.");
      } else {
        setError(e.message ?? "Connection failed.");
      }
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setError(null);
    onConnect("");
  }

  function truncate(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
          <span className="text-xs font-mono text-white">{truncate(account)}</span>
        </span>
        <button
          onClick={handleDisconnect}
          className="text-xs text-white/60 hover:text-white transition-colors underline underline-offset-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 text-white text-sm font-medium hover:bg-white/25 border border-white/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <MetaMaskIcon />
        {connecting ? "Connecting…" : "Connect MetaMask"}
      </button>
      {error && (
        <p className="text-xs text-red-300 max-w-[200px] text-right">{error}</p>
      )}
    </div>
  );
}
