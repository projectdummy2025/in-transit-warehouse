import { StagingBay, StagingTelemetry } from "./stagingTypes";

// Pure function to calculate bay utilization percentage
export function calculateUtilizationPercentage(currentUnits: number, maxCapacityUnits: number): number {
  if (maxCapacityUnits <= 0) return 0;
  const percentage = (currentUnits / maxCapacityUnits) * 100;
  return Math.min(100, Math.round(percentage));
}

// Pure function to determine bay capacity status threshold
export function getBayCapacityStatus(currentUnits: number, maxCapacityUnits: number): "NORMAL" | "HIGH" | "CRITICAL" {
  const percentage = calculateUtilizationPercentage(currentUnits, maxCapacityUnits);
  if (percentage >= 90) return "CRITICAL";
  if (percentage >= 70) return "HIGH";
  return "NORMAL";
}

// Pure function to compute global telemetry metrics across all buffer bays
export function calculateStagingTelemetry(bayList: StagingBay[]): StagingTelemetry {
  const totalBays = bayList.length;
  const occupiedBays = bayList.filter((b) => b.currentUnits > 0).length;
  const totalCapacityUnits = bayList.reduce((sum, b) => sum + b.maxCapacityUnits, 0);
  const totalCurrentUnits = bayList.reduce((sum, b) => sum + b.currentUnits, 0);
  const utilizationPercentage = calculateUtilizationPercentage(totalCurrentUnits, totalCapacityUnits);

  return {
    totalBays,
    occupiedBays,
    totalCapacityUnits,
    totalCurrentUnits,
    utilizationPercentage,
  };
}
