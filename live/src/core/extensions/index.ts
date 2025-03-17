// Third-party libraries
import { Redis } from "ioredis";
// Hocuspocus extensions and core
import { Database } from "@hocuspocus/extension-database";
import { Extension } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";
// core helpers and utilities
import { getRedisUrl } from "@/core/lib/utils/redis-url";
import { reportError, catchAsync } from "@/core/helpers/error-reporting";
// core libraries
import { fetchPageDescriptionBinary, updatePageDescription } from "@/core/lib/page";
// plane live libraries
import { fetchDocument } from "@/plane-live/lib/fetch-document";
import { updateDocument } from "@/plane-live/lib/update-document";
// types
import { type HocusPocusServerContext, type TDocumentTypes } from "@/core/types/common";
import { AppError } from "@/core/helpers/error-handler";
import { logger } from "@plane/logger";

export const getExtensions: () => Promise<Extension[]> = async () => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    }),
    new Database({
      fetch: async ({ context, documentName: pageId, requestParameters }) => {
        const cookie = (context as HocusPocusServerContext).cookie;
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;
        console.log("documentType", documentType);

        return catchAsync(
          async () => {
            if (!documentType) {
              throw new AppError("Document type is required");
            }

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
            console.log("fetchedData", fetchedData);

            if (!fetchedData) {
              throw new AppError(`Failed to fetch document: ${pageId}`);
            }

            return fetchedData;
          },
          {
            params: { pageId, documentType },
            extra: { operation: "fetch" },
          }
        );
      },
      store: async ({ context, state, documentName: pageId, requestParameters }) => {
        const cookie = (context as HocusPocusServerContext).cookie;
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;

        return catchAsync(
          async () => {
            if (!documentType) {
              throw new AppError("Document type is required");
            }

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
          },
          {
            params: { pageId, documentType },
            extra: { operation: "store" },
          }
        );
      },
    }),
  ];

  const redisUrl = getRedisUrl();

  if (redisUrl) {
    await catchAsync(
      async () => {
        const redisClient = new Redis(redisUrl);

        await new Promise<void>((resolve, reject) => {
          redisClient.on("error", (error: any) => {
            if (
              error?.code === "ENOTFOUND" ||
              error.message.includes("WRONGPASS") ||
              error.message.includes("NOAUTH")
            ) {
              redisClient.disconnect();
              reject(new AppError(`Redis connection failed: ${error.message}`));
            } else {
              reportError(error, { extra: { component: "redis" } });
              reject(error);
            }
          });

          redisClient.on("ready", () => {
            extensions.push(new HocusPocusRedis({ redis: redisClient }));
            logger.info("Redis Client connected ✅");
            resolve();
          });
        });
      },
      { extra: { component: "redis", operation: "connection" } }
    ).catch((error) => {
      reportError(error, { extra: { component: "redis", operation: "connection" } });
      logger.warn(
        `Redis Client wasn't able to connect, continuing without Redis (you won't be able to sync data between multiple plane live servers)`,
        error
      );
    });
  } else {
    logger.warn(
      "Redis URL is not set, continuing without Redis (you won't be able to sync data between multiple plane live servers)"
    );
  }

  return extensions;
};
