import { z } from "zod";

export const PaymentRequestSchema = z.object({
  version: z.literal("1.0"),
  requestId: z.string().uuid(),
  type: z.literal("payment_request"),
  amount: z.object({
    value: z.number().positive(),
    currency: z.literal("HBAR"),
  }),
  merchant: z.object({
    id: z.string(),
    name: z.string(),
  }),
  description: z.string(),
  expiresAt: z.string().datetime(),
  metadata: z
    .object({
      serviceId: z.string(),
      farmId: z.string().optional(),
      cooperativeId: z.string().optional(),
      sessionId: z.string().optional(),
    })
    .optional(),
});

export const PaymentResponseSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["approved", "declined", "pending"]),
  transactionId: z.string().optional(),
  payerAccountId: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
