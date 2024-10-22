// Third-party libraries
import { Redis } from "ioredis";

// Hocuspocus extensions and core
import { Database } from "@hocuspocus/extension-database";
import { Extension } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";

// Core helpers and utilities
import { logger } from "@/core/helpers/logger.js";
import { getRedisUrl } from "@/core/lib/utils/redis-url.js";

// Core libraries
import {
  fetchPageDescriptionBinary,
  updatePageDescription,
} from "@/core/lib/page.js";

// Core types
import { TDocumentTypes } from "@/core/types/common.js";

// Plane live libraries
import { fetchDocument } from "@/plane-live/lib/fetch-document.js";
import { updateDocument } from "@/plane-live/lib/update-document.js";

export const getExtensions: () => Promise<Extension[]> = async () => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    }),
    new Database({
      fetch: async ({
        documentName: pageId,
        requestHeaders,
        requestParameters,
      }) => {
        // request headers
        const cookie = requestHeaders.cookie?.toString();
        // query params
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as
          | TDocumentTypes
          | undefined;
        // TODO: Fix this lint error.
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
          try {
            let fetchedData = null;
            if (documentType === "project_page") {
              fetchedData = await fetchPageDescriptionBinary(
                params,
                pageId,
                cookie,
              );
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
            logger.error("Error in fetching document", error);
          }
        });
      },
      store: async ({
        state,
        documentName: pageId,
        requestHeaders,
        requestParameters,
      }) => {
        // request headers
        const cookie = requestHeaders.cookie?.toString();
        // query params
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as
          | TDocumentTypes
          | undefined;

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
            logger.error("Error in updating document:", error);
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
          if (
            error?.code === "ENOTFOUND" ||
            error.message.includes("WRONGPASS") ||
            error.message.includes("NOAUTH")
          ) {
            redisClient.disconnect();
          }
          logger.warn(
            `Redis Client wasn't able to connect, continuing without Redis (you won't be able to sync data between multiple plane live servers)`,
            error,
          );
          reject(error);
        });

        redisClient.on("ready", () => {
          extensions.push(new HocusPocusRedis({ redis: redisClient }));
          logger.info("Redis Client connected ✅");
          resolve();
        });
      });
    } catch (error) {
      logger.warn(
        `Redis Client wasn't able to connect, continuing without Redis (you won't be able to sync data between multiple plane live servers)`,
        error,
      );
    }
  } else {
    logger.warn(
      "Redis URL is not set, continuing without Redis (you won't be able to sync data between multiple plane live servers)",
    );
  }

  return extensions;
};

import * as Y from "yjs";
import { migrateDocJSON } from "prosemirror-flat-list";

// Function to convert binary data to JSON
async function convertBinaryToJson(binaryData) {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, binaryData);
  const json = ydoc.toJSON();
  return json;
}

// Function to convert JSON back to binary
function convertJsonToBinary(json) {
  const ydoc = new Y.Doc();
  ydoc.fromJSON(json);
  const binaryData = Y.encodeStateAsUpdate(ydoc);
  return binaryData;
}

// Fetch binary data
async function fetchAndMigrateDocument(params, pageId, cookie) {
  let binaryData = await fetchPageDescriptionBinary(params, pageId, cookie);

  // Convert binary to JSON
  let jsonData = await convertBinaryToJson(binaryData);

  // Migrate JSON document
  let migratedJson = migrateDocJSON(jsonData);

  // Convert JSON back to binary
  let updatedBinaryData = convertJsonToBinary(migratedJson);

  // Store the updated binary data
  await updatePageDescription(params, pageId, updatedBinaryData, cookie);
}

// Example usage
fetchAndMigrateDocument(params, pageId, cookie);
