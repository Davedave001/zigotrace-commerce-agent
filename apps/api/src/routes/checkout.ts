import { Router, Request, Response } from "express";
import { CheckoutRequestSchema, EUDR_SERVICES } from "@eudr-guardian/acp";
import { Ap2Client } from "@eudr-guardian/ap2";

export const checkoutRouter = Router();

const ap2 = new Ap2Client({
  merchantId: "eudr-guardian",
  merchantName: "EUDR Guardian Verification Network",
  ttlSeconds: 300,
});

checkoutRouter.post("/", (req: Request, res: Response) => {
  const parsed = CheckoutRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { serviceId, cooperativeId, farmId } = parsed.data;
  const service = EUDR_SERVICES.find(s => s.id === serviceId);
  if (!service) {
    res.status(404).json({ error: "Unknown service" });
    return;
  }

  const paymentRequest = ap2.createPaymentRequest({
    serviceId,
    amountHbar: parseFloat(service.price.amount),
    description: service.description,
    cooperativeId,
    farmId,
    sessionId: crypto.randomUUID(),
  });

  res.json({
    sessionId: paymentRequest.requestId,
    paymentRequest,
    receiverAccountId: process.env.HEDERA_OPERATOR_ID,
    amountHbar: paymentRequest.amount.value,
    service,
  });
});
