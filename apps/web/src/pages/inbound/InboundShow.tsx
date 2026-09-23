import React from "react";
import { ArrowLeft, Box, MapPin, Calendar, Layers, CheckCircle2 } from "lucide-react";
import { InboundItem } from "./inboundTypes";

interface ShowProps {
  itemDetail: InboundItem;
  onBack: () => void;
}

// Inbound show view presenting comprehensive physical unit and LPN audit details
export function InboundShow({ itemDetail, onBack }: ShowProps) {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-[#18191d] border border-zinc-800/90 text-zinc-400 hover:text-white transition-colors"
          title="Back to Index"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            LPN Entity Specification
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical unit identification and receiving verification record
          </p>
        </div>
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
            <CheckCircle2 className="w-3.5 h-3.5" /> RECEIVED
          </span>
        </div>

        {/* Specification attribute grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="flex items-start gap-3">
            <Box className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
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
            <Layers className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
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
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
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
            <Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
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

        {/* Action card footer */}
        <div className="p-4 border-t border-zinc-800/90 bg-zinc-900/30 flex justify-end">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Return to Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
