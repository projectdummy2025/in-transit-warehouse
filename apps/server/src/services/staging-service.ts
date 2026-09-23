import { eq } from "drizzle-orm";
import { StagingInventoryItem } from "@in-transit/shared";
import { databaseInstance } from "../db/client";
import { locationsTable, lpnsTable, skusTable } from "../db/schema";

// Standard overdue dwell time threshold in minutes (24 hours)
export const overdueThresholdMinutes = 1440;
const millisecondsPerMinute = 60000;

// Calculate dwell time duration in minutes from received timestamp
export function calculateDwellTime(receivedAtIso: string, currentTime: Date = new Date()): number {
  const receivedTimestamp = new Date(receivedAtIso).getTime();
  const currentTimestamp = currentTime.getTime();
  const elapsedMilliseconds = Math.max(0, currentTimestamp - receivedTimestamp);
  return Math.floor(elapsedMilliseconds / millisecondsPerMinute);
}

// Check whether dwell time exceeds maximum threshold
export function checkIsOverdue(
  dwellTimeMinutes: number,
  thresholdMinutes: number = overdueThresholdMinutes
): boolean {
  return dwellTimeMinutes > thresholdMinutes;
}

// Fetch active staging inventory records from database with calculated dwell metrics
export async function fetchStagingInventory(
  maximumHours?: number,
  currentTime: Date = new Date()
): Promise<StagingInventoryItem[]> {
  // Query all STAGED LPNs joining with SKUs and Locations
  const stagedRecords = await databaseInstance
    .select({
      lpnCode: lpnsTable.lpnCode,
      skuCode: skusTable.skuCode,
      skuName: skusTable.name,
      quantity: lpnsTable.quantity,
      locationCode: locationsTable.locationCode,
      receivedAt: lpnsTable.receivedAt,
    })
    .from(lpnsTable)
    .innerJoin(skusTable, eq(lpnsTable.skuId, skusTable.id))
    .innerJoin(locationsTable, eq(lpnsTable.currentLocationId, locationsTable.id))
    .where(eq(lpnsTable.status, "STAGED"));

  // Enrich each inventory record with calculated dwell time and overdue flag
  const enrichedItems: StagingInventoryItem[] = stagedRecords.map((recordItem) => {
    const dwellMinutes = calculateDwellTime(recordItem.receivedAt, currentTime);
    const overdueFlag = checkIsOverdue(dwellMinutes);

    return {
      lpn_code: recordItem.lpnCode,
      sku_code: recordItem.skuCode,
      sku_name: recordItem.skuName,
      quantity: recordItem.quantity,
      location_code: recordItem.locationCode,
      dwell_time_minutes: dwellMinutes,
      is_overdue: overdueFlag,
      received_at: recordItem.receivedAt,
    };
  });

  // Filter by maximum hours if query parameter is provided
  if (maximumHours !== undefined && !Number.isNaN(maximumHours)) {
    const maxMinutes = maximumHours * 60;
    return enrichedItems.filter((item) => item.dwell_time_minutes <= maxMinutes);
  }

  return enrichedItems;
}
