import { Hono } from "hono";
import { processOutboundDispatch } from "../services/outbound-service";

// Outbound API router definition
const outboundRouter = new Hono();

// Route: Process outbound dispatch with FIFO validation
outboundRouter.post("/dispatch", async (requestContext) => {
  try {
    const requestBody = await requestContext.req.json();
    const { lpnCode, outboundLocationId, notes } = requestBody;

    // Validate required body fields presence
    if (!lpnCode || typeof lpnCode !== "string") {
      return requestContext.json({ message: "Invalid or missing lpnCode" }, 400);
    }

    // Process dispatch operation through service
    const dispatchedLpn = await processOutboundDispatch({
      lpnCode,
      outboundLocationId,
      notes,
    });

    return requestContext.json(
      {
        message: "LPN dispatched successfully",
        data: dispatchedLpn,
      },
      200
    );
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
    return requestContext.json({ message: errorMessage }, 400);
  }
});

export { outboundRouter };
