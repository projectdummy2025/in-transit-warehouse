import { SseEvent } from "@in-transit/shared";

type EventSubscriber = (eventPayload: SseEvent) => void;

// Singleton event emitter service managing real-time Server-Sent Events subscribers
class ActivityEventEmitter {
  private activeSubscribers: Set<EventSubscriber> = new Set();

  // Register new client listener
  public subscribe(subscriber: EventSubscriber): () => void {
    this.activeSubscribers.add(subscriber);
    return () => {
      this.activeSubscribers.delete(subscriber);
    };
  }

  // Publish event to all active connected listeners
  public emit(eventPayload: SseEvent): void {
    this.activeSubscribers.forEach((subscriber) => {
      try {
        subscriber(eventPayload);
      } catch (caughtError) {
        // Safely ignore broken client connections
      }
    });
  }

  // Broadcast mutation created event
  public broadcastMutationCreated(eventData: unknown): void {
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    this.emit({
      event: "mutation:created",
      data: eventData,
      timestamp: currentTimestamp,
    });
  }

  // Broadcast LPN dispatched event
  public broadcastLpnDispatched(eventData: unknown): void {
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    this.emit({
      event: "lpn:dispatched",
      data: eventData,
      timestamp: currentTimestamp,
    });
  }

  // Broadcast aging overdue alert event
  public broadcastAgingOverdue(eventData: unknown): void {
    const currentTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    this.emit({
      event: "aging:overdue",
      data: eventData,
      timestamp: currentTimestamp,
    });
  }

  // Get current active listener count
  public getSubscriberCount(): number {
    return this.activeSubscribers.size;
  }
}

export const activityEventEmitter = new ActivityEventEmitter();
