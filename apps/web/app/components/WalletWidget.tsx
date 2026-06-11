"use client";

interface Props {
  account: string | null;
  onConnect: (accountId: string) => void;
}

export function WalletWidget({ account, onConnect }: Props) {
  function handleConnect() {
    // HashConnect integration wired in Phase 4.
    // For demo, accept a testnet account ID from prompt.
    const id = window.prompt("Enter your Hedera testnet account ID (e.g. 0.0.12345):");
    if (id?.trim()) onConnect(id.trim());
  }

  if (!account) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 rounded-lg bg-white/15 text-white text-sm font-medium hover:bg-white/25 border border-white/30 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-sm font-mono text-gray-700">{account}</span>
      <button
        onClick={() => onConnect("")}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Disconnect
      </button>
    </div>
  );
}
