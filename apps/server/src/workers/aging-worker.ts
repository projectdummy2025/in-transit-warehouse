import { Lpn, LpnStatus, StagingInventoryItem } from "@in-transit/shared";
import { activityEventEmitter } from "../services/event-emitter.js";
import { enrichStagingItem } from "../services/staging-service.js";
import { activeStagingInventory } from "../routes/staging.js";

const DEFAULT_SCAN_INTERVAL_MILLISECONDS = 5 * 60 * 1000; // 5 minutes

// Check inventory and broadcast alert for overdue items
export function scanAgingInventory(inventoryList: Lpn[], currentTime: Date = new Date()): StagingInventoryItem[] {
  const overdueItems: StagingInventoryItem[] = [];

  // Filter and check each staged inventory item
  inventoryList
    .filter((lpnRecord) => lpnRecord.status === LpnStatus.STAGED)
    .forEach((lpnRecord) => {
      const enrichedItem = enrichStagingItem(lpnRecord, currentTime);
      if (enrichedItem.is_overdue) {
        overdueItems.push(enrichedItem);
        // Broadcast overdue alert to SSE stream
        activityEventEmitter.emit({
          event: "aging:overdue",
          data: enrichedItem,
          timestamp: currentTime.toISOString()
        });
      }
    });

  return overdueItems;
}

// Aging alert background worker
export class AgingWorker {
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  // Start periodic aging checks
  public start(intervalMilliseconds: number = DEFAULT_SCAN_INTERVAL_MILLISECONDS): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log(`(${new Date().toISOString()}) Aging alert worker started`);

    this.timerHandle = setInterval(() => {
      this.executeScan();
    }, intervalMilliseconds);
  }

  // Execute single scan cycle
  public executeScan(): StagingInventoryItem[] {
    const scanTime = new Date();
    const overdueList = scanAgingInventory(activeStagingInventory, scanTime);

    if (overdueList.length > 0) {
      console.log(`(${scanTime.toISOString()}) Aging check detected ${overdueList.length} overdue LPNs`);
    }

    return overdueList;
  }

  // Stop periodic worker
  public stop(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.isRunning = false;
    console.log(`(${new Date().toISOString()}) Aging alert worker stopped`);
  }
}

export const agingWorker = new AgingWorker();
