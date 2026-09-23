import React, { useState, useEffect } from "react";
import { StagingBay, StagingPallet } from "./staging/stagingTypes";
import { StagingGrid } from "./staging/StagingGrid";
import { StagingShow } from "./staging/StagingShow";
import { LiveActivityLog } from "@/components/LiveActivityLog";

// Initial physical warehouse buffer bay configuration with clean zero-state
const INITIAL_BAYS: StagingBay[] = [
  { bayCode: "BAY-01", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-02", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-03", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-04", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-05", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-06", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-07", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
  { bayCode: "BAY-08", maxCapacityUnits: 50, currentUnits: 0, pallets: [] },
];

type ViewMode = "grid" | "show";

interface ApiStagingItem {
  lpn_code: string;
  sku_code: string;
  quantity: number;
  location_code: string;
  dwell_time_minutes: number;
  is_overdue: boolean;
  received_at: string;
}

// Buffer staging overview page orchestrator with live API data fetching and telemetry stream
export function StagingPage() {
  const [activeView, setActiveView] = useState<ViewMode>("grid");
  const [bayList, setBayList] = useState<StagingBay[]>(INITIAL_BAYS);
  const [selectedBay, setSelectedBay] = useState<StagingBay | null>(null);

  // Fetch staging inventory from server API and map directly to warehouse bays
  useEffect(() => {
    async function loadStagingInventory() {
      try {
        const response = await fetch("/api/inventory/staging");
        if (!response.ok) return;

        const serverData = (await response.json()) as ApiStagingItem[];
        if (!Array.isArray(serverData)) return;

        // Group server pallets by location code
        const bayMap = new Map<string, StagingPallet[]>();
        serverData.forEach((item) => {
          const location = item.location_code || "BAY-01";
          const pallet: StagingPallet = {
            lpnCode: item.lpn_code,
            skuCode: item.sku_code,
            quantityNumber: item.quantity,
            receivedAt: item.received_at,
          };
          const existingList = bayMap.get(location) || [];
          existingList.push(pallet);
          bayMap.set(location, existingList);
        });

        // Populate base bays with actual database records
        const baseBayCodes = ["BAY-01", "BAY-02", "BAY-03", "BAY-04", "BAY-05", "BAY-06", "BAY-07", "BAY-08"];
        const updatedBays: StagingBay[] = baseBayCodes.map((code) => {
          const pallets = bayMap.get(code) || [];
          bayMap.delete(code);
          const totalUnits = pallets.reduce((sum, p) => sum + p.quantityNumber, 0);
          return {
            bayCode: code,
            maxCapacityUnits: 50,
            currentUnits: totalUnits,
            pallets,
          };
        });

        // Append any dynamically created staging bays from database
        bayMap.forEach((pallets, bayCode) => {
          const totalUnits = pallets.reduce((sum, p) => sum + p.quantityNumber, 0);
          updatedBays.push({
            bayCode,
            maxCapacityUnits: 50,
            currentUnits: totalUnits,
            pallets,
          });
        });

        setBayList(updatedBays);
      } catch (error) {
        console.error("Failed to load staging inventory", error);
      }
    }

    loadStagingInventory();
  }, []);

  return (
    <div className="w-full space-y-6">
      {activeView === "grid" && (
        <>
          <StagingGrid
            bayList={bayList}
            onSelectBay={(bay) => {
              setSelectedBay(bay);
              setActiveView("show");
            }}
          />
          <LiveActivityLog maxDisplayCount={5} />
        </>
      )}

      {activeView === "show" && selectedBay && (
        <StagingShow
          bayDetail={selectedBay}
          onBack={() => {
            setSelectedBay(null);
            setActiveView("grid");
          }}
        />
      )}
    </div>
  );
}
