import { NextRequest } from "next/server";
import type { CooperativePackage, AgentEvent } from "../../lib/types";
import { verifyGeolocation } from "../../lib/specialist-agents/geolocation";
import { assessDeforestation } from "../../lib/specialist-agents/deforestation";
import { verifyAgronomy } from "../../lib/specialist-agents/agronomy";
import { validateFarmRecords } from "../../lib/specialist-agents/farm-records";
import { detectCounterfeits } from "../../lib/specialist-agents/counterfeit";
import { scoreCompliance } from "../../lib/specialist-agents/compliance";
import { buildReport } from "../../lib/specialist-agents/report";
import { logToHcs } from "../../lib/hcs-logger";
import { transferHbar, mintTracePassNft } from "../../lib/hedera";
import { DEMO_COOPERATIVE } from "../../lib/demo-data";

const AGENT_PRICES: Record<string, number> = {
  geolocation: 0.05,
  deforestation: 0.10,
  agronomy: 0.03,
  "farm-records": 0.03,
  counterfeit: 0.05,
  compliance: 0.04,
  report: 0.15,
};

function emit(controller: ReadableStreamDefaultController, event: AgentEvent) {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(line));
}

export async function POST(req: NextRequest) {
  const sessionId = crypto.randomUUID();
  const hcsTopicId = process.env.HCS_EUDR_TOPIC_ID ?? "0.0.PENDING";

  const formData = await req.formData();
  let cooperative: CooperativePackage;

  if (formData.get("demo") === "true") {
    cooperative = DEMO_COOPERATIVE;
  } else {
    const file = formData.get("package") as File | null;
    if (!file) {
      return new Response("No package uploaded", { status: 400 });
    }
    cooperative = JSON.parse(await file.text()) as CooperativePackage;
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        emit(controller, {
          type: "guardian_start",
          timestamp: Date.now(),
          agentId: "guardian",
          message: `Starting EUDR verification for ${cooperative.cooperativeName} â€” ${cooperative.farms.length} farms`,
        });

        await logToHcs({ eventType: "GUARDIAN_START", timestamp: Date.now(), sessionId, cooperativeId: cooperative.cooperativeId });

        // --- Agent 1: Geolocation ---
        emit(controller, {
          type: "payment_requested",
          timestamp: Date.now(),
          agentId: "geolocation",
          message: `Requesting GPS polygon verification â€” ${cooperative.farms.length} farms`,
          priceHbar: AGENT_PRICES.geolocation * cooperative.farms.length,
        });

        const geoResults = await Promise.all(
          cooperative.farms.map((farm) => verifyGeolocation(farm))
        );

        emit(controller, {
          type: "agent_result",
          timestamp: Date.now(),
          agentId: "geolocation",
          message: `GPS verification complete â€” ${geoResults.filter((r) => r.status === "PASS").length}/${geoResults.length} farms passed`,
        });

        // --- Agent 2: Deforestation ---
        emit(controller, {
          type: "payment_requested",
          timestamp: Date.now(),
          agentId: "deforestation",
          message: "Requesting deforestation risk scan",
          priceHbar: AGENT_PRICES.deforestation * cooperative.farms.length,
        });

        const defoResults = await Promise.all(
          cooperative.farms.map((farm) => assessDeforestation(farm, cooperative))
        );

        const defoHigh = defoResults.filter((r) => r.riskLevel === "HIGH").length;
        emit(controller, {
          type: "agent_result",
          timestamp: Date.now(),
          agentId: "deforestation",
          message: `Deforestation scan complete â€” ${defoHigh} HIGH risk farms detected`,
        });

        // --- Agent 3: Agronomy ---
        emit(controller, {
          type: "payment_requested",
          timestamp: Date.now(),
          agentId: "agronomy",
          message: "Requesting agronomy & pesticide compliance check",
          priceHbar: AGENT_PRICES.agronomy * cooperative.farms.length,
        });

        const agroResults = await Promise.all(
          cooperative.farms.map((farm) => verifyAgronomy(farm, cooperative.commodity))
        );

        const bannedCount = agroResults.filter((r) => r.euBannedPesticidesDetected.length > 0).length;
        emit(controller, {
          type: "agent_result",
          timestamp: Date.now(),
          agentId: "agronomy",
          message: `Agronomy check complete â€” ${bannedCount} farms with EU-banned substances`,
        });

        // --- Agent 4: Farm Records ---
        emit(controller, {
          type: "payment_requested",
          timestamp: Date.now(),
          agentId: "farm-records",
          message: "Requesting farm records validation",
          priceHbar: AGENT_PRICES["farm-records"] * cooperative.farms.length,
        });

        const recordsResults = await Promise.all(
          cooperative.farms.map((farm) => validateFarmRecords(farm))
        );

        emit(controller, {
          type: "agent_result",
          timestamp: Date.now(),
          agentId: "farm-records",
          message: `Records validation complete â€” ${recordsResults.filter((r) => r.status === "PASS").length}/${recordsResults.length} farms pass`,
        });

        // --- Agent 5: Counterfeit ---
        emit(controller, {
          type: "payment_requested",
          timestamp: Date.now(),
          agentId: "counterfeit",
          message: "Requesting counterfeit & volume fraud detection",
          priceHbar: AGENT_PRICES.counterfeit,
        });

        const counterfeitResult = await detectCounterfeits(cooperative);

        emit(controller, {
          type: "agent_result",
          timestamp: Date.now(),
          agentId: "counterfeit",
          message: counterfeitResult.volumeAnomalyDetected
            ? `Volume anomaly detected â€” ${counterfeitResult.anomalyFactor}x over capacity`
            : `No volume fraud detected â€” anomaly factor ${counterfeitResult.anomalyFactor}x`,
        });

        // --- Agent 6: Compliance Scoring ---
        emit(controller, {
          type: "payment_requested",
          timestamp: Date.now(),
          agentId: "compliance",
          message: "Requesting EUDR compliance scoring",
          priceHbar: AGENT_PRICES.compliance,
        });

        const complianceResult = scoreCompliance({
          geoResults,
          defoResults,
          agroResults,
          recordsResults,
          counterfeitResult,
        });

        emit(controller, {
          type: "compliance_scored",
          timestamp: Date.now(),
          agentId: "compliance",
          message: `EUDR Readiness Score: ${complianceResult.readinessScore}% â€” ${complianceResult.readinessBand}`,
        });

        await logToHcs({
          eventType: "COMPLIANCE_SCORED",
          timestamp: Date.now(),
          sessionId,
          cooperativeId: cooperative.cooperativeId,
          result: { score: complianceResult.readinessScore, band: complianceResult.readinessBand },
        });

        // --- MPP split payment (simulated on testnet) ---
        let splitTxId: string | undefined;
        if (process.env.HEDERA_OPERATOR_ID && process.env.GEOLOCATION_ACCOUNT) {
          try {
            const accounts = {
              geolocation: process.env.GEOLOCATION_ACCOUNT!,
              deforestation: process.env.DEFORESTATION_ACCOUNT!,
              agronomy: process.env.AGRONOMY_ACCOUNT!,
              farmRecords: process.env.FARM_RECORDS_ACCOUNT!,
              counterfeit: process.env.COUNTERFEIT_ACCOUNT!,
              compliance: process.env.COMPLIANCE_ACCOUNT!,
              report: process.env.REPORT_ACCOUNT!,
            };

            splitTxId = await transferHbar([
              { toAccountId: accounts.geolocation, amountHbar: 0.05 },
              { toAccountId: accounts.deforestation, amountHbar: 0.10 },
              { toAccountId: accounts.agronomy, amountHbar: 0.03 },
              { toAccountId: accounts.farmRecords, amountHbar: 0.03 },
              { toAccountId: accounts.counterfeit, amountHbar: 0.05 },
              { toAccountId: accounts.compliance, amountHbar: 0.04 },
              { toAccountId: accounts.report, amountHbar: 0.15 },
            ]);

            emit(controller, {
              type: "payment_confirmed",
              timestamp: Date.now(),
              agentId: "guardian",
              message: `MPP split settled â€” 0.45 HBAR distributed to 7 agents`,
              txId: splitTxId,
            });
          } catch {
            // Payment failure is non-blocking for demo
          }
        }

        // --- Agent 7: Report Generation ---
        emit(controller, {
          type: "agent_start",
          timestamp: Date.now(),
          agentId: "report",
          message: "Generating EUDR Due Diligence Statement...",
          priceHbar: AGENT_PRICES.report,
        });

        // TracePass NFT â€” only if score qualifies
        let tracePassTokenId: string | null = null;
        if (complianceResult.readinessScore >= 65 && process.env.HEDERA_OPERATOR_ID) {
          try {
            const nft = await mintTracePassNft({
              cooperativeId: cooperative.cooperativeId,
              eudrScore: complianceResult.readinessScore,
              commodity: cooperative.commodity,
              hcsTopicId,
              verifiedDate: new Date().toISOString(),
            });
            tracePassTokenId = nft.tokenId;

            emit(controller, {
              type: "nft_minted",
              timestamp: Date.now(),
              agentId: "guardian",
              message: `TracePass NFT minted: ${nft.tokenId}#${nft.serialNumber}`,
              tokenId: nft.tokenId,
            });
          } catch {
            // NFT minting non-blocking
          }
        }

        const report = buildReport({
          cooperativeId: cooperative.cooperativeId,
          cooperativeName: cooperative.cooperativeName,
          commodity: cooperative.commodity,
          geoResults,
          defoResults,
          agroResults,
          recordsResults,
          complianceResult,
          hcsTopicId,
          tracePassTokenId,
        });

        await logToHcs({
          eventType: "DDS_GENERATED",
          timestamp: Date.now(),
          sessionId,
          cooperativeId: cooperative.cooperativeId,
          result: { ddsReference: report.ddsReference, score: report.readinessScore },
        });

        emit(controller, {
          type: "report_ready",
          timestamp: Date.now(),
          agentId: "report",
          message: `DDS generated â€” ${report.ddsReference} | ${report.exportEligibleFarms.length} farms export-eligible`,
          report,
        });
      } catch (err) {
        emit(controller, {
          type: "agent_error",
          timestamp: Date.now(),
          message: `Guardian error: ${err instanceof Error ? err.message : String(err)}`,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
