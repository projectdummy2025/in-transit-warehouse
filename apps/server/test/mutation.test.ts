import { describe, expect, it } from "bun:test";
import { defaultDatabase } from "../src/db/client";
import { locationsTable, lpnsTable, mutationLogsTable, skusTable } from "../src/db/schema";
import { serverApp } from "../src/index";

// Test suite for Internal Mutation Move API and workflow
describe("Mutation Move API", () => {
  it("should successfully move LPN to new location and update status to STAGED", async () => {
    // Seed SKU and Locations
    const [testSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-MUT-${Date.now()}`,
        name: "Mutation Pallet Item",
      })
      .returning();

    const [sourceLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-SRC-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 100,
      })
      .returning();

    const [destinationLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-DEST-${Date.now()}`,
        locationType: "TRANSIT",
        capacity: 100,
      })
      .returning();

    // Create initial LPN
    const [initialLpn] = await defaultDatabase.databaseClient
      .insert(lpnsTable)
      .values({
        lpnCode: `LPN-TEST-MOVE-${Date.now()}`,
        skuId: testSku.id,
        quantity: 25,
        currentLocationId: sourceLocation.id,
        status: "RECEIVED",
      })
      .returning();

    // Send Move request
    const moveRequest = new Request("http://localhost/api/mutations/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: initialLpn.lpnCode,
        destinationLocationId: destinationLocation.id,
        notes: "Transfer to staging rack",
      }),
    });

    const moveResponse = await serverApp.request(moveRequest);
    const responsePayload = (await moveResponse.json()) as {
      message: string;
      data: { id: number; lpnCode: string; status: string; currentLocationId: number };
    };

    expect(moveResponse.status).toBe(200);
    expect(responsePayload.message).toBe("LPN moved successfully");
    expect(responsePayload.data.status).toBe("STAGED");
    expect(responsePayload.data.currentLocationId).toBe(destinationLocation.id);

    // Verify audit log entry in mutation_logs table
    const mutationLogs = await defaultDatabase.databaseClient
      .select()
      .from(mutationLogsTable);

    const latestLog = mutationLogs[mutationLogs.length - 1];
    expect(latestLog.lpnId).toBe(initialLpn.id);
    expect(latestLog.sourceLocationId).toBe(sourceLocation.id);
    expect(latestLog.destinationLocationId).toBe(destinationLocation.id);
    expect(latestLog.actionType).toBe("MOVE");
  });

  it("should return 400 error when moving non-existent LPN", async () => {
    const invalidRequest = new Request("http://localhost/api/mutations/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: "LPN-NON-EXISTENT",
        destinationLocationId: 1,
      }),
    });

    const invalidResponse = await serverApp.request(invalidRequest);
    const responsePayload = (await invalidResponse.json()) as { message: string };

    expect(invalidResponse.status).toBe(400);
    expect(responsePayload.message).toBe("Target LPN not found");
  });

  it("should return 400 error when moving to the same current location", async () => {
    const [testSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-SAME-${Date.now()}`,
        name: "Same Location Item",
      })
      .returning();

    const [testLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-SAME-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 100,
      })
      .returning();

    const [testLpn] = await defaultDatabase.databaseClient
      .insert(lpnsTable)
      .values({
        lpnCode: `LPN-SAME-${Date.now()}`,
        skuId: testSku.id,
        quantity: 10,
        currentLocationId: testLocation.id,
        status: "RECEIVED",
      })
      .returning();

    const sameLocationRequest = new Request("http://localhost/api/mutations/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: testLpn.lpnCode,
        destinationLocationId: testLocation.id,
      }),
    });

    const sameLocationResponse = await serverApp.request(sameLocationRequest);
    const responsePayload = (await sameLocationResponse.json()) as { message: string };

    expect(sameLocationResponse.status).toBe(400);
    expect(responsePayload.message).toBe("LPN is already at destination location");
  });
});
