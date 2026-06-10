import { NextRequest, NextResponse } from "next/server";
import { Ap2Client } from "@eudr-guardian/ap2";

const ap2 = new Ap2Client({
  merchantId: "eudr-guardian",
  merchantName: "EUDR Guardian Verification Network",
});

export async function POST(req: NextRequest) {
  const { serviceId, amountHbar, description, cooperativeId, farmId } = await req.json();

  if (!serviceId || !amountHbar) {
    return NextResponse.json({ error: "serviceId and amountHbar required" }, { status: 400 });
  }

  const request = ap2.createPaymentRequest({
    serviceId,
    amountHbar,
    description: description ?? serviceId,
    cooperativeId,
    farmId,
    sessionId: crypto.randomUUID(),
  });

  return NextResponse.json(request);
}
