import { describe, expect, test } from "bun:test";
import { InboundReceiveSchema, MutationMoveSchema, OutboundDispatchSchema, LpnStatus, LocationType } from "../index.js";

describe("Shared Schemas and Enums", () => {
  test("InboundReceiveSchema validates valid payload", () => {
    const payload = { sku_id: "SKU-001", quantity: 10 };
    const result = InboundReceiveSchema.parse(payload);
    expect(result.sku_id).toBe("SKU-001");
    expect(result.quantity).toBe(10);
  });

  test("MutationMoveSchema validates valid payload", () => {
    const payload = { lpn_id: "LPN-001", target_location_id: "LOC-002" };
    const result = MutationMoveSchema.parse(payload);
    expect(result.lpn_id).toBe("LPN-001");
    expect(result.target_location_id).toBe("LOC-002");
  });

  test("OutboundDispatchSchema validates valid payload", () => {
    const payload = { lpn_id: "LPN-001" };
    const result = OutboundDispatchSchema.parse(payload);
    expect(result.lpn_id).toBe("LPN-001");
  });

  test("Enums are properly defined", () => {
    expect(LpnStatus.RECEIVED).toBe("RECEIVED");
    expect(LocationType.TRANSIT).toBe("TRANSIT");
  });
});
