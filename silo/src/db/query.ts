import DB from "@/db/client";
import { decryptAES } from "@/helpers/decrypt";
import { logger } from "@/logger";
import { TApplicationSecret } from "@/types/dbquery";

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

/**
 * Get application secret
 * @param key - key of the application secret
 * @returns {Promise<TApplicationSecret>}
 */
export const getAppSecret = async (key: string) => {
  const app = await db.query<TApplicationSecret>(
    `SELECT * FROM application_secrets WHERE key = $1 and deleted_at is null`,
    [key]
  );
  return app[0];
};

/**
 * Get application secret value
 * @param key - key of the application secret
 * @returns {Promise<string>}
 */
export const getAppSecretValue = async (key: string) => {
  const app = await getAppSecret(key);
  if (!app || !app.value) {
    throw new Error(`Application secret value not found for key: ${key}`);
  }

  const encryptedSecret = {
    iv: app.value.split(":")[0],
    ciphertext: app.value.split(":")[1],
    tag: app.value.split(":")[2],
  };
  if (app.is_secured) {
    return decryptAES(encryptedSecret);
  }
  return app.value;
};
