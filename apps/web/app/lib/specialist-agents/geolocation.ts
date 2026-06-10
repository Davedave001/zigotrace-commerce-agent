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

Evaluate the following and respond ONLY with valid JSON matching this schema:
{
  "farmId": string,
  "status": "PASS" | "FAIL" | "WARNING",
  "polygonAreaHa": number,
  "issues": string[]
}

Check:
1. Are there at least 4 GPS coordinates (minimum for a polygon)?
2. Do coordinates look plausible (valid lat/lng ranges)?
3. Is the polygon closed (first and last point match or close)?
4. Does the estimated area roughly match the claimed area?
5. Flag if area is < 0.5 hectares (suspiciously small) or > 500 hectares (suspiciously large)
6. Note any obvious anomalies

Set status to FAIL for missing/corrupt polygon, WARNING for minor issues, PASS otherwise.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { farmId: farm.farmId, status: "WARNING", polygonAreaHa: farm.areaHectares, issues: ["Could not parse geolocation response"] };
  }
  return JSON.parse(jsonMatch[0]) as GeolocationResult;
}
