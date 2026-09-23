import React, { useState } from "react";
import { InboundIndex } from "./inbound/InboundIndex";
import { InboundCreate } from "./inbound/InboundCreate";
import { InboundShow } from "./inbound/InboundShow";
import { InboundItem } from "./inbound/inboundTypes";

type ViewMode = "index" | "create" | "show";

const INITIAL_INBOUND_LIST: InboundItem[] = [
  {
    lpnCode: "LPN-20260923-0001",
    skuCode: "SKU-ELE-01",
    quantityNumber: 10,
    locationCode: "INBOUND",
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    lpnCode: "LPN-20260923-0002",
    skuCode: "SKU-FOOD-02",
    quantityNumber: 25,
    locationCode: "INBOUND",
    receivedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

// Inbound module orchestrator controlling index, create, and show views
export function InboundPage() {
  const [activeView, setActiveView] = useState<ViewMode>("index");
  const [itemList, setItemList] = useState<InboundItem[]>(INITIAL_INBOUND_LIST);
  const [selectedItem, setSelectedItem] = useState<InboundItem | null>(null);

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
