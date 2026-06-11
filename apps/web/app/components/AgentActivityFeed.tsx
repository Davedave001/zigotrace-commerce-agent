"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "../lib/types";

interface Props {
  events: AgentEvent[];
  running: boolean;
}

const AGENT_LABELS: Record<string, string> = {
  geolocation: "Geolocation Agent",
  deforestation: "Deforestation Agent",
  agronomy: "Agronomy Agent",
  "farm-records": "Farm Records Agent",
  counterfeit: "Counterfeit Agent",
  compliance: "Compliance Agent",
  report: "Report Agent",
  guardian: "EUDR Guardian",
};

const EVENT_COLORS: Record<AgentEvent["type"], string> = {
  guardian_start: "text-gray-700",
  payment_requested: "text-amber-600",
  payment_confirmed: "text-green-600",
  agent_start: "text-blue-600",
  agent_result: "text-[#1a6b3c]",
  agent_error: "text-red-600",
  compliance_scored: "text-purple-600",
  report_ready: "text-[#1a6b3c] font-semibold",
  remediation_report_ready: "text-[#1a6b3c] font-semibold",
  nft_minted: "text-indigo-600",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

export function AgentActivityFeed({ events, running }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Agent Activity</h2>
        {running && (
          <span className="flex items-center gap-2 text-xs text-[#1a6b3c]">
            <span className="h-2 w-2 rounded-full bg-[#1a6b3c] animate-pulse" />
            Running
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {events.length === 0 && !running && (
          <p className="text-gray-400 text-center mt-8">
            Agent activity will appear here once verification starts.
          </p>
        )}

        {events.map((event, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-400 shrink-0">[{formatTime(event.timestamp)}]</span>
            {event.agentId && (
              <span className="text-gray-500 shrink-0">
                {AGENT_LABELS[event.agentId] ?? event.agentId}:
              </span>
            )}
            <span className={EVENT_COLORS[event.type]}>{event.message}</span>
            {event.priceHbar && (
              <span className="text-amber-500 ml-auto shrink-0">
                {event.priceHbar} HBAR
              </span>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
