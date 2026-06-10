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

  // Append to .env.local if it exists
  const envPath = "apps/web/.env.local";
  if (fs.existsSync(envPath)) {
    const current = fs.readFileSync(envPath, "utf8");
    if (!current.includes("HCS_EUDR_TOPIC_ID")) {
      fs.appendFileSync(envPath, `\nHCS_EUDR_TOPIC_ID=${topicId}\n`);
      console.log(`\nAlso appended to ${envPath}`);
    }
  }

  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
