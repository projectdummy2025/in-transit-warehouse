import { Hono } from "hono";
import { eventsRouter } from "./routes/events-route";
import { inboundRouter } from "./routes/inbound-route";
import { mutationRouter } from "./routes/mutation-route";
import { outboundRouter } from "./routes/outbound-route";
import { stagingRouter } from "./routes/staging-route";
import { agingWorker } from "./workers/aging-worker";

// Server constants definition
const defaultPort = Number(process.env.PORT) || 8125;
const statusSuccess = 200;
const statusNotFound = 404;
const statusError = 500;

// Application factory function
export function createServer() {
  const serverApp = new Hono();

  // Middleware: log incoming request timestamp and method
  serverApp.use("*", async (requestContext, nextHandler) => {
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(`(${currentTimestamp}) Server request ${requestContext.req.method} ${requestContext.req.path}`);
    await nextHandler();
  });

  // Route: base health check endpoint
  serverApp.get("/health", (requestContext) => {
    return requestContext.json({ status: "ok" }, statusSuccess);
  });

  // Route: root welcome endpoint
  serverApp.get("/", (requestContext) => {
    return requestContext.json({ message: "In-Transit WMS API" }, statusSuccess);
  });

  // Route: inbound management endpoints
  serverApp.route("/api/inbound", inboundRouter);

  // Route: mutation management endpoints
  serverApp.route("/api/mutations", mutationRouter);

  // Route: outbound management endpoints
  serverApp.route("/api/outbound", outboundRouter);

  // Route: events and real-time SSE activity stream
  serverApp.route("/api/events", eventsRouter);

  // Route: staging inventory management endpoints
  serverApp.route("/api/inventory", stagingRouter);

  // Middleware: custom 404 not found handler
  serverApp.notFound((requestContext) => {
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(`(${currentTimestamp}) Server route not found: ${requestContext.req.path}`);
    return requestContext.json({ message: "Route not found" }, statusNotFound);
  });

  // Middleware: global error handler
  serverApp.onError((caughtError, requestContext) => {
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.error(`(${currentTimestamp}) Server error encountered: ${caughtError.message}`);
    return requestContext.json({ message: "Internal server error" }, statusError);
  });

  return serverApp;
}

// Default application instance
const serverApp = createServer();

// Start background aging alert worker in production/runtime mode
if (process.env.NODE_ENV !== "test") {
  agingWorker.start();
}

// Server bootstrap log
const launchTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
console.log(`(${launchTimestamp}) Server initialized on port ${defaultPort}`);

export { serverApp, agingWorker };

export default {
  port: defaultPort,
  fetch: serverApp.fetch,
};
