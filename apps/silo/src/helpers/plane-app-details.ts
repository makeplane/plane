import { TAppKeys } from "@plane/etl/core";
import { logger } from "@plane/logger";
import { getAppSecretValue } from "@/db/query";
import { Store } from "@/worker/base";
import { getPlaneAppDetailsCacheKey } from "./cache-keys";

type PlaneAppDetails = {
  planeAppId: string;
  planeAppClientId: string;
  planeAppClientSecret: string;
};

/**
 * Get plane app details from db
 * @param appName - plane app name in lowercase e.g. "github"
 * @returns plane app details
 */
// TODO: uncomment this once the db query is implemented and decrypt is implemented
const getPlaneAppDetailsFromDB = async (appName: string): Promise<PlaneAppDetails> => {
  // getAppSecret is db query function
  const appId = await getAppSecretValue(`x-${appName}-id`);
  const appClientId = await getAppSecretValue(`x-${appName}-client_id`);
  const appClientSecret = await getAppSecretValue(`x-${appName}-client_secret`);

  if (!appId || !appClientId || !appClientSecret) {
    throw new Error(`Plane app details not found for ${appName}`);
  }

  const app = {
    planeAppId: appId,
    planeAppClientId: appClientId,
    planeAppClientSecret: appClientSecret,
  };
  return app;
};

/**
 * Get plane app details from cache or db
 * IMPORTANT: For importers always send the IMPORTER as the appName
 * @param appName - plane app name in lowercase e.g. "github"
 * @returns plane app details
 */
export const getPlaneAppDetails = async (appName: TAppKeys): Promise<PlaneAppDetails> => {
  try {
    const PLANE_APP_DETAILS_CACHE_EXPIRY_TIME = 60 * 60 * 24; // 1 day

    const appNameInLowerCase = appName.toLowerCase();
    const cacheKey = getPlaneAppDetailsCacheKey(appNameInLowerCase);
    const store = Store.getInstance();
    const planeAppDetails = await store.get(cacheKey);

    if (planeAppDetails) {
      return JSON.parse(planeAppDetails);
    }
    const app = await getPlaneAppDetailsFromDB(appNameInLowerCase);
    store.set(cacheKey, JSON.stringify(app), PLANE_APP_DETAILS_CACHE_EXPIRY_TIME);

    return app;
  } catch (error) {
    logger.error(`Error getting plane app details for ${appName}`, { error });
    throw error;
  }
};
