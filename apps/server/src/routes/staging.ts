import { Hono } from "hono";
import { Lpn, LpnStatus } from "@in-transit/shared";
import { enrichStagingItem } from "../services/staging-service.js";

export const stagingRouter = new Hono();

// Shared in-memory inventory store for staged items
export const activeStagingInventory: Lpn[] = [];

// Get staging inventory items with calculated dwell-time
stagingRouter.get("/staging", (context) => {
  const currentTime = new Date();

  // Filter for staged items and enrich with dwell time metrics
  const stagingItems = activeStagingInventory
    .filter((lpnRecord) => lpnRecord.status === LpnStatus.STAGED)
    .map((lpnRecord) => enrichStagingItem(lpnRecord, currentTime));

  return context.json({
    data: stagingItems,
    count: stagingItems.length,
    timestamp: currentTime.toISOString()
  });
});
