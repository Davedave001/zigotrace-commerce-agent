import { Router, Request, Response } from "express";
import type { ScanBreakdown } from "../lib/remediation-agents.js";
import {
  remediateGeolocation,
  remediateLegality,
  remediateDueDiligence,
  remediateRiskManagement,
  buildRemediationReport,
} from "../lib/remediation-agents.js";
import { logToHcs } from "../lib/hcs-logger.js";
import { transferHbar, mintTracePassNft } from "../lib/hedera.js";

export const remediationRouter = Router();

// HBAR accounts per corrective dimension
const DIM_ACCOUNTS = {
  geo:            { accounts: ["GEOLOCATION_ACCOUNT", "FARM_RECORDS_ACCOUNT"],                     hbar: [0.05, 0.03] },
  legality:       { accounts: ["FARM_RECORDS_ACCOUNT", "COMPLIANCE_ACCOUNT"],                      hbar: [0.03, 0.04] },
  dueDiligence:   { accounts: ["DEFORESTATION_ACCOUNT", "COUNTERFEIT_ACCOUNT", "COMPLIANCE_ACCOUNT"], hbar: [0.10, 0.05, 0.04] },
  riskManagement: { accounts: ["AGRONOMY_ACCOUNT", "COMPLIANCE_ACCOUNT"],                          hbar: [0.03, 0.04] },
  report:         { accounts: ["REPORT_ACCOUNT"],                                                  hbar: [0.15] },
};

function emit(res: Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

remediationRouter.post("/", async (req: Request, res: Response) => {
  const {
    submissionId,
    userType = "farmer",
    overallScore,
    overallLevel,
    breakdown,
    rawAnswers = {},
  } = req.body as {
    submissionId: string;
    userType: "farmer" | "cooperative" | "operator";
    overallScore: number;
    overallLevel: string;
    breakdown: ScanBreakdown;
    rawAnswers: Record<string, unknown>;
  };

  if (!submissionId || !breakdown || overallScore === undefined) {
    res.status(400).json({ error: "submissionId, breakdown, and overallScore are required" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const hcsTopicId = process.env.HCS_EUDR_TOPIC_ID ?? "0.0.PENDING";

  try {
    emit(res, {
      type: "guardian_start",
      timestamp: Date.now(),
      agentId: "guardian",
      message: `Starting remediation analysis for submission ${submissionId} — overall score ${overallScore}% (${overallLevel})`,
    });

    await logToHcs({ eventType: "REMEDIATION_START", timestamp: Date.now(), sessionId: submissionId, cooperativeId: submissionId });

    // Determine which dimensions need remediation (below 70%)
    const GAP_THRESHOLD = 70;
    const correctiveActions = [];
    const hbarTransfers: { toAccountId: string; amountHbar: number }[] = [];

    // Geolocation
    if ((breakdown.geo?.pct ?? 100) < GAP_THRESHOLD) {
      emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "geolocation", message: "Geolocation & Traceability gap detected — running remediation analysis", priceHbar: 0.08 });
      const action = await remediateGeolocation(breakdown, rawAnswers, userType);
      correctiveActions.push(action);
      emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "geolocation", message: `Geo remediation: ${action.priorityActions.length} corrective actions generated` });
      DIM_ACCOUNTS.geo.accounts.forEach((env, i) => {
        const id = process.env[env];
        if (id) hbarTransfers.push({ toAccountId: id, amountHbar: DIM_ACCOUNTS.geo.hbar[i] });
      });
    }

    // Legality
    if ((breakdown.legality?.pct ?? 100) < GAP_THRESHOLD) {
      emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "farm-records", message: "Legality gap detected — running remediation analysis", priceHbar: 0.07 });
      const action = await remediateLegality(breakdown, rawAnswers, userType);
      correctiveActions.push(action);
      emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "farm-records", message: `Legality remediation: ${action.priorityActions.length} corrective actions generated` });
      DIM_ACCOUNTS.legality.accounts.forEach((env, i) => {
        const id = process.env[env];
        if (id) hbarTransfers.push({ toAccountId: id, amountHbar: DIM_ACCOUNTS.legality.hbar[i] });
      });
    }

    // Due Diligence
    if ((breakdown.dueDiligence?.pct ?? 100) < GAP_THRESHOLD) {
      emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "deforestation", message: "Due Diligence gap detected — running deforestation & supply chain analysis", priceHbar: 0.19 });
      const action = await remediateDueDiligence(breakdown, rawAnswers, userType);
      correctiveActions.push(action);
      emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "deforestation", message: `Due Diligence remediation: ${action.priorityActions.length} corrective actions generated` });
      DIM_ACCOUNTS.dueDiligence.accounts.forEach((env, i) => {
        const id = process.env[env];
        if (id) hbarTransfers.push({ toAccountId: id, amountHbar: DIM_ACCOUNTS.dueDiligence.hbar[i] });
      });
    }

    // Risk Management
    if ((breakdown.riskManagement?.pct ?? 100) < GAP_THRESHOLD) {
      emit(res, { type: "payment_requested", timestamp: Date.now(), agentId: "agronomy", message: "Risk Management gap detected — running compliance readiness analysis", priceHbar: 0.07 });
      const action = await remediateRiskManagement(breakdown, rawAnswers, userType);
      correctiveActions.push(action);
      emit(res, { type: "agent_result", timestamp: Date.now(), agentId: "agronomy", message: `Risk Management remediation: ${action.priorityActions.length} corrective actions generated` });
      DIM_ACCOUNTS.riskManagement.accounts.forEach((env, i) => {
        const id = process.env[env];
        if (id) hbarTransfers.push({ toAccountId: id, amountHbar: DIM_ACCOUNTS.riskManagement.hbar[i] });
      });
    }

    // MPP split — pay all triggered agents in one Hedera transaction
    let splitTxId: string | undefined;
    if (process.env.HEDERA_OPERATOR_ID && hbarTransfers.length > 0) {
      // Add report agent share
      const reportAccountId = process.env.REPORT_ACCOUNT;
      if (reportAccountId) hbarTransfers.push({ toAccountId: reportAccountId, amountHbar: 0.15 });

      try {
        splitTxId = await transferHbar(hbarTransfers);
        const totalHbar = hbarTransfers.reduce((s, t) => s + t.amountHbar, 0);
        emit(res, { type: "payment_confirmed", timestamp: Date.now(), agentId: "guardian", message: `MPP split settled — ${totalHbar.toFixed(2)} HBAR distributed to ${hbarTransfers.length} agents`, txId: splitTxId });
      } catch { /* non-blocking */ }
    }

    // TracePass NFT for high readiness (≥65%)
    let tracePassTokenId: string | null = null;
    if (overallScore >= 65 && process.env.HEDERA_OPERATOR_ID) {
      try {
        const nft = await mintTracePassNft({ cooperativeId: submissionId, eudrScore: overallScore, commodity: "multi-commodity", hcsTopicId, verifiedDate: new Date().toISOString() });
        tracePassTokenId = nft.tokenId;
        emit(res, { type: "nft_minted", timestamp: Date.now(), agentId: "guardian", message: `TracePass NFT minted: ${nft.tokenId}#${nft.serialNumber}`, tokenId: nft.tokenId });
      } catch { /* non-blocking */ }
    }

    // Compile final remediation report
    emit(res, { type: "agent_start", timestamp: Date.now(), agentId: "report", message: "Compiling remediation report...", priceHbar: 0.15 });
    const report = await buildRemediationReport(submissionId, userType, overallScore, overallLevel, correctiveActions, splitTxId, tracePassTokenId);

    await logToHcs({ eventType: "REMEDIATION_COMPLETE", timestamp: Date.now(), sessionId: submissionId, cooperativeId: submissionId, result: { score: overallScore, actionsCount: correctiveActions.length, ddsReference: report.ddsReference } });

    emit(res, {
      type: "report_ready",
      timestamp: Date.now(),
      agentId: "report",
      message: `Remediation plan ready — ${correctiveActions.length} dimensions analysed | ${report.ddsReference}`,
      report,
    });

  } catch (err) {
    emit(res, { type: "agent_error", timestamp: Date.now(), message: `Remediation error: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    res.end();
  }
});
