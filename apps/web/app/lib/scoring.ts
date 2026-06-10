import type { ReadinessBand } from "./types.js";

const WEIGHTS = {
  geolocationCompleteness: 0.20,
  deforestationClearance: 0.30,
  inputCompliance: 0.15,
  recordsLegality: 0.15,
  traceabilityScore: 0.10,
  antifraudScore: 0.10,
};

export interface ScoringInputs {
  geolocationPassRate: number;    // 0–1
  deforestationPassRate: number;  // 0–1
  inputComplianceRate: number;    // 0–1
  recordsLegalityRate: number;    // 0–1
  traceabilityRate: number;       // 0–1
  antifraudScore: number;         // 0–1
}

export function computeReadinessScore(inputs: ScoringInputs): number {
  const raw =
    inputs.geolocationPassRate * WEIGHTS.geolocationCompleteness +
    inputs.deforestationPassRate * WEIGHTS.deforestationClearance +
    inputs.inputComplianceRate * WEIGHTS.inputCompliance +
    inputs.recordsLegalityRate * WEIGHTS.recordsLegality +
    inputs.traceabilityRate * WEIGHTS.traceabilityScore +
    inputs.antifraudScore * WEIGHTS.antifraudScore;

  return Math.round(raw * 100);
}

export function getReadinessBand(score: number): ReadinessBand {
  if (score >= 85) return "Advanced Readiness";
  if (score >= 65) return "Intermediate Readiness";
  if (score >= 40) return "Basic Readiness";
  return "Critical Gaps";
}
