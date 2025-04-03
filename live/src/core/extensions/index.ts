// hocuspocus extensions and core
import { Extension } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { setupRedisExtension } from "@/core/extensions/redis";
import { createDatabaseExtension } from "@/core/extensions/database";
import { logger } from "@plane/logger";

export const getExtensions = async (): Promise<Extension[]> => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    }),
    createDatabaseExtension(),
  ];

  // Add Redis extensions if Redis is available
  const redisExtension = await setupRedisExtension();
  if (redisExtension) {
    logger.info("HocusPocus Redis extension configured ✅");
    extensions.push(redisExtension);
  }

  return extensions;
};
