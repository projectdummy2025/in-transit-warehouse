import React, { useState } from "react";
import {
  Package,
  ArrowLeftRight,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Boxes,
  LogOut,
  LucideIcon,
} from "lucide-react";

interface NavigationItem {
  itemKey: string;
  itemTitle: string;
  itemIcon: LucideIcon;
  itemDescription: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    itemKey: "inbound",
    itemTitle: "Inbound Receiving",
    itemIcon: Package,
    itemDescription: "Dock receiving and LPN label generation",
  },
  {
    itemKey: "mutation",
    itemTitle: "Location Mutation",
    itemIcon: ArrowLeftRight,
    itemDescription: "Internal pallet movement to staging bays",
  },
  {
    itemKey: "staging",
    itemTitle: "Staging Overview",
    itemIcon: LayoutGrid,
    itemDescription: "Buffer bay capacity telemetry and aging alerts",
  },
];

// Balanced operator workbench layout with full-bleed container composition
export default function App() {
  const [activeMenu, setActiveMenu] = useState<string>("inbound");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const currentTab =
    NAVIGATION_ITEMS.find((item) => item.itemKey === activeMenu) ||
    NAVIGATION_ITEMS[0];

  const handleLogout = () => {
    console.log(`(${new Date().toISOString()}) Operator logged out`);
  };

  return (
    <div className="flex h-screen bg-[#121316] text-zinc-200 font-sans antialiased overflow-hidden selection:bg-zinc-700 selection:text-white">
      {/* Collapsible left sidebar navigation */}
      <aside
        className={`bg-[#18191d] border-r border-zinc-800/90 flex flex-col transition-all duration-200 select-none ${
          isSidebarOpen ? "w-64" : "w-[68px]"
        }`}
      >
        {/* Brand header / Toggle button */}
        <div className="h-14 border-b border-zinc-800/90 flex items-center px-4 shrink-0 justify-between">
          {isSidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5">
                <Boxes className="w-5 h-5 text-zinc-300 shrink-0" strokeWidth={1.75} />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">
                  In-Transit
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar navigation list */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
          {NAVIGATION_ITEMS.map((menuItem) => {
            const isSelected = activeMenu === menuItem.itemKey;
            const IconComponent = menuItem.itemIcon;

            return (
              <button
                key={menuItem.itemKey}
                onClick={() => setActiveMenu(menuItem.itemKey)}
                title={!isSidebarOpen ? menuItem.itemTitle : undefined}
                className={`w-full flex items-center rounded-lg text-xs uppercase tracking-wider transition-all ${
                  isSidebarOpen
                    ? "gap-3 px-3 py-2.5 justify-start"
                    : "h-11 justify-center px-0"
                } ${
                  isSelected
                    ? "bg-[#25262c] text-zinc-100 font-bold border border-zinc-700/60 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium"
                }`}
              >
                <IconComponent
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isSelected ? "text-zinc-100" : "text-zinc-400"
                  }`}
                  strokeWidth={1.75}
                />
                {isSidebarOpen && <span className="truncate">{menuItem.itemTitle}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer operator profile */}
        <div className="p-3 border-t border-zinc-800/90">
          {isSidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <div className="text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
                  DC Operator
                </div>
                <div className="text-zinc-500 font-mono text-[10px] mt-0.5">DC-ZONE-01</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#121316]">
        {/* Top workspace bar with uppercase breadcrumb */}
        <header className="h-14 border-b border-zinc-800/90 bg-[#18191d]/60 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
            <span className="text-zinc-500 font-medium">Workbench</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 font-semibold">{currentTab.itemTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-zinc-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Full-width responsive workspace body without narrow max-width constraint */}
        <main className="flex-1 p-6 overflow-y-auto w-full flex flex-col">
          <div className="flex-1 flex flex-col space-y-4">
            {/* Header section */}
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-zinc-100">
                {currentTab.itemTitle}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentTab.itemDescription}
              </p>
            </div>

            {/* Full width content card frame */}
            <div className="flex-1 w-full bg-[#18191d] border border-zinc-800/90 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Workspace ready for ticket implementation
              </p>
              <p className="text-xs text-zinc-500 max-w-lg">
                Full-width container active. Ready for high-density barcode tables, mutation forms, and staging telemetry grids.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
