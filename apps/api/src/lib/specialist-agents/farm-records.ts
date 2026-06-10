import Anthropic from "@anthropic-ai/sdk";
import type { Farm } from "../types.js";

export interface FarmRecordsResult {
  farmId: string;
  status: "PASS" | "FAIL" | "WARNING";
  missingDocuments: string[];
  inconsistencies: string[];
  issues: string[];
}

const client = new Anthropic();

export async function validateFarmRecords(farm: Farm): Promise<FarmRecordsResult> {
  const hasPolygon = farm.gpsPolygon.length >= 4;

  const prompt = `Farm records auditor. Farm ${farm.farmId} (${farm.farmerName}):
GPS polygon: ${hasPolygon}, Fertilizer: ${farm.fertilizerRecords.length}, Pesticide: ${farm.pesticideRecords.length}
Harvest: ${JSON.stringify(farm.harvestRecords)}, Area: ${farm.areaHectares}ha

Respond ONLY with valid JSON:
{"farmId":"${farm.farmId}","status":"PASS"|"FAIL"|"WARNING","missingDocuments":string[],"inconsistencies":string[],"issues":string[]}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) {
    const missing: string[] = [];
    if (!hasPolygon) missing.push("GPS polygon");
    if (!farm.fertilizerRecords.length) missing.push("Fertilizer records");
    if (!farm.pesticideRecords.length) missing.push("Pesticide records");
    if (!farm.harvestRecords.length) missing.push("Harvest records");
    return { farmId:farm.farmId, status:missing.length>1?"FAIL":missing.length===1?"WARNING":"PASS", missingDocuments:missing, inconsistencies:[], issues:[] };
  }
  return JSON.parse(m[0]) as FarmRecordsResult;
}
