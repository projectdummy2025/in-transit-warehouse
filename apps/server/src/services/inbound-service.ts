import { eq } from "drizzle-orm";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable, mutationLogsTable, skusTable } from "../db/schema";
import { createLpnCode } from "../utils/lpn-generator";
import { verifyLocationCapacity } from "./location-service";

export interface InboundReceiveInput {
  skuId?: number;
  skuCode?: string;
  quantity: number;
  locationId?: number;
  locationCode?: string;
  lpnCode?: string;
  operatorId?: string;
}

// Service function to process inbound inventory reception supporting ID and Code identifiers
export async function processInboundReceive(receiveInput: InboundReceiveInput) {
  // Validate quantity is positive
  if (receiveInput.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  // Resolve target SKU by code or id
  let targetSkuId = receiveInput.skuId;
  if (!targetSkuId && receiveInput.skuCode) {
    const [foundSku] = await databaseInstance
      .select()
      .from(skusTable)
      .where(eq(skusTable.skuCode, receiveInput.skuCode));

    if (foundSku) {
      targetSkuId = foundSku.id;
    } else {
      // Create new SKU if not exists for fast in-transit intake
      const [newSku] = await databaseInstance
        .insert(skusTable)
        .values({
          skuCode: receiveInput.skuCode,
          name: `Item ${receiveInput.skuCode}`,
        })
        .returning();
      targetSkuId = newSku.id;
    }
  }

  if (!targetSkuId) {
    throw new Error("Target SKU identifier or code is required");
  }

  // Validate target SKU exists
  const [targetSku] = await databaseInstance
    .select()
    .from(skusTable)
    .where(eq(skusTable.id, targetSkuId));

  if (!targetSku) {
    throw new Error("Target SKU not found");
  }

  // Resolve target location by code or id
  let targetLocationId = receiveInput.locationId;
  if (!targetLocationId && receiveInput.locationCode) {
    const [foundLoc] = await databaseInstance
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.locationCode, receiveInput.locationCode));

    if (foundLoc) {
      targetLocationId = foundLoc.id;
    } else {
      // Auto-create INBOUND location if code does not exist yet
      const [newInboundLoc] = await databaseInstance
        .insert(locationsTable)
        .values({
          locationCode: receiveInput.locationCode,
          locationType: "INBOUND",
          capacity: 100,
        })
        .returning();
      targetLocationId = newInboundLoc.id;
    }
  }

  if (targetLocationId) {
    const [foundLocation] = await databaseInstance
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.id, targetLocationId));

    if (!foundLocation) {
      throw new Error("Target location not found");
    }

    if (foundLocation.locationType !== "INBOUND") {
      throw new Error("Target location must be an INBOUND location");
    }
  } else {
    const [defaultInboundLocation] = await databaseInstance
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.locationType, "INBOUND"));

    if (!defaultInboundLocation) {
      // Auto-create default INBOUND location if none exists
      const [createdInboundLocation] = await databaseInstance
        .insert(locationsTable)
        .values({
          locationCode: "IN-DOCK-01",
          locationType: "INBOUND",
          capacity: 100,
        })
        .returning();
      targetLocationId = createdInboundLocation.id;
    } else {
      targetLocationId = defaultInboundLocation.id;
    }
  }

  // Validate location capacity limits
  await verifyLocationCapacity(targetLocationId, receiveInput.quantity);

  // Generate unique LPN code if not provided
  const generatedLpnCode = receiveInput.lpnCode || createLpnCode();

  // Execute database atomic transaction for LPN creation and audit log entry
  const createdLpn = await databaseInstance.transaction(async (transactionClient) => {
    const [newLpn] = await transactionClient
      .insert(lpnsTable)
      .values({
        lpnCode: generatedLpnCode,
        skuId: targetSkuId,
        quantity: receiveInput.quantity,
        currentLocationId: targetLocationId,
        status: "RECEIVED",
      })
      .returning();

    await transactionClient.insert(mutationLogsTable).values({
      lpnId: newLpn.id,
      sourceLocationId: targetLocationId,
      destinationLocationId: targetLocationId,
      actionType: "RECEIVE",
      notes: `Inbound reception by ${receiveInput.operatorId || "SYSTEM"}`,
    });

    return newLpn;
  });

  // Log successful reception event
  const eventTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`(${eventTimestamp}) Inbound LPN received: ${createdLpn.lpnCode}`);

  return createdLpn;
}
