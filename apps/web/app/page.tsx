"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UploadPanel } from "./components/UploadPanel";
import { ScanLookupPanel } from "./components/ScanLookupPanel";
import { AgentActivityFeed } from "./components/AgentActivityFeed";
import { EUDRReportPanel } from "./components/EUDRReportPanel";
import { RemediationReportPanel } from "./components/RemediationReportPanel";
import { WalletWidget } from "./components/WalletWidget";
import { CountdownTimer } from "./components/CountdownTimer";
import type { AgentEvent, EudrReport, RemediationReport } from "./lib/types";

type Tab = "verify" | "remediate";

// ─── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative min-h-[620px] md:min-h-[720px] flex items-center overflow-hidden">
      <img
        src="/eudr-compliance-hero.png"
        alt="EUDR Compliance"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-[#4B0082]/45" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28 w-full">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-medium text-white/90 uppercase tracking-widest">
            Hedera Food Traceability Commerce Agent
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            EUDR Compliance,<br />Verified by AI.<br />Secured on Hedera.
          </h1>
          <p className="text-sm font-medium text-white/90 leading-relaxed max-w-xl">
            7 specialist AI agents verify geolocation, deforestation risk, legality,
            due diligence, and farm records — each paid in HBAR. Get your Due Diligence
            Statement before the December 2026 enforcement deadline.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGetStarted}
              className="bg-[#4B0082] hover:bg-[#3A0066] border border-white/30 text-white font-semibold px-8 py-3 rounded-md transition-colors text-sm"
            >
              Start EUDR Verification
            </button>
            <a
              href="https://zigotrace.com/eudr-scan"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#4B0082] hover:bg-white/90 font-semibold px-8 py-3 rounded-md transition-colors text-sm"
            >
              Start Your Free EUDR Quick Scan
            </a>
          </div>

          <CountdownTimer />
        </div>
      </div>
    </section>
  );
}

// ─── What is EUDR ─────────────────────────────────────────────────────────────

function WhatIsEudrSection() {
  const eudrPoints = [
    "EU Regulation 2023/1115 requires suppliers of 7 commodities to prove no deforestation occurred after December 31, 2020.",
    "Affected commodities: coffee, cocoa, palm oil, soy, rubber, cattle, and timber products.",
    "Every shipment entering the EU market requires a Due Diligence Statement (DDS) backed by verifiable data.",
    "Non-compliance risks market exclusion, import bans, fines, and lasting reputational damage.",
  ];

  const assessPoints = [
    "Profile & Registration — operator identity, commodity type, and cooperative membership (10%)",
    "Geolocation & Traceability — GPS farm polygons, plot mapping, and harvest chain records (30%)",
    "Legality — land rights documentation, labour law compliance, and local permits (20%)",
    "Due Diligence — deforestation risk assessment, buyer traceability, and DDS readiness (25%)",
    "Risk Management — EUDR awareness level, sustainability certification, and mitigation plans (15%)",
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 md:gap-20">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-[#4B0082] mb-8">
            What is EUDR?
          </h2>
          <div className="space-y-5">
            {eudrPoints.map((point, i) => (
              <div key={i} className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-[#4B0082] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-semibold">{i + 1}</span>
                </div>
                <p className="text-sm font-medium text-black leading-relaxed pt-2">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-[#4B0082] mb-8">
            What We Assess
          </h2>
          <div className="space-y-5">
            {assessPoints.map((point, i) => (
              <div key={i} className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-[#4B0082] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-semibold">{i + 1}</span>
                </div>
                <p className="text-sm font-medium text-black leading-relaxed pt-2">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── What You'll Get ──────────────────────────────────────────────────────────

function WhatYoullGetSection({ onGetStarted }: { onGetStarted: () => void }) {
  const cards: Array<
    | { type: "image"; src: string; alt: string }
    | { type: "text"; title: string; body: string }
  > = [
    { type: "image", src: "/eudr-farm-compliance.png",      alt: "Farm compliance verification" },
    {
      type: "text",
      title: "7-Agent AI Compliance Suite",
      body: "Geolocation, deforestation risk, agronomy, legality, farm records, counterfeit detection, and DDS generation — all automated and parallelised.",
    },
    {
      type: "text",
      title: "HBAR-Powered Agent Commerce",
      body: "Each specialist agent is paid in HBAR via MPP multi-party payment split. Transparent, on-chain, and fully auditable on Hedera.",
    },
    { type: "image", src: "/hedera-blockchain-payment.png", alt: "Hedera blockchain payments" },
    { type: "image", src: "/remediation-plan.png",          alt: "AI corrective action plan" },
    {
      type: "text",
      title: "AI Corrective Action Plans",
      body: "Guardian fetches your EUDR scan results from zigotrace.com and builds a prioritised remediation plan with direct ZigoTrace service links.",
    },
    {
      type: "text",
      title: "TracePass NFT Certification",
      body: "Farms scoring ≥65% receive a TracePass NFT minted on Hedera Token Service — a portable, verifiable EUDR compliance badge.",
    },
    { type: "image", src: "/trace-pass-certificate.png",    alt: "TracePass NFT certificate" },
  ];

  return (
    <section className="bg-[#F6F7F1] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-2 items-center mb-8 gap-6">
          <h2 className="text-xl md:text-2xl font-semibold text-[#4B0082]">
            What You&apos;ll Get
          </h2>
          <div className="lg:text-right flex lg:justify-end gap-3 flex-wrap">
            <button
              onClick={onGetStarted}
              className="bg-[#4B0082] hover:bg-[#3A0066] text-white font-semibold px-8 py-3 rounded-md transition-colors text-sm"
            >
              Start Verification
            </button>
            <a
              href="https://zigotrace.com/eudr-scan"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#4B0082] text-[#4B0082] hover:bg-[#4B0082] hover:text-white font-semibold px-8 py-3 rounded-md transition-colors text-sm"
            >
              Free Quick Scan
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {cards.map((card, i) =>
            card.type === "image" ? (
              <div key={i} className="h-56 md:h-64 overflow-hidden rounded-lg bg-[#4B0082]/10">
                <img src={card.src} alt={card.alt} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div key={i} className="bg-white rounded-lg p-5 md:p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#4B0082] mb-3">{card.title}</h3>
                  <p className="text-sm font-medium text-black leading-relaxed">{card.body}</p>
                </div>
                <button
                  onClick={onGetStarted}
                  className="mt-4 text-sm font-medium text-black hover:underline text-left"
                >
                  Learn More
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function HomeContent() {
  const searchParams = useSearchParams();
  const scanParam = searchParams.get("scan") ?? "";

  const [tab, setTab] = useState<Tab>(scanParam ? "remediate" : "verify");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [report, setReport] = useState<EudrReport | null>(null);
  const [remediationReport, setRemediationReport] = useState<RemediationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);

  function scrollToTool() {
    document.getElementById("tool-section")?.scrollIntoView({ behavior: "smooth" });
  }

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
          if (event.type === "report_ready") setReport(event.report as EudrReport);
          if (event.type === "remediation_report_ready") setRemediationReport(event.remediationReport as RemediationReport);
        } catch { /* partial chunk */ }
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
      try { jsonBody = { package: JSON.parse(await packageFile.text()) }; }
      catch { alert("Invalid JSON file."); return; }
    } else { return; }
    scrollToTool();
    await streamSse("/api/guardian", jsonBody);
  }

  async function handleScanLookup(submissionId: string) {
    scrollToTool();
    await streamSse("/api/remediation/from-scan", { submissionId });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#4B0082] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-white">EUDR Guardian</h1>
          <p className="text-xs text-white/75">Hedera Food Traceability Commerce Agent</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://zigotrace.com/eudr-scan"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block text-xs font-medium text-white/85 hover:text-white underline underline-offset-2 transition-colors"
          >
            Free Quick Scan →
          </a>
          <WalletWidget account={walletAccount} onConnect={setWalletAccount} />
        </div>
      </header>

      {/* 1. Hero */}
      <HeroSection onGetStarted={() => { setTab("verify"); scrollToTool(); }} />

      {/* 2. Run Verification — immediately below hero */}
      <section id="tool-section" className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-[#4B0082]">Run Verification</h2>
            <p className="text-sm text-black mt-1">
              Upload farm data for a full EUDR check, or fetch your scan report to get a corrective action plan.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="inline-flex bg-[#F6F7F1] border border-gray-200 rounded-lg p-1 gap-1 mb-6">
            <button
              onClick={() => setTab("verify")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "verify" ? "bg-[#4B0082] text-white" : "text-black hover:text-[#4B0082]"
              }`}
            >
              Farm Verification
            </button>
            <button
              onClick={() => setTab("remediate")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "remediate" ? "bg-[#4B0082] text-white" : "text-black hover:text-[#4B0082]"
              }`}
            >
              Remediate Scan
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {tab === "verify" ? (
                <UploadPanel onSubmit={handleVerify} running={running} />
              ) : (
                <ScanLookupPanel onLookup={handleScanLookup} running={running} initialId={scanParam} />
              )}
            </div>
            <div className="lg:col-span-1">
              <AgentActivityFeed events={events} running={running} />
            </div>
            <div className="lg:col-span-1">
              {tab === "verify" ? (
                <EUDRReportPanel report={report} />
              ) : (
                <RemediationReportPanel report={remediationReport} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. What is EUDR */}
      <WhatIsEudrSection />

      {/* 4. What You'll Get */}
      <WhatYoullGetSection onGetStarted={() => { setTab("verify"); scrollToTool(); }} />

      {/* Footer */}
      <footer className="bg-[#4B0082] text-white/75 text-xs text-center py-6 px-6">
        <p>© {new Date().getFullYear()} ZigoTrace · EUDR Guardian · Powered by Hedera Hashgraph</p>
        <p className="mt-1">HBAR payments settle on Hedera mainnet · HCS audit trail · TracePass NFT on HTS</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#4B0082] text-sm font-medium">Loading EUDR Guardian...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
