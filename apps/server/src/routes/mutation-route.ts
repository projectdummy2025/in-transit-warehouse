import { Hono } from "hono";
import { processMoveMutation } from "../services/mutation-service";

// Mutation API router definition
const mutationRouter = new Hono();

// Route: Process atomic internal mutation move
mutationRouter.post("/move", async (requestContext) => {
  try {
    const requestBody = await requestContext.req.json();
    const lpnCode = requestBody.lpn_code || requestBody.lpnCode;
    const destinationLocationId = requestBody.destinationLocationId;
    const destinationLocationCode = requestBody.to_location_code || requestBody.destinationLocation || requestBody.destinationLocationCode;
    const operatorId = requestBody.operator_id || requestBody.operatorId || requestBody.operatorName;
    const notes = requestBody.notes;

    // Validate required body fields presence
    if (!lpnCode || typeof lpnCode !== "string") {
      return requestContext.json({ message: "Invalid or missing lpnCode" }, 400);
    }

    if (!destinationLocationId && !destinationLocationCode) {
      return requestContext.json({ message: "Invalid or missing destination location" }, 400);
    }

    // Process move mutation through service
    const updatedLpn = await processMoveMutation({
      lpnCode,
      destinationLocationId: typeof destinationLocationId === "number" ? destinationLocationId : undefined,
      destinationLocationCode: typeof destinationLocationCode === "string" ? destinationLocationCode : undefined,
      operatorId,
      notes,
    });

    return requestContext.json(
      {
        message: "LPN moved successfully",
        data: updatedLpn,
        lpn_code: updatedLpn.lpnCode,
        lpnCode: updatedLpn.lpnCode,
        status: updatedLpn.status,
      },
      200
    );
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
    return requestContext.json({ message: errorMessage }, 400);
  }
});

export { mutationRouter };
