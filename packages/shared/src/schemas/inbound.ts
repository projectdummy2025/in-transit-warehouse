import { z } from "zod";

// Validate payload for inbound receive endpoint
export const InboundReceiveSchema = z.object({
  sku_id: z.string().min(1, "SKU identifier is required"),
  quantity: z.number().int().positive("Quantity must be positive integer"),
  location_id: z.string().optional()
});

export type InboundReceiveInput = z.infer<typeof InboundReceiveSchema>;
