// Data contracts and interfaces for physical warehouse buffer staging bays
export interface StagingPallet {
  lpnCode: string;
  skuCode: string;
  quantityNumber: number;
  receivedAt: string;
}

export interface StagingBay {
  bayCode: string;
  maxCapacityUnits: number;
  currentUnits: number;
  pallets: StagingPallet[];
}

export interface StagingTelemetry {
  totalBays: number;
  occupiedBays: number;
  totalCapacityUnits: number;
  totalCurrentUnits: number;
  utilizationPercentage: number;
}
