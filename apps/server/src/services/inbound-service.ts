import { eq } from "drizzle-orm";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable, mutationLogsTable, skusTable } from "../db/schema";

interface InboundReceiveInput {
  skuId: number;
  quantity: number;
  locationId?: number;
  lpnCode?: string;
}

// Service function to process inbound inventory reception
export async function processInboundReceive(receiveInput: InboundReceiveInput) {
  // Validate quantity is positive
  if (receiveInput.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  // Validate target location exists and is of INBOUND type
  let targetLocationId = receiveInput.locationId;

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
      throw new Error("No available INBOUND location found");
    }

    targetLocationId = defaultInboundLocation.id;
  }

  // Validate target SKU exists
  const [foundSku] = await databaseInstance
    .select()
    .from(skusTable)
    .where(eq(skusTable.id, receiveInput.skuId));

  if (!foundSku) {
    throw new Error("Target SKU not found");
  }

  // Generate unique LPN code if not provided
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  const generatedLpnCode = receiveInput.lpnCode || `LPN-${currentDate}-${randomSuffix}`;

  // Execute database atomic transaction for LPN creation and audit log entry
  const createdLpn = await databaseInstance.transaction(async (transactionClient) => {
    const [newLpn] = await transactionClient
      .insert(lpnsTable)
      .values({
        lpnCode: generatedLpnCode,
        skuId: receiveInput.skuId,
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
      notes: "Initial inbound reception",
    });

    return newLpn;
  });

  // Log successful reception event
  const eventTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`(${eventTimestamp}) Inbound LPN received: ${createdLpn.lpnCode}`);

  return createdLpn;
}
