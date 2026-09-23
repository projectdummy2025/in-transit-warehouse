import { SseEvent } from "@in-transit/shared";

type EventListener = (eventData: SseEvent) => void;

// Singleton event emitter service for SSE activity streaming
class ActivityEventEmitter {
  private activeListeners: Set<EventListener> = new Set();

  // Register new client listener
  public subscribe(listener: EventListener): () => void {
    this.activeListeners.add(listener);
    return () => {
      this.activeListeners.delete(listener);
    };
  }

  // Publish event to all active listeners
  public emit(eventData: SseEvent): void {
    this.activeListeners.forEach((listener) => {
      try {
        listener(eventData);
      } catch (error) {
        // Suppress broken connection errors
      }
    });
  }

  // Broadcast mutation created event
  public broadcastMutationCreated(payload: unknown): void {
    this.emit({
      event: "mutation:created",
      data: payload,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast LPN dispatched event
  public broadcastLpnDispatched(payload: unknown): void {
    this.emit({
      event: "lpn:dispatched",
      data: payload,
      timestamp: new Date().toISOString()
    });
  }

  // Get active client count
  public getListenerCount(): number {
    return this.activeListeners.size;
  }
}

export const activityEventEmitter = new ActivityEventEmitter();
