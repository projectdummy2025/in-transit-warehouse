import { Lpn, StagingInventoryItem } from "@in-transit/shared";

export const OVERDUE_THRESHOLD_MINUTES = 1440; // 24 hours in minutes
const MILLISECONDS_PER_MINUTE = 60000;

// Calculate dwell-time duration in minutes
export function calculateDwellTime(receivedAtIso: string, currentTime: Date = new Date()): number {
  const receivedTimestamp = new Date(receivedAtIso).getTime();
  const currentTimestamp = currentTime.getTime();
  const elapsedMilliseconds = Math.max(0, currentTimestamp - receivedTimestamp);
  return Math.floor(elapsedMilliseconds / MILLISECONDS_PER_MINUTE);
}

// Check if inventory duration exceeds threshold
export function checkIsOverdue(dwellTimeMinutes: number, thresholdMinutes: number = OVERDUE_THRESHOLD_MINUTES): boolean {
  return dwellTimeMinutes > thresholdMinutes;
}

// Transform raw LPN entity to Staging item with dwell-time metrics
export function enrichStagingItem(lpnRecord: Lpn, currentTime: Date = new Date()): StagingInventoryItem {
  const dwellTimeMinutes = calculateDwellTime(lpnRecord.received_at, currentTime);
  const isOverdue = checkIsOverdue(dwellTimeMinutes);

  return {
    lpn_id: lpnRecord.id,
    lpn_code: lpnRecord.lpn_code,
    sku_id: lpnRecord.sku_id,
    quantity: lpnRecord.quantity,
    location_id: lpnRecord.current_location_id,
    status: lpnRecord.status,
    received_at: lpnRecord.received_at,
    dwell_time_minutes: dwellTimeMinutes,
    is_overdue: isOverdue
  };
}
