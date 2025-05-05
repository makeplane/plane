import DB from "@/db/client";
import { logger } from "@/logger";

// get the db instance
const db = DB.getInstance();

/**
 * Get all users
 * @returns {Promise<any[]>}
 * @example
 */
export const healthCheck = async () => {
  try {
    await db.query("SELECT 1");
    return true;
  } catch (error) {
    logger.error("Error checking db health", { error });
    return false;
  }
};
