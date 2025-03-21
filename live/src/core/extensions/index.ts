// hocuspocus extensions and core
import { Extension } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { setupRedisExtension } from "@/core/extensions/redis";
import { createDatabaseExtension } from "@/core/extensions/database";
import { logger } from "@plane/logger";

export const getExtensions: () => Promise<Extension[]> = async () => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    }),
    createDatabaseExtension(),
  ];

  // Set up Redis extension if available
  const redisExtension = await setupRedisExtension();
  if (redisExtension) {
    extensions.push(redisExtension);
  }

  return extensions;
};
