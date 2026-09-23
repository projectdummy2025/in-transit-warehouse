import { Hono } from "hono";
import { processMoveMutation } from "../services/mutation-service";

// Mutation API router definition
const mutationRouter = new Hono();

// Route: Process atomic internal mutation move
mutationRouter.post("/move", async (requestContext) => {
  try {
    const requestBody = await requestContext.req.json();
    const { lpnCode, destinationLocationId, notes } = requestBody;

    // Validate required body fields presence
    if (!lpnCode || typeof lpnCode !== "string") {
      return requestContext.json({ message: "Invalid or missing lpnCode" }, 400);
    }

    if (!destinationLocationId || typeof destinationLocationId !== "number") {
      return requestContext.json({ message: "Invalid or missing destinationLocationId" }, 400);
    }

    // Process move mutation through service
    const updatedLpn = await processMoveMutation({
      lpnCode,
      destinationLocationId,
      notes,
    });

    return requestContext.json(
      {
        message: "LPN moved successfully",
        data: updatedLpn,
      },
      200
    );
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
    return requestContext.json({ message: errorMessage }, 400);
  }
});

export { mutationRouter };
