"use client";

import { useState } from "react";
import { UploadPanel } from "./components/UploadPanel";
import { AgentActivityFeed } from "./components/AgentActivityFeed";
import { EUDRReportPanel } from "./components/EUDRReportPanel";
import { WalletWidget } from "./components/WalletWidget";
import type { AgentEvent } from "./lib/types";
import type { EudrReport } from "./lib/types";

export default function HomePage() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [report, setReport] = useState<EudrReport | null>(null);
  const [running, setRunning] = useState(false);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);

  async function handleSubmit(payload: FormData) {
    setRunning(true);
    setEvents([]);
    setReport(null);

    const res = await fetch("/api/guardian", {
      method: "POST",
      body: payload,
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      for (const line of text.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event: AgentEvent = JSON.parse(line.slice(6));
          setEvents((prev) => [...prev, event]);
          if (event.type === "report_ready") {
            setReport(event.report as EudrReport);
          }
        } catch {
          // partial chunk — ignore
        }
      }
    }

    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a6b3c]">EUDR Guardian</h1>
          <p className="text-xs text-gray-500">Hedera Food Traceability Commerce Agent</p>
        </div>
        <WalletWidget account={walletAccount} onConnect={setWalletAccount} />
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: upload */}
        <div className="lg:col-span-1">
          <UploadPanel onSubmit={handleSubmit} running={running} />
        </div>

        {/* Center: agent feed */}
        <div className="lg:col-span-1">
          <AgentActivityFeed events={events} running={running} />
        </div>

        {/* Right: EUDR report */}
        <div className="lg:col-span-1">
          <EUDRReportPanel report={report} />
        </div>
      </main>
    </div>
  );
}
