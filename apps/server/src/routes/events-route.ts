import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { activityEventEmitter } from "../services/event-emitter";

const heartbeatIntervalMilliseconds = 15000;

// Events API router definition
const eventsRouter = new Hono();

// Route: Real-time Server-Sent Events activity stream
eventsRouter.get("/activity-stream", (requestContext) => {
  return streamSSE(requestContext, async (streamWriter) => {
    let isAborted = false;

    // Send initial connection confirmation event
    await streamWriter.writeSSE({
      event: "connected",
      data: JSON.stringify({ message: "Connected to activity stream" }),
    });

    // Register active subscriber to event emitter
    const unsubscribeHandler = activityEventEmitter.subscribe(async (eventPayload) => {
      if (isAborted) return;
      try {
        await streamWriter.writeSSE({
          event: eventPayload.event,
          data: JSON.stringify({
            ...((typeof eventPayload.data === "object" && eventPayload.data !== null) ? eventPayload.data : { payload: eventPayload.data }),
            timestamp: eventPayload.timestamp,
          }),
        });
      } catch (caughtError) {
        // Suppress stream write errors on aborted client connections
      }
    });

    // Clean up subscriber upon client abort or disconnect
    streamWriter.onAbort(() => {
      isAborted = true;
      unsubscribeHandler();
    });

    // Keep connection alive with periodic heartbeat until aborted
    while (!isAborted) {
      await streamWriter.sleep(heartbeatIntervalMilliseconds);
      if (isAborted) break;
      try {
        await streamWriter.writeSSE({
          event: "ping",
          data: "heartbeat",
        });
      } catch (caughtError) {
        break;
      }
    }
  });
});

export { eventsRouter };
