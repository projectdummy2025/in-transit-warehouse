import { Hono } from "hono";
import { fetchStagingInventory } from "../services/staging-service";

// Inventory staging API router definition
const stagingRouter = new Hono();

// Route: Get staging area inventory with calculated dwell time
stagingRouter.get("/staging", async (requestContext) => {
  try {
    const maxHoursQuery = requestContext.req.query("max_hours");
    const maximumHours = maxHoursQuery ? Number(maxHoursQuery) : undefined;

    // Fetch and enrich staged inventory items from database
    const stagingItems = await fetchStagingInventory(maximumHours);

    return requestContext.json(stagingItems, 200);
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Internal server error";
    return requestContext.json({ message: errorMessage }, 500);
  }
});

export { stagingRouter };
