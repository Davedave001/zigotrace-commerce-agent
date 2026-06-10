"use client";

import type { EudrReport, FarmVerificationResult } from "../lib/types";

interface Props {
  report: EudrReport | null;
}

const STATUS_ICON: Record<string, string> = {
  PASS: "✅",
  FAIL: "❌",
  WARNING: "⚠️",
};

const BAND_COLOR: Record<string, string> = {
  "Advanced Readiness": "text-green-700 bg-green-50",
  "Intermediate Readiness": "text-amber-700 bg-amber-50",
  "Basic Readiness": "text-orange-700 bg-orange-50",
  "Critical Gaps": "text-red-700 bg-red-50",
};

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 85
      ? "#1a6b3c"
      : score >= 65
      ? "#d97706"
      : score >= 40
      ? "#ea580c"
      : "#dc2626";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 60" className="w-32">
        <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 125.6} 125.6`}
        />
      </svg>
      <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

function FarmRow({ result }: { result: FarmVerificationResult }) {
  return (
    <tr className="border-t border-gray-100 text-xs">
      <td className="py-2 pr-3 font-mono text-gray-700">{result.farmId}</td>
      <td className="py-2 text-center">{STATUS_ICON[result.geolocation]}</td>
      <td className="py-2 text-center">{STATUS_ICON[result.deforestation]}</td>
      <td className="py-2 text-center">{STATUS_ICON[result.agronomy]}</td>
      <td className="py-2 text-center">{STATUS_ICON[result.records]}</td>
    </tr>
  );
}

export function EUDRReportPanel({ report }: Props) {
  if (!report) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-[600px] flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">
          EUDR Due Diligence Statement will appear here after verification.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px] overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-mono">{report.ddsReference}</p>
        <h2 className="text-base font-semibold text-gray-900">{report.cooperativeName}</h2>
        <p className="text-xs text-gray-500">{report.commodity} · {report.cooperativeId}</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <ScoreGauge score={report.readinessScore} />
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BAND_COLOR[report.readinessBand]}`}>
            {report.readinessBand}
          </span>
        </div>

        {/* Farm table */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Farm Verification</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="pb-1 pr-3">Farm ID</th>
                <th className="pb-1 text-center">GPS</th>
                <th className="pb-1 text-center">Defor.</th>
                <th className="pb-1 text-center">Agro.</th>
                <th className="pb-1 text-center">Docs</th>
              </tr>
            </thead>
            <tbody>
              {report.farmResults.map((r) => (
                <FarmRow key={r.farmId} result={r} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Red flags */}
        {report.redFlags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Red Flags</p>
            <ul className="space-y-1">
              {report.redFlags.map((flag, i) => (
                <li key={i} className="text-xs text-red-700 flex gap-2">
                  <span>•</span> {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommendations</p>
            <ul className="space-y-1">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-gray-700 flex gap-2">
                  <span className="text-[#1a6b3c]">{i + 1}.</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Export status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-700 font-semibold">{report.exportEligibleFarms.length} farms</p>
            <p className="text-green-600">Export eligible</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-red-700 font-semibold">{report.excludedFarms.length} farms</p>
            <p className="text-red-600">Excluded (pending remediation)</p>
          </div>
        </div>

        {/* Hedera proofs */}
        <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">HCS Audit Topic</span>
            <span className="font-mono text-[#1a6b3c]">{report.hcsTopicId}</span>
          </div>
          {report.tracePassTokenId && (
            <div className="flex justify-between">
              <span className="text-gray-400">TracePass NFT</span>
              <span className="font-mono text-indigo-600">{report.tracePassTokenId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Generated</span>
            <span className="text-gray-600">{new Date(report.generatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
