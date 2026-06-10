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

export async function detectCounterfeits(
  cooperative: CooperativePackage
): Promise<CounterfeitResult> {
  const benchmark = YIELD_BENCHMARKS_KG_PER_HA[cooperative.commodity] ?? 1000;
  const maxPossibleYieldKg = cooperative.farms.reduce(
    (sum, f) => sum + f.areaHectares * benchmark,
    0
  );
  const anomalyFactor =
    maxPossibleYieldKg > 0
      ? Math.round((cooperative.totalVolumeKg / maxPossibleYieldKg) * 100) / 100
      : 1;

  const prompt = `You are a commodity fraud detection specialist.

Cooperative: ${cooperative.cooperativeId} (${cooperative.commodity})
Total reported volume: ${cooperative.totalVolumeKg} kg
Sum of farm maximum yields: ${maxPossibleYieldKg} kg
Volume anomaly factor: ${anomalyFactor}x

Farms summary:
${cooperative.farms
  .map(
    (f) =>
      `  ${f.farmId}: ${f.areaHectares}ha, harvest ${f.harvestRecords.map((h) => h.quantityKg).join("+")} kg`
  )
  .join("\n")}

Detect:
1. Volume fraud: reported total > sum of farm maximums (factor > 1.3 is suspicious)
2. Input fraud: any farm with suspicious input records

Respond ONLY with valid JSON:
{
  "cooperativeId": "${cooperative.cooperativeId}",
  "volumeAnomalyDetected": boolean,
  "anomalyFactor": number,
  "inputFraudFlags": string[],
  "overallRisk": "LOW" | "MEDIUM" | "HIGH",
  "issues": string[]
}

HIGH risk if anomaly > 2x, MEDIUM if 1.3x–2x, LOW otherwise.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      cooperativeId: cooperative.cooperativeId,
      volumeAnomalyDetected: anomalyFactor > 1.3,
      anomalyFactor,
      inputFraudFlags: [],
      overallRisk: anomalyFactor > 2 ? "HIGH" : anomalyFactor > 1.3 ? "MEDIUM" : "LOW",
      issues: [],
    };
  }
  return JSON.parse(jsonMatch[0]) as CounterfeitResult;
}
