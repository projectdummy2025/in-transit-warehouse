// Data contracts and interfaces for pallet location mutation operations
export interface MutationRecord {
  mutationId: string;
  lpnCode: string;
  sourceLocation: string;
  destinationLocation: string;
  operatorName: string;
  mutatedAt: string;
  syncStatus: "optimistic" | "confirmed" | "failed";
}

export interface CreateMutationPayload {
  lpnCode: string;
  destinationLocation: string;
}
