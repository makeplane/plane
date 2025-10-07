import { Logger as HocuspocusLogger } from "@hocuspocus/extension-logger";
import { logger } from "@plane/logger";

export class Logger extends HocuspocusLogger {
  constructor() {
    super({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    });
  }
}
