import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Table: SKUs (Stock Keeping Units master data)
export const skusTable = sqliteTable("skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuCode: text("sku_code").notNull().unique(),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Table: Locations (Warehouse physical & logical storage areas)
export const locationsTable = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationCode: text("location_code").notNull().unique(),
  locationType: text("location_type", { enum: ["INBOUND", "TRANSIT", "OUTBOUND"] }).notNull(),
  capacity: integer("capacity").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Table: LPNs (License Plate Numbers for tracked inventory units)
export const lpnsTable = sqliteTable(
  "lpns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lpnCode: text("lpn_code").notNull().unique(),
    skuId: integer("sku_id")
      .notNull()
      .references(() => skusTable.id),
    quantity: integer("quantity").notNull(),
    currentLocationId: integer("current_location_id")
      .notNull()
      .references(() => locationsTable.id),
    status: text("status", { enum: ["RECEIVED", "STAGED", "PICKED", "DISPATCHED"] }).notNull(),
    receivedAt: text("received_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    // Indexes on current_location_id, status, and received_at for fast querying and FIFO sorting
    index("idx_lpns_location").on(table.currentLocationId),
    index("idx_lpns_status").on(table.status),
    index("idx_lpns_received").on(table.receivedAt),
  ]
);

// Table: Mutation Logs (Audit trail for inventory movements)
export const mutationLogsTable = sqliteTable(
  "mutation_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lpnId: integer("lpn_id")
      .notNull()
      .references(() => lpnsTable.id),
    sourceLocationId: integer("source_location_id")
      .notNull()
      .references(() => locationsTable.id),
    destinationLocationId: integer("destination_location_id")
      .notNull()
      .references(() => locationsTable.id),
    actionType: text("action_type").notNull(),
    notes: text("notes"),
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    // Index on lpn_id for tracking mutation history per LPN
    index("idx_mutations_lpn").on(table.lpnId),
  ]
);
