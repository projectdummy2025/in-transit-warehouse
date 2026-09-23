import React, { useState, useEffect } from "react";
import { InboundIndex } from "./inbound/InboundIndex";
import { InboundCreate } from "./inbound/InboundCreate";
import { InboundShow } from "./inbound/InboundShow";
import { InboundItem } from "./inbound/inboundTypes";

type ViewMode = "index" | "create" | "show";

// Inbound module orchestrator controlling index, create, and show views with live backend sync
export function InboundPage() {
  const [activeView, setActiveView] = useState<ViewMode>("index");
  const [itemList, setItemList] = useState<InboundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboundItem | null>(null);

  // Fetch inbound receiving records from backend API
  useEffect(() => {
    async function loadInboundItems() {
      try {
        const response = await fetch("/api/inbound");
        if (!response.ok) return;

        const data = (await response.json()) as InboundItem[];
        if (Array.isArray(data)) {
          setItemList(data);
        }
      } catch (error) {
        console.error("Failed to load inbound items", error);
      }
    }

    loadInboundItems();
  }, []);

  const handleCreateSuccess = (newItem: InboundItem) => {
    setItemList((previousItems) => [newItem, ...previousItems]);
    setSelectedItem(newItem);
    setActiveView("show");
  };

  const handleSelectLpn = (chosenItem: InboundItem) => {
    setSelectedItem(chosenItem);
    setActiveView("show");
  };

  return (
    <div className="w-full">
      {activeView === "index" && (
        <InboundIndex
          itemList={itemList}
          onCreateClick={() => setActiveView("create")}
          onSelectLpn={handleSelectLpn}
        />
      )}

      {activeView === "create" && (
        <InboundCreate
          onSuccess={handleCreateSuccess}
          onCancel={() => setActiveView("index")}
        />
      )}

      {activeView === "show" && selectedItem && (
        <InboundShow
          itemDetail={selectedItem}
          onBack={() => setActiveView("index")}
        />
      )}
    </div>
  );
}
