import { Hono } from "hono";
import { processInboundReceive } from "../services/inbound-service";

// Inbound API router definition
const inboundRouter = new Hono();

// Route: Receive inbound inventory and generate initial LPN
inboundRouter.post("/receive", async (requestContext) => {
  try {
    const requestBody = await requestContext.req.json();
    const skuCode = requestBody.sku_code || requestBody.skuCode;
    const skuId = requestBody.skuId;
    const quantity = requestBody.quantity ?? requestBody.quantityNumber;
    const locationCode = requestBody.location_code || requestBody.locationCode;
    const locationId = requestBody.locationId;
    const operatorId = requestBody.operator_id || requestBody.operatorId;
    const lpnCode = requestBody.lpn_code || requestBody.lpnCode;

    // Validate SKU identifier presence
    if (!skuId && !skuCode) {
      return requestContext.json({ message: "Invalid or missing skuId or sku_code" }, 400);
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return requestContext.json({ message: "Invalid or missing quantity" }, 400);
    }

    // Process inbound reception through service
    const createdLpn = await processInboundReceive({
      skuId: typeof skuId === "number" ? skuId : undefined,
      skuCode: typeof skuCode === "string" ? skuCode : undefined,
      quantity,
      locationId: typeof locationId === "number" ? locationId : undefined,
      locationCode: typeof locationCode === "string" ? locationCode : undefined,
      operatorId,
      lpnCode,
    });

    return requestContext.json(
      {
        message: "Inbound inventory received successfully",
        data: createdLpn,
        lpnCode: createdLpn.lpnCode,
        lpn_code: createdLpn.lpnCode,
        skuCode: skuCode || `SKU-${createdLpn.skuId}`,
        quantityNumber: createdLpn.quantity,
        locationCode: locationCode || "INBOUND",
        receivedAt: createdLpn.receivedAt,
      },
      201
    );
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
    return requestContext.json({ message: errorMessage }, 400);
  }
});

export { inboundRouter };
