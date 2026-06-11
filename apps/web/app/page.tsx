"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UploadPanel } from "./components/UploadPanel";
import { ScanLookupPanel } from "./components/ScanLookupPanel";
import { AgentActivityFeed } from "./components/AgentActivityFeed";
import { EUDRReportPanel } from "./components/EUDRReportPanel";
import { RemediationReportPanel } from "./components/RemediationReportPanel";
import { WalletWidget } from "./components/WalletWidget";
import type { AgentEvent, EudrReport, RemediationReport } from "./lib/types";

type Tab = "verify" | "remediate";

// Inner component — uses useSearchParams() which requires Suspense above it
function HomeContent() {
  const searchParams = useSearchParams();
  const scanParam = searchParams.get("scan") ?? "";

  const [tab, setTab] = useState<Tab>(scanParam ? "remediate" : "verify");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [report, setReport] = useState<EudrReport | null>(null);
  const [remediationReport, setRemediationReport] = useState<RemediationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);

  async function streamSse(endpoint: string, body: Record<string, unknown>) {
    setRunning(true);
    setEvents([]);
    setReport(null);
    setRemediationReport(null);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const raw = await res.text();
      let msg = `Error ${res.status}`;
      try { msg = (JSON.parse(raw) as { error?: string }).error ?? msg; } catch { msg = raw || msg; }
      setEvents([{ type: "agent_error", timestamp: Date.now(), message: msg }]);
      setRunning(false);
      return;
    }

    if (!res.body) { setRunning(false); return; }

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
          if (event.type === "remediation_report_ready") {
            setRemediationReport(event.remediationReport as RemediationReport);
          }
        } catch {
          // partial chunk — ignore
        }
      }
    }

    setRunning(false);
  }

  async function handleVerify(payload: FormData) {
    let jsonBody: Record<string, unknown>;
    const demo = payload.get("demo");
    const packageFile = payload.get("package");

    if (demo === "true") {
      jsonBody = { demo: true };
    } else if (packageFile instanceof File) {
      try {
        jsonBody = { package: JSON.parse(await packageFile.text()) };
      } catch {
        alert("Invalid JSON file.");
        return;
      }
    } else {
      return;
    }

    await streamSse("/api/guardian", jsonBody);
  }

  async function handleScanLookup(submissionId: string) {
    await streamSse("/api/remediation/from-scan", { submissionId });
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

      {/* Tab switcher */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab("verify")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "verify"
                ? "bg-[#1a6b3c] text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Farm Verification
          </button>
          <button
            onClick={() => setTab("remediate")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "remediate"
                ? "bg-[#1a6b3c] text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Remediate Scan
          </button>
        </div>
      </div>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: input panel */}
        <div className="lg:col-span-1">
          {tab === "verify" ? (
            <UploadPanel onSubmit={handleVerify} running={running} />
          ) : (
            <ScanLookupPanel
              onLookup={handleScanLookup}
              running={running}
              initialId={scanParam}
            />
          )}
        </div>

        {/* Center: agent feed */}
        <div className="lg:col-span-1">
          <AgentActivityFeed events={events} running={running} />
        </div>

        {/* Right: report */}
        <div className="lg:col-span-1">
          {tab === "verify" ? (
            <EUDRReportPanel report={report} />
          ) : (
            <RemediationReportPanel report={remediationReport} />
          )}
        </div>
      </main>
    </div>
  );
}

// Outer shell — wraps HomeContent in Suspense (required by useSearchParams in App Router)
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
