import React, { useState, ReactNode } from "react";
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

interface MenuItem {
  tabKey: string;
  tabTitle: string;
  shortcutBadge: string;
  itemIcon: LucideIcon;
}

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  selectTab: (tabKey: string) => void;
  onLogout?: () => void;
}

const MENU_LIST: MenuItem[] = [
  { tabKey: "inbound", tabTitle: "Inbound Receiving", shortcutBadge: "F1", itemIcon: Package },
  { tabKey: "mutation", tabTitle: "Location Mutation", shortcutBadge: "F2", itemIcon: ArrowLeftRight },
  { tabKey: "staging", tabTitle: "Staging Overview", shortcutBadge: "F3", itemIcon: LayoutGrid },
];

// High contrast warehouse operator workbench layout with global shortcut indicators
export function WorkbenchLayout({ children, activeTab, selectTab, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const currentMenu = MENU_LIST.find((item) => item.tabKey === activeTab) || MENU_LIST[0];

  return (
    <div className="flex h-screen bg-[#121316] text-zinc-200 font-sans antialiased overflow-hidden">
      {/* Collapsible left navigation sidebar */}
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
          {MENU_LIST.map((menuItem) => {
            const isSelected = activeTab === menuItem.tabKey;
            const IconComponent = menuItem.itemIcon;

            return (
              <button
                key={menuItem.tabKey}
                onClick={() => selectTab(menuItem.tabKey)}
                title={!isSidebarOpen ? `${menuItem.tabTitle} [${menuItem.shortcutBadge}]` : undefined}
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
                {isSidebarOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{menuItem.tabTitle}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                      {menuItem.shortcutBadge}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Operator status profile footer */}
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
                onClick={onLogout}
                className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onLogout}
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
        {/* Top header bar */}
        <header className="h-14 border-b border-zinc-800/90 bg-[#18191d]/60 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
            <span className="text-zinc-500 font-medium">Workbench</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 font-semibold">{currentMenu.tabTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-zinc-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Dynamic child workspace content */}
        <main className="flex-1 p-6 overflow-y-auto w-full flex flex-col">
          {children}
        </main>

        {/* Footer shortcuts status indicator bar */}
        <footer className="h-9 border-t border-zinc-800/90 bg-[#18191d]/80 px-6 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0 select-none">
          <div className="flex items-center gap-5">
            <span>[F1] INBOUND</span>
            <span>[F2] MUTATION</span>
            <span>[F3] STAGING</span>
            <span>[ESC] RESET SCAN</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <span>SCANNER BUFFER ACTIVE</span>
            <span>&bull;</span>
            <span>v0.1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
