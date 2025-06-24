// hocuspocus extensions and core
import { Extension } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { setupRedisExtension } from "@/core/extensions/setup-redis";
import { createDatabaseExtension } from "@/core/extensions/database";
import { logger } from "@plane/logger";
import { TitleSyncExtension } from "./title-sync";

export const getExtensions = async (): Promise<Extension[]> => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    }),
    createDatabaseExtension(),
    new TitleSyncExtension(),
  ];

  // Add Redis extensions if Redis is available
  const redisExtensions = await setupRedisExtension();
  if (redisExtensions) {
    extensions.push(redisExtensions);
  }

  return extensions;
};
