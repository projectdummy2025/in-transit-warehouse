import React from "react";
import { Plus, Eye, Package, Boxes, Layers, Tag, MapPin } from "lucide-react";
import { InboundItem } from "./inboundTypes";

interface IndexProps {
  itemList: InboundItem[];
  onCreateClick: () => void;
  onSelectLpn: (selectedItem: InboundItem) => void;
}

// Inbound index view displaying live computed receiving metrics and LPN ledger
export function InboundIndex({ itemList, onCreateClick, onSelectLpn }: IndexProps) {
  // Dynamically calculated operational metrics from shift receiving ledger
  const totalLpnCount = itemList.length;
  const totalMasterUnits = itemList.reduce((sum, item) => sum + item.quantityNumber, 0);
  const uniqueSkuCount = new Set(itemList.map((item) => item.skuCode)).size;
  const activeBaysCount = new Set(itemList.map((item) => item.locationCode)).size;

  return (
    <div className="w-full space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Inbound Inventory Index
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Shift receiving ledger and real-time buffer telemetry
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-wider hover:bg-white transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Receive Goods</span>
        </button>
      </div>

      {/* Dynamic Operational Warehouse Receiving KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Shift LPN Count */}
        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Shift LPN Count
            </span>
            <Boxes className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalLpnCount} <span className="text-xs text-zinc-500 font-sans font-normal">LPN</span>
          </div>
          <p className="text-[11px] text-zinc-500">Unique LPN containers registered</p>
        </div>

        {/* KPI 2: Total Master Units */}
        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Master Units Received
            </span>
            <Layers className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalMasterUnits} <span className="text-xs text-zinc-500 font-sans font-normal">Units</span>
          </div>
          <p className="text-[11px] text-zinc-500">Total physical quantity count</p>
        </div>

        {/* KPI 3: Unique SKU Count */}
        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active SKU Variety
            </span>
            <Tag className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {uniqueSkuCount} <span className="text-xs text-zinc-500 font-sans font-normal">SKUs</span>
          </div>
          <p className="text-[11px] text-zinc-500">Distinct product items in ledger</p>
        </div>

        {/* KPI 4: Occupied Staging Bays */}
        <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Staging Bays Used
            </span>
            <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {activeBaysCount} <span className="text-xs text-zinc-500 font-sans font-normal">Bays</span>
          </div>
          <p className="text-[11px] text-zinc-500">Distinct buffer bays populated</p>
        </div>
      </div>

      {/* Curated LPN Ledger Table */}
      <div className="bg-[#18191d] border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-zinc-800/90 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Shift Receiving Ledger
          </span>
          <span className="text-xs text-zinc-500 font-mono">{itemList.length} Records</span>
        </div>

        {itemList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-8 h-8 text-zinc-600 mx-auto" strokeWidth={1.5} />
            <div className="text-xs text-zinc-400 font-medium">
              No inbound LPN records received in this shift yet.
            </div>
            <button
              onClick={onCreateClick}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Scan First Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/90 text-zinc-400 uppercase tracking-wider font-semibold text-[11px] bg-zinc-900/40">
                  <th className="px-5 py-3">LPN Code</th>
                  <th className="px-5 py-3">SKU Identifier</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Staging Bay</th>
                  <th className="px-5 py-3">Received Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {itemList.map((recordItem) => (
                  <tr key={recordItem.lpnCode} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-zinc-100">{recordItem.lpnCode}</td>
                    <td className="px-5 py-3 text-zinc-300 font-sans">{recordItem.skuCode}</td>
                    <td className="px-5 py-3 text-zinc-200">{recordItem.quantityNumber}</td>
                    <td className="px-5 py-3 text-zinc-400">{recordItem.locationCode}</td>
                    <td className="px-5 py-3 text-zinc-500 text-[11px]">
                      {new Date(recordItem.receivedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 text-right font-sans">
                      <button
                        onClick={() => onSelectLpn(recordItem)}
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
