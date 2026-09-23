import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { defaultDatabase } from "../src/db/client";
import { locationsTable, lpnsTable, mutationLogsTable, skusTable } from "../src/db/schema";
import { serverApp } from "../src/index";

// Test suite for end-to-end warehouse mutation flow (Inbound -> Move -> Dispatch)
describe("End-to-End Warehouse Mutation Integration Flow", () => {
  it("should process full lifecycle from inbound reception to outbound dispatch with FIFO compliance", async () => {
    // Step 0: Seed master SKU and warehouse locations
    const [masterSku] = await defaultDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: `SKU-E2E-${Date.now()}`,
        name: "E2E Master Product",
      })
      .returning();

    const [inboundDock] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-INBOUND-${Date.now()}`,
        locationType: "INBOUND",
        capacity: 50,
      })
      .returning();

    const [transitAisle] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-TRANSIT-${Date.now()}`,
        locationType: "TRANSIT",
        capacity: 50,
      })
      .returning();

    const [outboundDock] = await defaultDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: `LOC-OUTBOUND-${Date.now()}`,
        locationType: "OUTBOUND",
        capacity: 50,
      })
      .returning();

    // Step 1: Inbound Receive Batch 1 (Old LPN)
    const receiveBatchOneRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: masterSku.id,
        quantity: 20,
        locationId: inboundDock.id,
      }),
    });

    const receiveBatchOneResponse = await serverApp.request(receiveBatchOneRequest);
    expect(receiveBatchOneResponse.status).toBe(201);
    const batchOnePayload = (await receiveBatchOneResponse.json()) as {
      data: { id: number; lpnCode: string; status: string; currentLocationId: number };
    };
    const firstLpnCode = batchOnePayload.data.lpnCode;
    expect(batchOnePayload.data.status).toBe("RECEIVED");
    expect(batchOnePayload.data.currentLocationId).toBe(inboundDock.id);

    // Manually ensure first LPN receivedAt is earlier for predictable FIFO testing
    await defaultDatabase.databaseClient
      .update(lpnsTable)
      .set({ receivedAt: "2026-01-01 08:00:00" })
      .where(eq(lpnsTable.id, batchOnePayload.data.id));

    // Step 2: Inbound Receive Batch 2 (Newer LPN for the same SKU)
    const receiveBatchTwoRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: masterSku.id,
        quantity: 15,
        locationId: inboundDock.id,
      }),
    });

    const receiveBatchTwoResponse = await serverApp.request(receiveBatchTwoRequest);
    expect(receiveBatchTwoResponse.status).toBe(201);
    const batchTwoPayload = (await receiveBatchTwoResponse.json()) as {
      data: { id: number; lpnCode: string; status: string };
    };
    const secondLpnCode = batchTwoPayload.data.lpnCode;
    expect(batchTwoPayload.data.status).toBe("RECEIVED");

    // Manually ensure second LPN receivedAt is later
    await defaultDatabase.databaseClient
      .update(lpnsTable)
      .set({ receivedAt: "2026-02-01 08:00:00" })
      .where(eq(lpnsTable.id, batchTwoPayload.data.id));

    // Step 3: Move First LPN from INBOUND to TRANSIT staging location
    const moveRequest = new Request("http://localhost/api/mutations/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: firstLpnCode,
        destinationLocationId: transitAisle.id,
        notes: "Moved to staging rack for inspection",
      }),
    });

    const moveResponse = await serverApp.request(moveRequest);
    expect(moveResponse.status).toBe(200);
    const movePayload = (await moveResponse.json()) as {
      data: { status: string; currentLocationId: number };
    };
    expect(movePayload.data.status).toBe("STAGED");
    expect(movePayload.data.currentLocationId).toBe(transitAisle.id);

    // Step 4: Attempt premature dispatch on Batch 2 (FIFO Violation check)
    const prematureDispatchRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: secondLpnCode,
      }),
    });

    const prematureDispatchResponse = await serverApp.request(prematureDispatchRequest);
    expect(prematureDispatchResponse.status).toBe(400);
    const violationPayload = (await prematureDispatchResponse.json()) as { message: string };
    expect(violationPayload.message).toContain("FIFO violation");

    // Step 5: Dispatch Batch 1 according to FIFO rules
    const validBatchOneDispatchRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: firstLpnCode,
        outboundLocationId: outboundDock.id,
        notes: "Loaded into outbound carrier",
      }),
    });

    const validBatchOneDispatchResponse = await serverApp.request(validBatchOneDispatchRequest);
    expect(validBatchOneDispatchResponse.status).toBe(200);
    const dispatchOnePayload = (await validBatchOneDispatchResponse.json()) as {
      data: { status: string; currentLocationId: number };
    };
    expect(dispatchOnePayload.data.status).toBe("DISPATCHED");
    expect(dispatchOnePayload.data.currentLocationId).toBe(outboundDock.id);

    // Step 6: Dispatch Batch 2 now that Batch 1 is cleared
    const validBatchTwoDispatchRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: secondLpnCode,
        outboundLocationId: outboundDock.id,
      }),
    });

    const validBatchTwoDispatchResponse = await serverApp.request(validBatchTwoDispatchRequest);
    expect(validBatchTwoDispatchResponse.status).toBe(200);
    const dispatchTwoPayload = (await validBatchTwoDispatchResponse.json()) as {
      data: { status: string };
    };
    expect(dispatchTwoPayload.data.status).toBe("DISPATCHED");

    // Step 7: Verify complete audit trail sequence in mutation_logs
    const auditLogsForFirstLpn = await defaultDatabase.databaseClient
      .select()
      .from(mutationLogsTable)
      .where(eq(mutationLogsTable.lpnId, batchOnePayload.data.id));

    expect(auditLogsForFirstLpn.length).toBe(3);
    expect(auditLogsForFirstLpn[0].actionType).toBe("RECEIVE");
    expect(auditLogsForFirstLpn[1].actionType).toBe("MOVE");
    expect(auditLogsForFirstLpn[2].actionType).toBe("DISPATCH");
  });
});
