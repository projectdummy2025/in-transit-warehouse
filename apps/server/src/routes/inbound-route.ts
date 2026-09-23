import { Hono } from "hono";
import { processInboundReceive } from "../services/inbound-service";

// Inbound API router definition
const inboundRouter = new Hono();

// Route: Receive inbound inventory and generate initial LPN
inboundRouter.post("/receive", async (requestContext) => {
  try {
    const requestBody = await requestContext.req.json();
    const { skuId, quantity, locationId, lpnCode } = requestBody;

    // Validate required body fields presence
    if (!skuId || typeof skuId !== "number") {
      return requestContext.json({ message: "Invalid or missing skuId" }, 400);
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return requestContext.json({ message: "Invalid or missing quantity" }, 400);
    }

    // Process inbound reception through service
    const createdLpn = await processInboundReceive({
      skuId,
      quantity,
      locationId,
      lpnCode,
    });

    return requestContext.json(
      {
        message: "Inbound inventory received successfully",
        data: createdLpn,
      },
      201
    );
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
    return requestContext.json({ message: errorMessage }, 400);
  }
});

export { inboundRouter };
