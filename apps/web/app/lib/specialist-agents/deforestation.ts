import Anthropic from "@anthropic-ai/sdk";
import type { Farm, CooperativePackage } from "../types";

export interface DeforestationResult {
  farmId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  forestLossHa: number;
  encroachmentDetected: boolean;
  issues: string[];
}

const client = new Anthropic();

export async function assessDeforestation(
  farm: Farm,
  cooperative: CooperativePackage
): Promise<DeforestationResult> {
  const prompt = `You are a deforestation risk analyst for EUDR compliance.

Farm data:
- Farm ID: ${farm.farmId}
- Country: ${cooperative.countryCode}
- Commodity: ${cooperative.commodity}
- Area: ${farm.areaHectares} hectares
- GPS polygon: ${JSON.stringify(farm.gpsPolygon)}
- Harvest records: ${JSON.stringify(farm.harvestRecords)}

EUDR requires: no deforestation after December 31, 2020.

Based on the country, commodity, GPS coordinates, and farm characteristics, perform a risk assessment.
High-risk zones: Congo Basin, Amazon, Southeast Asian peatlands, West African forest belt.
Commodity risk: palm oil and soy are highest risk; coffee is medium risk in certain countries.

Respond ONLY with valid JSON:
{
  "farmId": string,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "forestLossHa": number,
  "encroachmentDetected": boolean,
  "issues": string[]
}

Set forestLossHa to estimated probable loss (0 if low risk). Be conservative â€” flag as MEDIUM if uncertain.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { farmId: farm.farmId, riskLevel: "MEDIUM", forestLossHa: 0, encroachmentDetected: false, issues: ["Could not parse deforestation response"] };
  }
  return JSON.parse(jsonMatch[0]) as DeforestationResult;
}
