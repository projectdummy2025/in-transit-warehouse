import React, { useState, useEffect } from "react";
import { MutationRecord } from "./mutation/mutationTypes";
import { MutationIndex } from "./mutation/MutationIndex";
import { MutationForm } from "./mutation/MutationForm";
import { MutationShow } from "./mutation/MutationShow";

type ViewMode = "index" | "form" | "show";

// Location mutation page orchestrator with optimistic UI state handling and real API dispatch
export function MutationPage() {
  const [activeView, setActiveView] = useState<ViewMode>("index");
  const [mutationList, setMutationList] = useState<MutationRecord[]>([]);
  const [selectedMutation, setSelectedMutation] = useState<MutationRecord | null>(null);

  // Fetch recorded mutation logs from backend API
  useEffect(() => {
    async function loadMutations() {
      try {
        const response = await fetch("/api/mutations");
        if (!response.ok) return;

        const data = (await response.json()) as MutationRecord[];
        if (Array.isArray(data)) {
          setMutationList(data);
        }
      } catch (error) {
        console.error("Failed to load mutation logs", error);
      }
    }

    loadMutations();
  }, []);

  // Optimistic location transfer executor calling real backend API
  const handleOptimisticTransfer = async (lpnCode: string, destinationLocation: string) => {
    const timestampNow = new Date().toISOString();
    const newMutationId = `MUT-${Date.now()}`;

    // 1. Instantly construct optimistic record
    const optimisticRecord: MutationRecord = {
      mutationId: newMutationId,
      lpnCode: lpnCode,
      sourceLocation: "INBOUND",
      destinationLocation: destinationLocation,
      operatorName: "DC-OPERATOR-01",
      mutatedAt: timestampNow,
      syncStatus: "optimistic",
    };

    // 2. Update UI state immediately
    setMutationList((previousList) => [optimisticRecord, ...previousList]);
    setActiveView("index");

    console.log(`(${timestampNow}) Pallet location mutation initiated: ${lpnCode} -> ${destinationLocation}`);

    // 3. Background real network dispatch to backend Hono API
    try {
      const response = await fetch("/api/mutations/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lpn_code: lpnCode,
          to_location_code: destinationLocation,
          operator_id: "DC-OPERATOR-01",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      setMutationList((previousList) =>
        previousList.map((itemRecord) =>
          itemRecord.mutationId === newMutationId
            ? { ...itemRecord, syncStatus: "confirmed" }
            : itemRecord
        )
      );
      console.log(`(${new Date().toISOString()}) Pallet location mutation confirmed by server: ${newMutationId}`);
    } catch (catchError: unknown) {
      const errorMessage = catchError instanceof Error ? catchError.message : "Mutation move failed";
      console.error(`(${new Date().toISOString()}) Pallet location mutation error: ${errorMessage}`);
      setMutationList((previousList) =>
        previousList.map((itemRecord) =>
          itemRecord.mutationId === newMutationId
            ? { ...itemRecord, syncStatus: "failed" }
            : itemRecord
        )
      );
    }
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
