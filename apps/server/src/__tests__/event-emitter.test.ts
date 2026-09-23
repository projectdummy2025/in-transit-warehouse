import { describe, expect, test } from "bun:test";
import { SseEvent } from "@in-transit/shared";
import { activityEventEmitter } from "../services/event-emitter.js";

describe("DEV3-TICK-02-A: ActivityEventEmitter", () => {
  test("subscribes and emits events to active listeners", () => {
    const subscriberState: { payload: SseEvent | null } = { payload: null };
    const unsubscribe = activityEventEmitter.subscribe((event: SseEvent) => {
      subscriberState.payload = event;
    });

    const testEvent: SseEvent = {
      event: "mutation:created",
      data: { lpn_id: "LPN-001" },
      timestamp: new Date().toISOString()
    };

    activityEventEmitter.emit(testEvent);
    expect(subscriberState.payload).not.toBeNull();
    expect(subscriberState.payload?.event).toBe("mutation:created");

    unsubscribe();
    expect(activityEventEmitter.getListenerCount()).toBe(0);
  });
});
