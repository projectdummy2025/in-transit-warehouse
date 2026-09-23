import React, { useState, useEffect } from "react";
import { StagingBay, StagingPallet } from "./staging/stagingTypes";
import { StagingGrid } from "./staging/StagingGrid";
import { StagingShow } from "./staging/StagingShow";
import { LiveActivityLog } from "@/components/LiveActivityLog";

// Initial physical warehouse buffer bay configuration
const INITIAL_BAYS: StagingBay[] = [
  {
    bayCode: "BAY-01",
    maxCapacityUnits: 50,
    currentUnits: 35,
    pallets: [
      { lpnCode: "LPN-20260923-0001", skuCode: "SKU-FOOD-01", quantityNumber: 20, receivedAt: new Date(Date.now() - 3600000).toISOString() },
      { lpnCode: "LPN-20260923-0002", skuCode: "SKU-FOOD-02", quantityNumber: 15, receivedAt: new Date(Date.now() - 1800000).toISOString() },
    ],
  },
  {
    bayCode: "BAY-02",
    maxCapacityUnits: 50,
    currentUnits: 45,
    pallets: [
      { lpnCode: "LPN-20260923-0003", skuCode: "SKU-ELEC-01", quantityNumber: 25, receivedAt: new Date(Date.now() - 7200000).toISOString() },
      { lpnCode: "LPN-20260923-0004", skuCode: "SKU-ELEC-02", quantityNumber: 20, receivedAt: new Date(Date.now() - 5400000).toISOString() },
    ],
  },
  {
    bayCode: "BAY-03",
    maxCapacityUnits: 50,
    currentUnits: 10,
    pallets: [
      { lpnCode: "LPN-20260923-0005", skuCode: "SKU-HOME-01", quantityNumber: 10, receivedAt: new Date(Date.now() - 900000).toISOString() },
    ],
  },
  {
    bayCode: "BAY-04",
    maxCapacityUnits: 50,
    currentUnits: 0,
    pallets: [],
  },
  {
    bayCode: "BAY-05",
    maxCapacityUnits: 50,
    currentUnits: 20,
    pallets: [
      { lpnCode: "LPN-20260923-0006", skuCode: "SKU-BEV-01", quantityNumber: 20, receivedAt: new Date(Date.now() - 1200000).toISOString() },
    ],
  },
  {
    bayCode: "BAY-06",
    maxCapacityUnits: 50,
    currentUnits: 0,
    pallets: [],
  },
  {
    bayCode: "BAY-07",
    maxCapacityUnits: 50,
    currentUnits: 48,
    pallets: [
      { lpnCode: "LPN-20260923-0007", skuCode: "SKU-APPL-01", quantityNumber: 30, receivedAt: new Date(Date.now() - 8400000).toISOString() },
      { lpnCode: "LPN-20260923-0008", skuCode: "SKU-APPL-02", quantityNumber: 18, receivedAt: new Date(Date.now() - 6000000).toISOString() },
    ],
  },
  {
    bayCode: "BAY-08",
    maxCapacityUnits: 50,
    currentUnits: 0,
    pallets: [],
  },
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

  // Fetch staging inventory from server API and merge with bay matrix
  useEffect(() => {
    async function loadStagingInventory() {
      try {
        const response = await fetch("/api/inventory/staging");
        if (!response.ok) return;

        const serverData = (await response.json()) as ApiStagingItem[];
        if (!Array.isArray(serverData) || serverData.length === 0) return;

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

        // Merge grouped pallets into existing bay list or create new bays
        setBayList((prevBays) => {
          const updatedBays = prevBays.map((bay) => {
            const serverPallets = bayMap.get(bay.bayCode);
            if (serverPallets) {
              const totalUnits = serverPallets.reduce((sum, p) => sum + p.quantityNumber, 0);
              bayMap.delete(bay.bayCode);
              return {
                ...bay,
                currentUnits: totalUnits,
                pallets: serverPallets,
              };
            }
            return bay;
          });

          // Add any additional bays returned by server
          bayMap.forEach((pallets, bayCode) => {
            const totalUnits = pallets.reduce((sum, p) => sum + p.quantityNumber, 0);
            updatedBays.push({
              bayCode,
              maxCapacityUnits: 50,
              currentUnits: totalUnits,
              pallets,
            });
          });

          return updatedBays;
        });
      } catch {
        // Retain fallback initial bays on network failure
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
