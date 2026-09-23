import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { activityEventEmitter } from "../services/event-emitter";

const heartbeatIntervalMilliseconds = 15000;

// Events API router definition
const eventsRouter = new Hono();

// Route: Real-time Server-Sent Events activity stream
eventsRouter.get("/activity-stream", (requestContext) => {
  return streamSSE(requestContext, async (streamWriter) => {
    // Send initial connection confirmation event
    await streamWriter.writeSSE({
      event: "connected",
      data: JSON.stringify({ message: "Connected to activity stream" }),
    });

    // Register active subscriber to event emitter
    const unsubscribeHandler = activityEventEmitter.subscribe(async (eventPayload) => {
      await streamWriter.writeSSE({
        event: eventPayload.event,
        data: JSON.stringify(eventPayload.data),
      });
    });

    // Clean up subscriber upon client abort or disconnect
    streamWriter.onAbort(() => {
      unsubscribeHandler();
    });

    // Keep connection alive with periodic heartbeat
    while (true) {
      await streamWriter.sleep(heartbeatIntervalMilliseconds);
      await streamWriter.writeSSE({
        event: "ping",
        data: "heartbeat",
      });
    }
  });
});

export { eventsRouter };
