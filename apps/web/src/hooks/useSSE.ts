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

// Pure function to parse raw SSE string payload safely
export function parseSSEPayload(rawString: string): WarehouseActivityEvent | null {
  try {
    const data = JSON.parse(rawString);
    if (!data.eventId || !data.eventType || !data.lpnCode) {
      return null;
    }
    return data as WarehouseActivityEvent;
  } catch {
    return null;
  }
}

// Custom hook to consume real-time Server-Sent Events with fallback mock stream
export function useSSE({
  streamUrl = "/api/events/stream",
  enableMockStream = true,
}: UseSSEOptions = {}) {
  const [eventList, setEventList] = useState<WarehouseActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let eventSourceInstance: EventSource | null = null;
    let mockIntervalId: ReturnType<typeof setInterval> | null = null;

    // Try connecting to real SSE endpoint first
    try {
      eventSourceInstance = new EventSource(streamUrl);

      eventSourceInstance.onopen = () => {
        setIsConnected(true);
        console.log(`(${new Date().toISOString()}) SSE stream connected: ${streamUrl}`);
      };

      eventSourceInstance.onmessage = (eventPayload) => {
        const parsedEvent = parseSSEPayload(eventPayload.data);
        if (parsedEvent) {
          setEventList((prevList) => [parsedEvent, ...prevList.slice(0, 49)]);
        }
      };

      eventSourceInstance.onerror = () => {
        setIsConnected(false);
        if (eventSourceInstance) {
          eventSourceInstance.close();
        }

        // Fall back to local mock stream if real SSE endpoint is unreachable
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

    // Generator for simulated warehouse physical activity telemetry
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
        {
          eventType: "INBOUND_RECEIVED",
          lpnCode: "LPN-20260923-0090",
          locationCode: "INBOUND-BAY-01",
          messageText: "Received 50 Master Units of SKU-ELEC-05 at Dock Door 01",
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
