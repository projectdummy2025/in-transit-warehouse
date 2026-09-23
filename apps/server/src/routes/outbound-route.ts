import { Hono } from "hono";
import { processOutboundDispatch } from "../services/outbound-service";

// Outbound API router definition
const outboundRouter = new Hono();

// Route: Process outbound dispatch with FIFO validation
outboundRouter.post("/dispatch", async (requestContext) => {
  try {
    const requestBody = await requestContext.req.json();
    const lpnCode = requestBody.lpn_code || requestBody.lpnCode;
    const outboundLocationId = requestBody.outboundLocationId;
    const outboundLocationCode = requestBody.outbound_location_code || requestBody.outboundLocationCode;
    const operatorId = requestBody.operator_id || requestBody.operatorId;
    const notes = requestBody.notes;

    // Validate required body fields presence
    if (!lpnCode || typeof lpnCode !== "string") {
      return requestContext.json({ message: "Invalid or missing lpnCode" }, 400);
    }

    // Process dispatch operation through service
    const dispatchedLpn = await processOutboundDispatch({
      lpnCode,
      outboundLocationId: typeof outboundLocationId === "number" ? outboundLocationId : undefined,
      outboundLocationCode: typeof outboundLocationCode === "string" ? outboundLocationCode : undefined,
      operatorId,
      notes,
    });

    return requestContext.json(
      {
        message: "LPN dispatched successfully",
        data: dispatchedLpn,
        lpn_code: dispatchedLpn.lpnCode,
        lpnCode: dispatchedLpn.lpnCode,
        status: dispatchedLpn.status,
      },
      200
    );
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
    return requestContext.json({ message: errorMessage }, 400);
  }
});

export { outboundRouter };
