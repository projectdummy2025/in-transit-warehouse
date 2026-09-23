import { defineConfig } from "drizzle-kit";

// Database migration configuration supporting environment variable override
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || "warehouse.db",
  },
});
