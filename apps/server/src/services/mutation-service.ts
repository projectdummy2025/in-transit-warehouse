import { eq } from "drizzle-orm";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable, mutationLogsTable } from "../db/schema";
import { activityEventEmitter } from "./event-emitter";
import { verifyLocationCapacity } from "./location-service";

interface MoveLpnInput {
  lpnCode: string;
  destinationLocationId?: number;
  destinationLocationCode?: string;
  notes?: string;
  operatorId?: string;
}

// Service function to process atomic internal mutation move
export async function processMoveMutation(moveInput: MoveLpnInput) {
  // Query target LPN by code
  const [foundLpn] = await databaseInstance
    .select()
    .from(lpnsTable)
    .where(eq(lpnsTable.lpnCode, moveInput.lpnCode));

  if (!foundLpn) {
    throw new Error("Target LPN not found");
  }

  // Validate LPN is not already dispatched
  if (foundLpn.status === "DISPATCHED") {
    throw new Error("Cannot move a DISPATCHED LPN");
  }

  // Resolve destination location ID by ID or Code
  let targetLocationId = moveInput.destinationLocationId;
  if (!targetLocationId && moveInput.destinationLocationCode) {
    const [foundLocationByCode] = await databaseInstance
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.locationCode, moveInput.destinationLocationCode));

    if (foundLocationByCode) {
      targetLocationId = foundLocationByCode.id;
    } else {
      // Create TRANSIT staging bay location if code does not exist yet
      const [newLocation] = await databaseInstance
        .insert(locationsTable)
        .values({
          locationCode: moveInput.destinationLocationCode,
          locationType: "TRANSIT",
          capacity: 50,
        })
        .returning();
      targetLocationId = newLocation.id;
    }
  }

  if (!targetLocationId) {
    throw new Error("Destination location identifier or code is required");
  }

  // Validate destination location existence
  const [destinationLocation] = await databaseInstance
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, targetLocationId));

  if (!destinationLocation) {
    throw new Error("Destination location not found");
  }

  // Prevent moving to the exact same location
  if (foundLpn.currentLocationId === targetLocationId) {
    throw new Error("LPN is already at destination location");
  }

  // Validate destination location capacity
  await verifyLocationCapacity(targetLocationId, foundLpn.quantity);

  // Retrieve source location code for audit and event emission
  const [sourceLocation] = await databaseInstance
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, foundLpn.currentLocationId));

  const sourceLocationId = foundLpn.currentLocationId;
  const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  // Execute database atomic transaction for LPN location update and mutation log audit
  const updatedLpn = await databaseInstance.transaction(async (transactionClient) => {
    // Update LPN current location, status to STAGED, and timestamp
    const [resultLpn] = await transactionClient
      .update(lpnsTable)
      .set({
        currentLocationId: targetLocationId,
        status: "STAGED",
        updatedAt: currentTimestamp,
      })
      .where(eq(lpnsTable.id, foundLpn.id))
      .returning();

    // Insert mutation log audit entry
    await transactionClient.insert(mutationLogsTable).values({
      lpnId: foundLpn.id,
      sourceLocationId: sourceLocationId,
      destinationLocationId: targetLocationId,
      actionType: "MOVE",
      notes: moveInput.notes || `Internal transfer by ${moveInput.operatorId || "SYSTEM"}`,
    });

    return resultLpn;
  });

  // Log successful mutation event
  const logTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`(${logTimestamp}) LPN internal move processed: ${updatedLpn.lpnCode}`);

  // Broadcast real-time SSE mutation event
  activityEventEmitter.broadcastMutationCreated({
    lpn_code: updatedLpn.lpnCode,
    from_location: sourceLocation?.locationCode || String(sourceLocationId),
    to_location: destinationLocation.locationCode,
    operator_id: moveInput.operatorId || "SYSTEM",
    timestamp: logTimestamp,
  });

  return updatedLpn;
}
