import React from "react";
import { Box, MapPin, Calendar, Layers, CheckCircle2 } from "lucide-react";
import { InboundItem } from "./inboundTypes";

interface ShowProps {
  itemDetail: InboundItem;
  onBack: () => void;
}

// Inbound show view presenting physical unit specification and LPN audit details
export function InboundShow({ itemDetail, onBack }: ShowProps) {
  return (
    <div className="w-full space-y-6">
      {/* Top Header with right-aligned single Back action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            LPN Entity Specification
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical unit identification and receiving verification record
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
              License Plate Number
            </span>
            <div className="text-xl font-bold font-mono text-zinc-100 tracking-wider">
              {itemDetail.lpnCode}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> RECEIVED
          </span>
        </div>

        {/* Specification attribute grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="flex items-start gap-3">
            <Box className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                SKU Identifier
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {itemDetail.skuCode}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Layers className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Unit Quantity
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {itemDetail.quantityNumber} Master Units
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Current Staging Bay
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {itemDetail.locationCode} (Bay 01)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                Receipt Timestamp
              </span>
              <div className="text-sm font-medium text-zinc-200 mt-0.5 font-mono">
                {new Date(itemDetail.receivedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
