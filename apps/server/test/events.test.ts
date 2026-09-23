import { describe, expect, it } from "bun:test";
import { SseEvent } from "@in-transit/shared";
import { activityEventEmitter } from "../src/services/event-emitter";
import { serverApp } from "../src/index";

describe("Events Stream & SSE Emitter", () => {
  it("should subscribe, emit and broadcast events", () => {
    let capturedEvent: SseEvent | null = null;
    const unsubscribe = activityEventEmitter.subscribe((eventPayload) => {
      capturedEvent = eventPayload;
    });

    activityEventEmitter.broadcastMutationCreated({
      lpn_code: "LPN-TEST-BROADCAST",
      from_location: "IN-DOCK-01",
      to_location: "STAGE-A-01",
      operator_id: "OP-999",
      timestamp: "2026-09-23 10:00:00",
    });

    expect(capturedEvent).not.toBeNull();
    expect((capturedEvent as SseEvent | null)?.event).toBe("mutation:created");

    unsubscribe();
  });

  it("should respond with SSE event stream headers on /api/events/activity-stream", async () => {
    const request = new Request("http://localhost/api/events/activity-stream");
    const response = await serverApp.request(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });
});
