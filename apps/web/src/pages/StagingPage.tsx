import React, { useState } from "react";
import { StagingBay } from "./staging/stagingTypes";
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

// Buffer staging overview page orchestrator with live telemetry stream
export function StagingPage() {
  const [activeView, setActiveView] = useState<ViewMode>("grid");
  const [bayList] = useState<StagingBay[]>(INITIAL_BAYS);
  const [selectedBay, setSelectedBay] = useState<StagingBay | null>(null);

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
