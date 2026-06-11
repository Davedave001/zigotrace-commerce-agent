/**
 * One-time setup: creates the HCS audit topic on Hedera testnet.
 * Run once before starting the app:
 *   npx tsx scripts/setup-hedera.ts
 *
 * Requires HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in environment.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
} from "@hashgraph/sdk";
import * as fs from "fs";
import * as path from "path";

// Load .env from repo root if env vars aren't already set
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    console.error("Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY env vars first.");
    process.exit(1);
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringDer(operatorKey)
  );

  console.log("Creating EUDR audit HCS topic...");

  const tx = await new TopicCreateTransaction()
    .setTopicMemo("EUDR Guardian — Compliance Audit Trail")
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId!.toString();

  console.log(`\nHCS topic created: ${topicId}`);
  console.log("\nAdd this to your .env.local:");
  console.log(`HCS_EUDR_TOPIC_ID=${topicId}`);

  // Append to root .env if not already set
  const rootEnv = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(rootEnv)) {
    const current = fs.readFileSync(rootEnv, "utf8");
    if (!current.includes("HCS_EUDR_TOPIC_ID")) {
      fs.appendFileSync(rootEnv, `\nHCS_EUDR_TOPIC_ID=${topicId}\n`);
      console.log(`\nAppended to .env`);
    } else {
      console.log("\nHCS_EUDR_TOPIC_ID already in .env — update it manually if needed.");
    }
  }

  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
