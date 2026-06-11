"use client";

import type { RemediationReport, CorrectiveAction } from "../lib/types";

interface Props {
  report: RemediationReport | null;
}

const LEVEL_COLOR: Record<string, string> = {
  "Advanced Readiness":     "text-green-700 bg-green-50",
  "Intermediate Readiness": "text-amber-700 bg-amber-50",
  "Basic Readiness":        "text-orange-700 bg-orange-50",
  "Critical Gaps":          "text-red-700 bg-red-50",
};

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 85 ? "#4B0082" :
    score >= 65 ? "#d97706" :
    score >= 40 ? "#ea580c" :
    "#dc2626";

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

function ActionCard({ action }: { action: CorrectiveAction }) {
  const pct = action.score;
  const barColor =
    pct >= 70 ? "#4B0082" :
    pct >= 50 ? "#d97706" :
    pct >= 30 ? "#ea580c" :
    "#dc2626";

  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">{action.dimension}</span>
        <span className="font-mono text-xs font-bold" style={{ color: barColor }}>{pct}%</span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>

      {/* Priority actions */}
      <ol className="space-y-1">
        {action.priorityActions.map((step, i) => (
          <li key={i} className="text-xs text-gray-700 flex gap-2">
            <span className="text-[#4B0082] font-bold shrink-0">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {/* ZigoTrace CTA */}
      <a
        href={action.serviceLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full text-xs bg-[#f0f9f4] hover:bg-[#e0f4ea] text-[#4B0082] font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <span>{action.zigotraceService}</span>
        <span className="font-mono">{action.hbarCharged} HBAR →</span>
      </a>
    </div>
  );
}

export function RemediationReportPanel({ report }: Props) {
  if (!report) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-[600px] flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">
          Your AI remediation plan will appear here after fetching your scan results.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-mono">{report.ddsReference}</p>
        <h2 className="text-base font-semibold text-gray-900">
          {report.submittedName ? `Remediation Plan — ${report.submittedName}` : "Remediation Plan"}
        </h2>
        <p className="text-xs text-gray-500">Submission #{report.submissionId}</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <ScoreGauge score={report.overallScore} />
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${LEVEL_COLOR[report.overallLevel] ?? "text-gray-700 bg-gray-100"}`}>
            {report.overallLevel}
          </span>
        </div>

        {/* Summary */}
        {report.summaryStatement && (
          <div className="bg-[#f8f7f4] rounded-lg p-4">
            <p className="text-xs text-gray-700 leading-relaxed">{report.summaryStatement}</p>
          </div>
        )}

        {/* Corrective action cards */}
        {report.correctiveActions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Corrective Actions ({report.correctiveActions.length} dimension{report.correctiveActions.length !== 1 ? "s" : ""})
            </p>
            {report.correctiveActions.map((action) => (
              <ActionCard key={action.dimension} action={action} />
            ))}
          </div>
        ) : (
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-green-700">All dimensions above 70%</p>
            <p className="text-xs text-green-600 mt-1">No corrective actions required. Maintain your current practices.</p>
          </div>
        )}

        {/* Hedera proofs + totals */}
        <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Total HBAR charged</span>
            <span className="font-mono font-semibold text-[#4B0082]">{report.totalHbarCharged} HBAR</span>
          </div>
          {report.hcsTxId && (
            <div className="flex justify-between">
              <span className="text-gray-400">Hedera TX</span>
              <span className="font-mono text-[#4B0082] truncate max-w-[160px]">{report.hcsTxId}</span>
            </div>
          )}
          {report.tracePassTokenId && (
            <div className="flex justify-between items-center">
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
