import { defineConfig } from "drizzle-kit";

// Drizzle ORM migration configuration
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "warehouse.db",
  },
});
