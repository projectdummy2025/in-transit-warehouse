import { describe, expect, it } from "bun:test";
import { defaultDatabase } from "../src/db/client";
import { locationsTable, skusTable } from "../src/db/schema";
import { verifyLocationCapacity } from "../src/services/location-service";
import { serverApp } from "../src/index";

// Test suite for location capacity validation
describe("Location Capacity Service", () => {
  it("should pass capacity verification when below limit", async () => {
    const [testLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-CAP-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 100,
      })
      .returning();

    const capacityStatus = await verifyLocationCapacity(testLocation.id, 50);

    expect(capacityStatus.remainingCapacity).toBe(100);
    expect(capacityStatus.occupiedQuantity).toBe(0);
  });

  it("should throw error when incoming quantity exceeds capacity", async () => {
    const [smallLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-SMALL-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 10,
      })
      .returning();

    expect(verifyLocationCapacity(smallLocation.id, 20)).rejects.toThrow("Location capacity exceeded");
  });

  it("should return 400 via API when receiving exceeds location capacity", async () => {
    const [testSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-CAP-${Date.now()}`,
        name: "Heavy Unit",
      })
      .returning();

    const [tinyLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-TINY-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 5,
      })
      .returning();

    const overCapacityRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: testSku.id,
        quantity: 100,
        locationId: tinyLocation.id,
      }),
    });

    const apiResponse = await serverApp.request(overCapacityRequest);
    const responsePayload = (await apiResponse.json()) as { message: string };

    expect(apiResponse.status).toBe(400);
    expect(responsePayload.message).toBe("Location capacity exceeded");
  });
});
