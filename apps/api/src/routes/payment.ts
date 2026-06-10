import { Router, Request, Response } from "express";
import { Ap2Client } from "@eudr-guardian/ap2";

export const paymentRouter = Router();

const ap2 = new Ap2Client({ merchantId: "eudr-guardian", merchantName: "EUDR Guardian Verification Network" });

paymentRouter.post("/request", (req: Request, res: Response) => {
  const { serviceId, amountHbar, description, cooperativeId, farmId } = req.body as Record<string, unknown>;
  if (!serviceId || !amountHbar) {
    res.status(400).json({ error: "serviceId and amountHbar required" });
    return;
  }
  const request = ap2.createPaymentRequest({
    serviceId: String(serviceId),
    amountHbar: Number(amountHbar),
    description: description ? String(description) : String(serviceId),
    cooperativeId: cooperativeId ? String(cooperativeId) : undefined,
    farmId: farmId ? String(farmId) : undefined,
    sessionId: crypto.randomUUID(),
  });
  res.json(request);
});

paymentRouter.get("/verify", async (req: Request, res: Response) => {
  const { txId } = req.query;
  if (!txId) {
    res.status(400).json({ error: "txId required" });
    return;
  }
  const network = process.env.HEDERA_NETWORK ?? "testnet";
  const mirrorUrl = network === "mainnet"
    ? `https://mainnet.mirrornode.hedera.com/api/v1/transactions/${txId}`
    : `https://testnet.mirrornode.hedera.com/api/v1/transactions/${txId}`;
  try {
    const r = await fetch(mirrorUrl);
    if (!r.ok) { res.status(404).json({ verified: false, error: "Transaction not found" }); return; }
    const data = await r.json() as { transactions?: Array<{ result: string }> };
    res.json({ verified: data.transactions?.[0]?.result === "SUCCESS", transaction: data.transactions?.[0] });
  } catch {
    res.status(500).json({ verified: false, error: "Mirror node lookup failed" });
  }
});
