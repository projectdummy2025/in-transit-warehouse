import { LpnStatus, LocationType } from "../enums/index.js";

// Stock Keeping Unit master data interface
export interface Sku {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

// Physical or logical storage location interface
export interface Location {
  id: string;
  code: string;
  type: LocationType;
  capacity: number;
  created_at: string;
}

// License Plate Number inventory unit interface
export interface Lpn {
  id: string;
  lpn_code: string;
  sku_id: string;
  quantity: number;
  status: LpnStatus;
  current_location_id: string;
  received_at: string;
  dispatched_at?: string;
}

// Immutable audit log interface for inventory movement
export interface MutationLog {
  id: string;
  lpn_id: string;
  from_location_id: string;
  to_location_id: string;
  operator_id: string;
  moved_at: string;
}

// Staging item structure enriched with dwell-time metrics
export interface StagingInventoryItem {
  lpn_code: string;
  sku_code: string;
  sku_name: string;
  quantity: number;
  location_code: string;
  dwell_time_minutes: number;
  is_overdue: boolean;
  received_at: string;
}

// Payload contract for mutation:created real-time SSE event
export interface MutationCreatedPayload {
  lpn_code: string;
  from_location: string;
  to_location: string;
  operator_id: string;
  timestamp: string;
}

// Payload contract for aging:overdue real-time SSE event
export interface AgingOverduePayload {
  lpn_code: string;
  location_code: string;
  dwell_time_hours: number;
  timestamp: string;
}

// Generic container interface for Server-Sent Events
export interface SseEvent<T = unknown> {
  event: "mutation:created" | "lpn:dispatched" | "aging:overdue" | "ping" | "connected";
  data: T;
  timestamp?: string;
}
