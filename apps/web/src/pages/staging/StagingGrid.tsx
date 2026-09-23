import React from "react";
import { LayoutGrid, Layers, MapPin, AlertTriangle, CheckCircle2, ChevronRight, Boxes } from "lucide-react";
import { StagingBay } from "./stagingTypes";
import { calculateUtilizationPercentage, getBayCapacityStatus } from "./stagingLogic";

interface GridProps {
  bayList: StagingBay[];
  onSelectBay: (selectedBay: StagingBay) => void;
}

// Visual matrix layout of physical warehouse buffer bays and pallet density
export function StagingGrid({ bayList, onSelectBay }: GridProps) {
  const totalBays = bayList.length;
  const occupiedBays = bayList.filter((b) => b.currentUnits > 0).length;
  const totalCapacity = bayList.reduce((sum, b) => sum + b.maxCapacityUnits, 0);
  const totalUnits = bayList.reduce((sum, b) => sum + b.currentUnits, 0);
  const globalUtilization = calculateUtilizationPercentage(totalUnits, totalCapacity);

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Buffer Staging Grid Visualizer
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical buffer bay capacity telemetry and unit load density
          </p>
        </div>
      </div>

      {/* Real-time Buffer Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Buffer Bays
            </span>
            <LayoutGrid className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalBays} <span className="text-xs text-zinc-500 font-sans font-normal">Bays</span>
          </div>
          <p className="text-[11px] text-zinc-500">Configured staging zones</p>
        </div>

        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active Occupied Bays
            </span>
            <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {occupiedBays} <span className="text-xs text-zinc-500 font-sans font-normal">Active</span>
          </div>
          <p className="text-[11px] text-zinc-500">Bays containing pallet units</p>
        </div>

        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Units Staged
            </span>
            <Layers className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalUnits} <span className="text-xs text-zinc-500 font-sans font-normal">/ {totalCapacity}</span>
          </div>
          <p className="text-[11px] text-zinc-500">Physical master unit inventory</p>
        </div>

        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Staging Utilization
            </span>
            <Boxes className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {globalUtilization}%
          </div>
          <p className="text-[11px] text-zinc-500">Aggregate capacity ratio</p>
        </div>
      </div>

      {/* Staging Bays Visual Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bayList.map((bayItem) => {
          const utilization = calculateUtilizationPercentage(bayItem.currentUnits, bayItem.maxCapacityUnits);
          const status = getBayCapacityStatus(bayItem.currentUnits, bayItem.maxCapacityUnits);

          return (
            <div
              key={bayItem.bayCode}
              onClick={() => onSelectBay(bayItem)}
              className="bg-[#18191d] border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl p-5 space-y-4 cursor-pointer transition-all shadow-sm hover:shadow group"
            >
              {/* Card top banner */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold font-mono text-zinc-100 uppercase tracking-wider">
                    {bayItem.bayCode}
                  </span>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    {bayItem.pallets.length} Pallets
                  </p>
                </div>

                {status === "CRITICAL" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> FULL
                  </span>
                )}
                {status === "HIGH" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> HIGH
                  </span>
                )}
                {status === "NORMAL" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> NORMAL
                  </span>
                )}
              </div>

              {/* Capacity meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-sans text-[11px]">Load</span>
                  <span className="text-zinc-200 font-semibold">
                    {bayItem.currentUnits} / {bayItem.maxCapacityUnits} <span className="text-zinc-500 font-normal">({utilization}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      status === "CRITICAL"
                        ? "bg-rose-500"
                        : status === "HIGH"
                        ? "bg-amber-500"
                        : "bg-zinc-300"
                    }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>

              {/* Staged LPN Pallets preview */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                  Staged LPN Inventory
                </span>
                {bayItem.pallets.length === 0 ? (
                  <p className="text-xs text-zinc-600 font-mono italic">Bay Empty</p>
                ) : (
                  <div className="space-y-1">
                    {bayItem.pallets.slice(0, 2).map((pallet) => (
                      <div
                        key={pallet.lpnCode}
                        className="flex items-center justify-between text-[11px] font-mono bg-zinc-900/60 px-2.5 py-1 rounded border border-zinc-800/60"
                      >
                        <span className="text-zinc-300 font-semibold">{pallet.lpnCode}</span>
                        <span className="text-zinc-500">{pallet.quantityNumber} U</span>
                      </div>
                    ))}
                    {bayItem.pallets.length > 2 && (
                      <p className="text-[10px] text-zinc-500 font-mono text-right">
                        +{bayItem.pallets.length - 2} more pallets
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Hover link */}
              <div className="flex items-center justify-end text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Inspect Bay</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
