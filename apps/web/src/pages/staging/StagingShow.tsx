import React from "react";
import { Layers, MapPin, Box, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { StagingBay } from "./stagingTypes";
import { calculateUtilizationPercentage, getBayCapacityStatus } from "./stagingLogic";

interface ShowProps {
  bayDetail: StagingBay;
  onBack: () => void;
}

// Staging show view presenting detailed pallet inventory inside a selected buffer bay
export function StagingShow({ bayDetail, onBack }: ShowProps) {
  const utilization = calculateUtilizationPercentage(bayDetail.currentUnits, bayDetail.maxCapacityUnits);
  const status = getBayCapacityStatus(bayDetail.currentUnits, bayDetail.maxCapacityUnits);
  const remainingCapacity = Math.max(0, bayDetail.maxCapacityUnits - bayDetail.currentUnits);

  return (
    <div className="w-full space-y-6">
      {/* Top Header with right-aligned single Back action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Buffer Bay Specification &bull; {bayDetail.bayCode}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical bay capacity telemetry and resident pallet inventory
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-1.5 rounded-lg border border-zinc-800 bg-[#18191d] text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
        >
          Kembali
        </button>
      </div>

      {/* Main specification card */}
      <div className="w-full bg-[#18191d] border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm">
        {/* Header banner */}
        <div className="p-6 border-b border-zinc-800/90 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Staging Location Code
            </span>
            <div className="text-xl font-bold font-mono text-zinc-100 tracking-wider">
              {bayDetail.bayCode}
            </div>
          </div>
          <div>
            {status === "CRITICAL" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} /> CAPACITY FULL ({utilization}%)
              </span>
            )}
            {status === "HIGH" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} /> HIGH OCCUPANCY ({utilization}%)
              </span>
            )}
            {status === "NORMAL" && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> NORMAL LOAD ({utilization}%)
              </span>
            )}
          </div>
        </div>

        {/* Specification attribute grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Bay Identifier
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {bayDetail.bayCode}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Layers className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Max Capacity
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {bayDetail.maxCapacityUnits} Master Units
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Box className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Occupied Load
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {bayDetail.currentUnits} Units ({bayDetail.pallets.length} Pallets)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Free Buffer Space
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {remainingCapacity} Units Free
              </div>
            </div>
          </div>
        </div>

        {/* Resident Pallets Ledger */}
        <div className="border-t border-zinc-800/90">
          <div className="px-6 py-3.5 border-b border-zinc-800/90 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Resident Pallet Ledger
            </span>
            <span className="text-xs text-zinc-500 font-mono">{bayDetail.pallets.length} Pallets Staged</span>
          </div>

          {bayDetail.pallets.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500 font-medium">
              Bay is currently empty. No pallet units staged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/90 text-zinc-400 uppercase tracking-wider font-semibold text-[11px] bg-zinc-900/40">
                    <th className="px-6 py-3">LPN Code</th>
                    <th className="px-6 py-3">SKU Identifier</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Received Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {bayDetail.pallets.map((pallet) => (
                    <tr key={pallet.lpnCode} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 font-semibold text-zinc-100">{pallet.lpnCode}</td>
                      <td className="px-6 py-3 text-zinc-300 font-sans">{pallet.skuCode}</td>
                      <td className="px-6 py-3 text-zinc-200">{pallet.quantityNumber} Units</td>
                      <td className="px-6 py-3 text-zinc-500 text-[11px]">
                        {new Date(pallet.receivedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
