import { NextRequest, NextResponse } from "next/server";
import { CheckoutRequestSchema, EUDR_SERVICES } from "@eudr-guardian/acp";
import { Ap2Client } from "@eudr-guardian/ap2";

const ap2 = new Ap2Client({
  merchantId: "eudr-guardian",
  merchantName: "EUDR Guardian Verification Network",
  ttlSeconds: 300,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CheckoutRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { serviceId, cooperativeId, farmId, payerAccountId } = parsed.data;
  const service = EUDR_SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const paymentRequest = ap2.createPaymentRequest({
    serviceId,
    amountHbar: parseFloat(service.price.amount),
    description: service.description,
    cooperativeId,
    farmId,
    sessionId: crypto.randomUUID(),
  });

  return NextResponse.json({
    sessionId: paymentRequest.requestId,
    paymentRequest,
    receiverAccountId: process.env.HEDERA_OPERATOR_ID,
    amountHbar: paymentRequest.amount.value,
    service,
  });
}
