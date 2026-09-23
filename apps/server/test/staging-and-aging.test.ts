import { describe, expect, it } from "bun:test";
import { databaseInstance } from "../src/db/client";
import { locationsTable, lpnsTable, skusTable } from "../src/db/schema";
import { activityEventEmitter } from "../src/services/event-emitter";
import { calculateDwellTime, checkIsOverdue, fetchStagingInventory } from "../src/services/staging-service";
import { AgingWorker } from "../src/workers/aging-worker";
import { serverApp } from "../src/index";

describe("Staging Inventory & Aging Worker", () => {
  it("should calculate dwell time and detect overdue correctly", () => {
    const currentTime = new Date("2026-09-23T12:00:00.000Z");
    const twentyFiveHoursAgo = "2026-09-22T11:00:00.000Z";

    const dwellTimeMinutes = calculateDwellTime(twentyFiveHoursAgo, currentTime);
    expect(dwellTimeMinutes).toBe(1500); // 25 hours * 60 minutes

    const isOverdue = checkIsOverdue(dwellTimeMinutes);
    expect(isOverdue).toBe(true);

    const normalMinutes = calculateDwellTime("2026-09-23T10:00:00.000Z", currentTime);
    expect(checkIsOverdue(normalMinutes)).toBe(false);
  });

  it("should fetch staged inventory from database and calculate dwell metrics", async () => {
    // Insert test SKU and Location
    const [testSku] = await databaseInstance
      .insert(skusTable)
      .values({
        skuCode: `SKU-STAGE-${Date.now()}`,
        name: "Staging Test SKU",
      })
      .returning();

    const [testLocation] = await databaseInstance
      .insert(locationsTable)
      .values({
        locationCode: `STAGE-LOC-${Date.now()}`,
        locationType: "TRANSIT",
        capacity: 20,
      })
      .returning();

    // Insert staged LPN received 30 hours ago
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    const [testLpn] = await databaseInstance
      .insert(lpnsTable)
      .values({
        lpnCode: `LPN-STAGE-${Date.now()}`,
        skuId: testSku.id,
        quantity: 100,
        currentLocationId: testLocation.id,
        status: "STAGED",
        receivedAt: thirtyHoursAgo,
      })
      .returning();

    const stagingItems = await fetchStagingInventory();
    const foundItem = stagingItems.find((item) => item.lpn_code === testLpn.lpnCode);

    expect(foundItem).toBeDefined();
    expect(foundItem?.is_overdue).toBe(true);
    expect(foundItem?.sku_code).toBe(testSku.skuCode);

    // Test endpoint GET /api/inventory/staging
    const request = new Request("http://localhost/api/inventory/staging");
    const response = await serverApp.request(request);
    expect(response.status).toBe(200);

    const responseItems = (await response.json()) as Array<{ lpn_code: string }>;
    const matched = responseItems.find((item) => item.lpn_code === testLpn.lpnCode);
    expect(matched).toBeDefined();
  });

  it("should scan overdue items and emit aging alert via event emitter", async () => {
    let capturedAlertPayload: unknown = null;
    const unsubscribe = activityEventEmitter.subscribe((eventPayload) => {
      if (eventPayload.event === "aging:overdue") {
        capturedAlertPayload = eventPayload.data;
      }
    });

    const testWorker = new AgingWorker();
    const overdueList = await testWorker.executeScan();

    expect(overdueList.length).toBeGreaterThan(0);
    expect(capturedAlertPayload).not.toBeNull();

    unsubscribe();
  });
});
