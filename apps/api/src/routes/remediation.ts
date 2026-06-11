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

const DIM_ACCOUNTS = {
  geo:            { accounts: ["GEOLOCATION_ACCOUNT", "FARM_RECORDS_ACCOUNT"],                        hbar: [0.05, 0.03] },
  legality:       { accounts: ["FARM_RECORDS_ACCOUNT", "COMPLIANCE_ACCOUNT"],                         hbar: [0.03, 0.04] },
  dueDiligence:   { accounts: ["DEFORESTATION_ACCOUNT", "COUNTERFEIT_ACCOUNT", "COMPLIANCE_ACCOUNT"], hbar: [0.10, 0.05, 0.04] },
  riskManagement: { accounts: ["AGRONOMY_ACCOUNT", "COMPLIANCE_ACCOUNT"],                             hbar: [0.03, 0.04] },
  report:         { accounts: ["REPORT_ACCOUNT"],                                                     hbar: [0.15] },
};

function emit(res: Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function mapRole(role: string): "farmer" | "cooperative" | "operator" {
  const r = (role ?? "").toLowerCase();
  if (r.includes("coop")) return "cooperative";
  if (r.includes("operator") || r.includes("trader") || r.includes("importer") || r.includes("exporter")) return "operator";
  return "farmer";
}

interface RemediationInput {
  submissionId: string;
  userType: "farmer" | "cooperative" | "operator";
  overallScore: number;
  overallLevel: string;
  breakdown: ScanBreakdown;
  rawAnswers: Record<string, unknown>;
  submittedName?: string;
}

async function runRemediation(res: Response, input: RemediationInput) {
  const { submissionId, userType, overallScore, overallLevel, breakdown, rawAnswers, submittedName } = input;
  const hcsTopicId = process.env.HCS_EUDR_TOPIC_ID ?? "0.0.PENDING";
  const nameTag = submittedName ? ` for ${submittedName}` : "";

  try {
    emit(res, {
      type: "guardian_start",
      timestamp: Date.now(),
      agentId: "guardian",
      message: `Starting remediation analysis${nameTag} — submission ${submissionId} | overall score ${overallScore}% (${overallLevel})`,
    });

    await logToHcs({ eventType: "REMEDIATION_START", timestamp: Date.now(), sessionId: submissionId, cooperativeId: submissionId });

    const GAP_THRESHOLD = 70;
    const correctiveActions = [];
    const hbarTransfers: { toAccountId: string; amountHbar: number }[] = [];

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

    let splitTxId: string | undefined;
    if (process.env.HEDERA_OPERATOR_ID && hbarTransfers.length > 0) {
      const reportAccountId = process.env.REPORT_ACCOUNT;
      if (reportAccountId) hbarTransfers.push({ toAccountId: reportAccountId, amountHbar: 0.15 });
      try {
        splitTxId = await transferHbar(hbarTransfers);
        const totalHbar = hbarTransfers.reduce((s, t) => s + t.amountHbar, 0);
        emit(res, { type: "payment_confirmed", timestamp: Date.now(), agentId: "guardian", message: `MPP split settled — ${totalHbar.toFixed(2)} HBAR distributed to ${hbarTransfers.length} agents`, txId: splitTxId });
      } catch { /* non-blocking */ }
    }

    let tracePassTokenId: string | null = null;
    if (overallScore >= 65 && process.env.HEDERA_OPERATOR_ID) {
      try {
        const nft = await mintTracePassNft({ cooperativeId: submissionId, eudrScore: overallScore, commodity: "multi-commodity", hcsTopicId, verifiedDate: new Date().toISOString() });
        tracePassTokenId = nft.tokenId;
        emit(res, { type: "nft_minted", timestamp: Date.now(), agentId: "guardian", message: `TracePass NFT minted: ${nft.tokenId}#${nft.serialNumber}`, tokenId: nft.tokenId });
      } catch { /* non-blocking */ }
    }

    emit(res, { type: "agent_start", timestamp: Date.now(), agentId: "report", message: "Compiling remediation report...", priceHbar: 0.15 });
    const report = await buildRemediationReport(submissionId, userType, overallScore, overallLevel, correctiveActions, splitTxId, tracePassTokenId, submittedName);

    await logToHcs({ eventType: "REMEDIATION_COMPLETE", timestamp: Date.now(), sessionId: submissionId, cooperativeId: submissionId, result: { score: overallScore, actionsCount: correctiveActions.length, ddsReference: report.ddsReference } });

    emit(res, {
      type: "remediation_report_ready",
      timestamp: Date.now(),
      agentId: "report",
      message: `Remediation plan ready — ${correctiveActions.length} dimension${correctiveActions.length !== 1 ? "s" : ""} analysed | ${report.ddsReference}`,
      remediationReport: report,
    });

  } catch (err) {
    emit(res, { type: "agent_error", timestamp: Date.now(), message: `Remediation error: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    res.end();
  }
}

// Direct POST — caller provides full scan data
remediationRouter.post("/", async (req: Request, res: Response) => {
  const { submissionId, userType = "farmer", overallScore, overallLevel, breakdown, rawAnswers = {} } = req.body as RemediationInput;

  if (!submissionId || !breakdown || overallScore === undefined) {
    res.status(400).json({ error: "submissionId, breakdown, and overallScore are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  await runRemediation(res, { submissionId, userType, overallScore, overallLevel, breakdown, rawAnswers });
});

// From-scan POST — Guardian fetches the submission from zigotrace.com/eudr-scan
remediationRouter.post("/from-scan", async (req: Request, res: Response) => {
  const { submissionId } = req.body as { submissionId: string };

  if (!submissionId) {
    res.status(400).json({ error: "submissionId is required" });
    return;
  }

  const scanApiUrl = (process.env.EUDR_SCAN_API_URL ?? "https://zigotrace.com").replace(/\/$/, "");
  const scanApiKey = process.env.EUDR_SCAN_API_KEY ?? "";

  let scanData: Record<string, unknown>;
  try {
    const r = await fetch(`${scanApiUrl}/api/internal/submissions/${submissionId}`, {
      headers: {
        "x-api-key": scanApiKey,
        "Accept": "application/json",
      },
    });
    if (!r.ok) {
      const body = await r.text();
      res.status(r.status).json({ error: `Scan site returned ${r.status}: ${body}` });
      return;
    }
    scanData = await r.json() as Record<string, unknown>;
  } catch (err) {
    res.status(502).json({ error: `Could not reach scan site: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }

  const breakdown = scanData.breakdown as ScanBreakdown;
  const overallScore = scanData.score_overall as number;
  const overallLevel = scanData.score_category as string;
  const role = scanData.role as string ?? "farmer";
  const submittedName = scanData.name as string | undefined;
  const assessment = scanData.assessment as { responses?: Record<string, unknown> } | undefined;
  const rawAnswers = assessment?.responses ?? {};

  if (!breakdown || overallScore === undefined) {
    res.status(422).json({ error: "Scan submission is missing breakdown or score data" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  await runRemediation(res, {
    submissionId: String(submissionId),
    userType: mapRole(role),
    overallScore,
    overallLevel,
    breakdown,
    rawAnswers,
    submittedName,
  });
});
