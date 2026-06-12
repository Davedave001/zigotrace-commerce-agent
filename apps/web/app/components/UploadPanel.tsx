"use client";

import { useRef, useState } from "react";

interface Props {
  onSubmit: (payload: FormData) => Promise<void>;
  running: boolean;
}

export function UploadPanel({ onSubmit, running }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();

    if (useDemo) {
      form.append("demo", "true");
    } else if (fileRef.current?.files?.[0]) {
      form.append("package", fileRef.current.files[0]);
    } else {
      alert("Please upload a farm data package or use the demo dataset.");
      return;
    }

    await onSubmit(form);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Farm Data Package</h2>
      <p className="text-xs text-black mb-4">
        Upload a JSON cooperative package or run the built-in coffee cooperative demo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File upload */}
        <div
          onClick={() => !useDemo && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            useDemo
              ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
              : "border-gray-300 hover:border-[#4B0082] hover:bg-green-50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            disabled={useDemo}
          />
          {fileName ? (
            <p className="text-sm text-[#4B0082] font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-sm text-black">Drop cooperative JSON here</p>
              <p className="text-xs text-black mt-1">or click to browse</p>
            </>
          )}
        </div>

        {/* Demo toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useDemo}
            onChange={(e) => {
              setUseDemo(e.target.checked);
              setFileName(null);
            }}
            className="w-4 h-4 accent-[#4B0082]"
          />
          <span className="text-sm text-black">
            Use Zigotrace Coffee Cooperative demo dataset
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={running}
          className="w-full py-3 rounded-lg bg-[#4B0082] text-white font-medium text-sm hover:bg-[#3A0066] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? "Running verification..." : "Start EUDR Verification"}
        </button>
      </form>

      {/* Pricing breakdown */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
          Agent Fees
        </p>
        <div className="space-y-1 text-xs text-black">
          {[
            ["GPS Polygon Verification", "0.05 HBAR"],
            ["Deforestation Risk Scan", "0.10 HBAR"],
            ["Agronomy & Input Check", "0.03 HBAR"],
            ["Farm Records Validation", "0.03 HBAR"],
            ["Counterfeit Detection", "0.05 HBAR"],
            ["EUDR Compliance Scoring", "0.04 HBAR"],
            ["DDS Report Generation", "0.15 HBAR"],
          ].map(([label, price]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span className="font-mono text-[#4B0082]">{price}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-1 border-t border-gray-100">
            <span>Full verification (MPP split)</span>
            <span className="font-mono text-[#4B0082]">0.45 HBAR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
