import React, { useState } from "react";
import { MutationRecord } from "./mutation/mutationTypes";
import { MutationIndex } from "./mutation/MutationIndex";
import { MutationForm } from "./mutation/MutationForm";
import { MutationShow } from "./mutation/MutationShow";

// Initial mock dataset for pallet mutation audit trail
const INITIAL_MUTATIONS: MutationRecord[] = [
  {
    mutationId: "MUT-20260923-0001",
    lpnCode: "LPN-20260923-0001",
    sourceLocation: "INBOUND-BAY-01",
    destinationLocation: "STAGING-A1",
    operatorName: "DC-OPERATOR-01",
    mutatedAt: new Date(Date.now() - 3600000).toISOString(),
    syncStatus: "confirmed",
  },
  {
    mutationId: "MUT-20260923-0002",
    lpnCode: "LPN-20260923-0002",
    sourceLocation: "INBOUND-BAY-01",
    destinationLocation: "STAGING-B2",
    operatorName: "DC-OPERATOR-01",
    mutatedAt: new Date(Date.now() - 1800000).toISOString(),
    syncStatus: "confirmed",
  },
];

type ViewMode = "index" | "form" | "show";

// Location mutation page orchestrator with optimistic UI state handling
export function MutationPage() {
  const [activeView, setActiveView] = useState<ViewMode>("index");
  const [mutationList, setMutationList] = useState<MutationRecord[]>(INITIAL_MUTATIONS);
  const [selectedMutation, setSelectedMutation] = useState<MutationRecord | null>(null);

  // Optimistic location transfer executor
  const handleOptimisticTransfer = (lpnCode: string, destinationLocation: string) => {
    const timestampNow = new Date().toISOString();
    const newMutationId = `MUT-${Date.now()}`;

    // 1. Instantly construct optimistic record
    const optimisticRecord: MutationRecord = {
      mutationId: newMutationId,
      lpnCode: lpnCode,
      sourceLocation: "STAGING-BAY-01",
      destinationLocation: destinationLocation,
      operatorName: "DC-OPERATOR-01",
      mutatedAt: timestampNow,
      syncStatus: "optimistic",
    };

    // 2. Update UI state immediately (zero lag)
    setMutationList((previousList) => [optimisticRecord, ...previousList]);
    setActiveView("index");

    // Logging per guidelines: (date-timestamp) functionality message
    console.log(`(${timestampNow}) Pallet location mutation initiated: ${lpnCode} -> ${destinationLocation}`);

    // 3. Background dispatch simulation (Network sync)
    setTimeout(() => {
      setMutationList((previousList) =>
        previousList.map((itemRecord) =>
          itemRecord.mutationId === newMutationId
            ? { ...itemRecord, syncStatus: "confirmed" }
            : itemRecord
        )
      );
      console.log(`(${new Date().toISOString()}) Pallet location mutation confirmed: ${newMutationId}`);
    }, 1500);
  };

  return (
    <div className="w-full">
      {activeView === "index" && (
        <MutationIndex
          itemList={mutationList}
          onCreateClick={() => setActiveView("form")}
          onSelectMutation={(selectedItem) => {
            setSelectedMutation(selectedItem);
            setActiveView("show");
          }}
        />
      )}

      {activeView === "form" && (
        <MutationForm
          onSuccess={(scannedLpn, scannedBay) => {
            handleOptimisticTransfer(scannedLpn, scannedBay);
          }}
          onCancel={() => setActiveView("index")}
        />
      )}

      {activeView === "show" && selectedMutation && (
        <MutationShow
          itemDetail={selectedMutation}
          onBack={() => {
            setSelectedMutation(null);
            setActiveView("index");
          }}
        />
      )}
    </div>
  );
}
