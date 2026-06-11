"use client";

import { useState } from "react";

interface Props {
  onLookup: (submissionId: string) => Promise<void>;
  running: boolean;
  initialId?: string;
}

export function ScanLookupPanel({ onLookup, running, initialId = "" }: Props) {
  const [submissionId, setSubmissionId] = useState(initialId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = submissionId.trim();
    if (!id) return;
    await onLookup(id);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Remediate from EUDR Scan</h2>
      <p className="text-xs text-gray-500 mb-4">
        Enter your ZigoTrace scan report ID. Guardian fetches your compliance gaps from{" "}
        <a href="https://zigotrace.com/eudr-scan" target="_blank" rel="noopener noreferrer" className="text-[#4B0082] underline">
          zigotrace.com/eudr-scan
        </a>{" "}
        and builds an AI-powered remediation plan charged via HBAR.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Scan Report ID
          </label>
          <input
            type="text"
            value={submissionId}
            onChange={(e) => setSubmissionId(e.target.value)}
            placeholder="e.g. 42"
            disabled={running}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B0082] focus:border-transparent disabled:opacity-50"
          />
          <p className="text-xs text-gray-400 mt-1">
            {initialId
              ? "ID pre-filled from your scan report email. Click below to start."
              : "Find your Report ID in the results email from zigotrace.com/eudr-scan."}
          </p>
        </div>

        <button
          type="submit"
          disabled={running || !submissionId.trim()}
          className="w-full py-3 rounded-lg bg-[#4B0082] text-white font-medium text-sm hover:bg-[#3A0066] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? "Fetching & analysing..." : "Get Remediation Plan"}
        </button>
      </form>

      {/* Per-dimension pricing */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Agent Fees — per gap (below 70%)
        </p>
        <div className="space-y-1 text-xs text-gray-600">
          {[
            ["Geolocation & Traceability gap", "0.08 HBAR"],
            ["Legality gap", "0.07 HBAR"],
            ["Due Diligence gap", "0.19 HBAR"],
            ["Risk Management gap", "0.07 HBAR"],
            ["Remediation report (always)", "0.15 HBAR"],
          ].map(([label, price]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span className="font-mono text-[#4B0082]">{price}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-1 border-t border-gray-100">
            <span>Max total (all 4 gaps)</span>
            <span className="font-mono text-[#4B0082]">0.56 HBAR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
