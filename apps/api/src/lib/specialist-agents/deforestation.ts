import Anthropic from "@anthropic-ai/sdk";
import type { Farm, CooperativePackage } from "../types.js";

export interface DeforestationResult {
  farmId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  forestLossHa: number;
  encroachmentDetected: boolean;
  issues: string[];
}

const client = new Anthropic();

export async function assessDeforestation(farm: Farm, cooperative: CooperativePackage): Promise<DeforestationResult> {
  const prompt = `You are a deforestation risk analyst for EUDR compliance.

Farm ${farm.farmId}: country=${cooperative.countryCode}, commodity=${cooperative.commodity}, area=${farm.areaHectares}ha
GPS: ${JSON.stringify(farm.gpsPolygon)}

EUDR: no deforestation after Dec 31 2020.
High-risk: Congo Basin, Amazon, SE Asian peatlands, West African forest belt.
Commodity risk: palm_oil/soy highest, coffee medium in some countries.

Respond ONLY with valid JSON:
{"farmId":string,"riskLevel":"LOW"|"MEDIUM"|"HIGH","forestLossHa":number,"encroachmentDetected":boolean,"issues":string[]}

forestLossHa=0 for low risk. Flag MEDIUM if uncertain.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { farmId: farm.farmId, riskLevel: "MEDIUM", forestLossHa: 0, encroachmentDetected: false, issues: [] };
  return JSON.parse(m[0]) as DeforestationResult;
}
