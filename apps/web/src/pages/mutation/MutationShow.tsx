import React from "react";
import { MapPin, Calendar, UserCheck, ArrowRightLeft, CheckCircle2, Clock } from "lucide-react";
import { MutationRecord } from "./mutationTypes";

interface ShowProps {
  itemDetail: MutationRecord;
  onBack: () => void;
}

// Mutation show view presenting detailed pallet relocation audit trail
export function MutationShow({ itemDetail, onBack }: ShowProps) {
  return (
    <div className="w-full space-y-6">
      {/* Top Header with right-aligned single Back action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Mutation Transfer Record
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical relocation audit trail and synchronization telemetry
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
              Mutation Identifier
            </span>
            <div className="text-xl font-bold font-mono text-zinc-100 tracking-wider">
              {itemDetail.mutationId}
            </div>
          </div>
          <div>
            {itemDetail.syncStatus === "optimistic" ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} /> OPTIMISTIC SYNC
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> CONFIRMED
              </span>
            )}
          </div>
        </div>

        {/* Specification attribute grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Target LPN
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {itemDetail.lpnCode}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Origin Location
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {itemDetail.sourceLocation}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Destination Location
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {itemDetail.destinationLocation}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Transfer Timestamp
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {new Date(itemDetail.mutatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Operator footer */}
        <div className="px-6 py-4 border-t border-zinc-800/90 bg-zinc-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <UserCheck className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
            <span>Executed by Operator: <span className="text-zinc-200 font-mono font-semibold">{itemDetail.operatorName}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
