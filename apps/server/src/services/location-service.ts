import { and, eq, ne } from "drizzle-orm";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable } from "../db/schema";

// Check if location has enough available capacity for incoming quantity
export async function verifyLocationCapacity(locationId: number, additionalQuantity: number) {
  // Query target location record
  const [targetLocation] = await databaseInstance
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, locationId));

  if (!targetLocation) {
    throw new Error("Location not found");
  }

  // Query active inventory items currently in location
  const activeItems = await databaseInstance
    .select()
    .from(lpnsTable)
    .where(
      and(
        eq(lpnsTable.currentLocationId, locationId),
        ne(lpnsTable.status, "DISPATCHED")
      )
    );

  // Calculate current total occupied quantity
  const occupiedQuantity = activeItems.reduce(
    (totalAccumulator, currentItem) => totalAccumulator + currentItem.quantity,
    0
  );

  // Validate that new quantity does not exceed location capacity
  if (occupiedQuantity + additionalQuantity > targetLocation.capacity) {
    throw new Error("Location capacity exceeded");
  }

  return {
    targetLocation,
    occupiedQuantity,
    remainingCapacity: targetLocation.capacity - occupiedQuantity,
  };
}
