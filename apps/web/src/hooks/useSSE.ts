import { useState, useEffect } from "react";

export interface WarehouseActivityEvent {
  eventId: string;
  eventType: "INBOUND_RECEIVED" | "LOCATION_MUTATED" | "STAGING_ALERT";
  lpnCode: string;
  locationCode: string;
  messageText: string;
  timestampISO: string;
}

interface UseSSEOptions {
  streamUrl?: string;
  enableMockStream?: boolean;
}

// Pure function to format event badge label
export function getEventBadgeLabel(type: WarehouseActivityEvent["eventType"]): string {
  switch (type) {
    case "INBOUND_RECEIVED":
      return "INBOUND";
    case "LOCATION_MUTATED":
      return "MUTATION";
    case "STAGING_ALERT":
      return "ALERT";
    default:
      return "SYSTEM";
  }
}

// Pure function to parse raw SSE string payload safely into WarehouseActivityEvent
export function parseSSEPayload(rawString: string, eventName?: string): WarehouseActivityEvent | null {
  try {
    const data = JSON.parse(rawString);
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestampISO = data.timestamp || new Date().toISOString();

    if (eventName === "mutation:created" || data.event === "mutation:created") {
      const payload = data.data || data;
      return {
        eventId,
        eventType: "LOCATION_MUTATED",
        lpnCode: payload.lpn_code || payload.lpnCode || "LPN-UNKNOWN",
        locationCode: payload.to_location || payload.destinationLocation || "STAGING",
        messageText: `LPN ${payload.lpn_code} moved from ${payload.from_location || "INBOUND"} to ${payload.to_location} by ${payload.operator_id || "OPERATOR"}`,
        timestampISO,
      };
    }

    if (eventName === "aging:overdue" || data.event === "aging:overdue") {
      const payload = data.data || data;
      return {
        eventId,
        eventType: "STAGING_ALERT",
        lpnCode: payload.lpn_code || payload.lpnCode || "LPN-OVERDUE",
        locationCode: payload.location_code || payload.locationCode || "STAGING",
        messageText: `Overdue Alert: LPN ${payload.lpn_code} at ${payload.location_code} exceeded 24h dwell-time (${payload.dwell_time_hours || 24}h)`,
        timestampISO,
      };
    }

    if (eventName === "lpn:dispatched" || data.event === "lpn:dispatched") {
      const payload = data.data || data;
      return {
        eventId,
        eventType: "LOCATION_MUTATED",
        lpnCode: payload.lpn_code || payload.lpnCode || "LPN-DISPATCHED",
        locationCode: "OUTBOUND",
        messageText: `Outbound Dispatch: LPN ${payload.lpn_code} dispatched by ${payload.operator_id || "OPERATOR"}`,
        timestampISO,
      };
    }

    // Direct match for structured WarehouseActivityEvent
    if (data.eventId && data.eventType && data.lpnCode) {
      return data as WarehouseActivityEvent;
    }

    return null;
  } catch {
    return null;
  }
}

// Custom hook to consume real-time Server-Sent Events with fallback mock stream
export function useSSE({
  streamUrl = "/api/events/activity-stream",
  enableMockStream = true,
}: UseSSEOptions = {}) {
  const [eventList, setEventList] = useState<WarehouseActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let eventSourceInstance: EventSource | null = null;
    let mockIntervalId: ReturnType<typeof setInterval> | null = null;

    try {
      eventSourceInstance = new EventSource(streamUrl);

      eventSourceInstance.onopen = () => {
        setIsConnected(true);
        console.log(`(${new Date().toISOString()}) SSE stream connected: ${streamUrl}`);
      };

      // Handle generic onmessage
      eventSourceInstance.onmessage = (eventPayload) => {
        const parsedEvent = parseSSEPayload(eventPayload.data);
        if (parsedEvent) {
          setEventList((prevList) => [parsedEvent, ...prevList.slice(0, 49)]);
        }
      };

      // Add specific event listeners for named server events
      const handleMutationCreated = (eventPayload: MessageEvent) => {
        const parsedEvent = parseSSEPayload(eventPayload.data, "mutation:created");
        if (parsedEvent) {
          setEventList((prevList) => [parsedEvent, ...prevList.slice(0, 49)]);
        }
      };

      const handleAgingOverdue = (eventPayload: MessageEvent) => {
        const parsedEvent = parseSSEPayload(eventPayload.data, "aging:overdue");
        if (parsedEvent) {
          setEventList((prevList) => [parsedEvent, ...prevList.slice(0, 49)]);
        }
      };

      const handleLpnDispatched = (eventPayload: MessageEvent) => {
        const parsedEvent = parseSSEPayload(eventPayload.data, "lpn:dispatched");
        if (parsedEvent) {
          setEventList((prevList) => [parsedEvent, ...prevList.slice(0, 49)]);
        }
      };

      eventSourceInstance.addEventListener("mutation:created", handleMutationCreated as EventListener);
      eventSourceInstance.addEventListener("aging:overdue", handleAgingOverdue as EventListener);
      eventSourceInstance.addEventListener("lpn:dispatched", handleLpnDispatched as EventListener);

      eventSourceInstance.onerror = () => {
        setIsConnected(false);
        if (eventSourceInstance) {
          eventSourceInstance.close();
        }

        if (enableMockStream && !mockIntervalId) {
          startMockStream();
        }
      };
    } catch {
      setIsConnected(false);
      if (enableMockStream) {
        startMockStream();
      }
    }

    function startMockStream() {
      setIsConnected(true);
      console.log(`(${new Date().toISOString()}) Initialized mock SSE stream fallback`);

      const MOCK_PRESETS: Omit<WarehouseActivityEvent, "eventId" | "timestampISO">[] = [
        {
          eventType: "INBOUND_RECEIVED",
          lpnCode: "LPN-20260923-0089",
          locationCode: "INBOUND-BAY-01",
          messageText: "Received 20 Master Units of SKU-FOOD-01 at Dock Door 01",
        },
        {
          eventType: "LOCATION_MUTATED",
          lpnCode: "LPN-20260923-0042",
          locationCode: "STAGING-A2",
          messageText: "Pallet transferred from INBOUND-BAY-01 to STAGING-A2",
        },
        {
          eventType: "STAGING_ALERT",
          lpnCode: "LPN-20260923-0012",
          locationCode: "STAGING-BAY-07",
          messageText: "Bay 07 threshold reached high density capacity (92%)",
        },
      ];

      let presetIndex = 0;
      mockIntervalId = setInterval(() => {
        const template = MOCK_PRESETS[presetIndex % MOCK_PRESETS.length];
        presetIndex++;

        const newEvent: WarehouseActivityEvent = {
          ...template,
          eventId: `EVT-${Date.now()}`,
          timestampISO: new Date().toISOString(),
        };

        setEventList((prevList) => [newEvent, ...prevList.slice(0, 49)]);
      }, 5000);
    }

    return () => {
      if (eventSourceInstance) {
        eventSourceInstance.close();
      }
      if (mockIntervalId) {
        clearInterval(mockIntervalId);
      }
    };
  }, [streamUrl, enableMockStream]);

  return { eventList, isConnected };
}
