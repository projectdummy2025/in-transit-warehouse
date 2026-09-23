import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable, mutationLogsTable } from "../db/schema";
import { processMoveMutation } from "../services/mutation-service";

// Mutation API router definition
const mutationRouter = new Hono();

// Route: Get all recorded pallet mutation logs
mutationRouter.get("/", async (requestContext) => {
  try {
    const rawMutationLogs = await databaseInstance
      .select({
        mutationId: mutationLogsTable.id,
        lpnCode: lpnsTable.lpnCode,
        sourceLocationId: mutationLogsTable.sourceLocationId,
        destinationLocationId: mutationLogsTable.destinationLocationId,
        actionType: mutationLogsTable.actionType,
        notes: mutationLogsTable.notes,
        createdAt: mutationLogsTable.createdAt,
      })
      .from(mutationLogsTable)
      .innerJoin(lpnsTable, eq(mutationLogsTable.lpnId, lpnsTable.id))
      .orderBy(desc(mutationLogsTable.id));

    // Fetch warehouse location metadata for code mapping
    const locationRecords = await databaseInstance.select().from(locationsTable);
    const locationCodeMap = new Map(locationRecords.map((loc) => [loc.id, loc.locationCode]));

    const formattedRecords = rawMutationLogs.map((logItem) => ({
      mutationId: `MUT-${logItem.mutationId.toString().padStart(4, "0")}`,
      lpnCode: logItem.lpnCode,
      sourceLocation: locationCodeMap.get(logItem.sourceLocationId) || `LOC-${logItem.sourceLocationId}`,
      destinationLocation: locationCodeMap.get(logItem.destinationLocationId) || `LOC-${logItem.destinationLocationId}`,
      operatorName: logItem.notes?.replace("Internal transfer by ", "") || "OPERATOR",
      mutatedAt: logItem.createdAt,
      syncStatus: "confirmed" as const,
    }));

    return requestContext.json(formattedRecords, 200);
  } catch (caughtError: unknown) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : "Internal server error";
    return requestContext.json({ message: errorMessage }, 500);
  }
});

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
