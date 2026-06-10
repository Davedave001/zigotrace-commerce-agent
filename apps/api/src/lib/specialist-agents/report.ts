import type { EudrReport, FarmVerificationResult } from "../types.js";
import type { GeolocationResult } from "./geolocation.js";
import type { DeforestationResult } from "./deforestation.js";
import type { AgronomyResult } from "./agronomy.js";
import type { FarmRecordsResult } from "./farm-records.js";
import type { ComplianceResult } from "./compliance.js";

export function buildReport(params: {
  cooperativeId: string; cooperativeName: string; commodity: string;
  geoResults: GeolocationResult[]; defoResults: DeforestationResult[];
  agroResults: AgronomyResult[]; recordsResults: FarmRecordsResult[];
  complianceResult: ComplianceResult; hcsTopicId: string; tracePassTokenId: string | null;
}): EudrReport {
  const { cooperativeId, cooperativeName, commodity, geoResults, defoResults, agroResults, recordsResults, complianceResult, hcsTopicId, tracePassTokenId } = params;
  const farmIds = geoResults.map(r => r.farmId);

  const farmResults: FarmVerificationResult[] = farmIds.map(farmId => {
    const geo = geoResults.find(r => r.farmId === farmId);
    const defo = defoResults.find(r => r.farmId === farmId);
    const agro = agroResults.find(r => r.farmId === farmId);
    const rec = recordsResults.find(r => r.farmId === farmId);
    const defoStatus = !defo ? "WARNING" : defo.riskLevel === "LOW" ? "PASS" : defo.riskLevel === "MEDIUM" ? "WARNING" : "FAIL";
    return {
      farmId,
      geolocation: geo?.status ?? "WARNING",
      deforestation: defoStatus,
      agronomy: agro?.status ?? "WARNING",
      records: rec?.status ?? "WARNING",
      issues: [...(geo?.issues??[]), ...(defo?.issues??[]), ...(agro?.issues??[]), ...(rec?.issues??[])],
    };
  });

  const exportEligibleFarms = farmResults.filter(f => f.geolocation !== "FAIL" && f.deforestation !== "FAIL" && f.agronomy !== "FAIL").map(f => f.farmId);
  const excludedFarms = farmIds.filter(id => !exportEligibleFarms.includes(id));
  const seq = Math.floor(Math.random() * 900) + 100;
  const ddsReference = `DDS-${new Date().getFullYear()}-${cooperativeId.toUpperCase().slice(0,4)}-${seq}`;

  return { ddsReference, cooperativeId, cooperativeName, commodity, readinessScore: complianceResult.readinessScore, readinessBand: complianceResult.readinessBand, farmResults, redFlags: complianceResult.redFlags, recommendations: complianceResult.recommendations, exportEligibleFarms, excludedFarms, hcsTopicId, tracePassTokenId, generatedAt: new Date().toISOString() };
}
