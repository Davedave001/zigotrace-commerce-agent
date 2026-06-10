import { z } from "zod";

export const CheckoutRequestSchema = z.object({
  serviceId: z.string(),
  cooperativeId: z.string().optional(),
  farmId: z.string().optional(),
  payerAccountId: z.string(),
  callbackUrl: z.string().url().optional(),
});

export const CheckoutSessionSchema = z.object({
  sessionId: z.string(),
  serviceId: z.string(),
  amountHbar: z.number(),
  receiverAccountId: z.string(),
  expiresAt: z.string().datetime(),
  status: z.enum(["pending", "paid", "expired"]),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
