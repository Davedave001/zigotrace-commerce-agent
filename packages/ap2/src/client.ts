import { v4 as uuidv4 } from "uuid";
import type { PaymentRequest } from "./models.js";

export interface Ap2ClientOptions {
  merchantId: string;
  merchantName: string;
  ttlSeconds?: number;
}

export class Ap2Client {
  constructor(private opts: Ap2ClientOptions) {}

  createPaymentRequest(params: {
    serviceId: string;
    amountHbar: number;
    description: string;
    farmId?: string;
    cooperativeId?: string;
    sessionId?: string;
  }): PaymentRequest {
    const now = new Date();
    const expires = new Date(now.getTime() + (this.opts.ttlSeconds ?? 300) * 1000);

    return {
      version: "1.0",
      requestId: uuidv4(),
      type: "payment_request",
      amount: { value: params.amountHbar, currency: "HBAR" },
      merchant: { id: this.opts.merchantId, name: this.opts.merchantName },
      description: params.description,
      expiresAt: expires.toISOString(),
      metadata: {
        serviceId: params.serviceId,
        farmId: params.farmId,
        cooperativeId: params.cooperativeId,
        sessionId: params.sessionId,
      },
    };
  }
}
