import { describe, expect, it } from "bun:test";
import { databaseInstance } from "../src/db/client";
import { locationsTable, lpnsTable, skusTable } from "../src/db/schema";
import { activityEventEmitter } from "../src/services/event-emitter";
import { serverApp } from "../src/index";

describe("E2E Warehouse Lifecycle", () => {
  it("should complete inbound, transit move, staging query, and outbound dispatch with SSE events", async () => {
    // 1. Seed master data (SKU, Inbound Location, Transit Location, Outbound Location)
    const timestampSeed = Date.now();
    const [sku] = await databaseInstance
      .insert(skusTable)
      .values({ skuCode: `SKU-E2E-${timestampSeed}`, name: "E2E Lifecycle Item" })
      .returning();

    const [inboundLoc] = await databaseInstance
      .insert(locationsTable)
      .values({ locationCode: `IN-DOCK-${timestampSeed}`, locationType: "INBOUND", capacity: 50 })
      .returning();

    const [transitLoc] = await databaseInstance
      .insert(locationsTable)
      .values({ locationCode: `STAGE-LOC-${timestampSeed}`, locationType: "TRANSIT", capacity: 50 })
      .returning();

    const [outboundLoc] = await databaseInstance
      .insert(locationsTable)
      .values({ locationCode: `OUT-DOCK-${timestampSeed}`, locationType: "OUTBOUND", capacity: 50 })
      .returning();

    // 2. Track SSE emitted events
    const capturedEvents: string[] = [];
    const unsubscribe = activityEventEmitter.subscribe((eventPayload) => {
      capturedEvents.push(eventPayload.event);
    });

    // 3. Receive Inbound
    const inboundRequest = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skuId: sku.id,
        quantity: 15,
        locationId: inboundLoc.id,
      }),
    });
    const inboundResponse = await serverApp.request(inboundRequest);
    expect(inboundResponse.status).toBe(201);
    const inboundJson = (await inboundResponse.json()) as { data: { id: number; lpnCode: string } };
    const lpnCode = inboundJson.data.lpnCode;
    expect(lpnCode).toBeDefined();

    // 4. Move to Transit Staging Area
    const moveRequest = new Request("http://localhost/api/mutations/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: lpnCode,
        destinationLocationId: transitLoc.id,
      }),
    });
    const moveResponse = await serverApp.request(moveRequest);
    expect(moveResponse.status).toBe(200);
    expect(capturedEvents).toContain("mutation:created");

    // 5. Query Staging Inventory API
    const stagingRequest = new Request("http://localhost/api/inventory/staging");
    const stagingResponse = await serverApp.request(stagingRequest);
    expect(stagingResponse.status).toBe(200);
    const stagingItems = (await stagingResponse.json()) as Array<{
      lpn_code: string;
      sku_code: string;
      location_code: string;
      is_overdue: boolean;
    }>;
    const stagedItem = stagingItems.find((item) => item.lpn_code === lpnCode);
    expect(stagedItem).toBeDefined();
    expect(stagedItem?.location_code).toBe(transitLoc.locationCode);
    expect(stagedItem?.is_overdue).toBe(false);

    // 6. Outbound Dispatch (FIFO)
    const dispatchRequest = new Request("http://localhost/api/outbound/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpnCode: lpnCode,
        outboundLocationId: outboundLoc.id,
      }),
    });
    const dispatchResponse = await serverApp.request(dispatchRequest);
    expect(dispatchResponse.status).toBe(200);
    expect(capturedEvents).toContain("lpn:dispatched");

    // 7. Verify LPN no longer shows in Staging Inventory
    const stagingAfterDispatchResponse = await serverApp.request(stagingRequest);
    const stagingAfterItems = (await stagingAfterDispatchResponse.json()) as Array<{ lpn_code: string }>;
    expect(stagingAfterItems.find((item) => item.lpn_code === lpnCode)).toBeUndefined();

    unsubscribe();
  });
});
