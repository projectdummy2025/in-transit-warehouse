import React from "react";
import { Plus, Eye, ArrowRightLeft, ArrowRight, Boxes, MapPin, CheckCircle2, Clock } from "lucide-react";
import { MutationRecord } from "./mutationTypes";

interface IndexProps {
  itemList: MutationRecord[];
  onCreateClick: () => void;
  onSelectMutation: (selectedItem: MutationRecord) => void;
}

// Location mutation index view displaying shift relocation telemetry and audit ledger
export function MutationIndex({ itemList, onCreateClick, onSelectMutation }: IndexProps) {
  // Compute real-time operational telemetry metrics
  const totalTransfers = itemList.length;
  const uniqueLpns = new Set(itemList.map((item) => item.lpnCode)).size;
  const sourceBays = new Set(itemList.map((item) => item.sourceLocation)).size;
  const destBays = new Set(itemList.map((item) => item.destinationLocation)).size;

  return (
    <div className="w-full space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Location Mutation Index
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Shift transfer audit trail and internal location telemetry
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Transfer Pallet</span>
        </button>
      </div>

      {/* Dynamic Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Shift Transfers
            </span>
            <ArrowRightLeft className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalTransfers} <span className="text-xs text-zinc-500 font-sans font-normal">Moves</span>
          </div>
          <p className="text-[11px] text-zinc-500">Pallet relocations executed</p>
        </div>

        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              LPNs Relocated
            </span>
            <Boxes className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {uniqueLpns} <span className="text-xs text-zinc-500 font-sans font-normal">LPN</span>
          </div>
          <p className="text-[11px] text-zinc-500">Distinct pallet units moved</p>
        </div>

        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Origin Bays Cleared
            </span>
            <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {sourceBays} <span className="text-xs text-zinc-500 font-sans font-normal">Bays</span>
          </div>
          <p className="text-[11px] text-zinc-500">Source locations evacuated</p>
        </div>

        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Target Bays Occupied
            </span>
            <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {destBays} <span className="text-xs text-zinc-500 font-sans font-normal">Bays</span>
          </div>
          <p className="text-[11px] text-zinc-500">Destination bays populated</p>
        </div>
      </div>

      {/* Mutation Ledger Table */}
      <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-zinc-800/90 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Mutation Audit Ledger
          </span>
          <span className="text-xs text-zinc-500 font-mono">{itemList.length} Records</span>
        </div>

        {itemList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ArrowRightLeft className="w-8 h-8 text-zinc-600 mx-auto" strokeWidth={1.5} />
            <div className="text-xs text-zinc-400 font-medium">
              No pallet mutation records executed in this shift yet.
            </div>
            <button
              onClick={onCreateClick}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Start First Transfer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/90 text-zinc-400 uppercase tracking-wider font-semibold text-[11px] bg-zinc-900/40">
                  <th className="px-5 py-3">Mutation ID</th>
                  <th className="px-5 py-3">LPN Code</th>
                  <th className="px-5 py-3">Movement Path</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {itemList.map((recordItem) => (
                  <tr key={recordItem.mutationId} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-zinc-100">{recordItem.mutationId}</td>
                    <td className="px-5 py-3 text-zinc-300 font-sans">{recordItem.lpnCode}</td>
                    <td className="px-5 py-3 text-zinc-300">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-zinc-400">{recordItem.sourceLocation}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-500" strokeWidth={2} />
                        <span className="text-zinc-100 font-semibold">{recordItem.destinationLocation}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-[11px]">
                      {new Date(recordItem.mutatedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 font-sans">
                      {recordItem.syncStatus === "optimistic" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold font-mono">
                          <Clock className="w-3 h-3 animate-spin" strokeWidth={2} /> SYNCING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2} /> CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-sans">
                      <button
                        onClick={() => onSelectMutation(recordItem)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-300 hover:text-white bg-zinc-800/70 hover:bg-zinc-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Show</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
