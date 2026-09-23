import { z } from "zod";

// Zod schema validating internal inventory move mutation API payload
export const MutationMoveSchema = z.object({
  lpn_code: z.string().min(1, "LPN code is required"),
  to_location_code: z.string().min(1, "Target location code is required"),
  operator_id: z.string().min(1, "Operator identifier is required"),
});

export type MutationMoveInput = z.infer<typeof MutationMoveSchema>;
