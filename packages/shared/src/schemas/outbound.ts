import { z } from "zod";

// Validate payload for outbound dispatch endpoint
export const OutboundDispatchSchema = z.object({
  lpn_id: z.string().min(1, "LPN identifier is required"),
  target_location_id: z.string().optional()
});

export type OutboundDispatchInput = z.infer<typeof OutboundDispatchSchema>;
