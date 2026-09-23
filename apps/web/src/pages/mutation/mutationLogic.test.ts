import { test, expect } from "bun:test";
import { MutationRecord } from "./mutationTypes";

// Pure business logic function for creating an optimistic mutation entry
export function createOptimisticRecord(
  lpnCode: string,
  sourceLocation: string,
  destinationLocation: string,
  operatorName: string
): MutationRecord {
  return {
    mutationId: `MUT-${Date.now()}`,
    lpnCode: lpnCode.trim(),
    sourceLocation: sourceLocation.trim(),
    destinationLocation: destinationLocation.trim(),
    operatorName: operatorName.trim(),
    mutatedAt: new Date().toISOString(),
    syncStatus: "optimistic",
  };
}

// Pure business logic function for calculating shift mutation KPI metrics
export function calculateMutationMetrics(records: MutationRecord[]) {
  const totalTransfers = records.length;
  const uniqueLpns = new Set(records.map((r) => r.lpnCode)).size;
  const sourceBays = new Set(records.map((r) => r.sourceLocation)).size;
  const destBays = new Set(records.map((r) => r.destinationLocation)).size;

  return { totalTransfers, uniqueLpns, sourceBays, destBays };
}

test("creates valid optimistic mutation record with optimistic status", () => {
  const record = createOptimisticRecord("LPN-001", "INBOUND-01", "STAGING-A1", "DC-OPERATOR-01");

  expect(record.lpnCode).toBe("LPN-001");
  expect(record.sourceLocation).toBe("INBOUND-01");
  expect(record.destinationLocation).toBe("STAGING-A1");
  expect(record.syncStatus).toBe("optimistic");
});

test("calculates accurate distinct mutation metrics from ledger records", () => {
  const mockRecords: MutationRecord[] = [
    {
      mutationId: "MUT-1",
      lpnCode: "LPN-01",
      sourceLocation: "BAY-1",
      destinationLocation: "BAY-2",
      operatorName: "OP-1",
      mutatedAt: new Date().toISOString(),
      syncStatus: "confirmed",
    },
    {
      mutationId: "MUT-2",
      lpnCode: "LPN-01",
      sourceLocation: "BAY-2",
      destinationLocation: "BAY-3",
      operatorName: "OP-1",
      mutatedAt: new Date().toISOString(),
      syncStatus: "confirmed",
    },
  ];

  const metrics = calculateMutationMetrics(mockRecords);

  expect(metrics.totalTransfers).toBe(2);
  expect(metrics.uniqueLpns).toBe(1);
  expect(metrics.sourceBays).toBe(2);
  expect(metrics.destBays).toBe(2);
});
