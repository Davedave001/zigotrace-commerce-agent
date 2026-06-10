import { computeReadinessScore, getReadinessBand } from "../scoring.js";
import type { GeolocationResult } from "./geolocation.js";
import type { DeforestationResult } from "./deforestation.js";
import type { AgronomyResult } from "./agronomy.js";
import type { FarmRecordsResult } from "./farm-records.js";
import type { CounterfeitResult } from "./counterfeit.js";
import type { ReadinessBand } from "../types.js";

export interface ComplianceResult {
  readinessScore: number;
  readinessBand: ReadinessBand;
  redFlags: string[];
  recommendations: string[];
}

export function scoreCompliance(params: {
  geoResults: GeolocationResult[];
  defoResults: DeforestationResult[];
  agroResults: AgronomyResult[];
  recordsResults: FarmRecordsResult[];
  counterfeitResult: CounterfeitResult;
}): ComplianceResult {
  const { geoResults, defoResults, agroResults, recordsResults, counterfeitResult } = params;

  const pass = (r: { status: string }) => r.status === "PASS";
  const defoPass = (r: DeforestationResult) => r.riskLevel === "LOW";

  const geolocationPassRate = geoResults.length > 0 ? geoResults.filter(pass).length / geoResults.length : 0;
  const deforestationPassRate = defoResults.length > 0 ? defoResults.filter(defoPass).length / defoResults.length : 0;
  const inputComplianceRate = agroResults.length > 0 ? agroResults.filter(r => r.euBannedPesticidesDetected.length === 0).length / agroResults.length : 0;
  const recordsLegalityRate = recordsResults.length > 0 ? recordsResults.filter(pass).length / recordsResults.length : 0;
  const traceabilityRate = geolocationPassRate * 0.5 + recordsLegalityRate * 0.5;
  const antifraudScore = counterfeitResult.overallRisk === "LOW" ? 1 : counterfeitResult.overallRisk === "MEDIUM" ? 0.5 : 0;

  const readinessScore = computeReadinessScore({ geolocationPassRate, deforestationPassRate, inputComplianceRate, recordsLegalityRate, traceabilityRate, antifraudScore });

  const redFlags: string[] = [];
  const recommendations: string[] = [];

  for (const r of defoResults) {
    if (r.riskLevel === "HIGH") {
      redFlags.push(`Farm ${r.farmId}: HIGH deforestation risk - ${r.forestLossHa}ha estimated forest loss`);
      recommendations.push(`Exclude farm ${r.farmId} from export batch pending independent forest verification`);
    }
  }
  for (const r of agroResults) {
    if (r.euBannedPesticidesDetected.length > 0) {
      redFlags.push(`Farm ${r.farmId}: EU-banned pesticides - ${r.euBannedPesticidesDetected.join(", ")}`);
      recommendations.push(`Farm ${r.farmId}: Replace banned pesticides with EU-approved IPM alternatives`);
    }
  }
  if (counterfeitResult.volumeAnomalyDetected) {
    redFlags.push(`Volume anomaly ${counterfeitResult.anomalyFactor}x - cooperative total exceeds farm capacity`);
    recommendations.push("Audit cooperative records for mixed-origin produce");
  }
  for (const r of geoResults) {
    if (r.status === "FAIL") recommendations.push(`Farm ${r.farmId}: Obtain accurate GPS polygon`);
  }
  if (recommendations.length === 0 && readinessScore >= 85) {
    recommendations.push("All farms clear - proceed with EU export documentation");
  }

  return { readinessScore, readinessBand: getReadinessBand(readinessScore), redFlags, recommendations };
}
