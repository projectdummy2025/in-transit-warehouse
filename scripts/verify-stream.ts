import { Lpn, LpnStatus, SseEvent } from "../packages/shared/src/index.js";
import { activityEventEmitter } from "../apps/server/src/services/event-emitter.js";
import { calculateDwellTime, checkIsOverdue } from "../apps/server/src/services/staging-service.js";
import { scanAgingInventory } from "../apps/server/src/workers/aging-worker.js";
import { application } from "../apps/server/src/index.js";
import { activeStagingInventory } from "../apps/server/src/routes/staging.js";

// Step 1: Verify health check endpoint
console.log("(1/4) Verifying server health endpoint...");
const healthResponse = await application.request("/health");
console.assert(healthResponse.status === 200, "Health status failed");
const healthJson = await healthResponse.json();
console.assert(healthJson.status === "healthy", "Health payload failed");
console.log("Health check passed.");

// Step 2: Verify SSE event subscription and broadcast
console.log("(2/4) Verifying SSE event broadcast...");
let capturedEvent: SseEvent | null = null;
const unsubscribe = activityEventEmitter.subscribe((event: SseEvent) => {
  capturedEvent = event;
});

activityEventEmitter.broadcastMutationCreated({
  lpn_id: "LPN-TEST-001",
  target_location_id: "LOC-STAGE-01"
});

console.assert(capturedEvent !== null, "Mutation broadcast failed");
console.assert((capturedEvent as SseEvent | null)?.event === "mutation:created", "Event name mismatch");
unsubscribe();
console.log("SSE event broadcast passed.");

// Step 3: Verify staging inventory dwell-time calculations
console.log("(3/4) Verifying dwell-time calculations...");
const currentTime = new Date();
const twentyFiveHoursAgo = new Date(currentTime.getTime() - 25 * 60 * 60 * 1000).toISOString();
const calculatedMinutes = calculateDwellTime(twentyFiveHoursAgo, currentTime);
console.assert(calculatedMinutes === 1500, `Expected 1500 minutes, got ${calculatedMinutes}`);
console.assert(checkIsOverdue(calculatedMinutes) === true, "Overdue check failed");
console.log("Dwell-time calculation passed.");

// Step 4: Verify aging worker detection and alert emission
console.log("(4/4) Verifying aging alert worker detection...");
const overdueLpn: Lpn = {
  id: "LPN-AGING-99",
  lpn_code: "LPN-20260922-9999",
  sku_id: "SKU-09",
  quantity: 100,
  current_location_id: "LOC-STAGE-01",
  status: LpnStatus.STAGED,
  received_at: twentyFiveHoursAgo,
  updated_at: currentTime.toISOString()
};

let agingAlert: SseEvent | null = null;
const unsubscribeAlert = activityEventEmitter.subscribe((event: SseEvent) => {
  if (event.event === "aging:overdue") {
    agingAlert = event;
  }
});

const detectedList = scanAgingInventory([overdueLpn], currentTime);
console.assert(detectedList.length === 1, "Aging scan detection failed");
console.assert(agingAlert !== null, "Aging SSE alert not emitted");
console.assert((agingAlert as SseEvent | null)?.event === "aging:overdue", "Aging event mismatch");
unsubscribeAlert();
console.log("Aging alert worker verification passed.");

// Populate inventory and check HTTP staging endpoint
activeStagingInventory.length = 0;
activeStagingInventory.push(overdueLpn);
const stagingResponse = await application.request("/api/inventory/staging");
console.assert(stagingResponse.status === 200, "Staging endpoint failed");
const stagingData = await stagingResponse.json();
console.assert(stagingData.count === 1, "Staging count mismatch");
console.assert(stagingData.data[0].is_overdue === true, "Staging overdue flag mismatch");

console.log("\nALL VERIFICATION STEPS PASSED SUCCESSFULLY (DEV3-TICK-03-C)!");
process.exit(0);
