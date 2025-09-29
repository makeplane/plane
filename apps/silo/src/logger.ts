import { logger } from "@plane/logger";

export const captureException = (exception: Error) => {
  logger.error(exception);
};
