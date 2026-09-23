import { describe, expect, it } from "bun:test";
import { defaultDatabase } from "../src/db/client";
import { locationsTable, mutationLogsTable, skusTable } from "../src/db/schema";
import { serverApp } from "../src/index";

// Test suite for Inbound Receive API and workflow
describe("Inbound Receive API", () => {
  it("should successfully receive inbound inventory and create LPN", async () => {
    // Seed SKU and Inbound Location
    const [testSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-INBOUND-${Date.now()}`,
        name: "Test Packaging Box",
      })
      .returning();

    const [testLocation] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-INBOUND-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 100,
      })
      .returning();

    // Send Inbound Receive request
    const receiveRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: testSku.id,
        quantity: 50,
        locationId: testLocation.id,
      }),
    });

    const receiveResponse = await serverApp.request(receiveRequest);
    const responsePayload = (await receiveResponse.json()) as {
      message: string;
      data: { id: number; lpnCode: string; status: string; quantity: number };
    };

    expect(receiveResponse.status).toBe(201);
    expect(responsePayload.message).toBe("Inbound inventory received successfully");
    expect(responsePayload.data.status).toBe("RECEIVED");
    expect(responsePayload.data.quantity).toBe(50);
    expect(responsePayload.data.lpnCode).toStartWith("LPN-");

    // Verify mutation log audit entry was created
    const mutationLogs = await defaultDatabase.databaseClient
      .select()
      .from(mutationLogsTable);

    expect(mutationLogs.length).toBeGreaterThan(0);
    expect(mutationLogs[mutationLogs.length - 1].actionType).toBe("RECEIVE");
  });

  it("should return 400 error when receiving with non-existent SKU", async () => {
    const invalidRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: 99999,
        quantity: 10,
      }),
    });

    const invalidResponse = await serverApp.request(invalidRequest);
    const responsePayload = (await invalidResponse.json()) as { message: string };

    expect(invalidResponse.status).toBe(400);
    expect(responsePayload.message).toBe("Target SKU not found");
  });

  it("should return 400 error when quantity is invalid", async () => {
    const invalidRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: 1,
        quantity: -5,
      }),
    });

    const invalidResponse = await serverApp.request(invalidRequest);
    expect(invalidResponse.status).toBe(400);
  });
});
