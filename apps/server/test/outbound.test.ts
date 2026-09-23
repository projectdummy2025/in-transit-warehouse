import { describe, expect, it } from "bun:test";
import { defaultDatabase } from "../src/db/client";
import { locationsTable, lpnsTable, mutationLogsTable, skusTable } from "../src/db/schema";
import { serverApp } from "../src/index";

// Test suite for Outbound Dispatch API and FIFO Engine
describe("Outbound Dispatch API & FIFO Engine", () => {
  it("should successfully dispatch oldest LPN in accordance with FIFO", async () => {
    // Seed SKU and Location
    const [testSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-FIFO-${Date.now()}`,
        name: "FIFO Tracked Material",
      })
      .returning();

    const [testLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-STAGING-${Date.now()}`,
        locationType: "TRANSIT",
        capacity: 100,
      })
      .returning();

    // Create single LPN
    const [testLpn] = await defaultDatabase.databaseClient
      .insert(lpnsTable)
      .values({
        lpnCode: `LPN-FIFO-OLD-${Date.now()}`,
        skuId: testSku.id,
        quantity: 10,
        currentLocationId: testLocation.id,
        status: "STAGED",
        receivedAt: "2026-01-01 08:00:00",
      })
      .returning();

    // Dispatch request
    const dispatchRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: testLpn.lpnCode,
        notes: "Outbound truck loading",
      }),
    });

    const dispatchResponse = await serverApp.request(dispatchRequest);
    const responsePayload = (await dispatchResponse.json()) as {
      message: string;
      data: { id: number; lpnCode: string; status: string };
    };

    expect(dispatchResponse.status).toBe(200);
    expect(responsePayload.message).toBe("LPN dispatched successfully");
    expect(responsePayload.data.status).toBe("DISPATCHED");

    // Verify mutation logs
    const mutationLogs = await defaultDatabase.databaseClient
      .select()
      .from(mutationLogsTable);

    const latestLog = mutationLogs[mutationLogs.length - 1];
    expect(latestLog.lpnId).toBe(testLpn.id);
    expect(latestLog.actionType).toBe("DISPATCH");
  });

  it("should reject dispatch when attempting to violate FIFO order", async () => {
    // Seed SKU and Location
    const [testSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-FIFO-VIOLATE-${Date.now()}`,
        name: "FIFO Strict Material",
      })
      .returning();

    const [testLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-FIFO-VIOLATE-${Date.now()}`,
        locationType: "TRANSIT",
        capacity: 100,
      })
      .returning();

    // Older LPN (Batch 1 - January)
    const [olderLpn] = await defaultDatabase.databaseClient
      .insert(lpnsTable)
      .values({
        lpnCode: `LPN-BATCH-1-${Date.now()}`,
        skuId: testSku.id,
        quantity: 20,
        currentLocationId: testLocation.id,
        status: "STAGED",
        receivedAt: "2026-01-10 10:00:00",
      })
      .returning();

    // Newer LPN (Batch 2 - February)
    const [newerLpn] = await defaultDatabase.databaseClient
      .insert(lpnsTable)
      .values({
        lpnCode: `LPN-BATCH-2-${Date.now()}`,
        skuId: testSku.id,
        quantity: 20,
        currentLocationId: testLocation.id,
        status: "STAGED",
        receivedAt: "2026-02-10 10:00:00",
      })
      .returning();

    // Attempt to dispatch newer LPN first (FIFO violation)
    const violationRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: newerLpn.lpnCode,
      }),
    });

    const violationResponse = await serverApp.request(violationRequest);
    const responsePayload = (await violationResponse.json()) as { message: string };

    expect(violationResponse.status).toBe(400);
    expect(responsePayload.message).toContain("FIFO violation");
    expect(responsePayload.message).toContain(olderLpn.lpnCode);

    // Now dispatch older LPN first (FIFO compliant)
    const validOldDispatch = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: olderLpn.lpnCode,
      }),
    });

    const validResponse = await serverApp.request(validOldDispatch);
    expect(validResponse.status).toBe(200);

    // After older LPN is dispatched, newer LPN can now be dispatched
    const validNewDispatch = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: newerLpn.lpnCode,
      }),
    });

    const validNewResponse = await serverApp.request(validNewDispatch);
    expect(validNewResponse.status).toBe(200);
  });

  it("should return 400 error when dispatching non-existent LPN", async () => {
    const invalidRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: "LPN-UNKNOWN-CODE",
      }),
    });

    const invalidResponse = await serverApp.request(invalidRequest);
    const responsePayload = (await invalidResponse.json()) as { message: string };

    expect(invalidResponse.status).toBe(400);
    expect(responsePayload.message).toBe("Target LPN not found");
  });
});
