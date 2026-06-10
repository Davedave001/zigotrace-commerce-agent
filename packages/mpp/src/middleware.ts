import type { MppSplit } from "./split.js";

export interface PaymentGateOptions {
  priceHbar: number;
  paymentRequestUrl: string;
  split?: MppSplit;
}

export interface Gated402Response {
  status: 402;
  body: {
    error: "Payment required";
    payment_details: {
      amount: number;
      currency: "HBAR";
      network: string;
      payment_url: string;
      split?: MppSplit["recipients"];
    };
  };
}

/**
 * Returns a 402 payload when the X-Payment-Token header is absent.
 * The caller checks for null (proceed) vs. Gated402Response (block).
 */
export function checkPaymentToken(
  headers: Record<string, string | undefined>,
  opts: PaymentGateOptions
): Gated402Response | null {
  const token = headers["x-payment-token"];
  if (!token) {
    return {
      status: 402,
      body: {
        error: "Payment required",
        payment_details: {
          amount: opts.priceHbar,
          currency: "HBAR",
          network: process.env.HEDERA_NETWORK ?? "testnet",
          payment_url: opts.paymentRequestUrl,
          split: opts.split?.recipients,
        },
      },
    };
  }
  return null;
}
