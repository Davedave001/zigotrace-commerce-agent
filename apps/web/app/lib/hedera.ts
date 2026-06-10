import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
  TransferTransaction,
  Hbar,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
} from "@hashgraph/sdk";

let _client: Client | null = null;

export function getHederaClient(): Client {
  if (_client) return _client;

  const network = (process.env.HEDERA_NETWORK ?? "testnet") as "testnet" | "mainnet";
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!);

  _client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  _client.setOperator(operatorId, operatorKey);
  return _client;
}

// Submit a message to an HCS topic
export async function submitHcsMessage(topicId: string, message: string): Promise<string> {
  const client = getHederaClient();
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return receipt.topicSequenceNumber?.toString() ?? "0";
}

// Transfer HBAR from operator to one or more recipients
export async function transferHbar(
  transfers: Array<{ toAccountId: string; amountHbar: number }>
): Promise<string> {
  const client = getHederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);

  const totalHbar = transfers.reduce((s, t) => s + t.amountHbar, 0);

  const tx = new TransferTransaction().addHbarTransfer(
    operatorId,
    Hbar.fromTinybars(-Math.round(totalHbar * 100_000_000))
  );

  for (const { toAccountId, amountHbar } of transfers) {
    tx.addHbarTransfer(
      AccountId.fromString(toAccountId),
      Hbar.fromTinybars(Math.round(amountHbar * 100_000_000))
    );
  }

  const result = await tx.execute(client);
  const receipt = await result.getReceipt(client);
  // status throws on failure
  return result.transactionId.toString();
}

// Create an NFT collection and mint one token for a verified cooperative
export async function mintTracePassNft(metadata: {
  cooperativeId: string;
  eudrScore: number;
  commodity: string;
  hcsTopicId: string;
  verifiedDate: string;
}): Promise<{ tokenId: string; serialNumber: string }> {
  const client = getHederaClient();
  const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!);

  const createTx = await new TokenCreateTransaction()
    .setTokenName(`TracePass — ${metadata.cooperativeId}`)
    .setTokenSymbol("TPASS")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(1)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_OPERATOR_ID!))
    .setSupplyKey(operatorKey.publicKey)
    .execute(client);

  const createReceipt = await createTx.getReceipt(client);
  const tokenId = createReceipt.tokenId!.toString();

  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .addMetadata(Buffer.from(JSON.stringify(metadata)))
    .execute(client);

  const mintReceipt = await mintTx.getReceipt(client);
  const serialNumber = mintReceipt.serials[0]?.toString() ?? "1";

  return { tokenId, serialNumber };
}
