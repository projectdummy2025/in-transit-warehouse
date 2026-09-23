import { z } from "zod";

// Zod schema validating outbound dispatch API payload
export const OutboundDispatchSchema = z.object({
  lpn_code: z.string().min(1, "LPN code is required"),
  outbound_location_code: z.string().min(1, "Outbound location code is required"),
  operator_id: z.string().min(1, "Operator identifier is required"),
});

export type OutboundDispatchInput = z.infer<typeof OutboundDispatchSchema>;
