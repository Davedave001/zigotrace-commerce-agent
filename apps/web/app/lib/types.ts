export interface GpsPoint {
  lat: number;
  lng: number;
}

export interface FertilizerRecord {
  product: string;
  quantityKg: number;
  date: string;
}

export interface PesticideRecord {
  product: string;
  activeIngredient: string;
  quantityL: number;
}

export interface HarvestRecord {
  quantityKg: number;
  season: string;
}

export interface Farm {
  farmId: string;
  farmerName: string;
  areaHectares: number;
  gpsPolygon: GpsPoint[];
  fertilizerRecords: FertilizerRecord[];
  pesticideRecords: PesticideRecord[];
  harvestRecords: HarvestRecord[];
}

export interface CooperativePackage {
  cooperativeId: string;
  cooperativeName: string;
  commodity: "coffee" | "cocoa" | "palm_oil" | "soy" | "rubber" | "cattle" | "timber";
  countryCode: string;
  totalVolumeKg: number;
  farms: Farm[];
}

export interface DimensionScore {
  pct: number;
  level: string;
  redFlags?: string[];
}

export interface CorrectiveAction {
  dimension: string;
  score: number;
  level: string;
  priorityActions: string[];
  zigotraceService: string;
  serviceLink: string;
  hbarCharged: number;
}

export interface RemediationReport {
  submissionId: string;
  overallScore: number;
  overallLevel: string;
  totalHbarCharged: number;
  hcsTxId: string | undefined;
  tracePassTokenId: string | null;
  correctiveActions: CorrectiveAction[];
  summaryStatement: string;
  generatedAt: string;
  ddsReference: string;
  submittedName?: string;
}

export interface AgentEvent {
  type:
    | "guardian_start"
    | "payment_requested"
    | "payment_confirmed"
    | "agent_start"
    | "agent_result"
    | "agent_error"
    | "compliance_scored"
    | "report_ready"
    | "remediation_report_ready"
    | "nft_minted";
  timestamp: number;
  agentId?: string;
  farmId?: string;
  message: string;
  priceHbar?: number;
  txId?: string;
  report?: EudrReport;
  remediationReport?: RemediationReport;
  tokenId?: string;
}

export type ReadinessBand =
  | "Advanced Readiness"
  | "Intermediate Readiness"
  | "Basic Readiness"
  | "Critical Gaps";

export interface FarmVerificationResult {
  farmId: string;
  geolocation: "PASS" | "FAIL" | "WARNING";
  deforestation: "PASS" | "FAIL" | "WARNING";
  agronomy: "PASS" | "FAIL" | "WARNING";
  records: "PASS" | "FAIL" | "WARNING";
  issues: string[];
}

export interface EudrReport {
  ddsReference: string;
  cooperativeId: string;
  cooperativeName: string;
  commodity: string;
  readinessScore: number;
  readinessBand: ReadinessBand;
  farmResults: FarmVerificationResult[];
  redFlags: string[];
  recommendations: string[];
  exportEligibleFarms: string[];
  excludedFarms: string[];
  hcsTopicId: string;
  tracePassTokenId: string | null;
  generatedAt: string;
}
