import { z } from "zod";

// Validate payload for inventory move endpoint
export const MutationMoveSchema = z.object({
  lpn_id: z.string().min(1, "LPN identifier is required"),
  target_location_id: z.string().min(1, "Target location identifier is required")
});

export type MutationMoveInput = z.infer<typeof MutationMoveSchema>;
