"use client";

import { useEffect, useState } from "react";

const DEADLINE = new Date("2026-12-30T00:00:00Z");

function getTimeLeft() {
  const diff = DEADLINE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const segments = [
    { label: "Days",    value: time.days },
    { label: "Hours",   value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-xs font-medium text-white/85 uppercase tracking-wide">
        EUDR Enforcement Deadline
      </p>
      <div className="inline-flex rounded-lg border border-white/55 bg-black/25 px-2 py-3 backdrop-blur-[2px]">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            className={`flex flex-col items-center px-3 ${i < segments.length - 1 ? "border-r border-white/45" : ""}`}
          >
            <span className="text-lg md:text-2xl font-medium tabular-nums text-white leading-none">
              {String(seg.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] md:text-xs font-medium text-white/85 mt-1">
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
