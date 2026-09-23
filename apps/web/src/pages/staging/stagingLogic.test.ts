import { test, expect } from "bun:test";
import { StagingBay } from "./stagingTypes";
import {
  calculateUtilizationPercentage,
  getBayCapacityStatus,
  calculateStagingTelemetry,
} from "./stagingLogic";

test("calculates accurate utilization percentage", () => {
  expect(calculateUtilizationPercentage(35, 50)).toBe(70);
  expect(calculateUtilizationPercentage(0, 50)).toBe(0);
  expect(calculateUtilizationPercentage(50, 50)).toBe(100);
});

test("determines correct capacity status threshold", () => {
  expect(getBayCapacityStatus(20, 50)).toBe("NORMAL"); // 40%
  expect(getBayCapacityStatus(36, 50)).toBe("HIGH"); // 72%
  expect(getBayCapacityStatus(46, 50)).toBe("CRITICAL"); // 92%
});

test("computes aggregate warehouse staging telemetry", () => {
  const mockBays: StagingBay[] = [
    { bayCode: "BAY-01", maxCapacityUnits: 50, currentUnits: 25, pallets: [] },
    { bayCode: "BAY-02", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  ];

  const telemetry = calculateStagingTelemetry(mockBays);

  expect(telemetry.totalBays).toBe(2);
  expect(telemetry.occupiedBays).toBe(1);
  expect(telemetry.totalCapacityUnits).toBe(100);
  expect(telemetry.totalCurrentUnits).toBe(25);
  expect(telemetry.utilizationPercentage).toBe(25);
});
