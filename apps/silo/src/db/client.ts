import pg from "pg";
import { env } from "@/env";
import { logger } from "@/logger";

/**
 * Database class
 * @description This class is used to connect to the database and execute queries
 * @example
 * const db = DB.getInstance();
 * const users = await db.query("SELECT * FROM users");
 * or write a query in query.ts and then use it
 */
class DB {
  private static instance: DB;
  private pool?: pg.Pool;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  public async init(): Promise<void> {
    if (!this.pool) {
      await this.connect();
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnected) return;
    let dbURI = env.DATABASE_URL;
    if (!dbURI) {
      logger.warn("Database URL is not set.. skipping database connection");
      return;
    }
    const maxAttempts = parseInt(env.MAX_DB_CONNECTION_ATTEMPTS) || 3;
    const retryDelay = 1000;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        this.pool = new pg.Pool({
          connectionString: dbURI,
          application_name: "silo",
        });
        // Test the connection
        await this.pool.query("SELECT 1");
        this.isConnected = true;
        logger.info("✅----Successfully connected to database----");
        break;
      } catch (error) {
        logger.error("❌----Error connecting to database----", { error });
        // this error is thrown for ssl mode verification error
        // no pg_hba.conf entry
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "28000" &&
          !dbURI.includes("sslmode=no-verify")
        ) {
          logger.info("🔄----Retrying connection with SSL Mode no verify----");
          dbURI = dbURI?.concat("?sslmode=no-verify");
        }
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          throw error;
        }
      }
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) {
      await this.connect();
    }
    try {
      logger.info(`Executing query: ${sql}`, { params });
      const result = await this.pool!.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error("Error querying database", { sql, params, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        logger.info("Database connection closed");
        this.isConnected = false;
      } catch (error) {
        logger.error("Error closing database connection", { error });
        throw error;
      }
    }
  }
}

export default DB;
