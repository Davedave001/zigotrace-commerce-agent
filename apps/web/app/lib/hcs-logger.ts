import { submitHcsMessage } from "./hedera.js";

export type HcsEventType =
  | "GUARDIAN_START"
  | "PAYMENT_REQUESTED"
  | "PAYMENT_CONFIRMED"
  | "FARM_VERIFIED"
  | "DEFORESTATION_CLEARED"
  | "AGRONOMY_VERIFIED"
  | "RECORDS_VALIDATED"
  | "COUNTERFEIT_SCAN"
  | "COMPLIANCE_SCORED"
  | "DDS_GENERATED"
  | "NFT_MINTED";

export interface HcsLogEntry {
  eventType: HcsEventType;
  timestamp: number;
  sessionId: string;
  cooperativeId?: string;
  farmId?: string;
  agentId?: string;
  txId?: string;
  amountHbar?: number;
  result?: unknown;
}

export async function logToHcs(entry: HcsLogEntry): Promise<void> {
  const topicId = process.env.HCS_EUDR_TOPIC_ID;
  if (!topicId) return; // graceful no-op if topic not configured yet

  try {
    await submitHcsMessage(topicId, JSON.stringify(entry));
  } catch {
    // HCS failures must never break the verification flow
  }
}
