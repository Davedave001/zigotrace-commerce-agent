import Anthropic from "@anthropic-ai/sdk";
import type { Farm } from "../types.js";

export interface GeolocationResult {
  farmId: string;
  status: "PASS" | "FAIL" | "WARNING";
  polygonAreaHa: number;
  issues: string[];
}

const client = new Anthropic();

export async function verifyGeolocation(farm: Farm): Promise<GeolocationResult> {
  const prompt = `You are a geospatial verification specialist for EUDR compliance.

Farm data:
- Farm ID: ${farm.farmId}
- Claimed area: ${farm.areaHectares} hectares
- GPS polygon vertices: ${JSON.stringify(farm.gpsPolygon)}

Respond ONLY with valid JSON:
{"farmId":string,"status":"PASS"|"FAIL"|"WARNING","polygonAreaHa":number,"issues":string[]}

Check: minimum 4 coordinates, valid lat/lng ranges, polygon closure, area vs claimed, flag if <0.5ha or >500ha.
FAIL for missing/corrupt polygon, WARNING for minor issues, PASS otherwise.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { farmId: farm.farmId, status: "WARNING", polygonAreaHa: farm.areaHectares, issues: ["Could not parse response"] };
  }
  return JSON.parse(jsonMatch[0]) as GeolocationResult;
}
