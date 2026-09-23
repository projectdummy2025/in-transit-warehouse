import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { activityEventEmitter } from "../services/event-emitter.js";

const PING_INTERVAL_MILLISECONDS = 15000;

export const eventsRouter = new Hono();

// SSE activity stream endpoint
eventsRouter.get("/activity-stream", (context) => {
  return streamSSE(context, async (stream) => {
    // Send initial connection event
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ message: "Connected to activity stream" })
    });

    // Subscribe client to real-time events
    const unsubscribe = activityEventEmitter.subscribe(async (eventPayload) => {
      await stream.writeSSE({
        event: eventPayload.event,
        data: JSON.stringify(eventPayload.data)
      });
    });

    // Clean up subscriber on client disconnect
    stream.onAbort(() => {
      unsubscribe();
    });

    // Send periodic heartbeat to keep connection alive
    while (true) {
      await stream.sleep(PING_INTERVAL_MILLISECONDS);
      await stream.writeSSE({
        event: "ping",
        data: "heartbeat"
      });
    }
  });
});
