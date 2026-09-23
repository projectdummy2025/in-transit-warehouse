import { describe, expect, it } from "bun:test";
import {
  InboundReceiveSchema,
  LocationType,
  LpnStatus,
  MutationMoveSchema,
  OutboundDispatchSchema,
} from "../src/index";

describe("Shared Contracts & Schemas", () => {
  it("should validate valid inbound receive payload", () => {
    const validPayload = {
      sku_code: "SKU-1001",
      quantity: 50,
      location_code: "IN-DOCK-01",
      operator_id: "OP-001",
    };

    const parsedResult = InboundReceiveSchema.parse(validPayload);
    expect(parsedResult).toEqual(validPayload);
  });

  it("should reject invalid inbound receive payload with missing fields", () => {
    const invalidPayload = {
      sku_code: "",
      quantity: -5,
    };

    const parseError = InboundReceiveSchema.safeParse(invalidPayload);
    expect(parseError.success).toBe(false);
  });

  it("should validate valid mutation move payload", () => {
    const validPayload = {
      lpn_code: "LPN-20260923-0001",
      to_location_code: "STAGE-A-01",
      operator_id: "OP-002",
    };

    const parsedResult = MutationMoveSchema.parse(validPayload);
    expect(parsedResult).toEqual(validPayload);
  });

  it("should validate valid outbound dispatch payload", () => {
    const validPayload = {
      lpn_code: "LPN-20260923-0001",
      outbound_location_code: "OUT-DOCK-01",
      operator_id: "OP-003",
    };

    const parsedResult = OutboundDispatchSchema.parse(validPayload);
    expect(parsedResult).toEqual(validPayload);
  });

  it("should export correct domain enums", () => {
    expect(LpnStatus.RECEIVED).toBe("RECEIVED");
    expect(LpnStatus.STAGED).toBe("STAGED");
    expect(LocationType.TRANSIT).toBe("TRANSIT");
  });
});
