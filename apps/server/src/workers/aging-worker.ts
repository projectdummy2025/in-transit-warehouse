import { StagingInventoryItem } from "@in-transit/shared";
import { activityEventEmitter } from "../services/event-emitter";
import { fetchStagingInventory } from "../services/staging-service";

// Default interval from environment variable or fallback to 5 minutes
const defaultScanInterval = Number(process.env.AGING_SCAN_INTERVAL_MS) || 300000;

// Background worker checking staging area inventory dwell time and emitting alerts
export class AgingWorker {
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  // Start periodic aging scans
  public start(intervalMilliseconds: number = defaultScanInterval): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(`(${currentTimestamp}) Aging alert worker started`);

    this.timerHandle = setInterval(async () => {
      try {
        await this.executeScan();
      } catch (caughtError: unknown) {
        const errorMessage = caughtError instanceof Error ? caughtError.message : "Unknown error";
        console.error(`(${new Date().toISOString().replace("T", " ").slice(0, 19)}) Aging scan failed: ${errorMessage}`);
      }
    }, intervalMilliseconds);
  }

  // Execute single scan cycle over database staging inventory
  public async executeScan(): Promise<StagingInventoryItem[]> {
    const scanTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    try {
      const stagingItems = await fetchStagingInventory();
      const overdueItems = stagingItems.filter((inventoryItem) => inventoryItem.is_overdue);

      // Broadcast overdue alert for each overdue LPN
      for (const overdueItem of overdueItems) {
        activityEventEmitter.broadcastAgingOverdue({
          lpn_code: overdueItem.lpn_code,
          location_code: overdueItem.location_code,
          dwell_time_hours: Number((overdueItem.dwell_time_minutes / 60).toFixed(1)),
          timestamp: scanTimestamp,
        });
      }

      if (overdueItems.length > 0) {
        console.log(`(${scanTimestamp}) Aging scan detected ${overdueItems.length} overdue LPNs`);
      }

      return overdueItems;
    } catch (caughtError: unknown) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Database error";
      console.error(`(${scanTimestamp}) Aging scan query error: ${errorMessage}`);
      return [];
    }
  }

  // Stop background scan timer
  public stop(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.isRunning = false;
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(`(${currentTimestamp}) Aging alert worker stopped`);
  }
}

export const agingWorker = new AgingWorker();
