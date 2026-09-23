import { test, expect } from "bun:test";
import { parseSSEPayload, getEventBadgeLabel } from "./useSSE";

test("parses valid SSE JSON payload correctly", () => {
  const mockJson = JSON.stringify({
    eventId: "EVT-100",
    eventType: "INBOUND_RECEIVED",
    lpnCode: "LPN-001",
    locationCode: "BAY-01",
    messageText: "Item received",
    timestampISO: "2026-09-23T10:00:00.000Z",
  });

  const parsed = parseSSEPayload(mockJson);

  expect(parsed).not.toBeNull();
  expect(parsed?.eventId).toBe("EVT-100");
  expect(parsed?.eventType).toBe("INBOUND_RECEIVED");
});

test("returns null for malformed SSE payload", () => {
  expect(parseSSEPayload("invalid json")).toBeNull();
  expect(parseSSEPayload("{}")).toBeNull();
});

test("returns correct badge label for event types", () => {
  expect(getEventBadgeLabel("INBOUND_RECEIVED")).toBe("INBOUND");
  expect(getEventBadgeLabel("LOCATION_MUTATED")).toBe("MUTATION");
  expect(getEventBadgeLabel("STAGING_ALERT")).toBe("ALERT");
});
