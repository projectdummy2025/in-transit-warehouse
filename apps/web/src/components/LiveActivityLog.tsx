import React from "react";
import { Activity, ArrowDownToLine, ArrowRightLeft, AlertTriangle, Radio } from "lucide-react";
import { useSSE, WarehouseActivityEvent } from "@/hooks/useSSE";
import { getEventBadgeLabel } from "@/hooks/useSSE";

interface LiveActivityLogProps {
  maxDisplayCount?: number;
}

// Live activity log stream component for warehouse floor operator telemetry
export function LiveActivityLog({ maxDisplayCount = 10 }: LiveActivityLogProps) {
  const { eventList, isConnected } = useSSE();
  const visibleEvents = eventList.slice(0, maxDisplayCount);

  return (
    <div className="w-full bg-[#18191d] border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-zinc-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Live Warehouse Floor Activity Feed
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-400" : "text-zinc-500"}`} strokeWidth={2} />
          <span className={isConnected ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
            {isConnected ? "STREAM ACTIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Stream list container */}
      <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
        {visibleEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            Awaiting real-time warehouse telemetry events...
          </div>
        ) : (
          visibleEvents.map((eventItem) => {
            const badgeLabel = getEventBadgeLabel(eventItem.eventType);

            return (
              <div
                key={eventItem.eventId}
                className="p-3 bg-[#121316] border border-zinc-800/70 rounded-lg flex items-start gap-3 text-xs transition-colors"
              >
                {/* Event Type Icon */}
                <div className="mt-0.5 shrink-0">
                  {eventItem.eventType === "INBOUND_RECEIVED" && (
                    <ArrowDownToLine className="w-4 h-4 text-zinc-300" strokeWidth={1.75} />
                  )}
                  {eventItem.eventType === "LOCATION_MUTATED" && (
                    <ArrowRightLeft className="w-4 h-4 text-zinc-300" strokeWidth={1.75} />
                  )}
                  {eventItem.eventType === "STAGING_ALERT" && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {badgeLabel}
                      </span>
                      <span className="font-mono font-semibold text-zinc-200 text-[11px]">
                        {eventItem.lpnCode}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        &bull; {eventItem.locationCode}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(eventItem.timestampISO).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-xs font-sans">
                    {eventItem.messageText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
