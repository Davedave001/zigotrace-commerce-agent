import Anthropic from "@anthropic-ai/sdk";
import type { Farm } from "../types.js";

export interface AgronomyResult {
  farmId: string;
  euBannedPesticidesDetected: string[];
  yieldAnomalyFactor: number;
  inputFraudFlags: string[];
  issues: string[];
  status: "PASS" | "FAIL" | "WARNING";
}

const EU_BANNED = [
  "chlorpyrifos","chlorpyrifos-methyl","thiamethoxam","clothianidin",
  "imidacloprid","paraquat","endosulfan","lindane","atrazine",
  "methamidophos","monocrotophos","phosphamidon",
];

const BENCHMARKS: Record<string, number> = {
  coffee:800, cocoa:600, palm_oil:20000, soy:3000, rubber:1500, cattle:300, timber:5000,
};

const client = new Anthropic();

export async function verifyAgronomy(farm: Farm, commodity: string): Promise<AgronomyResult> {
  const bannedDetected = farm.pesticideRecords
    .filter(p => EU_BANNED.some(b => p.activeIngredient.toLowerCase().includes(b)))
    .map(p => `${p.product} (${p.activeIngredient})`);

  const benchmarkKg = (BENCHMARKS[commodity] ?? 1000) * farm.areaHectares;
  const totalKg = farm.harvestRecords.reduce((s, r) => s + r.quantityKg, 0);
  const yieldAnomalyFactor = benchmarkKg > 0 ? Math.round(totalKg / benchmarkKg * 100) / 100 : 1;

  const prompt = `Agronomy specialist. Farm ${farm.farmId} (${commodity}, ${farm.areaHectares}ha):
Fertilizers: ${JSON.stringify(farm.fertilizerRecords)}
Pesticides: ${JSON.stringify(farm.pesticideRecords)}
EU-banned already found: ${JSON.stringify(bannedDetected)}
Yield anomaly: ${yieldAnomalyFactor}x

Respond ONLY with valid JSON:
{"farmId":"${farm.farmId}","euBannedPesticidesDetected":string[],"yieldAnomalyFactor":number,"inputFraudFlags":string[],"issues":string[],"status":"PASS"|"FAIL"|"WARNING"}
FAIL if banned pesticides. WARNING if anomaly >3x or fraud suspected.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { farmId:farm.farmId, euBannedPesticidesDetected:bannedDetected, yieldAnomalyFactor, inputFraudFlags:[], issues:[], status: bannedDetected.length>0?"FAIL":yieldAnomalyFactor>3?"WARNING":"PASS" };
  return JSON.parse(m[0]) as AgronomyResult;
}
