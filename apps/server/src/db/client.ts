import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

// Database configuration constants
const fallbackPath = "warehouse.db";
const journalModeQuery = "PRAGMA journal_mode = WAL;";
const foreignKeysQuery = "PRAGMA foreign_keys = ON;";

// Factory function to initialize database connection with required pragmas
export function createDatabase(databasePath?: string) {
  const selectedPath = databasePath || process.env.DATABASE_PATH || fallbackPath;
  const sqliteConnection = new Database(selectedPath);

  // Configure write-ahead logging for high concurrency
  sqliteConnection.run(journalModeQuery);

  // Enforce foreign key constraints integrity
  sqliteConnection.run(foreignKeysQuery);

  // Initialize Drizzle ORM client wrapper
  const databaseClient = drizzle(sqliteConnection);

  // Log successful database initialization
  const formattedTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`(${formattedTimestamp}) Database connection initialized`);

  return {
    sqliteConnection,
    databaseClient,
  };
}

// Singleton database instance for standard server usage
export const defaultDatabase = createDatabase();
export const databaseInstance = defaultDatabase.databaseClient;
