import React, { useState, useEffect } from "react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { InboundPage } from "@/pages/InboundPage";
import { MutationPage } from "@/pages/MutationPage";

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

      {activeTab === "staging" && (
        <div className="flex-1 flex flex-col space-y-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-100">
              Staging Overview
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Buffer bay capacity telemetry and aging alerts
            </p>
          </div>

          <div className="flex-1 w-full bg-[#18191d] border border-zinc-800/90 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Staging Visualizer Ready
            </p>
            <p className="text-xs text-zinc-500 max-w-lg">
              Module container ready for staging grid visualizer and live SSE telemetry.
            </p>
          </div>
        </div>
      )}
    </WorkbenchLayout>
  );
}
