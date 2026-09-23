import { describe, expect, it } from "bun:test";
import { serverApp } from "../src/index";

describe("Frontend to Backend Integration Contract", () => {
  it("should process inbound receive from frontend InboundCreate payload", async () => {
    const testSku = `SKU-FE-${Date.now()}`;
    const request = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku_code: testSku,
        quantity: 25,
        location_code: "IN-DOCK-01",
        operator_id: "OP-FE-001",
      }),
    });

    const response = await serverApp.request(request);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { lpnCode: string; skuCode: string; quantityNumber: number };
    expect(body.lpnCode).toBeDefined();
    expect(body.skuCode).toBe(testSku);
    expect(body.quantityNumber).toBe(25);
  });

  it("should process mutation move from frontend MutationForm payload", async () => {
    // 1. Inbound item first
    const testSku = `SKU-MUT-${Date.now()}`;
    const inboundReq = new Request("http://localhost/api/inbound/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku_code: testSku,
        quantity: 10,
        location_code: "IN-DOCK-01",
        operator_id: "OP-FE-001",
      }),
    });
    const inboundRes = await serverApp.request(inboundReq);
    const inboundJson = (await inboundRes.json()) as { lpnCode: string };

    // 2. Move to dynamic staging bay
    const testBay = `BAY-FE-${Date.now()}`;
    const moveReq = new Request("http://localhost/api/mutations/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lpn_code: inboundJson.lpnCode,
        to_location_code: testBay,
        operator_id: "DC-OPERATOR-01",
      }),
    });
    const moveRes = await serverApp.request(moveReq);
    expect(moveRes.status).toBe(200);

    // 3. Staging inventory endpoint contains newly moved item
    const stagingReq = new Request("http://localhost/api/inventory/staging");
    const stagingRes = await serverApp.request(stagingReq);
    expect(stagingRes.status).toBe(200);
    const stagingList = (await stagingRes.json()) as Array<{ lpn_code: string; location_code: string }>;
    const found = stagingList.find((item) => item.lpn_code === inboundJson.lpnCode);
    expect(found).toBeDefined();
    expect(found?.location_code).toBe(testBay);
  });
});
