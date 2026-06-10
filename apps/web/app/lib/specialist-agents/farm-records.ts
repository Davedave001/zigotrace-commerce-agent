import Anthropic from "@anthropic-ai/sdk";
import type { Farm } from "../types";

export interface FarmRecordsResult {
  farmId: string;
  status: "PASS" | "FAIL" | "WARNING";
  missingDocuments: string[];
  inconsistencies: string[];
  issues: string[];
}

const client = new Anthropic();

export async function validateFarmRecords(farm: Farm): Promise<FarmRecordsResult> {
  const hasFertilizerRecords = farm.fertilizerRecords.length > 0;
  const hasPesticideRecords = farm.pesticideRecords.length > 0;
  const hasHarvestRecords = farm.harvestRecords.length > 0;
  const hasPolygon = farm.gpsPolygon.length >= 4;

  const prompt = `You are a farm records compliance auditor for EUDR.

Farm ${farm.farmId} (${farm.farmerName}):
- GPS polygon present: ${hasPolygon}
- Fertilizer records: ${farm.fertilizerRecords.length} entries
- Pesticide records: ${farm.pesticideRecords.length} entries
- Harvest records: ${JSON.stringify(farm.harvestRecords)}
- Area: ${farm.areaHectares} ha

EUDR requires: traceability documentation, land ownership evidence, harvest records, input records.

Identify missing documents and any obvious inconsistencies.
Respond ONLY with valid JSON:
{
  "farmId": "${farm.farmId}",
  "status": "PASS" | "FAIL" | "WARNING",
  "missingDocuments": string[],
  "inconsistencies": string[],
  "issues": string[]
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    const missing: string[] = [];
    if (!hasFertilizerRecords) missing.push("Fertilizer records");
    if (!hasPesticideRecords) missing.push("Pesticide records");
    if (!hasHarvestRecords) missing.push("Harvest records");
    if (!hasPolygon) missing.push("GPS polygon");
    return {
      farmId: farm.farmId,
      status: missing.length > 1 ? "FAIL" : missing.length === 1 ? "WARNING" : "PASS",
      missingDocuments: missing,
      inconsistencies: [],
      issues: [],
    };
  }
  return JSON.parse(jsonMatch[0]) as FarmRecordsResult;
}
