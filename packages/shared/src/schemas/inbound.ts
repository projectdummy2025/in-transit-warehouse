import { z } from "zod";

// Zod schema validating inbound receiving API payload
export const InboundReceiveSchema = z.object({
  sku_code: z.string().min(1, "SKU code is required"),
  quantity: z.number().int().positive("Quantity must be positive integer"),
  location_code: z.string().min(1, "Location code is required"),
  operator_id: z.string().min(1, "Operator identifier is required"),
});

export type InboundReceiveInput = z.infer<typeof InboundReceiveSchema>;
