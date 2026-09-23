import React, { useState, useEffect } from "react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { InboundPage } from "@/pages/InboundPage";
import { MutationPage } from "@/pages/MutationPage";
import { StagingPage } from "@/pages/StagingPage";

// Main application root with global keyboard shortcut handler
export default function App() {
  const [activeTab, setActiveTab] = useState<string>("inbound");

  // Global keyboard shortcuts listener for F1, F2, F3 navigation
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "F1") {
        keyboardEvent.preventDefault();
        setActiveTab("inbound");
      } else if (keyboardEvent.key === "F2") {
        keyboardEvent.preventDefault();
        setActiveTab("mutation");
      } else if (keyboardEvent.key === "F3") {
        keyboardEvent.preventDefault();
        setActiveTab("staging");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    console.log(`(${new Date().toISOString()}) Operator session ended`);
  };

  return (
    <WorkbenchLayout
      activeTab={activeTab}
      selectTab={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === "inbound" && <InboundPage />}
      {activeTab === "mutation" && <MutationPage />}
      {activeTab === "staging" && <StagingPage />}
    </WorkbenchLayout>
  );
}
