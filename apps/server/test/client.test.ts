import { describe, expect, it } from "bun:test";
import { createDatabase } from "../src/db/client";

// Test suite for database connection and PRAGMA settings
describe("Database Client", () => {
  // Test memory database initialization and foreign keys pragma
  it("should enable foreign keys pragma on initialization", () => {
    const memoryDatabase = createDatabase(":memory:");
    const queryResult = memoryDatabase.sqliteConnection
      .query("PRAGMA foreign_keys;")
      .get() as { foreign_keys: number };

    expect(queryResult.foreign_keys).toBe(1);
    memoryDatabase.sqliteConnection.close();
  });

  // Test database client instance is created properly
  it("should provide valid drizzle client instance", () => {
    const memoryDatabase = createDatabase(":memory:");

    expect(memoryDatabase.databaseClient).toBeDefined();
    memoryDatabase.sqliteConnection.close();
  });
});
