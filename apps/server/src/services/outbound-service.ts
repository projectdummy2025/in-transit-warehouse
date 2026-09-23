import { and, asc, eq, lt, ne } from "drizzle-orm";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable, mutationLogsTable } from "../db/schema";

interface DispatchLpnInput {
  lpnCode: string;
  outboundLocationId?: number;
  notes?: string;
}

// Find oldest undispatched LPN for given SKU code or ID to enforce FIFO
export async function findOldestLpn(skuId: number) {
  const [oldestLpn] = await databaseInstance
    .select()
    .from(lpnsTable)
    .where(
      and(
        eq(lpnsTable.skuId, skuId),
        ne(lpnsTable.status, "DISPATCHED")
      )
    )
    .orderBy(asc(lpnsTable.receivedAt), asc(lpnsTable.id))
    .limit(1);

  return oldestLpn || null;
}

// Service function to process outbound dispatch with strict FIFO validation
export async function processOutboundDispatch(dispatchInput: DispatchLpnInput) {
  // Query target LPN
  const [targetLpn] = await databaseInstance
    .select()
    .from(lpnsTable)
    .where(eq(lpnsTable.lpnCode, dispatchInput.lpnCode));

  if (!targetLpn) {
    throw new Error("Target LPN not found");
  }

  // Validate LPN is not already dispatched
  if (targetLpn.status === "DISPATCHED") {
    throw new Error("LPN is already DISPATCHED");
  }

  // FIFO check: verify no older undispatched LPN exists for the same SKU
  const [olderLpn] = await databaseInstance
    .select()
    .from(lpnsTable)
    .where(
      and(
        eq(lpnsTable.skuId, targetLpn.skuId),
        ne(lpnsTable.status, "DISPATCHED"),
        ne(lpnsTable.id, targetLpn.id),
        lt(lpnsTable.receivedAt, targetLpn.receivedAt)
      )
    )
    .orderBy(asc(lpnsTable.receivedAt))
    .limit(1);

  if (olderLpn) {
    throw new Error(
      `FIFO violation: older inventory exists for this SKU (LPN: ${olderLpn.lpnCode})`
    );
  }

  // Validate outbound destination location if provided
  let destinationLocationId = targetLpn.currentLocationId;
  if (dispatchInput.outboundLocationId) {
    const [foundLocation] = await databaseInstance
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.id, dispatchInput.outboundLocationId));

    if (!foundLocation) {
      throw new Error("Outbound destination location not found");
    }

    destinationLocationId = dispatchInput.outboundLocationId;
  }

  const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  // Execute database atomic transaction for LPN status update and dispatch audit log
  const dispatchedLpn = await databaseInstance.transaction(async (transactionClient) => {
    // Update LPN status to DISPATCHED
    const [resultLpn] = await transactionClient
      .update(lpnsTable)
      .set({
        status: "DISPATCHED",
        currentLocationId: destinationLocationId,
        updatedAt: currentTimestamp,
      })
      .where(eq(lpnsTable.id, targetLpn.id))
      .returning();

    // Insert mutation log audit entry for dispatch
    await transactionClient.insert(mutationLogsTable).values({
      lpnId: targetLpn.id,
      sourceLocationId: targetLpn.currentLocationId,
      destinationLocationId: destinationLocationId,
      actionType: "DISPATCH",
      notes: dispatchInput.notes || "Outbound dispatch completed",
    });

    return resultLpn;
  });

  // Log successful dispatch event
  const logTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`(${logTimestamp}) Outbound LPN dispatched: ${dispatchedLpn.lpnCode}`);

  return dispatchedLpn;
}
