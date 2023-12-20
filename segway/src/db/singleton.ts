import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
// logger
import { logger } from "../utils/logger";

export class DatabaseSingleton {
  private static instance: DatabaseSingleton;
  public db: PostgresJsDatabase<typeof schema> | null = null;

  private constructor() {
    try {
      // Ensure the DATABASE_URL is provided
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set.");
      }

      const queryClient = postgres(process.env.DATABASE_URL);
      this.db = drizzle(queryClient, { schema });
      logger.info("🛢️ Connected to Database");
    } catch (error) {
      logger.error("Failed to initialize database connection:", error);
      throw new Error("Could not connect to Database");
    }
  }

  public static getInstance(): DatabaseSingleton {
    if (!DatabaseSingleton.instance) {
      DatabaseSingleton.instance = new DatabaseSingleton();
    }

    return DatabaseSingleton.instance;
  }
}
