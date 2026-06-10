import Anthropic from "@anthropic-ai/sdk";
import type { Farm } from "../types";

export interface AgronomyResult {
  farmId: string;
  euBannedPesticidesDetected: string[];
  yieldAnomalyFactor: number;
  inputFraudFlags: string[];
  issues: string[];
  status: "PASS" | "FAIL" | "WARNING";
}

const EU_BANNED_ACTIVE_INGREDIENTS = [
  "chlorpyrifos", "chlorpyrifos-methyl", "thiamethoxam", "clothianidin",
  "imidacloprid", "paraquat", "endosulfan", "lindane", "atrazine",
  "methamidophos", "monocrotophos", "phosphamidon",
];

const YIELD_BENCHMARKS_KG_PER_HA: Record<string, number> = {
  coffee: 800,
  cocoa: 600,
  palm_oil: 20000,
  soy: 3000,
  rubber: 1500,
  cattle: 300,
  timber: 5000,
};

const client = new Anthropic();

export async function verifyAgronomy(farm: Farm, commodity: string): Promise<AgronomyResult> {
  const bannedDetected = farm.pesticideRecords
    .filter((p) =>
      EU_BANNED_ACTIVE_INGREDIENTS.some((banned) =>
        p.activeIngredient.toLowerCase().includes(banned)
      )
    )
    .map((p) => `${p.product} (${p.activeIngredient})`);

  const benchmarkYieldKg = (YIELD_BENCHMARKS_KG_PER_HA[commodity] ?? 1000) * farm.areaHectares;
  const totalHarvestKg = farm.harvestRecords.reduce((s, r) => s + r.quantityKg, 0);
  const yieldAnomalyFactor =
    benchmarkYieldKg > 0 ? Math.round((totalHarvestKg / benchmarkYieldKg) * 100) / 100 : 1;

  const prompt = `You are an agronomy compliance specialist.

Farm ${farm.farmId}:
- Commodity: ${commodity}, Area: ${farm.areaHectares} ha
- Fertilizer records: ${JSON.stringify(farm.fertilizerRecords)}
- Pesticide records: ${JSON.stringify(farm.pesticideRecords)}
- EU-banned active ingredients already detected: ${JSON.stringify(bannedDetected)}
- Yield anomaly factor vs regional benchmark: ${yieldAnomalyFactor}x

Identify any input fraud flags (mislabeled products, impossible application rates, lot number anomalies).
Respond ONLY with valid JSON:
{
  "farmId": "${farm.farmId}",
  "euBannedPesticidesDetected": string[],
  "yieldAnomalyFactor": number,
  "inputFraudFlags": string[],
  "issues": string[],
  "status": "PASS" | "FAIL" | "WARNING"
}

FAIL if banned pesticides detected. WARNING if yield anomaly > 3x or input fraud suspected. PASS otherwise.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      farmId: farm.farmId,
      euBannedPesticidesDetected: bannedDetected,
      yieldAnomalyFactor,
      inputFraudFlags: [],
      issues: [],
      status: bannedDetected.length > 0 ? "FAIL" : yieldAnomalyFactor > 3 ? "WARNING" : "PASS",
    };
  }
  return JSON.parse(jsonMatch[0]) as AgronomyResult;
}
