import { Router, Request, Response } from "express";
import type { CooperativePackage, AgentEvent } from "../lib/types.js";
import { verifyGeolocation } from "../lib/specialist-agents/geolocation.js";
import { assessDeforestation } from "../lib/specialist-agents/deforestation.js";
import { verifyAgronomy } from "../lib/specialist-agents/agronomy.js";
import { validateFarmRecords } from "../lib/specialist-agents/farm-records.js";
import { detectCounterfeits } from "../lib/specialist-agents/counterfeit.js";
import { scoreCompliance } from "../lib/specialist-agents/compliance.js";
import { buildReport } from "../lib/specialist-agents/report.js";
import { logToHcs } from "../lib/hcs-logger.js";
import { transferHbar, mintTracePassNft } from "../lib/hedera.js";
import { DEMO_COOPERATIVE } from "../lib/demo-data.js";

export const guardianRouter = Router();

const AGENT_PRICES: Record<string, number> = {
  geolocation: 0.05, deforestation: 0.10, agronomy: 0.03,
  "farm-records": 0.03, counterfeit: 0.05, compliance: 0.04, report: 0.15,
};

function emit(res: Response, event: AgentEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

guardianRouter.post("/", async (req: Request, res: Response) => {
  const sessionId = crypto.randomUUID();
  const hcsTopicId = process.env.HCS_EUDR_TOPIC_ID ?? "0.0.PENDING";

  // Accept JSON body or multipart demo flag
  let cooperative: CooperativePackage;
  const isDemo = req.body?.demo === true || req.body?.demo === "true";

  if (isDemo) {
    cooperative = DEMO_COOPERATIVE;
  } else if (req.body?.package) {
    try {
      cooperative = typeof req.body.package === "string"
        ? JSON.parse(req.body.package)
        : req.body.package;
    } catch {
      res.status(400).json({ error: "Invalid package JSON" });
      return;
    }
  } else {
    res.status(400).json({ error: "Send { demo: true } or { package: <CooperativePackage> }" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    emit(res, { type: "guardian_start", timestamp: Date.now(), agentId: "guardian", message: `Starting EUDR verification for ${cooperative.cooperativeName} — ${cooperative.farms.length} farms` });
    await logToHcs({ eventType: "GUARDIAN_START", timestamp: Date.now(), sessionId, cooperativeId: cooperative.cooperativeId });

    // Agent 1: Geolocation
    emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "geolocation", message: `GPS polygon verification — ${cooperative.farms.length} farms`, priceHbar: AGENT_PRICES.geolocation * cooperative.farms.length });
    const geoResults = await Promise.all(cooperative.farms.map(f => verifyGeolocation(f)));
    emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "geolocation", message: `GPS check complete — ${geoResults.filter(r => r.status === "PASS").length}/${geoResults.length} passed` });

    // Agent 2: Deforestation
    emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "deforestation", message: "Deforestation risk scan", priceHbar: AGENT_PRICES.deforestation * cooperative.farms.length });
    const defoResults = await Promise.all(cooperative.farms.map(f => assessDeforestation(f, cooperative)));
    const defoHigh = defoResults.filter(r => r.riskLevel === "HIGH").length;
    emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "deforestation", message: `Deforestation scan complete — ${defoHigh} HIGH risk farms` });

    // Agent 3: Agronomy
    emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "agronomy", message: "Agronomy & pesticide compliance check", priceHbar: AGENT_PRICES.agronomy * cooperative.farms.length });
    const agroResults = await Promise.all(cooperative.farms.map(f => verifyAgronomy(f, cooperative.commodity)));
    const bannedCount = agroResults.filter(r => r.euBannedPesticidesDetected.length > 0).length;
    emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "agronomy", message: `Agronomy check complete — ${bannedCount} farms with EU-banned substances` });

    // Agent 4: Farm Records
    emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "farm-records", message: "Farm records validation", priceHbar: AGENT_PRICES["farm-records"] * cooperative.farms.length });
    const recordsResults = await Promise.all(cooperative.farms.map(f => validateFarmRecords(f)));
    emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "farm-records", message: `Records validated — ${recordsResults.filter(r => r.status === "PASS").length}/${recordsResults.length} passed` });

    // Agent 5: Counterfeit
    emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "counterfeit", message: "Counterfeit & volume fraud detection", priceHbar: AGENT_PRICES.counterfeit });
    const counterfeitResult = await detectCounterfeits(cooperative);
    emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "counterfeit", message: counterfeitResult.volumeAnomalyDetected ? `Volume anomaly ${counterfeitResult.anomalyFactor}x detected` : `No volume fraud — factor ${counterfeitResult.anomalyFactor}x` });

    // Agent 6: Compliance Scoring
    emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "compliance", message: "EUDR compliance scoring", priceHbar: AGENT_PRICES.compliance });
    const complianceResult = scoreCompliance({ geoResults, defoResults, agroResults, recordsResults, counterfeitResult });
    emit(res, { type: "compliance_scored", timestamp: Date.now(), agentId: "compliance", message: `EUDR Readiness: ${complianceResult.readinessScore}% — ${complianceResult.readinessBand}` });
    await logToHcs({ eventType: "COMPLIANCE_SCORED", timestamp: Date.now(), sessionId, cooperativeId: cooperative.cooperativeId, result: { score: complianceResult.readinessScore } });

    // MPP split
    let splitTxId: string | undefined;
    if (process.env.HEDERA_OPERATOR_ID && process.env.GEOLOCATION_ACCOUNT) {
      try {
        splitTxId = await transferHbar([
          { toAccountId: process.env.GEOLOCATION_ACCOUNT!, amountHbar: 0.05 },
          { toAccountId: process.env.DEFORESTATION_ACCOUNT!, amountHbar: 0.10 },
          { toAccountId: process.env.AGRONOMY_ACCOUNT!, amountHbar: 0.03 },
          { toAccountId: process.env.FARM_RECORDS_ACCOUNT!, amountHbar: 0.03 },
          { toAccountId: process.env.COUNTERFEIT_ACCOUNT!, amountHbar: 0.05 },
          { toAccountId: process.env.COMPLIANCE_ACCOUNT!, amountHbar: 0.04 },
          { toAccountId: process.env.REPORT_ACCOUNT!, amountHbar: 0.15 },
        ]);
        emit(res, { type: "payment_confirmed", timestamp: Date.now(), agentId: "guardian", message: "MPP split settled — 0.45 HBAR distributed to 7 agents", txId: splitTxId });
      } catch { /* non-blocking for demo */ }
    }

    // TracePass NFT
    let tracePassTokenId: string | null = null;
    if (complianceResult.readinessScore >= 65 && process.env.HEDERA_OPERATOR_ID) {
      try {
        const nft = await mintTracePassNft({ cooperativeId: cooperative.cooperativeId, eudrScore: complianceResult.readinessScore, commodity: cooperative.commodity, hcsTopicId, verifiedDate: new Date().toISOString() });
        tracePassTokenId = nft.tokenId;
        emit(res, { type: "nft_minted", timestamp: Date.now(), agentId: "guardian", message: `TracePass NFT minted: ${nft.tokenId}#${nft.serialNumber}`, tokenId: nft.tokenId });
      } catch { /* non-blocking */ }
    }

    // Agent 7: Report
    emit(res, { type: "agent_start", timestamp: Date.now(), agentId: "report", message: "Generating EUDR Due Diligence Statement...", priceHbar: AGENT_PRICES.report });
    const report = buildReport({ cooperativeId: cooperative.cooperativeId, cooperativeName: cooperative.cooperativeName, commodity: cooperative.commodity, geoResults, defoResults, agroResults, recordsResults, complianceResult, hcsTopicId, tracePassTokenId });
    await logToHcs({ eventType: "DDS_GENERATED", timestamp: Date.now(), sessionId, cooperativeId: cooperative.cooperativeId, result: { ddsReference: report.ddsReference, score: report.readinessScore } });

    emit(res, { type: "report_ready", timestamp: Date.now(), agentId: "report", message: `DDS generated — ${report.ddsReference} | ${report.exportEligibleFarms.length} farms export-eligible`, report });

  } catch (err) {
    emit(res, { type: "agent_error", timestamp: Date.now(), message: `Guardian error: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    res.end();
  }
});
