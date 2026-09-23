import { LpnStatus, LocationType } from "../enums/index.js";

// SKU entity interface
export interface Sku {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

// Location entity interface
export interface Location {
  id: string;
  code: string;
  type: LocationType;
  capacity: number;
  created_at: string;
}

// LPN entity interface
export interface Lpn {
  id: string;
  lpn_code: string;
  sku_id: string;
  quantity: number;
  current_location_id: string;
  status: LpnStatus;
  received_at: string;
  updated_at: string;
}

// Mutation log entity interface
export interface MutationLog {
  id: string;
  lpn_id: string;
  source_location_id: string;
  target_location_id: string;
  action_type: string;
  created_at: string;
}

// Staging inventory item with dwell-time metrics
export interface StagingInventoryItem {
  lpn_id: string;
  lpn_code: string;
  sku_id: string;
  sku_name?: string;
  quantity: number;
  location_id: string;
  location_code?: string;
  status: LpnStatus;
  received_at: string;
  dwell_time_minutes: number;
  is_overdue: boolean;
}

// Base SSE event payload
export interface SseEvent<T = unknown> {
  event: "mutation:created" | "lpn:dispatched" | "aging:overdue";
  data: T;
  timestamp: string;
}
