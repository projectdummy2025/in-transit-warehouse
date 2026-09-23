import { describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";
import { createDatabase } from "../src/db/client";
import { locationsTable, lpnsTable, mutationLogsTable, skusTable } from "../src/db/schema";

// Helper function to apply initial migration to test database
function applyMigration(sqliteConnection: Database) {
  const migrationPath = join(__dirname, "../drizzle/0000_dizzy_mephisto.sql");
  const migrationSql = readFileSync(migrationPath, "utf-8");
  const sqlStatements = migrationSql.split("--> statement-breakpoint");

  for (const singleStatement of sqlStatements) {
    const trimmedStatement = singleStatement.trim();
    if (trimmedStatement.length > 0) {
      sqliteConnection.run(trimmedStatement);
    }
  }
}

// Test suite for database schema and table constraints
describe("Database Schema", () => {
  // Test inserting and retrieving master SKU and Location records
  it("should create sku and location records properly", async () => {
    const memoryDatabase = createDatabase(":memory:");
    applyMigration(memoryDatabase.sqliteConnection);

    // Insert SKU master record
    await memoryDatabase.databaseClient.insert(skusTable).values({
      skuCode: "SKU-TEST-001",
      name: "Widget Standard",
    });

    // Insert Location master record
    await memoryDatabase.databaseClient.insert(locationsTable).values({
      locationCode: "INBOUND-01",
      locationType: "INBOUND",
      capacity: 10,
    });

    const skusList = await memoryDatabase.databaseClient.select().from(skusTable);
    const locationsList = await memoryDatabase.databaseClient.select().from(locationsTable);

    expect(skusList.length).toBe(1);
    expect(skusList[0].skuCode).toBe("SKU-TEST-001");
    expect(locationsList.length).toBe(1);
    expect(locationsList[0].locationCode).toBe("INBOUND-01");

    memoryDatabase.sqliteConnection.close();
  });

  // Test inserting LPN inventory item and mutation log entry
  it("should create lpn and mutation log records with relation constraints", async () => {
    const memoryDatabase = createDatabase(":memory:");
    applyMigration(memoryDatabase.sqliteConnection);

    // Seed parent SKU and Location records
    const [insertedSku] = await memoryDatabase.databaseClient
      .insert(skusTable)
      .values({
        skuCode: "SKU-ITEM-001",
        name: "Electronic Unit",
      })
      .returning();

    const [inboundLocation] = await memoryDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: "LOC-INBOUND-01",
        locationType: "INBOUND",
        capacity: 5,
      })
      .returning();

    const [transitLocation] = await memoryDatabase.databaseClient
      .insert(locationsTable)
      .values({
        locationCode: "LOC-TRANSIT-01",
        locationType: "TRANSIT",
        capacity: 10,
      })
      .returning();

    // Insert LPN record referencing SKU and Location
    const [insertedLpn] = await memoryDatabase.databaseClient
      .insert(lpnsTable)
      .values({
        lpnCode: "LPN-20260923-0001",
        skuId: insertedSku.id,
        quantity: 20,
        currentLocationId: inboundLocation.id,
        status: "RECEIVED",
      })
      .returning();

    expect(insertedLpn.lpnCode).toBe("LPN-20260923-0001");
    expect(insertedLpn.status).toBe("RECEIVED");

    // Insert Mutation Log entry referencing LPN and Locations
    const [insertedLog] = await memoryDatabase.databaseClient
      .insert(mutationLogsTable)
      .values({
        lpnId: insertedLpn.id,
        sourceLocationId: inboundLocation.id,
        destinationLocationId: transitLocation.id,
        actionType: "MOVE",
        notes: "Move to staging",
      })
      .returning();

    expect(insertedLog.actionType).toBe("MOVE");
    expect(insertedLog.lpnId).toBe(insertedLpn.id);

    memoryDatabase.sqliteConnection.close();
  });
});
