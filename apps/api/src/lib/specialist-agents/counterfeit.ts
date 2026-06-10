import Anthropic from "@anthropic-ai/sdk";
import type { CooperativePackage } from "../types.js";

export interface CounterfeitResult {
  cooperativeId: string;
  volumeAnomalyDetected: boolean;
  anomalyFactor: number;
  inputFraudFlags: string[];
  overallRisk: "LOW" | "MEDIUM" | "HIGH";
  issues: string[];
}

const BENCHMARKS: Record<string, number> = {
  coffee:800, cocoa:600, palm_oil:20000, soy:3000, rubber:1500, cattle:300, timber:5000,
};

const client = new Anthropic();

export async function detectCounterfeits(cooperative: CooperativePackage): Promise<CounterfeitResult> {
  const bench = BENCHMARKS[cooperative.commodity] ?? 1000;
  const maxYield = cooperative.farms.reduce((s, f) => s + f.areaHectares * bench, 0);
  const anomalyFactor = maxYield > 0 ? Math.round(cooperative.totalVolumeKg / maxYield * 100) / 100 : 1;

  const prompt = `Fraud detection specialist. Cooperative ${cooperative.cooperativeId} (${cooperative.commodity}):
Total reported: ${cooperative.totalVolumeKg}kg, Max capacity: ${maxYield}kg, Factor: ${anomalyFactor}x
Farms: ${cooperative.farms.map(f => `${f.farmId}:${f.areaHectares}ha,${f.harvestRecords.map(h=>h.quantityKg).join("+")}kg`).join(" | ")}

Respond ONLY with valid JSON:
{"cooperativeId":"${cooperative.cooperativeId}","volumeAnomalyDetected":boolean,"anomalyFactor":number,"inputFraudFlags":string[],"overallRisk":"LOW"|"MEDIUM"|"HIGH","issues":string[]}
HIGH if >2x, MEDIUM if 1.3-2x, LOW otherwise.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { cooperativeId:cooperative.cooperativeId, volumeAnomalyDetected:anomalyFactor>1.3, anomalyFactor, inputFraudFlags:[], overallRisk:anomalyFactor>2?"HIGH":anomalyFactor>1.3?"MEDIUM":"LOW", issues:[] };
  return JSON.parse(m[0]) as CounterfeitResult;
}
