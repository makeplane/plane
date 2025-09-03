import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";
import { Extension } from "@hocuspocus/server";
import { Redis } from "ioredis";
// core helpers and utilities
import { manualLogger } from "@/core/helpers/logger.js";
// core libraries
import { fetchPageDescriptionBinary, updatePageDescription } from "@/core/lib/page.js";
import { getRedisUrl } from "@/core/lib/utils/redis-url.js";
import { type HocusPocusServerContext, type TDocumentTypes } from "@/core/types/common.js";
// plane live libraries
import { fetchDocument } from "@/plane-live/lib/fetch-document.js";
import { updateDocument } from "@/plane-live/lib/update-document.js";

export const getExtensions: () => Promise<Extension[]> = async () => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        manualLogger.info(message);
      },
    }),
    new Database({
      fetch: async ({ context, documentName: pageId, requestParameters }) => {
        const cookie = (context as HocusPocusServerContext).cookie;
        // query params
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;
        // TODO: Fix this lint error.
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
          try {
            let fetchedData = null;
            if (documentType === "project_page") {
              fetchedData = await fetchPageDescriptionBinary(params, pageId, cookie);
            } else {
              fetchedData = await fetchDocument({
                cookie,
                documentType,
                pageId,
                params,
              });
            }
            resolve(fetchedData);
          } catch (error) {
            manualLogger.error({ err: error }, "Error in fetching document");
          }
        });
      },
      store: async ({ context, state, documentName: pageId, requestParameters }) => {
        const cookie = (context as HocusPocusServerContext).cookie;
        // query params
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;

        // TODO: Fix this lint error.
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async () => {
          try {
            if (documentType === "project_page") {
              await updatePageDescription(params, pageId, state, cookie);
            } else {
              await updateDocument({
                cookie,
                documentType,
                pageId,
                params,
                updatedDescription: state,
              });
            }
          } catch (error) {
            manualLogger.error({ err: error }, "Error in updating document:");
          }
        });
      },
    }),
  ];

  const redisUrl = getRedisUrl();

  if (redisUrl) {
    try {
      const redisClient = new Redis(redisUrl);

      await new Promise<void>((resolve, reject) => {
        redisClient.on("error", (error: any) => {
          if (error?.code === "ENOTFOUND" || error.message.includes("WRONGPASS") || error.message.includes("NOAUTH")) {
            redisClient.disconnect();
          }
          manualLogger.warn(
            { err: error },
            `Redis Client wasn't able to connect, continuing without Redis (you won't be able to sync data between multiple plane live servers)`
          );
          reject(error);
        });

        redisClient.on("ready", () => {
          extensions.push(new HocusPocusRedis({ redis: redisClient }));
          manualLogger.info("Redis Client connected ✅");
          resolve();
        });
      });
    } catch (error) {
      manualLogger.warn(
        { err: error },
        `Redis Client wasn't able to connect, continuing without Redis (you won't be able to sync data between multiple plane live servers)`
      );
    }
  } else {
    manualLogger.warn(
      "Redis URL is not set, continuing without Redis (you won't be able to sync data between multiple plane live servers)"
    );
  }

  return extensions;
};
