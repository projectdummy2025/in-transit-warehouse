import { Hono } from "hono";
import { eventsRouter } from "./routes/events.js";
import { stagingRouter } from "./routes/staging.js";
import { agingWorker } from "./workers/aging-worker.js";

const DEFAULT_SERVER_PORT = 8125;

export const application = new Hono();

// Health check endpoint
application.get("/health", (context) => {
  return context.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Mount modular sub-routers
application.route("/api/events", eventsRouter);
application.route("/api/inventory", stagingRouter);

// Start background aging alert worker
agingWorker.start();

console.log(`(${new Date().toISOString()}) In-Transit server initialized on port ${DEFAULT_SERVER_PORT}`);

export default {
  port: DEFAULT_SERVER_PORT,
  fetch: application.fetch
};
